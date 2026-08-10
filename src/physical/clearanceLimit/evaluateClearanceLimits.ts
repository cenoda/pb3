import type { ClearanceCondition, ClearanceLimit } from "../../contract/cat6";
import type {
  PhysicalCheckResult,
  PhysicalValidationStatus,
} from "../../contract/phys3";
import type { PartDefinitionV2 } from "../../contract/partV2";

type ClearanceLimitFamily =
  | "maxCpuCoolerHeight"
  | "maxGpuLength"
  | "maxPsuLength";

interface FamilyConfig {
  targetCategory: PartDefinitionV2["category"];
  measurementAxis: "heightMm" | "lengthMm";
  checkId: string;
  label: string;
}

const FAMILY_CONFIG: Record<ClearanceLimitFamily, FamilyConfig> = {
  maxCpuCoolerHeight: {
    targetCategory: "cooler",
    measurementAxis: "heightMm",
    checkId: "clearance-limit:cpu-cooler-height",
    label: "CPU cooler height",
  },
  maxGpuLength: {
    targetCategory: "gpu",
    measurementAxis: "lengthMm",
    checkId: "clearance-limit:gpu-length",
    label: "GPU length",
  },
  maxPsuLength: {
    targetCategory: "psu",
    measurementAxis: "lengthMm",
    checkId: "clearance-limit:psu-length",
    label: "PSU length",
  },
};

export interface ClearanceLimitFacts {
  psuLengthMm?: number;
}

/** Selected build part ids for scalar clearance-limit evaluation. */
export interface ClearanceLimitSelectedPartIds {
  gpuId?: string;
  coolerId?: string;
  psuId?: string;
}

const FAMILY_SELECTED_ID_KEY: Record<
  ClearanceLimitFamily,
  keyof ClearanceLimitSelectedPartIds
> = {
  maxCpuCoolerHeight: "coolerId",
  maxGpuLength: "gpuId",
  maxPsuLength: "psuId",
};

function measurementMm(
  part: PartDefinitionV2 | undefined,
  axis: "heightMm" | "lengthMm",
): number | undefined {
  const value = part?.dimensionsMm?.[axis];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isPredicateDefinitelyFalse(
  predicate: ClearanceCondition,
  facts: ClearanceLimitFacts,
): boolean {
  if (predicate.subject !== "psu.lengthMm") {
    return false;
  }
  const psuLengthMm = facts.psuLengthMm;
  if (psuLengthMm === undefined) {
    return false;
  }
  if (predicate.operator === "lte") {
    return psuLengthMm > predicate.valueMm;
  }
  return psuLengthMm <= predicate.valueMm;
}

function isBranchDefinitelyInapplicable(
  limit: ClearanceLimit,
  facts: ClearanceLimitFacts,
): boolean {
  const predicates = limit.appliesWhen;
  if (!predicates || predicates.length === 0) {
    return false;
  }
  return predicates.some((predicate) => isPredicateDefinitelyFalse(predicate, facts));
}

function branchFitsLimit(
  measurementMm: number,
  limitMm: number,
): boolean {
  return measurementMm <= limitMm;
}

function aggregateBranchStatuses(
  branchStatuses: Array<"fit" | "fail">,
): PhysicalValidationStatus {
  if (branchStatuses.length === 0) return "unavailable";
  const allFit = branchStatuses.every((s) => s === "fit");
  const allFail = branchStatuses.every((s) => s === "fail");
  if (allFit) return "fit";
  if (allFail) return "interference";
  return "conditional";
}

function evaluateFamily(
  family: ClearanceLimitFamily,
  limits: ClearanceLimit[],
  casePart: PartDefinitionV2,
  targetPart: PartDefinitionV2 | undefined,
  facts: ClearanceLimitFacts,
  evidenceSourceIds: string[],
): PhysicalCheckResult | null {
  const config = FAMILY_CONFIG[family];
  const measurement = measurementMm(targetPart, config.measurementAxis);

  if (measurement === undefined) {
    return {
      checkId: config.checkId,
      kind: "clearance-limit",
      status: "unavailable",
      involvedPartIds: targetPart ? [casePart.id, targetPart.id] : [casePart.id],
      involvedNodeNames: [`clearance-limit:${family}`],
      explanation: targetPart
        ? `${config.label} for ${targetPart.id} is unavailable: no published ${config.measurementAxis} in catalog dimensionsMm.`
        : `${config.label} check unavailable: no ${config.targetCategory} part in build.`,
      evidenceSourceIds,
    };
  }

  const retained = limits.filter((limit) => !isBranchDefinitelyInapplicable(limit, facts));
  if (retained.length === 0) {
    return {
      checkId: config.checkId,
      kind: "clearance-limit",
      status: "unavailable",
      involvedPartIds: [casePart.id, targetPart!.id],
      involvedNodeNames: [`clearance-limit:${family}`],
      explanation: `${config.label} for ${targetPart!.id}: no published clearance branch applies to this build after conservative applicability filtering.`,
      evidenceSourceIds,
    };
  }

  const branchStatuses = retained.map((limit) =>
    branchFitsLimit(measurement, limit.limitMm) ? "fit" : "fail",
  );
  const status = aggregateBranchStatuses(branchStatuses);
  const targetId = targetPart!.id;

  if (status === "fit") {
    return {
      checkId: config.checkId,
      kind: "clearance-limit",
      status: "fit",
      involvedPartIds: [casePart.id, targetId],
      involvedNodeNames: [`clearance-limit:${family}`],
      evidenceSourceIds,
    };
  }

  const measurementLabel =
    config.measurementAxis === "heightMm"
      ? `${measurement} mm height`
      : `${measurement} mm length`;

  if (status === "interference") {
    const tightest = Math.min(...retained.map((l) => l.limitMm));
    return {
      checkId: config.checkId,
      kind: "clearance-limit",
      status: "interference",
      involvedPartIds: [casePart.id, targetId],
      involvedNodeNames: [`clearance-limit:${family}`],
      explanation: `${config.label} ${measurementLabel} exceeds every retained published limit (tightest ${tightest} mm) in ${casePart.id}.`,
      evidenceSourceIds,
    };
  }

  const fitLimits = retained.filter((l) => branchFitsLimit(measurement, l.limitMm));
  const failLimits = retained.filter((l) => !branchFitsLimit(measurement, l.limitMm));
  const fitMax = Math.max(...fitLimits.map((l) => l.limitMm));
  const failMin = Math.min(...failLimits.map((l) => l.limitMm));

  return {
    checkId: config.checkId,
    kind: "clearance-limit",
    status: "conditional",
    involvedPartIds: [casePart.id, targetId],
    involvedNodeNames: [`clearance-limit:${family}`],
    explanation: `${config.label} ${measurementLabel} fits some retained published branches (up to ${fitMax} mm) and fails others (from ${failMin} mm) in ${casePart.id}; configuration is not fully modelled.`,
    evidenceSourceIds,
  };
}

/**
 * Scalar clearance-limit evaluator — separate from the OBB collision engine.
 * Uses published case clearanceLimits and target-part dimensionsMm only.
 */
export function evaluateClearanceLimits(args: {
  partsById: Map<string, PartDefinitionV2>;
  casePartId: string;
  selectedPartIds: ClearanceLimitSelectedPartIds;
  evidenceSourceIds?: string[];
}): PhysicalCheckResult[] {
  const casePart = args.partsById.get(args.casePartId);
  if (!casePart || casePart.category !== "case" || !casePart.clearanceLimits) {
    return [];
  }

  const evidenceSourceIds = args.evidenceSourceIds ?? [];
  const clearanceLimits = casePart.clearanceLimits;
  const selectedPsu = args.selectedPartIds.psuId
    ? args.partsById.get(args.selectedPartIds.psuId)
    : undefined;
  const facts: ClearanceLimitFacts = {
    psuLengthMm: measurementMm(selectedPsu, "lengthMm"),
  };

  const results: PhysicalCheckResult[] = [];
  const families: ClearanceLimitFamily[] = [
    "maxCpuCoolerHeight",
    "maxGpuLength",
    "maxPsuLength",
  ];

  for (const family of families) {
    const limits = clearanceLimits[family];
    if (!limits || limits.length === 0) continue;

    const selectedId = args.selectedPartIds[FAMILY_SELECTED_ID_KEY[family]];
    const targetPart = selectedId ? args.partsById.get(selectedId) : undefined;
    const result = evaluateFamily(
      family,
      limits,
      casePart,
      targetPart,
      facts,
      evidenceSourceIds,
    );
    if (result) results.push(result);
  }

  return results;
}

export {
  isBranchDefinitelyInapplicable,
  aggregateBranchStatuses,
  branchFitsLimit,
  isPredicateDefinitelyFalse,
};

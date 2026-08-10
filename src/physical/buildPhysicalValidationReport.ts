import type {
  PhysicalCheckResult,
  PhysicalValidationReport,
} from "../contract/phys3";
import {
  PHYS3_CONTRACT_VERSION,
  PHYS3_OVERLAP_EPSILON_MM,
} from "../contract/phys3";
import type { ResolvedAssembly } from "./buildAssemblyState";
import type { GlbPhysicalIndex } from "./indexGlbPhysicalNodes";
import { loadPhysicalSpec } from "./loadPhysicalSpec";
import type { PartDefinitionV2 } from "../contract/partV2";
import { collectCollisionInputs } from "./collision/collectCollisionInputs";
import { aggregatePhysicalStatus } from "./collision/types";
import { createObbCollisionEngine } from "./collision/validatePhysicalFit";
import { evaluateClearanceLimits } from "./clearanceLimit/evaluateClearanceLimits";

export interface BuildPhysicalReportArgs {
  assembly: ResolvedAssembly;
  partsById: Map<string, PartDefinitionV2>;
  glbIndexes: Map<string, GlbPhysicalIndex>;
}

/**
 * Build a full physical validation report for the resolved assembly.
 * Incomplete mounts / missing geometry → unavailable checks (never silent fit).
 */
export function buildPhysicalValidationReport(
  args: BuildPhysicalReportArgs,
): PhysicalValidationReport {
  const { assembly, partsById, glbIndexes } = args;
  const checks: PhysicalCheckResult[] = [];

  // Coverage / mount completeness
  for (const part of assembly.parts) {
    if (part.isRoot) continue;
    if (part.resolution?.status === "unavailable" || !part.transform) {
      const unavailable =
        part.resolution?.status === "unavailable" ? part.resolution : null;
      checks.push({
        checkId: `coverage:${part.partId}`,
        kind: "collision",
        status: "unavailable",
        involvedPartIds: [part.partId],
        involvedNodeNames: unavailable?.involvedNodeNames?.length
          ? unavailable.involvedNodeNames
          : [`part:${part.partId}`],
        explanation:
          unavailable?.explanation ??
          `Part ${part.partId} is not mounted; physical validation unavailable.`,
        evidenceSourceIds: [],
      });
    }
  }

  const posed = [];
  for (const part of assembly.parts) {
    if (!part.transform) continue;
    const def = partsById.get(part.partId);
    const index = glbIndexes.get(part.partId);
    const worldMatrix = assembly.worldMatrices.get(part.partId);
    if (!def || !index || !worldMatrix) {
      checks.push({
        checkId: `geometry:${part.partId}`,
        kind: "collision",
        status: "unavailable",
        involvedPartIds: [part.partId],
        involvedNodeNames: [`part:${part.partId}`],
        explanation: `Missing part definition, GLB index, or world matrix for ${part.partId}.`,
        evidenceSourceIds: [],
      });
      continue;
    }
    const spec = loadPhysicalSpec(def);
    if (!spec) {
      checks.push({
        checkId: `coverage:${part.partId}`,
        kind: "collision",
        status: "unavailable",
        involvedPartIds: [part.partId],
        involvedNodeNames: [`part:${part.partId}`],
        explanation: `Part ${part.partId} has no physicalSpec.`,
        evidenceSourceIds: [],
      });
      continue;
    }
    posed.push({
      partId: part.partId,
      worldMatrix,
      spec,
      index,
    });
  }

  const collected = collectCollisionInputs(posed);
  for (const miss of collected.missing) {
    checks.push({
      checkId: `missing:${miss.partId}:${miss.nodeName}`,
      kind: miss.nodeName.startsWith("clearance:") ? "clearance" : "collision",
      status: "unavailable",
      involvedPartIds: [miss.partId],
      involvedNodeNames: [miss.nodeName],
      explanation: `${miss.partId}: ${miss.reason} (${miss.nodeName}).`,
      evidenceSourceIds: [],
    });
  }

  // Only run geometric checks when we have a fully mounted supported assembly.
  // If any coverage unavailable exists, still run geometry on available poses
  // but aggregate will be unavailable unless interference is found.
  if (collected.collisionNodes.length > 0) {
    const engine = createObbCollisionEngine();
    const geometric = engine.evaluate({
      collisionNodes: collected.collisionNodes,
      clearanceNodes: collected.clearanceNodes,
      allowedContacts: collected.allowedContacts,
      overlapEpsilonMm: PHYS3_OVERLAP_EPSILON_MM,
    });
    checks.push(...geometric);
  } else if (checks.length === 0) {
    checks.push({
      checkId: "coverage:empty",
      kind: "collision",
      status: "unavailable",
      involvedPartIds: assembly.parts.map((p) => p.partId),
      involvedNodeNames: ["assembly"],
      explanation: "No collision geometry available for physical validation.",
      evidenceSourceIds: [],
    });
  }

  const casePartEntry = assembly.parts.find((p) => p.category === "case");
  const casePart = casePartEntry
    ? partsById.get(casePartEntry.partId)
    : undefined;
  const clearanceEvidenceSourceIds = casePart?.provenance?.clearanceLimits
    ?.sourceId
    ? [casePart.provenance.clearanceLimits.sourceId]
    : [];

  if (casePartEntry) {
    const selectedPartId = (category: string) =>
      assembly.parts.find((p) => p.category === category)?.partId;

    checks.push(
      ...evaluateClearanceLimits({
        partsById,
        casePartId: casePartEntry.partId,
        selectedPartIds: {
          gpuId: selectedPartId("gpu"),
          coolerId: selectedPartId("cooler"),
          psuId: selectedPartId("psu"),
        },
        evidenceSourceIds: clearanceEvidenceSourceIds,
      }),
    );
  }

  return {
    physicalContractVersion: PHYS3_CONTRACT_VERSION,
    buildStateVersion: "vs2",
    assemblyState: assembly.assemblyState,
    checks,
    overallStatus: aggregatePhysicalStatus(checks),
    geometryDataVersion: assembly.geometryDataVersion,
  };
}

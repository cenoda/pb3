/**
 * Pure performance evidence binder (prov4 §6.7 + external corrective overlay).
 * Exact pilot key only; never invents FPS.
 */
import type {
  AggregatedPerformanceEvidence,
  EvidenceSource,
  EvidenceSourceRegistryFile,
  ExternalPerformanceObservation,
  ExternalPerformanceObservationsFile,
  HumanVerificationFile,
  HumanVerificationRecord,
  PerformanceEvidenceBinding,
  PerformanceEvidenceFile,
  PerformanceEvidenceRecord,
  PilotBaselineKey,
  SourceRightsRecordFile,
} from "../contract/prov4";
import { highGateDigestsIncludeCapture } from "../contract/prov4.schema";
import { aggregateComparableObservations } from "./aggregatePerformanceEvidence";
import { classifyFreshness } from "./classifyFreshness";
import { pilotKeyEquals } from "./pilotBuild";

export interface BindPerformanceEvidenceInput {
  key: PilotBaselineKey;
  /** When false, skip pilot overlay (caller keeps perf1). */
  isPilotBuild: boolean;
  evidenceFile: PerformanceEvidenceFile;
  registry: EvidenceSourceRegistryFile;
  verifications: HumanVerificationFile;
  nowIso: string;
  externalObservations?: ExternalPerformanceObservationsFile;
  /**
   * Required when externalObservations is provided. Aggregation fails closed
   * without storeExtractedObservation-approved rights decisions.
   */
  sourceRights?: SourceRightsRecordFile;
  /**
   * Digests verified OK by integrity (repo-file on-disk match, etc.).
   * When provided, every rawArtifact sha256 on the bound row must be present.
   * When omitted, digest existence checks are skipped (schema shape still enforced).
   */
  verifiedArtifactDigests?: ReadonlySet<string>;
}

export interface BindPerformanceEvidenceResult {
  binding: PerformanceEvidenceBinding;
  /** Residual synthetic-stub row when external aggregate is unavailable. */
  syntheticReference?: PerformanceEvidenceRecord;
  displayClass: "aggregated" | "synthetic-perf1" | "unavailable";
}

function unavailable(
  reason: Extract<
    PerformanceEvidenceBinding,
    { status: "unavailable" }
  >["reason"],
  explanation: string,
): PerformanceEvidenceBinding {
  return { status: "unavailable", reason, explanation };
}

function resolveSources(
  sourceIds: string[],
  registry: EvidenceSourceRegistryFile,
): { ok: true; sources: EvidenceSource[] } | { ok: false } {
  const sources: EvidenceSource[] = [];
  for (const id of sourceIds) {
    const found = registry.sources.find((s) => s.sourceId === id);
    if (!found) return { ok: false };
    sources.push(found);
  }
  return { ok: true, sources };
}

function confidenceCeiling(
  sources: EvidenceSource[],
): "stub" | "medium" | "high" | "none" {
  if (sources.length === 0) return "none";
  const classes = new Set(sources.map((s) => s.sourceClass));
  if (classes.has("first-party")) return "high";
  if (classes.has("external-review")) return "medium";
  if ([...classes].every((c) => c === "project-synthetic")) return "stub";
  return "none";
}

const CONFIDENCE_RANK: Record<string, number> = {
  none: 0,
  stub: 1,
  low: 2,
  medium: 3,
  high: 4,
};

function exceedsCeiling(
  confidence: PerformanceEvidenceRecord["confidence"],
  ceiling: ReturnType<typeof confidenceCeiling>,
): boolean {
  return (CONFIDENCE_RANK[confidence] ?? 0) > (CONFIDENCE_RANK[ceiling] ?? 0);
}

function collectArtifactDigests(row: PerformanceEvidenceRecord): string[] {
  const digests: string[] = [];
  if (row.captureConditions?.rawArtifact) {
    digests.push(row.captureConditions.rawArtifact.sha256);
  }
  const ft = row.measurement.frametime;
  if (
    ft.status === "available" &&
    (ft.representation === "raw-artifact" ||
      ft.representation === "summary-and-raw")
  ) {
    digests.push(ft.artifact.sha256);
  }
  return digests;
}

/** Latest accessedAt among contributing observations (ISO date or datetime). */
function latestAccessedAt(
  observations: readonly ExternalPerformanceObservation[],
  contributingIds: readonly string[],
): string | undefined {
  const idSet = new Set(contributingIds);
  let latest: string | undefined;
  for (const obs of observations) {
    if (!idSet.has(obs.observationId)) continue;
    if (!latest || obs.accessedAt > latest) {
      latest = obs.accessedAt;
    }
  }
  return latest;
}

function hasCompleteCharterMetrics(row: PerformanceEvidenceRecord): boolean {
  const m = row.measurement;
  if (m.metricKind === "first-party-measured") {
    return (
      typeof m.fpsAverage === "number" &&
      typeof m.fpsOnePercentLow === "number" &&
      m.frametime.status === "available"
    );
  }
  if (m.metricKind === "synthetic-stub") {
    return (
      m.fpsAverage.status === "unavailable" &&
      m.fpsOnePercentLow.status === "unavailable" &&
      m.frametime.status === "unavailable"
    );
  }
  if (m.metricKind === "external-aggregated") {
    return (
      m.fpsOnePercentLow.status === "unavailable" &&
      m.frametime.status === "unavailable"
    );
  }
  return true;
}

function findVerification(
  verificationId: string | undefined,
  file: HumanVerificationFile,
): HumanVerificationRecord | undefined {
  if (!verificationId) return undefined;
  return file.records.find((r) => r.verificationId === verificationId);
}

function rangeDerivationForAggregate(
  aggregate: AggregatedPerformanceEvidence,
): PerformanceEvidenceRecord["captureConditions"] extends infer T
  ? T extends { rangeDerivation: infer R }
    ? R
    : never
  : never {
  if (aggregate.aggregationMethod === "three-plus-weighted-percentiles") {
    return "external-aggregated-weighted-percentiles";
  }
  return "external-aggregated-two-source-range";
}

function performanceRecordFromAggregate(
  key: PilotBaselineKey,
  aggregate: AggregatedPerformanceEvidence,
  syntheticReference: PerformanceEvidenceRecord | undefined,
  dataVersion: string,
  sourceObservations: readonly ExternalPerformanceObservation[],
): PerformanceEvidenceRecord {
  const buildPartIds = syntheticReference?.buildPartIds ?? {
    caseId: "case.fractal-design-north-tg-dark" as const,
    motherboardId: "motherboard.gigabyte-b650-aorus-elite-ax-v2" as const,
    cpuId: "cpu.amd-ryzen-5-7600" as const,
    gpuId: "gpu.asus-dual-rtx4070-o12g" as const,
    coolerId: "cooler.noctua-nh-d15-g2" as const,
    ramId: "ram.teamgroup-t-create-expert-ddr5-6000-32gb" as const,
    psuId: "psu.corsair-rm750e" as const,
  };

  const accessed =
    latestAccessedAt(
      sourceObservations,
      aggregate.contributingObservationIds,
    ) ?? dataVersion;
  // Normalize date-only accessedAt to a stable ISO datetime for freshness.
  const capturedAt = /^\d{4}-\d{2}-\d{2}$/.test(accessed)
    ? `${accessed}T00:00:00.000Z`
    : accessed;

  return {
    provenanceContractVersion: "prov4",
    evidenceId: `perf.pilot.${key.resolution}.external-aggregated`,
    key,
    buildPartIds,
    measurement: {
      metricKind: "external-aggregated",
      fpsMin: aggregate.fpsMin,
      fpsMax: aggregate.fpsMax,
      fpsAverage: aggregate.fpsAverage,
      fpsOnePercentLow: {
        status: "unavailable",
        reason: "external aggregate; 1% low not published across sources",
      },
      frametime: {
        status: "unavailable",
        reason: "external aggregate; frametime not published across sources",
      },
    },
    confidence: aggregate.confidence,
    dataVersion,
    basis: aggregate.basis,
    sourceIds: aggregate.contributingSourceIds,
    capturedAt,
    freshnessPolicy: { maxAgeDays: 365 },
    captureConditions: {
      protocolId: "prov4.external-aggregate",
      protocolVersion: "2026.08.1",
      runCount: aggregate.contributingObservationIds.length,
      rangeDerivation:
        aggregate.aggregationMethod === "published-range"
          ? "imported-review-stated-range"
          : rangeDerivationForAggregate(aggregate),
      gamePatchVersion: "varies-by-source",
      gpuDriverVersion: "varies-by-source",
      toolName: "curated-external-observations",
      toolVersion: dataVersion,
      graphicsSettings: {
        presetId: "preset.raster-ultra",
        exactSettings:
          "Exact pilot comparability key; see contributing observation fixtures",
      },
      powerThermal: {
        cpuPowerLimitId: "cpu-power.default",
        gpuPowerLimitId: "gpu-power.default",
        conditions: "review benches; not first-party capture",
      },
      // Intentionally omit rawArtifact: external aggregates are not lab captures.
    },
    limitingFactor: {
      category: "GPU-bound",
      explanation:
        "External-review aggregate for pilot raster-ultra; not a measured bottleneck claim.",
    },
  };
}

function bindLegacyRow(
  input: BindPerformanceEvidenceInput,
  row: PerformanceEvidenceRecord,
): PerformanceEvidenceBinding {
  const resolved = resolveSources(row.sourceIds, input.registry);
  if (!resolved.ok) {
    return unavailable(
      "missing_source",
      `Unresolved sourceIds on evidence ${row.evidenceId}`,
    );
  }
  const { sources } = resolved;

  if (!hasCompleteCharterMetrics(row)) {
    return unavailable(
      "incomplete_charter_metrics",
      `Evidence ${row.evidenceId} has incomplete charter metrics for metricKind ${row.measurement.metricKind}`,
    );
  }

  if (
    row.confidence === "low" ||
    row.confidence === "medium" ||
    row.confidence === "high" ||
    row.measurement.metricKind === "first-party-measured"
  ) {
    if (!row.captureConditions) {
      return unavailable(
        "incomplete_capture_conditions",
        `Evidence ${row.evidenceId} requires complete captureConditions`,
      );
    }
    if (
      row.measurement.metricKind === "first-party-measured" &&
      row.captureConditions.runCount < 2
    ) {
      return unavailable(
        "incomplete_capture_conditions",
        `Evidence ${row.evidenceId} first-party-measured requires runCount >= 2`,
      );
    }
  }

  if (
    input.verifiedArtifactDigests &&
    row.measurement.metricKind !== "external-aggregated"
  ) {
    for (const digest of collectArtifactDigests(row)) {
      if (!input.verifiedArtifactDigests.has(digest)) {
        return unavailable(
          "raw_artifact_integrity_failed",
          `Raw artifact digest ${digest} failed integrity verification`,
        );
      }
    }
  }

  const ceiling = confidenceCeiling(sources);
  if (ceiling === "none" || exceedsCeiling(row.confidence, ceiling)) {
    return unavailable(
      "confidence_ceiling_violation",
      `Confidence "${row.confidence}" exceeds source-class ceiling "${ceiling}"`,
    );
  }

  let verification: HumanVerificationRecord | undefined;
  if (row.confidence === "high") {
    if (!row.verificationId) {
      return unavailable(
        "verification_required",
        `Evidence ${row.evidenceId} confidence "high" requires verificationId`,
      );
    }
    verification = findVerification(row.verificationId, input.verifications);
    if (!verification) {
      return unavailable(
        "verification_required",
        `Missing verification record ${row.verificationId}`,
      );
    }
    if (
      verification.kind !== "performance-capture-attestation" ||
      verification.verdict !== "pass" ||
      !highGateDigestsIncludeCapture(row, verification)
    ) {
      return unavailable(
        "verification_failed",
        `Verification ${row.verificationId} failed high-gate attestation checks`,
      );
    }
  } else if (row.verificationId) {
    verification = findVerification(row.verificationId, input.verifications);
  }

  const freshness = classifyFreshness({
    asOf: row.capturedAt,
    policy: row.freshnessPolicy,
    nowIso: input.nowIso,
  });

  return {
    status: "bound",
    evidence: row,
    freshness,
    sources,
    verification,
  };
}

function findSyntheticReference(
  input: BindPerformanceEvidenceInput,
): PerformanceEvidenceRecord | undefined {
  return input.evidenceFile.rows.find(
    (row) =>
      pilotKeyEquals(row.key, input.key) &&
      row.measurement.metricKind === "synthetic-stub",
  );
}

export function bindPerformanceEvidence(
  input: BindPerformanceEvidenceInput,
): PerformanceEvidenceBinding {
  return bindPerformanceEvidenceDetailed(input).binding;
}

export function bindPerformanceEvidenceDetailed(
  input: BindPerformanceEvidenceInput,
): BindPerformanceEvidenceResult {
  if (!input.isPilotBuild) {
    return {
      binding: unavailable(
        "not_pilot_key",
        "Build is not the exact pilot part set; no prov4 performance overlay",
      ),
      displayClass: "unavailable",
    };
  }

  const syntheticReference = findSyntheticReference(input);

  if (input.externalObservations) {
    if (!input.sourceRights) {
      return {
        binding: unavailable(
          "missing_source",
          "External observations present but sourceRights record was not provided; fail closed",
        ),
        syntheticReference,
        displayClass: "synthetic-perf1",
      };
    }

    const aggregation = aggregateComparableObservations(
      input.key,
      input.externalObservations.observations,
      input.sourceRights,
    );

    if (aggregation.status === "aggregated") {
      const evidence = performanceRecordFromAggregate(
        input.key,
        aggregation,
        syntheticReference,
        input.externalObservations.dataVersion,
        input.externalObservations.observations,
      );
      const binding = bindLegacyRow(input, evidence);
      if (binding.status === "bound") {
        return { binding, displayClass: "aggregated" };
      }
      return {
        binding,
        syntheticReference,
        displayClass: "unavailable",
      };
    }

    return {
      binding: unavailable("missing_evidence_row", aggregation.explanation),
      syntheticReference,
      displayClass: "synthetic-perf1",
    };
  }

  const row = input.evidenceFile.rows.find((r) =>
    pilotKeyEquals(r.key, input.key),
  );
  if (!row) {
    return {
      binding: unavailable(
        "missing_evidence_row",
        `No prov4 performance evidence row for resolution ${input.key.resolution}`,
      ),
      displayClass: "unavailable",
    };
  }

  const binding = bindLegacyRow(input, row);
  const displayClass =
    row.measurement.metricKind === "synthetic-stub"
      ? "synthetic-perf1"
      : binding.status === "bound"
        ? "aggregated"
        : "unavailable";

  return {
    binding,
    syntheticReference:
      row.measurement.metricKind === "synthetic-stub" ? row : undefined,
    displayClass,
  };
}

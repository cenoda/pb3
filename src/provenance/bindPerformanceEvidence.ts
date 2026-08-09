/**
 * Pure performance evidence binder (prov4 §6.7).
 * Exact pilot key only; never invents FPS.
 */
import type {
  EvidenceSource,
  EvidenceSourceRegistryFile,
  HumanVerificationFile,
  HumanVerificationRecord,
  PerformanceEvidenceBinding,
  PerformanceEvidenceFile,
  PerformanceEvidenceRecord,
  PilotBaselineKey,
} from "../contract/prov4";
import { highGateDigestsIncludeCapture } from "../contract/prov4.schema";
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
  /**
   * Digests verified OK by integrity (repo-file on-disk match, etc.).
   * When provided, every rawArtifact sha256 on the bound row must be present.
   * When omitted, digest existence checks are skipped (schema shape still enforced).
   */
  verifiedArtifactDigests?: ReadonlySet<string>;
}

function unavailable(
  reason: Extract<PerformanceEvidenceBinding, { status: "unavailable" }>["reason"],
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

function confidenceCeiling(sources: EvidenceSource[]): "stub" | "medium" | "high" | "none" {
  if (sources.length === 0) return "none";
  const classes = new Set(sources.map((s) => s.sourceClass));
  if (classes.has("first-party")) return "high";
  if (classes.has("external-review")) return "medium";
  if ([...classes].every((c) => c === "project-synthetic")) return "stub";
  // manufacturer-spec alone does not raise performance confidence
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
  if (row.captureConditions) {
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
  // external-review: each field present as number or unavailable (schema ensures)
  return true;
}

function findVerification(
  verificationId: string | undefined,
  file: HumanVerificationFile,
): HumanVerificationRecord | undefined {
  if (!verificationId) return undefined;
  return file.records.find((r) => r.verificationId === verificationId);
}

export function bindPerformanceEvidence(
  input: BindPerformanceEvidenceInput,
): PerformanceEvidenceBinding {
  if (!input.isPilotBuild) {
    return unavailable(
      "not_pilot_key",
      "Build is not the exact pilot part set; no prov4 performance overlay",
    );
  }

  const row = input.evidenceFile.rows.find((r) =>
    pilotKeyEquals(r.key, input.key),
  );
  if (!row) {
    return unavailable(
      "missing_evidence_row",
      `No prov4 performance evidence row for resolution ${input.key.resolution}`,
    );
  }

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

  if (input.verifiedArtifactDigests) {
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

  // Default M0 presentation: bound + stale disclosure (do not withhold)
  return {
    status: "bound",
    evidence: row,
    freshness,
    sources,
    verification,
  };
}

/**
 * Pure combination performance estimator (`est1`).
 * Control flow: ALGORITHM_DISCUSSION.md §0.1 (O1–O9).
 *
 * Temporary draft: motherboard/cooling/case airflow/non-default power out of M0.
 * Never returns synthetic-stub (O9).
 */
import {
  DEFAULT_ESTIMATOR_POLICY,
  EST1_CONTRACT_VERSION,
  EST1_DEFAULT_DATA_VERSION,
  EST1_DRAFT_CAVEAT,
  type CombinationEstimate,
  type CombinationEstimateResult,
  type CombinationEstimateUnavailable,
  type CpuScaleEdge,
  type EstimatorExclusionReason,
  type EstimatorPolicy,
  type EstimatorQuery,
  type VendorPerformanceAnchor,
} from "../contract/est1";
import type {
  ExternalPerformanceObservation,
  SourceRightsRecordFile,
} from "../contract/prov4";
import { aggregateComparableObservations } from "../provenance/aggregatePerformanceEvidence";
import { sourceRightsEligibility } from "../provenance/groupComparablePerformance";
import {
  applyCpuScaleEdge,
  findCpuScaleEdge,
} from "./applyCpuScaleEdge";
import { estimatorQueryToPilotKey } from "./estimatorQuery";
import {
  extractFpsRange,
  nonCpuFieldsMatch,
  rankReviewObservation,
  rankVendorAnchor,
  sortCandidatesByComparability,
  type RankedAnchorCandidate,
} from "./selectComparableAnchors";
import { validateWithReviews } from "./validateWithReviews";

export interface EstimateCombinationInput {
  query: EstimatorQuery;
  externalObservations: readonly ExternalPerformanceObservation[];
  sourceRights: SourceRightsRecordFile;
  vendorAnchors: readonly VendorPerformanceAnchor[];
  cpuScaleEdges: readonly CpuScaleEdge[];
  policy?: EstimatorPolicy;
  /** Fixture dataVersion fallback when no contributor version is available. */
  dataVersion?: string;
}

function unavailable(
  query: EstimatorQuery,
  reason: CombinationEstimateUnavailable["reason"],
  explanation: string,
  exclusionReasons: EstimatorExclusionReason[],
  dataVersion: string,
): CombinationEstimateUnavailable {
  return {
    status: "unavailable",
    estimatorContractVersion: EST1_CONTRACT_VERSION,
    query,
    reason,
    explanation,
    exclusionReasons,
    dataVersion,
    draftCaveat: EST1_DRAFT_CAVEAT,
  };
}

function relativeRangeWidth(
  fpsMin: number,
  fpsMax: number,
  fpsAverage: number,
): number {
  const mid = (fpsMin + fpsMax) / 2;
  const denom = Math.max(Math.abs(fpsAverage), Math.abs(mid), 1e-9);
  return (fpsMax - fpsMin) / denom;
}

function finalizeEstimate(
  estimate: CombinationEstimate,
  policy: EstimatorPolicy,
): CombinationEstimateResult {
  if (
    relativeRangeWidth(
      estimate.fpsMin,
      estimate.fpsMax,
      estimate.fpsAverage,
    ) > policy.maxRelativeRangeWidth
  ) {
    return unavailable(
      estimate.query,
      "range_too_wide",
      `Relative range width exceeds policy max ${policy.maxRelativeRangeWidth} (P1)`,
      estimate.exclusionReasons,
      estimate.dataVersion,
    );
  }
  return estimate;
}

function applyO4(
  estimate: CombinationEstimate,
  input: EstimateCombinationInput,
  policy: EstimatorPolicy,
): CombinationEstimateResult {
  if (!policy.requireReviewValidationWhenComparable) {
    return finalizeEstimate(estimate, policy);
  }

  // For exact-aggregate, contributors already are the comparable reviews;
  // still run validation when additional structure requires bounding (no-op
  // if the same set yields identical bounds).
  const validated = validateWithReviews({
    estimate,
    query: input.query,
    externalObservations: input.externalObservations,
    sourceRights: input.sourceRights,
  });

  if (validated.status === "failed") {
    return unavailable(
      input.query,
      "validation_failed",
      validated.explanation,
      validated.exclusionReasons,
      estimate.dataVersion,
    );
  }

  const next =
    validated.status === "ok" ? validated.estimate : validated.estimate;
  return finalizeEstimate(
    {
      ...next,
      exclusionReasons: validated.exclusionReasons,
    },
    policy,
  );
}

function vendorAnchorRightsOk(
  anchor: VendorPerformanceAnchor,
  sourceRights: SourceRightsRecordFile,
): { ok: true } | { ok: false; detail: string } {
  // Reuse observation-shaped eligibility via a shim.
  const shim = {
    observationId: anchor.anchorId,
    sourceId: anchor.sourceId,
  } as ExternalPerformanceObservation;
  const result = sourceRightsEligibility(shim, sourceRights);
  if (!result.eligible) {
    return { ok: false, detail: result.detail };
  }
  return { ok: true };
}

function tryExactAggregate(
  input: EstimateCombinationInput,
  policy: EstimatorPolicy,
  dataVersion: string,
  exclusions: EstimatorExclusionReason[],
): CombinationEstimateResult | null {
  const key = estimatorQueryToPilotKey(input.query);
  const agg = aggregateComparableObservations(
    key,
    input.externalObservations,
    input.sourceRights,
  );

  for (const ex of agg.exclusionReasons) {
    exclusions.push({ code: ex.reason, detail: ex.detail });
  }

  if (agg.status !== "aggregated") {
    return null;
  }

  const estimate: CombinationEstimate = {
    status: "estimated",
    estimatorContractVersion: EST1_CONTRACT_VERSION,
    query: input.query,
    fpsMin: agg.fpsMin,
    fpsMax: agg.fpsMax,
    fpsAverage: agg.fpsAverage,
    confidence: agg.confidence === "medium" ? "medium" : "low",
    method: "exact-aggregate",
    basis: agg.basis,
    draftCaveat: EST1_DRAFT_CAVEAT,
    contributors: agg.contributingObservationIds.map((id) => ({
      role: "exact-observation" as const,
      refKind: "prov4-observation" as const,
      refId: id,
    })),
    exclusionReasons: [...exclusions],
    dataVersion,
  };

  return applyO4(estimate, input, policy);
}

function tryVendorIdentity(
  candidate: RankedAnchorCandidate,
  anchor: VendorPerformanceAnchor,
  input: EstimateCombinationInput,
  policy: EstimatorPolicy,
  dataVersion: string,
  exclusions: EstimatorExclusionReason[],
): CombinationEstimateResult | null {
  if (candidate.cpuId !== input.query.cpuId) return null;
  if (!nonCpuFieldsMatch(input.query, candidate)) return null;

  const range = extractFpsRange(candidate);
  if (!range) {
    exclusions.push({
      code: "comparability_failed",
      detail: `Vendor anchor ${candidate.id} lacks usable FPS`,
    });
    return null;
  }

  const estimate: CombinationEstimate = {
    status: "estimated",
    estimatorContractVersion: EST1_CONTRACT_VERSION,
    query: input.query,
    ...range,
    confidence: "low",
    method: "vendor-anchor",
    basis: `Vendor identity anchor ${anchor.anchorId} (exact CPU match)`,
    draftCaveat: EST1_DRAFT_CAVEAT,
    contributors: [
      {
        role: "primary-anchor",
        refKind: "vendor-anchor",
        refId: anchor.anchorId,
      },
    ],
    exclusionReasons: [...exclusions],
    dataVersion,
  };

  return applyO4(estimate, input, policy);
}

function tryScaledCandidate(
  candidate: RankedAnchorCandidate,
  input: EstimateCombinationInput,
  policy: EstimatorPolicy,
  dataVersion: string,
  exclusions: EstimatorExclusionReason[],
): CombinationEstimateResult | null {
  // O2/O3: no CPU transform without evidenced edge — including 1440p/4K.
  // No GPU-bound waiver.
  if (policy.allowGpuBoundCpuWaiverWithoutRatio) {
    // Locked false in M0; defensive.
  }

  if (!nonCpuFieldsMatch(input.query, candidate)) {
    exclusions.push({
      code: "comparability_failed",
      detail: `Candidate ${candidate.id} fails non-CPU field match`,
    });
    return null;
  }

  if (candidate.cpuId === undefined) {
    exclusions.push({
      code: "comparability_failed",
      detail: `Candidate ${candidate.id} missing cpuId — M0 non-scalable`,
    });
    return null;
  }

  if (candidate.cpuId === input.query.cpuId) {
    // Exact CPU already handled by identity/exact paths.
    return null;
  }

  const edge = findCpuScaleEdge(
    input.cpuScaleEdges,
    candidate.cpuId,
    input.query.cpuId,
    input.query.resolution,
    input.query.gameId,
  );

  if (!edge) {
    exclusions.push({
      code: "missing_scale_edge",
      detail: `No CpuScaleEdge from ${candidate.cpuId} → ${input.query.cpuId} for ${input.query.resolution}`,
    });
    return null;
  }

  const range = extractFpsRange(candidate);
  if (!range) {
    exclusions.push({
      code: "comparability_failed",
      detail: `Candidate ${candidate.id} lacks usable FPS for scaling`,
    });
    return null;
  }

  const scaled = applyCpuScaleEdge(range, edge);
  const estimate: CombinationEstimate = {
    status: "estimated",
    estimatorContractVersion: EST1_CONTRACT_VERSION,
    query: input.query,
    ...scaled,
    confidence: policy.scaledConfidenceCeiling,
    method: "scaled-combination",
    basis: `Scaled ${candidate.kind} ${candidate.id} via ${edge.edgeId} (factor=${edge.factor}, uncertainty=${edge.uncertainty})`,
    draftCaveat: EST1_DRAFT_CAVEAT,
    contributors: [
      {
        role: "primary-anchor",
        refKind:
          candidate.kind === "vendor" ? "vendor-anchor" : "prov4-observation",
        refId: candidate.id,
      },
      {
        role: "scale-edge",
        refKind: "cpu-scale-edge",
        refId: edge.edgeId,
      },
    ],
    exclusionReasons: [...exclusions],
    dataVersion,
  };

  return applyO4(estimate, input, policy);
}

/**
 * Estimate combination performance for a pilot query.
 * Deterministic; no clock I/O; no network.
 */
export function estimateCombinationPerformance(
  input: EstimateCombinationInput,
): CombinationEstimateResult {
  const policy = input.policy ?? DEFAULT_ESTIMATOR_POLICY;
  const dataVersion = input.dataVersion ?? EST1_DEFAULT_DATA_VERSION;
  const exclusions: EstimatorExclusionReason[] = [];

  // Path 1: exact-comparable multi-source aggregate (highest strength).
  const exact = tryExactAggregate(input, policy, dataVersion, exclusions);
  if (exact && exact.status === "estimated") {
    return exact;
  }
  if (exact && exact.status === "unavailable") {
    // Exact path produced a concrete policy failure (e.g. range_too_wide /
    // validation_failed) — do not silently fall through to weaker methods.
    if (
      exact.reason === "range_too_wide" ||
      exact.reason === "validation_failed" ||
      exact.reason === "policy_block"
    ) {
      return exact;
    }
  }

  // Collect vendor + review candidates (comparability-first ranking, O1).
  const ranked: RankedAnchorCandidate[] = [];

  for (const anchor of input.vendorAnchors) {
    const rights = vendorAnchorRightsOk(anchor, input.sourceRights);
    if (!rights.ok) {
      exclusions.push({
        code: "rights_denied",
        detail: rights.detail,
      });
      continue;
    }
    ranked.push(rankVendorAnchor(input.query, anchor));
  }

  for (const obs of input.externalObservations) {
    const rights = sourceRightsEligibility(obs, input.sourceRights);
    if (!rights.eligible) {
      exclusions.push({
        code: "rights_denied",
        detail: rights.detail,
      });
      continue;
    }
    // Skip exact CPU matches here — they belong to exact aggregate path.
    // Near-miss (CPU mismatch) candidates may scale.
    ranked.push(rankReviewObservation(input.query, obs));
  }

  const sorted = sortCandidatesByComparability(ranked);
  let sawMissingScaleEdge = false;

  for (const candidate of sorted) {
    if (candidate.kind === "vendor") {
      const anchor = input.vendorAnchors.find(
        (a) => a.anchorId === candidate.id,
      );
      if (!anchor) continue;

      // Identity vendor path (exact CPU).
      if (candidate.cpuId === input.query.cpuId) {
        const identity = tryVendorIdentity(
          candidate,
          anchor,
          input,
          policy,
          dataVersion,
          exclusions,
        );
        if (identity?.status === "estimated") return identity;
        if (
          identity?.status === "unavailable" &&
          (identity.reason === "range_too_wide" ||
            identity.reason === "validation_failed")
        ) {
          return identity;
        }
        continue;
      }

      const beforeLen = exclusions.length;
      const scaled = tryScaledCandidate(
        candidate,
        input,
        policy,
        dataVersion,
        exclusions,
      );
      if (
        exclusions.slice(beforeLen).some((e) => e.code === "missing_scale_edge")
      ) {
        sawMissingScaleEdge = true;
      }
      if (scaled?.status === "estimated") return scaled;
      if (
        scaled?.status === "unavailable" &&
        (scaled.reason === "range_too_wide" ||
          scaled.reason === "validation_failed")
      ) {
        return scaled;
      }
      continue;
    }

    // Review near-miss scale path (CPU mismatch only).
    if (candidate.cpuId === input.query.cpuId) {
      // Exact reviews without successful aggregate already handled → skip.
      continue;
    }

    const beforeLen = exclusions.length;
    const scaled = tryScaledCandidate(
      candidate,
      input,
      policy,
      dataVersion,
      exclusions,
    );
    if (
      exclusions.slice(beforeLen).some((e) => e.code === "missing_scale_edge")
    ) {
      sawMissingScaleEdge = true;
    }
    if (scaled?.status === "estimated") return scaled;
    if (
      scaled?.status === "unavailable" &&
      (scaled.reason === "range_too_wide" ||
        scaled.reason === "validation_failed")
    ) {
      return scaled;
    }
  }

  if (sawMissingScaleEdge) {
    return unavailable(
      input.query,
      "missing_scale_edge",
      "CPU-mismatched anchors require an evidenced CpuScaleEdge; none matched (O2/O3 — no GPU-bound waiver)",
      exclusions,
      dataVersion,
    );
  }

  return unavailable(
    input.query,
    "no_candidates",
    "No estimator candidates survived comparability-first selection under M0 policy",
    exclusions,
    dataVersion,
  );
}

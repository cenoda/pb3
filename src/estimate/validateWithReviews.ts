/**
 * O4: when comparable review observations exist, must validate/bound the estimate.
 */
import type {
  CombinationEstimate,
  EstimatorContributor,
  EstimatorExclusionReason,
  EstimatorQuery,
} from "../contract/est1";
import type {
  ExternalPerformanceObservation,
  SourceRightsRecordFile,
} from "../contract/prov4";
import { aggregateComparableObservations } from "../provenance/aggregatePerformanceEvidence";
import { groupComparableObservations } from "../provenance/groupComparablePerformance";
import { estimatorQueryToPilotKey } from "./estimatorQuery";

export type ValidationOutcome =
  | {
      status: "ok";
      estimate: CombinationEstimate;
      contributors: EstimatorContributor[];
      exclusionReasons: EstimatorExclusionReason[];
    }
  | {
      status: "failed";
      reason: "validation_failed";
      explanation: string;
      exclusionReasons: EstimatorExclusionReason[];
    }
  | {
      status: "noop";
      estimate: CombinationEstimate;
      exclusionReasons: EstimatorExclusionReason[];
    };

/**
 * If exact-comparable reviews exist for the query, intersect the estimate
 * range with review-derived bounds. Empty intersection → validation_failed.
 * No comparable reviews → no-op.
 */
export function validateWithReviews(input: {
  estimate: CombinationEstimate;
  query: EstimatorQuery;
  externalObservations: readonly ExternalPerformanceObservation[];
  sourceRights: SourceRightsRecordFile;
}): ValidationOutcome {
  const { estimate, query, externalObservations, sourceRights } = input;
  const key = estimatorQueryToPilotKey(query);
  const { comparable, exclusions } = groupComparableObservations(
    key,
    externalObservations,
    sourceRights,
  );

  const exclusionReasons: EstimatorExclusionReason[] = [
    ...estimate.exclusionReasons,
    ...exclusions.map((ex) => ({
      code: ex.reason,
      detail: ex.detail,
    })),
  ];

  if (comparable.length === 0) {
    return { status: "noop", estimate, exclusionReasons };
  }

  // Prefer aggregate bounds when aggregation succeeds; else use min/max of avgs/ranges.
  const agg = aggregateComparableObservations(
    key,
    externalObservations,
    sourceRights,
  );

  let boundMin: number;
  let boundMax: number;
  const reviewContributors: EstimatorContributor[] = [];

  if (agg.status === "aggregated") {
    boundMin = agg.fpsMin;
    boundMax = agg.fpsMax;
    for (const id of agg.contributingObservationIds) {
      reviewContributors.push({
        role: "review-validation",
        refKind: "prov4-observation",
        refId: id,
      });
    }
  } else {
    const lows: number[] = [];
    const highs: number[] = [];
    for (const obs of comparable) {
      if (
        obs.fpsRangeMin !== undefined &&
        obs.fpsRangeMax !== undefined &&
        obs.fpsRangeMin < obs.fpsRangeMax
      ) {
        lows.push(obs.fpsRangeMin);
        highs.push(obs.fpsRangeMax);
      } else if (typeof obs.fpsAverage === "number") {
        lows.push(obs.fpsAverage * 0.95);
        highs.push(obs.fpsAverage * 1.05);
      }
      reviewContributors.push({
        role: "review-validation",
        refKind: "prov4-observation",
        refId: obs.observationId,
      });
    }
    if (lows.length === 0 || highs.length === 0) {
      return {
        status: "failed",
        reason: "validation_failed",
        explanation:
          "Comparable reviews exist but lack usable FPS bounds for O4 validation",
        exclusionReasons,
      };
    }
    boundMin = Math.min(...lows);
    boundMax = Math.max(...highs);
  }

  const fpsMin = Math.max(estimate.fpsMin, boundMin);
  const fpsMax = Math.min(estimate.fpsMax, boundMax);

  if (!(fpsMin < fpsMax)) {
    return {
      status: "failed",
      reason: "validation_failed",
      explanation: `Estimate range ${estimate.fpsMin}–${estimate.fpsMax} does not intersect comparable review bounds ${boundMin}–${boundMax}`,
      exclusionReasons,
    };
  }

  let fpsAverage = estimate.fpsAverage;
  if (fpsAverage < fpsMin) fpsAverage = fpsMin;
  if (fpsAverage > fpsMax) fpsAverage = fpsMax;

  const contributors: EstimatorContributor[] = [
    ...estimate.contributors,
    ...reviewContributors.filter(
      (c) =>
        !estimate.contributors.some(
          (e) => e.refId === c.refId && e.role === c.role,
        ),
    ),
  ];

  return {
    status: "ok",
    estimate: {
      ...estimate,
      fpsMin,
      fpsMax,
      fpsAverage,
      basis: `${estimate.basis}; bounded by comparable review validation (O4)`,
      contributors,
      exclusionReasons,
    },
    contributors,
    exclusionReasons,
  };
}

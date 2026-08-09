/**
 * Deterministic external observation aggregation (corrective plan §4).
 */
import type {
  AggregatePerformanceResult,
  ExternalPerformanceObservation,
  ObservationExclusion,
  ObservationWeighting,
  PilotBaselineKey,
  SourceRightsRecordFile,
} from "../contract/prov4";
import { groupComparableObservations } from "./groupComparablePerformance";

const SOURCE_METHOD_WEIGHT = {
  "tier-a-reviewed": 3,
  "tier-b-reviewed": 2,
  manufacturer: 1,
} as const;

const CONDITION_COMPLETENESS_WEIGHT = {
  "full-disclosed": 3,
  "partial-disclosed": 2,
  minimal: 1,
} as const;

const RECENCY_CLASS_WEIGHT = {
  current: 3,
  recent: 2,
  aged: 1,
} as const;

export function computeObservationWeight(
  weighting: ObservationWeighting,
): number {
  return (
    SOURCE_METHOD_WEIGHT[weighting.sourceMethodQuality] *
    CONDITION_COMPLETENESS_WEIGHT[weighting.conditionCompleteness] *
    RECENCY_CLASS_WEIGHT[weighting.recencyClass]
  );
}

interface WeightedValue {
  value: number;
  weight: number;
  observationId: string;
  sourceId: string;
}

function weightedPercentile(
  items: WeightedValue[],
  percentile: number,
): number {
  const sorted = [...items].sort((a, b) => a.value - b.value);
  const totalWeight = sorted.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return sorted[0]?.value ?? 0;

  const target = (percentile / 100) * totalWeight;
  let cumulative = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    cumulative += sorted[i]!.weight;
    if (cumulative >= target) {
      const prev = sorted[i - 1];
      if (!prev || cumulative === sorted[i]!.weight) {
        return sorted[i]!.value;
      }
      const span = cumulative - (cumulative - sorted[i]!.weight);
      const prevCumulative = cumulative - span;
      const fraction = (target - prevCumulative) / span;
      return prev.value + fraction * (sorted[i]!.value - prev.value);
    }
  }
  return sorted[sorted.length - 1]!.value;
}

function hasPublishedRange(
  observation: ExternalPerformanceObservation,
): boolean {
  return (
    observation.fpsRangeMin !== undefined &&
    observation.fpsRangeMax !== undefined &&
    observation.fpsRangeMin < observation.fpsRangeMax
  );
}

function hasAverage(observation: ExternalPerformanceObservation): boolean {
  return (
    typeof observation.fpsAverage === "number" && observation.fpsAverage > 0
  );
}

function aggregateFromComparable(
  exactKey: PilotBaselineKey,
  comparable: ExternalPerformanceObservation[],
  exclusions: ObservationExclusion[],
): AggregatePerformanceResult {
  if (comparable.length === 0) {
    return {
      status: "unavailable",
      reason: "no_comparable_observations",
      explanation: `No comparable external observations for exact pilot key at ${exactKey.resolution}`,
      exclusionReasons: exclusions,
    };
  }

  const withAverage = comparable.filter(hasAverage);

  if (withAverage.length >= 3) {
    const weighted: WeightedValue[] = withAverage.map((obs) => ({
      value: obs.fpsAverage!,
      weight: computeObservationWeight(obs.weighting),
      observationId: obs.observationId,
      sourceId: obs.sourceId,
    }));
    const fpsMin = weightedPercentile(weighted, 20);
    const fpsAverage = weightedPercentile(weighted, 50);
    const fpsMax = weightedPercentile(weighted, 80);
    if (!(fpsMin < fpsMax)) {
      return {
        status: "unavailable",
        reason: "insufficient_independent_sources",
        explanation:
          "Weighted percentiles collapsed; refusing to invent a product range",
        exclusionReasons: exclusions,
      };
    }
    return {
      status: "aggregated",
      fpsMin,
      fpsMax,
      fpsAverage,
      confidence: "medium",
      aggregationMethod: "three-plus-weighted-percentiles",
      contributingObservationIds: withAverage.map((o) => o.observationId),
      contributingSourceIds: [...new Set(withAverage.map((o) => o.sourceId))],
      exclusionReasons: exclusions,
      basis: `Aggregated ${withAverage.length} independent external observations (weighted 20th/50th/80th percentiles)`,
    };
  }

  if (withAverage.length === 2) {
    const sorted = withAverage
      .map((obs) => obs.fpsAverage!)
      .sort((a, b) => a - b);
    const fpsMin = sorted[0]!;
    const fpsMax = sorted[1]!;
    if (!(fpsMin < fpsMax)) {
      return {
        status: "unavailable",
        reason: "insufficient_independent_sources",
        explanation: "Two-source averages collapsed to identical values",
        referenceObservationIds: withAverage.map((o) => o.observationId),
        exclusionReasons: exclusions,
      };
    }
    return {
      status: "aggregated",
      fpsMin,
      fpsMax,
      fpsAverage: (fpsMin + fpsMax) / 2,
      confidence: "low",
      aggregationMethod: "two-observation-range",
      contributingObservationIds: withAverage.map((o) => o.observationId),
      contributingSourceIds: [...new Set(withAverage.map((o) => o.sourceId))],
      exclusionReasons: exclusions,
      basis:
        "Two independent external observations: range from ordered averages",
    };
  }

  if (withAverage.length === 1 && hasPublishedRange(withAverage[0]!)) {
    const obs = withAverage[0]!;
    return {
      status: "aggregated",
      fpsMin: obs.fpsRangeMin!,
      fpsMax: obs.fpsRangeMax!,
      fpsAverage: obs.fpsAverage!,
      confidence: "low",
      aggregationMethod: "published-range",
      contributingObservationIds: [obs.observationId],
      contributingSourceIds: [obs.sourceId],
      exclusionReasons: exclusions,
      basis:
        "Single observation with source-published repeatability range preserved",
    };
  }

  const rangeOnly = comparable.find(hasPublishedRange);
  if (comparable.length === 1 && rangeOnly) {
    return {
      status: "aggregated",
      fpsMin: rangeOnly.fpsRangeMin!,
      fpsMax: rangeOnly.fpsRangeMax!,
      fpsAverage: (rangeOnly.fpsRangeMin! + rangeOnly.fpsRangeMax!) / 2,
      confidence: "low",
      aggregationMethod: "published-range",
      contributingObservationIds: [rangeOnly.observationId],
      contributingSourceIds: [rangeOnly.sourceId],
      exclusionReasons: exclusions,
      basis:
        "Single observation with source-published range (no separate average)",
    };
  }

  if (withAverage.length === 1) {
    return {
      status: "unavailable",
      reason: "single_average_only",
      explanation:
        "One average-only observation is evidence sidecar reference only; product range unavailable",
      referenceObservationIds: [withAverage[0]!.observationId],
      exclusionReasons: exclusions,
    };
  }

  return {
    status: "unavailable",
    reason: "insufficient_independent_sources",
    explanation:
      "Comparable observations lack averages or published ranges required for aggregation",
    exclusionReasons: exclusions,
  };
}

export function aggregateComparableObservations(
  exactKey: PilotBaselineKey,
  observations: readonly ExternalPerformanceObservation[],
  sourceRights: SourceRightsRecordFile,
): AggregatePerformanceResult {
  if (observations.length === 0) {
    return {
      status: "unavailable",
      reason: "no_observations",
      explanation: "No external performance observations in fixture",
      exclusionReasons: [],
    };
  }

  const { comparable, exclusions } = groupComparableObservations(
    exactKey,
    observations,
    sourceRights,
  );
  return aggregateFromComparable(exactKey, comparable, exclusions);
}

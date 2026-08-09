/**
 * Comparability-first ranking of estimator anchors (O1).
 * Harvest order may prefer manufacturer corpora; ranking never prefers weaker evidence.
 */
import type {
  EstimatorQuery,
  VendorPerformanceAnchor,
} from "../contract/est1";
import type { ExternalPerformanceObservation } from "../contract/prov4";
import {
  qualityClassFromExactSettings,
} from "../provenance/groupComparablePerformance";

export type AnchorKind = "vendor" | "review";

export interface RankedAnchorCandidate {
  kind: AnchorKind;
  id: string;
  sourceId: string;
  cpuId: string | undefined;
  gpuId: string;
  gameId: string;
  presetId: string | undefined;
  resolution: string;
  upscaleId: string;
  frameGenId: string;
  rayTracingState: string;
  exactSettings: string;
  fpsAverage?: number;
  fpsRangeMin?: number;
  fpsRangeMax?: number;
  /** Higher is better. */
  score: number;
  fieldMatchScore: number;
  metricScore: number;
  sourceScore: number;
}

function fieldMatchScore(
  query: EstimatorQuery,
  candidate: {
    cpuId?: string;
    gpuId: string;
    gameId: string;
    presetId?: string;
    resolution: string;
    upscaleId: string;
    frameGenId: string;
    rayTracingState: string;
  },
): number {
  let score = 0;
  if (candidate.gpuId === query.gpuId) score += 20;
  if (candidate.gameId === query.gameId) score += 20;
  if (candidate.resolution === query.resolution) score += 15;
  if (candidate.upscaleId === query.upscaleId) score += 10;
  if (candidate.frameGenId === query.frameGenId) score += 10;
  if (candidate.rayTracingState === query.rayTracingState) score += 10;
  if (candidate.presetId === undefined || candidate.presetId === query.presetId) {
    score += candidate.presetId === query.presetId ? 10 : 3;
  }
  if (candidate.cpuId === query.cpuId) score += 25;
  else if (candidate.cpuId !== undefined) score += 5; // known but mismatched — scalable candidate
  // missing cpuId: +0 (weak)
  return score;
}

function metricScore(candidate: {
  fpsAverage?: number;
  fpsRangeMin?: number;
  fpsRangeMax?: number;
  exactSettings: string;
}): number {
  let score = 0;
  const hasRange =
    candidate.fpsRangeMin !== undefined &&
    candidate.fpsRangeMax !== undefined &&
    candidate.fpsRangeMin < candidate.fpsRangeMax;
  if (hasRange) score += 15;
  if (typeof candidate.fpsAverage === "number") score += 10;
  const quality = qualityClassFromExactSettings(candidate.exactSettings);
  if (quality === "ultra" || quality === "unspecified") score += 5;
  else score -= 5; // material quality conflict risk
  return score;
}

function sourceScore(kind: AnchorKind, sourceMethodHint?: string): number {
  // lab > vendor-official > external-review > marketing-thin
  if (kind === "vendor") return 25;
  if (sourceMethodHint === "tier-a-reviewed") return 30; // strong review can outrank weak vendor
  if (sourceMethodHint === "tier-b-reviewed") return 22;
  if (sourceMethodHint === "manufacturer") return 25;
  return 18;
}

export function rankVendorAnchor(
  query: EstimatorQuery,
  anchor: VendorPerformanceAnchor,
): RankedAnchorCandidate {
  const field = fieldMatchScore(query, anchor);
  const metric = metricScore(anchor);
  const source = sourceScore("vendor");
  return {
    kind: "vendor",
    id: anchor.anchorId,
    sourceId: anchor.sourceId,
    cpuId: anchor.cpuId,
    gpuId: anchor.gpuId,
    gameId: anchor.gameId,
    presetId: anchor.presetId,
    resolution: anchor.resolution,
    upscaleId: anchor.upscaleId,
    frameGenId: anchor.frameGenId,
    rayTracingState: anchor.rayTracingState,
    exactSettings: anchor.exactSettings,
    fpsAverage: anchor.fpsAverage,
    fpsRangeMin: anchor.fpsRangeMin,
    fpsRangeMax: anchor.fpsRangeMax,
    fieldMatchScore: field,
    metricScore: metric,
    sourceScore: source,
    score: field + metric + source,
  };
}

export function rankReviewObservation(
  query: EstimatorQuery,
  observation: ExternalPerformanceObservation,
): RankedAnchorCandidate {
  const field = fieldMatchScore(query, observation);
  const metric = metricScore(observation);
  const source = sourceScore(
    "review",
    observation.weighting.sourceMethodQuality,
  );
  return {
    kind: "review",
    id: observation.observationId,
    sourceId: observation.sourceId,
    cpuId: observation.cpuId,
    gpuId: observation.gpuId,
    gameId: observation.gameId,
    presetId: observation.presetId,
    resolution: observation.resolution,
    upscaleId: observation.upscaleId,
    frameGenId: observation.frameGenId,
    rayTracingState: observation.rayTracingState,
    exactSettings: observation.exactSettings,
    fpsAverage: observation.fpsAverage,
    fpsRangeMin: observation.fpsRangeMin,
    fpsRangeMax: observation.fpsRangeMax,
    fieldMatchScore: field,
    metricScore: metric,
    sourceScore: source,
    score: field + metric + source,
  };
}

/** Sort descending by score; stable by id. */
export function sortCandidatesByComparability(
  candidates: RankedAnchorCandidate[],
): RankedAnchorCandidate[] {
  return [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.fieldMatchScore !== a.fieldMatchScore) {
      return b.fieldMatchScore - a.fieldMatchScore;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Non-CPU fields that must match for a scalable (CPU-transform) candidate.
 */
export function nonCpuFieldsMatch(
  query: EstimatorQuery,
  candidate: {
    gpuId: string;
    gameId: string;
    resolution: string;
    upscaleId: string;
    frameGenId: string;
    rayTracingState: string;
    presetId?: string;
  },
): boolean {
  if (candidate.gpuId !== query.gpuId) return false;
  if (candidate.gameId !== query.gameId) return false;
  if (candidate.resolution !== query.resolution) return false;
  if (candidate.upscaleId !== query.upscaleId) return false;
  if (candidate.frameGenId !== query.frameGenId) return false;
  if (candidate.rayTracingState !== query.rayTracingState) return false;
  if (
    candidate.presetId !== undefined &&
    candidate.presetId !== query.presetId
  ) {
    return false;
  }
  return true;
}

export function extractFpsRange(candidate: {
  fpsAverage?: number;
  fpsRangeMin?: number;
  fpsRangeMax?: number;
}): { fpsMin: number; fpsMax: number; fpsAverage: number } | null {
  const hasRange =
    candidate.fpsRangeMin !== undefined &&
    candidate.fpsRangeMax !== undefined &&
    candidate.fpsRangeMin < candidate.fpsRangeMax;
  if (hasRange) {
    const fpsMin = candidate.fpsRangeMin!;
    const fpsMax = candidate.fpsRangeMax!;
    const fpsAverage =
      typeof candidate.fpsAverage === "number"
        ? candidate.fpsAverage
        : (fpsMin + fpsMax) / 2;
    return { fpsMin, fpsMax, fpsAverage };
  }
  if (typeof candidate.fpsAverage === "number" && candidate.fpsAverage > 0) {
    // Average-only: synthesize a narrow range (±5%) so scale can proceed;
    // P1 width check and O4 validation still apply.
    const avg = candidate.fpsAverage;
    return {
      fpsMin: avg * 0.95,
      fpsMax: avg * 1.05,
      fpsAverage: avg,
    };
  }
  return null;
}

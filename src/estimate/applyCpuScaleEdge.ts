/**
 * Apply an evidenced CPU scale edge to FPS endpoints (est1).
 * Multiplies endpoints by factor and inflates half-width by mid × uncertainty.
 */
import type { CpuScaleEdge } from "../contract/est1";

export interface ScaledFpsRange {
  fpsMin: number;
  fpsMax: number;
  fpsAverage: number;
}

export function applyCpuScaleEdge(
  range: ScaledFpsRange,
  edge: CpuScaleEdge,
): ScaledFpsRange {
  const scaledMin = range.fpsMin * edge.factor;
  const scaledMax = range.fpsMax * edge.factor;
  const scaledAvg = range.fpsAverage * edge.factor;
  const mid = scaledAvg;
  const halfWidth = (scaledMax - scaledMin) / 2;
  const inflate = Math.abs(mid) * edge.uncertainty;
  let fpsMin = mid - halfWidth - inflate;
  let fpsMax = mid + halfWidth + inflate;
  let fpsAverage = scaledAvg;

  // Keep average inside the inflated range; enforce strict ordering.
  if (!(fpsMin < fpsMax)) {
    // Degenerate after scale — widen minimally around mid.
    fpsMin = mid * 0.99;
    fpsMax = mid * 1.01;
    if (!(fpsMin < fpsMax)) {
      fpsMin = mid - 1;
      fpsMax = mid + 1;
    }
  }
  if (fpsAverage < fpsMin) fpsAverage = fpsMin;
  if (fpsAverage > fpsMax) fpsAverage = fpsMax;

  return { fpsMin, fpsMax, fpsAverage };
}

/**
 * Find a matching scale edge from fromCpu → toCpu for the query resolution/game.
 * Prefer resolution+game scoped edges, then resolution-only, then unscoped.
 */
export function findCpuScaleEdge(
  edges: readonly CpuScaleEdge[],
  fromCpuId: string,
  toCpuId: string,
  resolution: string,
  gameId: string,
): CpuScaleEdge | null {
  if (fromCpuId === toCpuId) return null;

  const candidates = edges.filter(
    (e) => e.fromCpuId === fromCpuId && e.toCpuId === toCpuId,
  );
  if (candidates.length === 0) return null;

  const exact = candidates.find(
    (e) => e.resolution === resolution && e.gameId === gameId,
  );
  if (exact) return exact;

  const resOnly = candidates.find(
    (e) => e.resolution === resolution && e.gameId === undefined,
  );
  if (resOnly) return resOnly;

  const gameOnly = candidates.find(
    (e) => e.resolution === undefined && e.gameId === gameId,
  );
  if (gameOnly) return gameOnly;

  const unscoped = candidates.find(
    (e) => e.resolution === undefined && e.gameId === undefined,
  );
  return unscoped ?? null;
}

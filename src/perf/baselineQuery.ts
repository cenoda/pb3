import type { BuildStateV2 } from "../contract/vs2";
import type {
  BaselineQuery,
  Perf1ResolutionId,
  PerfPanelDimensions,
} from "../contract/perf1";

const PERF1_RESOLUTIONS: readonly Perf1ResolutionId[] = [
  "1080p",
  "1440p",
  "4k",
] as const;

/**
 * Build three baseline queries (one per resolution) from BuildStateV2 and
 * panel dimensions. Case, motherboard, cooler, ram, and psu ids are
 * intentionally omitted — RAM tier stays a perf1 panel dimension, not the
 * compat2 RAM SKU (ramId), per the deferred mapping decision.
 */
export function baselineQueriesForBuild(
  buildState: BuildStateV2,
  dimensions: PerfPanelDimensions,
): BaselineQuery[] {
  return PERF1_RESOLUTIONS.map((resolution) => ({
    cpuId: buildState.cpuId as BaselineQuery["cpuId"],
    gpuId: buildState.gpuId as BaselineQuery["gpuId"],
    gameId: buildState.gameId as BaselineQuery["gameId"],
    presetId: buildState.presetId as BaselineQuery["presetId"],
    resolution,
    upscaleId: dimensions.upscaleId,
    frameGenId: dimensions.frameGenId,
    ramTierId: dimensions.ramTierId,
    powerProfileId: dimensions.powerProfileId,
  }));
}

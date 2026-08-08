import type { BuildState } from "../contract/vs0";
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
 * Build three baseline queries (one per resolution) from vs0 BuildState and
 * panel dimensions. Case, motherboard, and cooler are intentionally omitted.
 */
export function baselineQueriesForBuild(
  buildState: BuildState,
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

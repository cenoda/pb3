import type { BuildState, PerformanceQuery } from "../contract/vs0";
import { RESOLUTIONS, VS0_CONTRACT_VERSION } from "../contract/vs0";

export function queriesForBuild(state: BuildState): PerformanceQuery[] {
  return RESOLUTIONS.map((r) => ({
    contractVersion: VS0_CONTRACT_VERSION,
    cpuId: state.cpuId,
    gpuId: state.gpuId,
    gameId: state.gameId,
    presetId: state.presetId,
    resolutionId: r.id,
  }));
}

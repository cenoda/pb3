import type { PerformanceQuery } from "../contract/vs0";
import { RESOLUTIONS, VS0_CONTRACT_VERSION } from "../contract/vs0";
import type { BuildStateV2 } from "../contract/vs2";

export function queriesForBuild(state: BuildStateV2): PerformanceQuery[] {
  return RESOLUTIONS.map((r) => ({
    contractVersion: VS0_CONTRACT_VERSION,
    cpuId: state.cpuId,
    gpuId: state.gpuId,
    gameId: state.gameId,
    presetId: state.presetId,
    resolutionId: r.id,
  }));
}

/**
 * Build EstimatorQuery from pilot resolution (M0 fixed surface).
 */
import type { EstimatorQuery, EstimatorResolution } from "../contract/est1";
import type { PilotBaselineKey } from "../contract/prov4";
import { pilotBaselineKeyFor } from "../provenance/pilotBuild";

export function estimatorQueryFor(
  resolution: EstimatorResolution,
): EstimatorQuery {
  return {
    cpuId: "cpu.zen4-7600",
    gpuId: "gpu.rtx4070",
    gameId: "game.cyberpunk-2077",
    presetId: "preset.raster-ultra",
    resolution,
    upscaleId: "upscale.off",
    frameGenId: "framegen.off",
    rayTracingState: "off",
    ramTierId: "ram.32gb-ddr5",
    powerProfileId: "power.default",
  };
}

export function estimatorQueryToPilotKey(
  query: EstimatorQuery,
): PilotBaselineKey {
  return pilotBaselineKeyFor(query.resolution);
}

export function pilotKeyToEstimatorQuery(
  key: PilotBaselineKey,
): EstimatorQuery {
  return estimatorQueryFor(key.resolution);
}

/**
 * Phase-4 pilot build constants (exact part set + baseline key factory).
 * Authority: docs/phases/phase-4/specs/phase-4.md §2
 */
import type { BuildStateV2 } from "../contract/vs2";
import { DEFAULT_BUILD_STATE_V2 } from "../contract/vs2";
import type { PilotBaselineKey, Prov4PilotPartId } from "../contract/prov4";
import { PROV4_PILOT_PART_IDS } from "../contract/prov4";

/** Pilot RAM SKU → perf1 RAM tier (pilot constant only; not a catalog rule). */
export const PILOT_RAM_SKU_TO_TIER = {
  ramSkuId: "ram.teamgroup-t-create-expert-ddr5-6000-32gb",
  ramTierId: "ram.32gb-ddr5",
} as const;

export const PILOT_RESOLUTIONS = ["1080p", "1440p", "4k"] as const;
export type PilotResolution = (typeof PILOT_RESOLUTIONS)[number];

export const PILOT_PART_IDS: readonly Prov4PilotPartId[] = PROV4_PILOT_PART_IDS;

export const PILOT_BUILD_PART_IDS = {
  caseId: "case.fractal-design-north-tg-dark",
  motherboardId: "motherboard.gigabyte-b650-aorus-elite-ax-v2",
  cpuId: "cpu.amd-ryzen-5-7600",
  gpuId: "gpu.asus-dual-rtx4070-o12g",
  coolerId: "cooler.noctua-nh-d15-g2",
  ramId: "ram.teamgroup-t-create-expert-ddr5-6000-32gb",
  psuId: "psu.corsair-rm750e",
} as const;

/** Exact pilot build = DEFAULT_BUILD_STATE_V2 part + game/preset set. */
export function isPilotBuild(state: BuildStateV2): boolean {
  return (
    state.caseId === PILOT_BUILD_PART_IDS.caseId &&
    state.motherboardId === PILOT_BUILD_PART_IDS.motherboardId &&
    state.cpuId === PILOT_BUILD_PART_IDS.cpuId &&
    state.gpuId === PILOT_BUILD_PART_IDS.gpuId &&
    state.coolerId === PILOT_BUILD_PART_IDS.coolerId &&
    state.ramId === PILOT_BUILD_PART_IDS.ramId &&
    state.psuId === PILOT_BUILD_PART_IDS.psuId &&
    state.gameId === DEFAULT_BUILD_STATE_V2.gameId &&
    state.presetId === DEFAULT_BUILD_STATE_V2.presetId
  );
}

export function pilotBaselineKeyFor(
  resolution: PilotResolution,
): PilotBaselineKey {
  return {
    cpuId: "cpu.amd-ryzen-5-7600",
    gpuId: "gpu.asus-dual-rtx4070-o12g",
    gameId: "game.cyberpunk-2077",
    presetId: "preset.raster-ultra",
    resolution,
    upscaleId: "upscale.off",
    frameGenId: "framegen.off",
    ramTierId: PILOT_RAM_SKU_TO_TIER.ramTierId,
    powerProfileId: "power.default",
  };
}

export function pilotKeyEquals(
  a: PilotBaselineKey,
  b: PilotBaselineKey,
): boolean {
  return (
    a.cpuId === b.cpuId &&
    a.gpuId === b.gpuId &&
    a.gameId === b.gameId &&
    a.presetId === b.presetId &&
    a.resolution === b.resolution &&
    a.upscaleId === b.upscaleId &&
    a.frameGenId === b.frameGenId &&
    a.ramTierId === b.ramTierId &&
    a.powerProfileId === b.powerProfileId
  );
}

export function buildPartIdsFromState(state: BuildStateV2): string[] {
  return [
    state.caseId,
    state.motherboardId,
    state.cpuId,
    state.gpuId,
    state.coolerId,
    state.ramId,
    state.psuId,
  ];
}

/** Exact pilot baseline dimensions (panel / query side). */
export function isPilotBaselineDimensions(dims: {
  upscaleId: string;
  frameGenId: string;
  ramTierId: string;
  powerProfileId: string;
}): boolean {
  return (
    dims.upscaleId === "upscale.off" &&
    dims.frameGenId === "framegen.off" &&
    dims.ramTierId === PILOT_RAM_SKU_TO_TIER.ramTierId &&
    dims.powerProfileId === "power.default"
  );
}

/**
 * Pilot performance overlay is active only for the exact pilot build part set
 * and exact pilot baseline dimensions (no near-match reuse).
 */
export function isPilotPerformanceOverlayActive(
  state: BuildStateV2,
  dims: {
    upscaleId: string;
    frameGenId: string;
    ramTierId: string;
    powerProfileId: string;
  },
): boolean {
  return isPilotBuild(state) && isPilotBaselineDimensions(dims);
}

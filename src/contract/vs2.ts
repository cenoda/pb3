import {
  PHASE0_CPU_IDS,
  PHASE0_GAME,
  PHASE0_GPU_IDS,
  PHASE0_PRESET,
} from "./vs0";

/** Phase-2 BuildState / URL contract version. */
export const VS2_CONTRACT_VERSION = "vs2" as const;
export type Vs2ContractVersion = typeof VS2_CONTRACT_VERSION;

/** Part categories in the phase-2 catalog. */
export type PartCategoryV2 =
  | "case"
  | "motherboard"
  | "cpu"
  | "gpu"
  | "cooler"
  | "ram"
  | "psu";

export interface BuildStateV2 {
  contractVersion: Vs2ContractVersion;
  caseId: string;
  motherboardId: string;
  cpuId: string;
  gpuId: string;
  coolerId: string;
  ramId: string;
  psuId: string;
  gameId: string;
  presetId: string;
}

export const PHASE2_CASE_IDS = [
  "case.fractal-design-north-tg-dark",
  "case.lian-li-a3-matx-black",
] as const;

/**
 * Slot 14 (`motherboard.gigabyte-b650m-aorus-elite-ax-rev-1-3`) is admitted in
 * the runtime manifest with a visual-only plane GLB and collision-less
 * `physicalSpec` (Step 6, 2026-08-10).
 */
export const PHASE2_MOTHERBOARD_IDS = [
  "motherboard.gigabyte-b650-aorus-elite-ax-v2",
  "motherboard.asus-tuf-gaming-b860m-plus-wifi",
] as const;

export const PHASE2_RAM_IDS = [
  "ram.teamgroup-t-create-expert-ddr5-6000-32gb",
  "ram.gskill-trident-z5-rgb-ddr5-8400",
] as const;

export const PHASE2_PSU_IDS = [
  "psu.corsair-rm750e",
  "psu.cooler-master-v550-sfx-gold",
] as const;

export const DEFAULT_BUILD_STATE_V2: BuildStateV2 = {
  contractVersion: VS2_CONTRACT_VERSION,
  caseId: "case.fractal-design-north-tg-dark",
  motherboardId: "motherboard.gigabyte-b650-aorus-elite-ax-v2",
  cpuId: "cpu.amd-ryzen-5-7600",
  gpuId: "gpu.asus-dual-rtx4070-o12g",
  coolerId: "cooler.noctua-nh-d15-g2",
  ramId: "ram.teamgroup-t-create-expert-ddr5-6000-32gb",
  psuId: "psu.corsair-rm750e",
  gameId: PHASE0_GAME.id,
  presetId: PHASE0_PRESET.id,
};

export const VS2_URL_KEYS = {
  v: "v",
  cpu: "cpu",
  gpu: "gpu",
  case: "case",
  mb: "mb",
  cooler: "cooler",
  ram: "ram",
  psu: "psu",
  game: "game",
  preset: "preset",
} as const;

export {
  PHASE0_CPU_IDS,
  PHASE0_GPU_IDS,
  PHASE0_GAME,
  PHASE0_PRESET,
};

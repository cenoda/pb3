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
  "case.mid-tower-atx-01",
  "case.micro-atx-mini-01",
] as const;

export const PHASE2_MOTHERBOARD_IDS = [
  "mb.atx-b650-01",
  "mb.micro-b450-01",
] as const;

export const PHASE2_RAM_IDS = [
  "ram.ddr5-32gb-6000",
  "ram.ddr5-16gb-7200",
] as const;

export const PHASE2_PSU_IDS = ["psu.750w-atx", "psu.550w-sfx"] as const;

export const DEFAULT_BUILD_STATE_V2: BuildStateV2 = {
  contractVersion: VS2_CONTRACT_VERSION,
  caseId: "case.mid-tower-atx-01",
  motherboardId: "mb.atx-b650-01",
  cpuId: "cpu.zen4-7600",
  gpuId: "gpu.rtx4070",
  coolerId: "cooler.air-twin-tower-01",
  ramId: "ram.ddr5-32gb-6000",
  psuId: "psu.750w-atx",
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

/** Fixed part.json paths for phase 2 (13 parts). */
export const PHASE2_PART_PATHS = [
  "parts/case/case.mid-tower-atx-01/part.json",
  "parts/case/case.micro-atx-mini-01/part.json",
  "parts/motherboard/mb.atx-b650-01/part.json",
  "parts/motherboard/mb.micro-b450-01/part.json",
  "parts/cpu/cpu.zen4-7600/part.json",
  "parts/cpu/cpu.zen4-7800x3d/part.json",
  "parts/gpu/gpu.rtx4070/part.json",
  "parts/gpu/gpu.rtx4080/part.json",
  "parts/cooler/cooler.air-twin-tower-01/part.json",
  "parts/ram/ram.ddr5-32gb-6000/part.json",
  "parts/ram/ram.ddr5-16gb-7200/part.json",
  "parts/psu/psu.750w-atx/part.json",
  "parts/psu/psu.550w-sfx/part.json",
] as const;

export {
  PHASE0_CPU_IDS,
  PHASE0_GPU_IDS,
  PHASE0_GAME,
  PHASE0_PRESET,
};

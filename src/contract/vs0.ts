/** Phase-0 contract version. Bump on breaking changes. */
export const VS0_CONTRACT_VERSION = "vs0" as const;
export type Vs0ContractVersion = typeof VS0_CONTRACT_VERSION;

/** Part categories used in the vertical slice. */
export type PartCategory =
  | "case"
  | "motherboard"
  | "cpu"
  | "gpu"
  | "cooler";

/** Fixed resolution ids for the single game panel. */
export type ResolutionId = "1080p" | "1440p" | "4k";

export interface ResolutionSpec {
  id: ResolutionId;
  width: number;
  height: number;
  /** Short label for UI, e.g. "1440p". */
  label: string;
}

export const RESOLUTIONS: readonly ResolutionSpec[] = [
  { id: "1080p", width: 1920, height: 1080, label: "1080p" },
  { id: "1440p", width: 2560, height: 1440, label: "1440p" },
  { id: "4k", width: 3840, height: 2160, label: "4K" },
] as const;

/**
 * How strongly we stand behind an estimate.
 * Phase-0 stubs should use "stub" so UI never confuses them with measured data.
 */
export type EstimateConfidence =
  | "stub"
  | "low"
  | "medium"
  | "high"
  | "none";

/** Lifecycle of a performance estimate row. */
export type EstimateStatus = "ok" | "unavailable";

/**
 * On-disk / in-catalog definition of one part.
 * Loaded from parts/{category}/{id}/part.json
 */
export interface PartDefinition {
  contractVersion: Vs0ContractVersion;
  id: string;
  category: PartCategory;
  displayName: string;
  modelGlbPath: string;
  notes?: string;
}

/**
 * Runtime selection state for the single build screen.
 * This is what selection UI mutates and what the URL encodes.
 */
export interface BuildState {
  contractVersion: Vs0ContractVersion;
  caseId: string;
  motherboardId: string;
  cpuId: string;
  gpuId: string;
  coolerId: string;
  gameId: string;
  presetId: string;
}

/**
 * Input to the performance estimator for one resolution.
 * Derived from BuildState + a ResolutionId — not stored in the URL separately.
 */
export interface PerformanceQuery {
  contractVersion: Vs0ContractVersion;
  cpuId: string;
  gpuId: string;
  gameId: string;
  presetId: string;
  resolutionId: ResolutionId;
}

/**
 * Output of the performance estimator for one query.
 * Always a range when status === "ok". Never a single point score.
 */
export interface PerformanceEstimate {
  contractVersion: Vs0ContractVersion;
  query: PerformanceQuery;
  status: EstimateStatus;
  fpsMin: number | null;
  fpsMax: number | null;
  confidence: EstimateConfidence;
  dataVersion: string;
  basis: string;
  reason?: string;
}

/** One row in the phase-0 performance fixture table. */
export interface PerformanceFixtureRow {
  cpuId: string;
  gpuId: string;
  gameId: string;
  presetId: string;
  resolutionId: ResolutionId;
  fpsMin: number;
  fpsMax: number;
  confidence: EstimateConfidence;
  dataVersion: string;
  basis: string;
}

/** File shape for benchmarks/vs0/performance-fixtures.json. */
export interface PerformanceFixtureFile {
  contractVersion: Vs0ContractVersion;
  dataVersion: string;
  rows: PerformanceFixtureRow[];
}

export const PHASE0_GAME = {
  id: "game.cyberpunk-2077",
  displayName: "Cyberpunk 2077 (fixture label)",
} as const;

export const PHASE0_PRESET = {
  id: "preset.raster-ultra",
  displayName: "Ultra (raster, no upscaling) — fixture",
} as const;

export const DEFAULT_BUILD_STATE: BuildState = {
  contractVersion: VS0_CONTRACT_VERSION,
  caseId: "case.fractal-design-north-tg-dark",
  motherboardId: "motherboard.gigabyte-b650-aorus-elite-ax-v2",
  cpuId: "cpu.amd-ryzen-5-7600",
  gpuId: "gpu.asus-dual-rtx4070-o12g",
  coolerId: "cooler.noctua-nh-d15-g2",
  gameId: PHASE0_GAME.id,
  presetId: PHASE0_PRESET.id,
};

export const PHASE0_CPU_IDS = [
  "cpu.amd-ryzen-5-7600",
  "cpu.amd-ryzen-7-7800x3d",
] as const;

export const PHASE0_GPU_IDS = ["gpu.asus-dual-rtx4070-o12g", "gpu.asus-proart-rtx4080-o16g"] as const;

/** Fixed part.json paths for phase 0 (contract §3). */
export const PHASE0_PART_PATHS = [
  "parts/case/case.fractal-design-north-tg-dark/part.json",
  "parts/motherboard/motherboard.gigabyte-b650-aorus-elite-ax-v2/part.json",
  "parts/cpu/cpu.amd-ryzen-5-7600/part.json",
  "parts/cpu/cpu.amd-ryzen-7-7800x3d/part.json",
  "parts/gpu/gpu.asus-dual-rtx4070-o12g/part.json",
  "parts/gpu/gpu.asus-proart-rtx4080-o16g/part.json",
  "parts/cooler/cooler.noctua-nh-d15-g2/part.json",
] as const;

/**
 * Phase-1 performance-engine contract types.
 * Authority: docs/phases/phase-1/specs/performance-data-contract.md
 */
import type { EstimateConfidence } from "./vs0";

export { type EstimateConfidence } from "./vs0";

/** Phase-1 contract version. Bump on breaking field or semantic changes. */
export const PERF1_CONTRACT_VERSION = "perf1" as const;
export type Perf1ContractVersion = typeof PERF1_CONTRACT_VERSION;

/** Required dataVersion on every perf1 stub row until a dataset revision. */
export const PERF1_DATA_VERSION = "perf1" as const;

// --- Baseline vocabulary (§3.1) ---

export type CpuId = "cpu.amd-ryzen-5-7600" | "cpu.amd-ryzen-7-7800x3d";
export type GpuId = "gpu.asus-dual-rtx4070-o12g" | "gpu.asus-proart-rtx4080-o16g";
export type GameId = "game.cyberpunk-2077";
export type PresetId = "preset.raster-ultra";
export type Perf1ResolutionId = "1080p" | "1440p" | "4k";
export type UpscaleId = "upscale.off" | "upscale.dlss-quality";
export type FrameGenId = "framegen.off" | "framegen.on";
export type RamTierId = "ram.16gb-ddr5" | "ram.32gb-ddr5";
export type PowerProfileId = "power.default";

// --- Correction vocabulary (§4.1) ---

export type CpuPowerId = "cpu-power.default" | "cpu-power.reduced";
export type GpuPowerId = "gpu-power.default" | "gpu-power.reduced";
export type CoolingBucketId =
  | "cooling.sufficient"
  | "cooling.marginal"
  | "cooling.insufficient";
export type LoadProfileId = "load.transient" | "load.sustained";

// --- Workload vocabulary (§6.1) ---

export type WorkloadId = "cinebench.r23" | "cinebench.2024";
export type WorkloadMetric = "metric.single-core" | "metric.multi-core";

// --- Baseline model (§3) ---

export interface BaselineQuery {
  cpuId: CpuId;
  gpuId: GpuId;
  gameId: GameId;
  presetId: PresetId;
  resolution: Perf1ResolutionId;
  upscaleId: UpscaleId;
  frameGenId: FrameGenId;
  ramTierId: RamTierId;
  powerProfileId: PowerProfileId;
}

export type LimitingFactorCategory =
  | "GPU-bound"
  | "CPU-bound"
  | "VRAM pressure"
  | "power limit"
  | "RAM-bound";

export interface LimitingFactor {
  category: LimitingFactorCategory;
  explanation: string;
}

export interface PerformanceEstimate {
  fpsMin: number;
  fpsMax: number;
  confidence: EstimateConfidence;
  dataVersion: string;
  basis: string;
  limitingFactor: LimitingFactor;
}

export interface UnavailableResult {
  status: "unavailable";
  reason: string;
}

export type BaselineEstimateResult = PerformanceEstimate | UnavailableResult;

// --- Correction model (§4) ---

export interface CorrectionInput {
  cpuPowerId?: CpuPowerId;
  gpuPowerId?: GpuPowerId;
  coolingBucketId?: CoolingBucketId;
  loadProfileId?: LoadProfileId;
  /** Reserved Phase 3 input; not applied by the Phase 1 model. */
  coolingHeadroom?: number;
  /** Reserved Phase 3 normalized severity value or bucket. */
  intakeRestrictionSeverity?: string;
  /** Declared evidence source for a future Phase 3 correction input. */
  evidenceSourceId?: string;
}

export interface CorrectedEstimate {
  status: "ok";
  fpsMin: number;
  fpsMax: number;
  confidence: EstimateConfidence;
  dataVersion: string;
  basis: string;
  limitingFactor: LimitingFactor;
  reason: string;
}

export interface WithheldCorrection {
  status: "withheld";
  reason: string;
}

export type CorrectionResult = CorrectedEstimate | WithheldCorrection;

// --- Workload model (§6) ---

export interface WorkloadQuery {
  cpuId: CpuId;
  workloadId: WorkloadId;
  metric: WorkloadMetric;
}

export interface WorkloadEstimate {
  cpuId: CpuId;
  workloadId: WorkloadId;
  metric: WorkloadMetric;
  score: number;
  confidence: EstimateConfidence;
  dataVersion: string;
  basis: string;
}

export type WorkloadEstimateResult = WorkloadEstimate | UnavailableResult;

// --- Raw benchmark ingestion record (§7 — types only; no runner) ---

export interface RawBenchmarkSource {
  sourceId: string;
  kind: "first-party";
}

export interface RawHardware {
  cpuId: CpuId;
  gpuId?: GpuId;
  ramTierId?: RamTierId;
  cpuPowerId?: CpuPowerId;
  gpuPowerId?: GpuPowerId;
}

export interface RawPerformanceBenchmarkRecord {
  recordType: "performance";
  recordId: string;
  capturedAt: string;
  source: RawBenchmarkSource;
  hardware: RawHardware & { gpuId: GpuId };
  query: BaselineQuery;
  corrections?: CorrectionInput;
  measurement: {
    fpsMin: number;
    fpsMax: number;
  };
  dataVersion: string;
}

export interface RawWorkloadBenchmarkRecord {
  recordType: "workload";
  recordId: string;
  capturedAt: string;
  source: RawBenchmarkSource;
  hardware: RawHardware;
  query: WorkloadQuery;
  measurement: {
    score: number;
  };
  dataVersion: string;
}

export type RawBenchmarkRecord =
  | RawPerformanceBenchmarkRecord
  | RawWorkloadBenchmarkRecord;

// --- Fixture file shapes (§8) ---

export interface BaselineFixtureRow extends BaselineQuery {
  fpsMin: number;
  fpsMax: number;
  confidence: EstimateConfidence;
  dataVersion: string;
  basis: string;
  limitingFactor: LimitingFactor;
}

export interface BaselineFixtureFile {
  contractVersion: Perf1ContractVersion;
  dataVersion: string;
  description?: string;
  rows: BaselineFixtureRow[];
}

export interface CinebenchFixtureRow {
  cpuId: CpuId;
  workloadId: WorkloadId;
  metric: WorkloadMetric;
  score: number;
  confidence: EstimateConfidence;
  dataVersion: string;
  basis: string;
}

export interface CinebenchFixtureFile {
  contractVersion: Perf1ContractVersion;
  dataVersion: string;
  description?: string;
  rows: CinebenchFixtureRow[];
}

export interface CorrectionExample {
  note?: string;
  query: BaselineQuery;
  correction: CorrectionInput;
  result: CorrectionResult;
}

export interface CorrectionExamplesFile {
  contractVersion: Perf1ContractVersion;
  dataVersion: string;
  description?: string;
  examples: CorrectionExample[];
}

export interface UnavailableBaselineExample {
  note?: string;
  query: BaselineQuery;
  result: UnavailableResult;
}

export interface UnavailableWorkloadExample {
  note?: string;
  query: WorkloadQuery;
  result: UnavailableResult;
}

export type UnavailableExample =
  | UnavailableBaselineExample
  | UnavailableWorkloadExample;

export interface UnavailableExamplesFile {
  contractVersion: Perf1ContractVersion;
  dataVersion: string;
  description?: string;
  examples: UnavailableExample[];
}

// --- Panel defaults (implementation_plan.md §2) ---

export interface PerfPanelDimensions {
  upscaleId: UpscaleId;
  frameGenId: FrameGenId;
  ramTierId: RamTierId;
  powerProfileId: PowerProfileId;
}

export const DEFAULT_PERF_PANEL_DIMENSIONS: PerfPanelDimensions = {
  upscaleId: "upscale.off",
  frameGenId: "framegen.off",
  ramTierId: "ram.32gb-ddr5",
  powerProfileId: "power.default",
} as const;

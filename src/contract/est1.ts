/**
 * Phase 4.1 combination estimator contract types (`est1`).
 * Authority: docs/phases/phase-4.1/specs/estimator-data-contract.md
 *
 * Sidecar only — does not replace prov4 (evidence) or rewrite perf1.
 */
import type { EstimateConfidence } from "./vs0";

export type { EstimateConfidence } from "./vs0";

export const EST1_CONTRACT_VERSION = "est1" as const;
export type Est1ContractVersion = typeof EST1_CONTRACT_VERSION;

/** M0 product caveat — temporary draft function (motherboard/cooling out). */
export const EST1_DRAFT_CAVEAT =
  "Temporary draft estimate under controlled baseline assumptions. Motherboard, cooling, case airflow, and non-default power limits are not modeled and may change real-world results." as const;

export const EST1_DEFAULT_DATA_VERSION = "est1-20260809" as const;

export type EstimatorResolution = "1080p" | "1440p" | "4k";
export type RayTracingState = "off" | "on" | "partial";

export type EstimatorMethod =
  | "exact-aggregate"
  | "vendor-anchor"
  | "scaled-combination";

export type EstimatorContributorRole =
  | "primary-anchor"
  | "exact-observation"
  | "scale-edge"
  | "review-validation";

export type EstimatorRefKind =
  | "prov4-observation"
  | "prov4-aggregate"
  | "vendor-anchor"
  | "cpu-scale-edge";

export type EstimatorUnavailableReason =
  | "no_candidates"
  | "missing_scale_edge"
  | "comparability_failed"
  | "range_too_wide"
  | "rights_denied"
  | "validation_failed"
  | "policy_block";

/** M0 pilot query surface — motherboard/cooler/case not included. */
export interface EstimatorQuery {
  cpuId: "cpu.amd-ryzen-5-7600";
  gpuId: "gpu.asus-dual-rtx4070-o12g";
  gameId: "game.cyberpunk-2077";
  presetId: "preset.raster-ultra";
  resolution: EstimatorResolution;
  upscaleId: "upscale.off";
  frameGenId: "framegen.off";
  rayTracingState: "off";
  ramTierId: "ram.32gb-ddr5";
  powerProfileId: "power.default";
}

export interface CpuScaleEdge {
  edgeId: string;
  fromCpuId: string;
  toCpuId: string;
  /** Optional band; omit = all resolutions (still subject to O2/O3). */
  resolution?: EstimatorResolution;
  gameId?: string;
  /** Multiplicative factor: to ≈ from * factor */
  factor: number;
  /** Relative uncertainty (e.g. 0.05 = ±5% width inflate guidance) */
  uncertainty: number;
  sourceIds: string[];
  basis: string;
  dataVersion: string;
}

export interface CpuScaleEdgeFile {
  estimatorContractVersion: Est1ContractVersion;
  dataVersion: string;
  edges: CpuScaleEdge[];
}

export interface VendorPerformanceAnchor {
  anchorId: string;
  sourceId: string;
  sourceUrl: string;
  publishedAt: string;
  accessedAt: string;
  /** Omit if vendor did not state CPU — weak comparability; M0 non-scalable. */
  cpuId?: string;
  gpuId: string;
  gameId: string;
  presetId?: string;
  exactSettings: string;
  resolution: EstimatorResolution;
  upscaleId: string;
  frameGenId: string;
  rayTracingState: RayTracingState;
  fpsAverage?: number;
  fpsRangeMin?: number;
  fpsRangeMax?: number;
  testSystem: string;
  sampleNotes?: string;
}

export interface VendorPerformanceAnchorFile {
  estimatorContractVersion: Est1ContractVersion;
  dataVersion: string;
  anchors: VendorPerformanceAnchor[];
}

export interface EstimatorContributor {
  role: EstimatorContributorRole;
  refKind: EstimatorRefKind;
  refId: string;
}

export interface EstimatorExclusionReason {
  code: string;
  detail: string;
}

export interface CombinationEstimate {
  status: "estimated";
  estimatorContractVersion: Est1ContractVersion;
  query: EstimatorQuery;
  fpsMin: number;
  fpsMax: number;
  fpsAverage: number;
  confidence: "low" | "medium";
  method: EstimatorMethod;
  basis: string;
  draftCaveat: string;
  contributors: EstimatorContributor[];
  exclusionReasons: EstimatorExclusionReason[];
  dataVersion: string;
}

export interface CombinationEstimateUnavailable {
  status: "unavailable";
  estimatorContractVersion: Est1ContractVersion;
  query: EstimatorQuery;
  reason: EstimatorUnavailableReason;
  explanation: string;
  exclusionReasons: EstimatorExclusionReason[];
  dataVersion: string;
  draftCaveat: string;
}

export type CombinationEstimateResult =
  | CombinationEstimate
  | CombinationEstimateUnavailable;

export interface EstimatorPolicy {
  /** P1: max relative range width before unavailable */
  maxRelativeRangeWidth: number;
  /** O4 locked */
  requireReviewValidationWhenComparable: true;
  /** O2/O3 locked */
  allowGpuBoundCpuWaiverWithoutRatio: false;
  /** O5 locked */
  scaledConfidenceCeiling: "low";
}

export const DEFAULT_ESTIMATOR_POLICY: EstimatorPolicy = {
  maxRelativeRangeWidth: 0.4,
  requireReviewValidationWhenComparable: true,
  allowGpuBoundCpuWaiverWithoutRatio: false,
  scaledConfidenceCeiling: "low",
};

/** Display class for pilot UI (distinct from outer synthetic residual). */
export type Est1DisplayClass =
  | "est1-estimated"
  | "est1-unavailable"
  | "synthetic-perf1"
  | "off";

export type EstimatorConfidence = Extract<
  EstimateConfidence,
  "low" | "medium"
>;

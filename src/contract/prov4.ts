/**
 * Phase-4 provenance contract types (`prov4`).
 * Authority: docs/phases/phase-4/specs/provenance-data-contract.md
 *
 * Sidecar only — does not extend perf1 / phys3 / vs2 public field shapes.
 */
import type { EstimateConfidence } from "./vs0";
import type { PhysicalModelGrade } from "./phys3";

export type { EstimateConfidence } from "./vs0";
export type { PhysicalModelGrade } from "./phys3";

export const PROV4_CONTRACT_VERSION = "prov4" as const;
export type Prov4ContractVersion = typeof PROV4_CONTRACT_VERSION;

/** Default freshness window (owner-accepted O3-A). */
export const PROV4_DEFAULT_MAX_AGE_DAYS = 365 as const;

// --- Source registry (§3) ---

export type EvidenceSourceClass =
  "first-party" | "project-synthetic" | "external-review" | "manufacturer-spec";

export type EvidenceRightsClass =
  | "apache-2.0-project"
  | "public-spec"
  | "fair-use-citation"
  | "licensed"
  | "unavailable";

export interface EvidenceSource {
  sourceId: string;
  sourceClass: EvidenceSourceClass;
  rightsClass: EvidenceRightsClass;
  /** Short human-readable title for UI disclosure. */
  title: string;
  /** Free-text origin: lab note, URL, datasheet name, fixture path, etc. */
  origin: string;
  /** Optional stable URL or citation string; required for external-review. */
  citation?: string;
  /** ISO-8601 date the source itself was published or authored, if known. */
  publishedAt?: string;
  notes?: string;
}

export interface EvidenceSourceRegistryFile {
  provenanceContractVersion: Prov4ContractVersion;
  registryVersion: string;
  sources: EvidenceSource[];
}

// --- Freshness (§4) ---

export type FreshnessState = "current" | "stale" | "unknown";

export interface FreshnessPolicy {
  /** Inclusive max age in whole days; omit for no automatic stale. */
  maxAgeDays?: number;
}

/**
 * Pure classifier input. `asOf` is optional so missing timestamps are
 * representable without lying that a string was present.
 */
export interface FreshnessInput {
  /** ISO-8601 timestamp of capture or human review, when known. */
  asOf?: string;
  policy: FreshnessPolicy;
  /** ISO-8601 "now" injected by caller for pure tests; runtime uses clock. */
  nowIso: string;
}

export interface FreshnessResult {
  state: FreshnessState;
  ageDays?: number;
  explanation: string;
}

// --- Human verification (§5) ---

export type VerificationKind =
  | "performance-capture-attestation"
  | "geometry-dimension-check"
  | "geometry-mount-check";

export type VerificationVerdict = "pass" | "fail" | "incomplete";

export interface HumanVerificationRecord {
  verificationId: string;
  kind: VerificationKind;
  verdict: VerificationVerdict;
  /** ISO-8601 */
  reviewedAt: string;
  reviewerLabel: string;
  /** What was checked, in human prose. */
  checklist: string[];
  /** Registry source ids supporting the review. */
  sourceIds: string[];
  /**
   * Lowercase hex SHA-256 digests the verifier attests.
   * Required non-empty for pass `performance-capture-attestation` used by
   * `"high"` rows; must include `captureConditions.rawArtifact.sha256`.
   */
  attestedArtifactDigests?: string[];
  notes?: string;
}

export interface HumanVerificationFile {
  provenanceContractVersion: Prov4ContractVersion;
  records: HumanVerificationRecord[];
}

// --- Performance evidence (§6) ---

export interface PilotBaselineKey {
  cpuId: "cpu.amd-ryzen-5-7600";
  gpuId: "gpu.asus-dual-rtx4070-o12g";
  gameId: "game.cyberpunk-2077";
  presetId: "preset.raster-ultra";
  resolution: "1080p" | "1440p" | "4k";
  upscaleId: "upscale.off";
  frameGenId: "framegen.off";
  ramTierId: "ram.32gb-ddr5";
  powerProfileId: "power.default";
}

export type RangeDerivationMethod =
  | "repeated-run-min-max"
  | "repeated-run-mean-pm-band"
  | "imported-review-stated-range"
  | "external-aggregated-weighted-percentiles"
  | "external-aggregated-two-source-range"
  | "synthetic-fixture-range";

/** Locked categorical weighting vocabulary (corrective plan §4.3). */
export type SourceMethodQuality =
  "tier-a-reviewed" | "tier-b-reviewed" | "manufacturer";

export type ConditionCompleteness =
  "full-disclosed" | "partial-disclosed" | "minimal";

export type RecencyClass = "current" | "recent" | "aged";

export interface ObservationWeighting {
  sourceMethodQuality: SourceMethodQuality;
  conditionCompleteness: ConditionCompleteness;
  recencyClass: RecencyClass;
}

export type RayTracingState = "off" | "on" | "partial";

/** Exact comparability fields for external observation grouping. */
export interface PerformanceComparabilityKey {
  cpuId: string;
  gpuId: string;
  gameId: string;
  presetId: string;
  resolution: string;
  upscaleId: string;
  frameGenId: string;
  rayTracingState: RayTracingState;
}

export type ObservationExclusionReason =
  | "cpu_mismatch"
  | "gpu_mismatch"
  | "game_mismatch"
  | "preset_mismatch"
  | "resolution_mismatch"
  | "upscale_mismatch"
  | "framegen_mismatch"
  | "ray_tracing_mismatch"
  | "settings_mismatch"
  | "duplicate_source"
  | "source_rights_denied";

export interface ObservationExclusion {
  observationId: string;
  reason: ObservationExclusionReason;
  detail: string;
}

/**
 * Curated public benchmark observation (build-time fixture).
 * Authority: ADR-005 + corrective plan §2.2.
 */
export interface ExternalPerformanceObservation {
  observationId: string;
  /** Registry EvidenceSource.sourceId; must pass source-rights-record approval. */
  sourceId: string;
  sourceUrl: string;
  publishedAt: string;
  accessedAt: string;
  cpuId: string;
  gpuId: string;
  gameId: string;
  gamePatchVersion?: string;
  presetId: string;
  exactSettings: string;
  resolution: "1080p" | "1440p" | "4k";
  upscaleId: string;
  frameGenId: string;
  rayTracingState: RayTracingState;
  fpsAverage?: number;
  /** Source-published range low (not inferred). */
  fpsRangeMin?: number;
  /** Source-published range high (not inferred). */
  fpsRangeMax?: number;
  fpsOnePercentLow?: number | MetricUnavailable;
  frametime?: FrametimeEvidence;
  testSystem: string;
  driverVersion?: string;
  sampleNotes?: string;
  weighting: ObservationWeighting;
}

export interface ExternalPerformanceObservationsFile {
  provenanceContractVersion: Prov4ContractVersion;
  dataVersion: string;
  observations: ExternalPerformanceObservation[];
}

export type ExternalAggregationMethod =
  | "three-plus-weighted-percentiles"
  | "two-observation-range"
  | "published-range";

export interface AggregatedPerformanceEvidence {
  status: "aggregated";
  fpsMin: number;
  fpsMax: number;
  fpsAverage: number;
  confidence: "low" | "medium";
  aggregationMethod: ExternalAggregationMethod;
  contributingObservationIds: string[];
  contributingSourceIds: string[];
  exclusionReasons: ObservationExclusion[];
  basis: string;
}

export type AggregatePerformanceResult =
  | AggregatedPerformanceEvidence
  | {
      status: "unavailable";
      reason:
        | "no_observations"
        | "no_comparable_observations"
        | "single_average_only"
        | "insufficient_independent_sources";
      explanation: string;
      referenceObservationIds?: string[];
      exclusionReasons: ObservationExclusion[];
    };

export type SourceRightsDecision =
  "approved" | "approved-metadata-only" | "excluded";

export interface SourceRightsRecordEntry {
  sourceId: string;
  publisher: string;
  canonicalUrl: string;
  accessFindings: string;
  robotsTermsFindings: string;
  citationRights: EvidenceRightsClass;
  storeExtractedObservation: boolean;
  decision: SourceRightsDecision;
  notes?: string;
}

export interface SourceRightsRecordFile {
  provenanceContractVersion: Prov4ContractVersion;
  recordVersion: string;
  reviewedAt: string;
  reviewerLabel: string;
  decisions: SourceRightsRecordEntry[];
}

/** Explicit absence — never invent a number. */
export interface MetricUnavailable {
  status: "unavailable";
  reason: string;
}

export interface FrametimeDistributionSummary {
  /** Number of frametime samples (or aggregated sample count) used. */
  sampleCount: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

/**
 * Content-addressed raw evidence binding.
 * A free-form string is not allowed.
 */
export interface RawArtifactReference {
  kind: "repo-file" | "content-addressed" | "lab-archive";
  /**
   * repo-file: repo-relative path (e.g. benchmarks/prov4/raw/…).
   * content-addressed: scheme URI (e.g. sha256-<hex> or multihash URI).
   * lab-archive: durable lab archive locator string.
   */
  locator: string;
  /** Lowercase hex SHA-256 (64 chars) of the referenced bytes. */
  sha256: string;
  /** IANA media type, e.g. application/json, text/csv. */
  mediaType: string;
  /** Exact byte length of the referenced payload. */
  byteLength: number;
}

/**
 * Charter frametime distribution: summary percentiles and/or a verifiable
 * raw frametime artifact. First-party measured rows must use an available
 * form, not MetricUnavailable.
 */
export type FrametimeEvidence =
  | {
      status: "available";
      representation: "summary";
      summary: FrametimeDistributionSummary;
    }
  | {
      status: "available";
      representation: "raw-artifact";
      artifact: RawArtifactReference;
    }
  | {
      status: "available";
      representation: "summary-and-raw";
      summary: FrametimeDistributionSummary;
      artifact: RawArtifactReference;
    }
  | MetricUnavailable;

/**
 * Display + charter metrics. Discriminated by `metricKind`.
 */
export type PerformanceMeasurement =
  | {
      metricKind: "first-party-measured";
      fpsMin: number;
      fpsMax: number;
      fpsAverage: number;
      fpsOnePercentLow: number;
      frametime: Exclude<FrametimeEvidence, MetricUnavailable>;
    }
  | {
      metricKind: "synthetic-stub";
      fpsMin: number;
      fpsMax: number;
      fpsAverage: MetricUnavailable;
      fpsOnePercentLow: MetricUnavailable;
      frametime: MetricUnavailable;
    }
  | {
      metricKind: "external-review";
      fpsMin: number;
      fpsMax: number;
      fpsAverage: number | MetricUnavailable;
      fpsOnePercentLow: number | MetricUnavailable;
      frametime: FrametimeEvidence;
    }
  | {
      metricKind: "external-aggregated";
      fpsMin: number;
      fpsMax: number;
      fpsAverage: number;
      fpsOnePercentLow: MetricUnavailable;
      frametime: MetricUnavailable;
    };

/**
 * Full capture envelope. Required for confidence "low" | "medium" | "high".
 * Forbidden to omit when confidence is not "stub" | "none".
 */
export interface PerformanceCaptureConditions {
  protocolId: string;
  protocolVersion: string;
  /**
   * Number of timed runs that contributed to the range.
   * For first-party-measured rows, must be an integer `>= 2`.
   */
  runCount: number;
  rangeDerivation: RangeDerivationMethod;
  gamePatchVersion: string;
  gpuDriverVersion: string;
  toolName: string;
  toolVersion: string;
  graphicsSettings: {
    presetId: "preset.raster-ultra";
    exactSettings: string;
  };
  powerThermal: {
    cpuPowerLimitId: "cpu-power.default" | "cpu-power.reduced";
    gpuPowerLimitId: "gpu-power.default" | "gpu-power.reduced";
    conditions: string;
  };
  /**
   * Required for first-party measured / high-confidence capture rows.
   * External aggregates omit this: there is no first-party raw capture to claim.
   */
  rawArtifact?: RawArtifactReference;
}

export interface PerformanceEvidenceRecord {
  provenanceContractVersion: Prov4ContractVersion;
  evidenceId: string;
  key: PilotBaselineKey;
  buildPartIds: {
    caseId: "case.fractal-design-north-tg-dark";
    motherboardId: "motherboard.gigabyte-b650-aorus-elite-ax-v2";
    cpuId: "cpu.amd-ryzen-5-7600";
    gpuId: "gpu.asus-dual-rtx4070-o12g";
    coolerId: "cooler.noctua-nh-d15-g2";
    ramId: "ram.teamgroup-t-create-expert-ddr5-6000-32gb";
    psuId: "psu.corsair-rm750e";
  };
  measurement: PerformanceMeasurement;
  confidence: EstimateConfidence;
  dataVersion: string;
  basis: string;
  /** Registry EvidenceSource.sourceId values (origins), not phys3 ids. */
  sourceIds: string[];
  /** ISO-8601 capture or fixture-authoring time used for freshness. */
  capturedAt: string;
  freshnessPolicy: FreshnessPolicy;
  /**
   * Required when confidence is "low" | "medium" | "high".
   * Omitted only when confidence is "stub".
   */
  captureConditions?: PerformanceCaptureConditions;
  /** Required when confidence is "high". */
  verificationId?: string;
  limitingFactor?: {
    category:
      "GPU-bound" | "CPU-bound" | "VRAM pressure" | "power limit" | "RAM-bound";
    explanation: string;
  };
}

export type PerformanceEvidenceBinding =
  | {
      status: "bound";
      evidence: PerformanceEvidenceRecord;
      freshness: FreshnessResult;
      sources: EvidenceSource[];
      verification?: HumanVerificationRecord;
    }
  | {
      status: "unavailable";
      reason:
        | "not_pilot_key"
        | "missing_evidence_row"
        | "missing_source"
        | "incomplete_capture_conditions"
        | "incomplete_charter_metrics"
        | "raw_artifact_integrity_failed"
        | "confidence_ceiling_violation"
        | "verification_required"
        | "verification_failed"
        | "stale_withheld";
      explanation: string;
    };

export interface PerformanceEvidenceFile {
  provenanceContractVersion: Prov4ContractVersion;
  dataVersion: string;
  rows: PerformanceEvidenceRecord[];
}

// --- Geometry evidence (§7) ---

export interface GeometryEvidenceRecord {
  provenanceContractVersion: Prov4ContractVersion;
  evidenceId: string;
  partId: string;
  /**
   * Official join key to Phase 3.
   * MUST equal `physicalSpec.evidence.sourceId` for that part exactly.
   */
  phys3EvidenceSourceId: string;
  modelGrade: PhysicalModelGrade;
  geometryDataVersion: string;
  sourceIds: string[];
  reviewedAt: string;
  freshnessPolicy: FreshnessPolicy;
  verificationId?: string;
  basis: string;
  measuredDimensionsMm?: Array<{
    label: string;
    valueMm: number;
    toleranceMm?: number;
  }>;
}

export type GeometryEvidenceBinding =
  | {
      status: "bound";
      evidence: GeometryEvidenceRecord;
      freshness: FreshnessResult;
      sources: EvidenceSource[];
      verification?: HumanVerificationRecord;
    }
  | {
      status: "unavailable";
      partId: string;
      reason:
        | "not_pilot_part"
        | "missing_physical_spec"
        | "missing_evidence_row"
        | "missing_source"
        | "grade_ceiling_violation"
        | "verification_required"
        | "phys3_ref_mismatch";
      explanation: string;
    };

export interface GeometryEvidenceFile {
  provenanceContractVersion: Prov4ContractVersion;
  dataVersion: string;
  rows: GeometryEvidenceRecord[];
}

/** Pilot part ids allowed in the M0 geometry file. */
export const PROV4_PILOT_PART_IDS = [
  "case.fractal-design-north-tg-dark",
  "motherboard.gigabyte-b650-aorus-elite-ax-v2",
  "cpu.amd-ryzen-5-7600",
  "gpu.asus-dual-rtx4070-o12g",
  "cooler.noctua-nh-d15-g2",
  "ram.teamgroup-t-create-expert-ddr5-6000-32gb",
  "psu.corsair-rm750e",
] as const;

export type Prov4PilotPartId = (typeof PROV4_PILOT_PART_IDS)[number];

// --- Cooling provenance (§8) ---

export interface CoolingEvidenceProvenance {
  provenanceContractVersion: Prov4ContractVersion;
  evidenceSourceId: string;
  sourceIds: string[];
  capturedAt: string;
  freshnessPolicy: FreshnessPolicy;
  verificationId?: string;
  basis: string;
}

export interface CoolingProvenanceFile {
  provenanceContractVersion: Prov4ContractVersion;
  dataVersion: string;
  rows: CoolingEvidenceProvenance[];
}

// --- Aggregate disclosure (§9) ---

/** Per-resolution external aggregation attempt (pilot overlay). */
export interface ExternalPerformanceDisclosure {
  resolution: "1080p" | "1440p" | "4k";
  aggregation: AggregatePerformanceResult;
  /** Residual synthetic-stub row from pilot-performance-evidence.json when present. */
  syntheticReference?: PerformanceEvidenceRecord;
  /** Product display class after external-first binding. */
  displayClass: "aggregated" | "synthetic-perf1" | "unavailable";
}

export interface PilotDisclosureReport {
  provenanceContractVersion: Prov4ContractVersion;
  isPilotBuild: boolean;
  buildPartIds: string[];
  /**
   * When isPilotBuild, length is always 3 (one binding attempt per resolution).
   */
  performance: PerformanceEvidenceBinding[];
  /** External observation aggregation + synthetic reference (pilot only). */
  externalPerformance?: ExternalPerformanceDisclosure[];
  /** When isPilotBuild, one entry per selected pilot part (7 for default). */
  geometry: GeometryEvidenceBinding[];
  cooling:
    | {
        status: "available";
        provenance: CoolingEvidenceProvenance;
        freshness: FreshnessResult;
      }
    | { status: "unavailable"; reason: string; explanation: string };
  limitations: string[];
}

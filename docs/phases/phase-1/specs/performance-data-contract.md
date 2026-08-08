# Performance Data Contract (Phase 1)

Status: **owner-accepted (2026-08-08)**
Scope authority: [`phase-1.md`](./phase-1.md)

This document defines the Phase 1 performance-engine types and normative rules. It
does not define fixture rows, a benchmark runner, PresentMon integration, or an
ingestion pipeline.

## 1. Contract version

Contract version: **`perf1`**

`perf1` is the successor to Phase 0's `vs0` contract for the performance-engine
data governed here. Every Phase 1 stub row uses `dataVersion: "perf1"`; this is the
required data-version convention until a later dataset revision is explicitly
introduced. A breaking field or semantic change requires a new contract version;
fixture refreshes that preserve this shape do not.

## 2. Shared confidence enum

Phase 1 reuses Phase 0's exact `EstimateConfidence` enum. It is not redefined or
renamed here. Source: [`vertical-slice-data-contract.md`](../../phase-0/specs/vertical-slice-data-contract.md).

```typescript
type EstimateConfidence = "stub" | "low" | "medium" | "high" | "none";
```

`"none"` is used for an unavailable result. Happy-path Phase 1 fixture rows are
`"stub"` until supported evidence exists.

## 3. Baseline model

### 3.1 Fixed baseline vocabulary

These are the only Phase 1 baseline lookup values. IDs remain opaque strings; the
engine compares them for equality and does not parse their structure.

| Dimension | Fixed IDs |
|-----------|-----------|
| CPU | `cpu.zen4-7600`, `cpu.zen4-7800x3d` |
| GPU | `gpu.rtx4070`, `gpu.rtx4080` |
| Game | `game.cyberpunk-2077` |
| Preset | `preset.raster-ultra` |
| Resolution | `1080p`, `1440p`, `4k` |
| Upscaling | `upscale.off`, `upscale.dlss-quality` |
| Frame generation | `framegen.off`, `framegen.on` |
| RAM tier | `ram.16gb-ddr5`, `ram.32gb-ddr5` |
| Baseline power profile | `power.default` |

```typescript
type CpuId = "cpu.zen4-7600" | "cpu.zen4-7800x3d";
type GpuId = "gpu.rtx4070" | "gpu.rtx4080";
type GameId = "game.cyberpunk-2077";
type PresetId = "preset.raster-ultra";
type ResolutionId = "1080p" | "1440p" | "4k";
type UpscaleId = "upscale.off" | "upscale.dlss-quality";
type FrameGenId = "framegen.off" | "framegen.on";
type RamTierId = "ram.16gb-ddr5" | "ram.32gb-ddr5";
type PowerProfileId = "power.default";
```

VRAM is implicit in `gpuId`, not a separate query dimension, per [`phase-1.md`](./phase-1.md)
§2.2.

### 3.2 BaselineQuery

`BaselineQuery` is the complete controlled-baseline lookup key. It contains no
case, motherboard, or cooler key; those remain in `BuildState` for Phase 0 URL
continuity but are not Phase 1 performance-engine lookup keys (§2.1).

```typescript
interface BaselineQuery {
  cpuId: CpuId;
  gpuId: GpuId;
  gameId: GameId;
  presetId: PresetId;
  resolution: ResolutionId;
  upscaleId: UpscaleId;
  frameGenId: FrameGenId;
  ramTierId: RamTierId;
  powerProfileId: PowerProfileId;
}
```

A supported query assumes the controlled baseline conditions in §1.1: adequate
cooling, manufacturer-default power limits, and other conditions stated in the
estimate's `basis`.

### 3.3 PerformanceEstimate

A supported baseline result is always an FPS range. `limitingFactor` is structured
so the UI can show both a bounded category and a human-readable explanation.

```typescript
type LimitingFactorCategory =
  | "GPU-bound"
  | "CPU-bound"
  | "VRAM pressure"
  | "power limit"
  | "RAM-bound";

interface LimitingFactor {
  category: LimitingFactorCategory;
  explanation: string;
}

interface PerformanceEstimate {
  fpsMin: number;
  fpsMax: number;
  confidence: EstimateConfidence;
  dataVersion: string;
  basis: string;
  limitingFactor: LimitingFactor;
}
```

`fpsMin` and `fpsMax` are an inclusive expected range, never a single invented
point estimate. Every supported estimate carries `confidence`, `dataVersion`,
`basis`, and `limitingFactor` (§3.1).

### 3.4 Unavailable baseline result

Unknown or unsupported baseline keys return the same structured unavailable pattern
used by `vs0`: a status discriminator and a reason. No FPS range is invented.

```typescript
interface UnavailableResult {
  status: "unavailable";
  reason: string;
}

type BaselineEstimateResult = PerformanceEstimate | UnavailableResult;
```

The same `UnavailableResult` shape is used for unknown or unconfirmed workload
queries in §6. It is an outcome, not a guessed default and not a new fallback
estimate shape.

## 4. Correction model

### 4.1 Fixed correction vocabulary

The Phase 1 correction dimensions and values are fixed by [`phase-1.md`](./phase-1.md)
§2.3.

| Dimension | Fixed IDs |
|-----------|-----------|
| CPU power limit | `cpu-power.default`, `cpu-power.reduced` |
| GPU power limit | `gpu-power.default`, `gpu-power.reduced` |
| Cooling bucket | `cooling.sufficient`, `cooling.marginal`, `cooling.insufficient` |
| Load profile | `load.transient`, `load.sustained` |

```typescript
type CpuPowerId = "cpu-power.default" | "cpu-power.reduced";
type GpuPowerId = "gpu-power.default" | "gpu-power.reduced";
type CoolingBucketId =
  | "cooling.sufficient"
  | "cooling.marginal"
  | "cooling.insufficient";
type LoadProfileId = "load.transient" | "load.sustained";
```

### 4.2 CorrectionInput

All Phase 1 correction dimensions are optional. Omitting one is partial input, not
permission for the engine to guess it.

```typescript
interface CorrectionInput {
  cpuPowerId?: CpuPowerId;
  gpuPowerId?: GpuPowerId;
  coolingBucketId?: CoolingBucketId;
  loadProfileId?: LoadProfileId;

  /** Reserved normalized Phase 3 input; not applied by the Phase 1 model. */
  coolingHeadroom?: number;
  /** Reserved Phase 3 normalized severity value or bucket. */
  intakeRestrictionSeverity?: string;
  /** Declared evidence source for a future Phase 3 correction input. */
  evidenceSourceId?: string;
}
```

Cooling buckets are user-selected or evidence-backed only; the engine never infers
one. Inputs outside the Phase 1 vocabulary are rejected or ignored with a clear
“not supported in phase 1” outcome, never silently clamped to a default (§3.2).

### 4.3 CorrectedEstimate

Applying an allowed correction changes the range, or an applicable sub-range, and
makes the cause visible in `reason`. The corrected output retains the baseline
explainability fields.

```typescript
interface CorrectedEstimate {
  status: "ok";
  fpsMin: number;
  fpsMax: number;
  confidence: EstimateConfidence;
  dataVersion: string;
  basis: string;
  limitingFactor: LimitingFactor;
  reason: string;
}
```

`reason` must identify which supplied correction applied, such as a power-limit
reduction or insufficient cooling under sustained load. A correction must not
silently merge materially different conditions into one unexplained number (§3.2).

### 4.4 WithheldCorrection

A sustained-load correction without applicable evidence returns an explicit withheld
result. It may be returned alongside the valid baseline or a valid non-sustained
partial correction; it is never silence and never a guessed sustained derate.

```typescript
interface WithheldCorrection {
  status: "withheld";
  reason: string;
}

type CorrectionResult = CorrectedEstimate | WithheldCorrection;
```

`reason` states what was not computed and why, for example that sustained-performance
correction data was not available for the supplied input (§3.2; completion scenario
§4 step 7).

### 4.5 Power-tier epistemic rule

The exact rule for `cpu-power.reduced` and `gpu-power.reduced` is defined by
[`phase-1.md`](./phase-1.md) §2.3 and is normative here:

> At the phase-1 scope-lock stage, the magnitude of `cpu-power.reduced` /
> `gpu-power.reduced` is an undetermined stub value — `confidence: "stub"`, same as
> every other unbacked phase-1 row. External review / community data can raise
> confidence to `"low"` or `"medium"`, never `"high"`; first-party controlled
> measurement is the only path that can reach `"high"`.

No `*.reduced` value may be presented as measured or verified without the applicable
benchmark evidence (§5).

## 5. Phase 3 correction interface hook

The correction layer exposes a stable, forward-compatible optional input surface for
Phase 3:

| Optional field | Intended role |
|----------------|---------------|
| `coolingHeadroom` | Normalized cooling headroom scalar or future bucket mapping |
| `intakeRestrictionSeverity` | Normalized intake-restriction severity |
| `evidenceSourceId` | Evidence source identifier, such as 3D layout or user override |

These fields are reserved on `CorrectionInput` as shown in §4.2. Their normalized
semantics and vocabulary belong to Phase 3. Phase 1 does not infer cooling, run
thermal/airflow/fluid simulation, or apply these fields. The baseline model API does
not change when Phase 3 supplies them (§3.3).

## 6. WorkloadEstimate — Cinebench

### 6.1 Workload vocabulary

| Dimension | Fixed IDs |
|-----------|-----------|
| Workload version | `cinebench.r23`, `cinebench.2024` |
| Metric | `metric.single-core`, `metric.multi-core` |

The two metrics are stored independently for each version. No third Cinebench ID is
introduced until its real name and existence are confirmed (§2.5).

### 6.2 WorkloadEstimate type

`WorkloadEstimate` is distinct from `PerformanceEstimate`. Cinebench is CPU-only:
there is no `gpuId`, resolution, preset, upscaling, or frame-generation field.

```typescript
type WorkloadId = "cinebench.r23" | "cinebench.2024";
type WorkloadMetric = "metric.single-core" | "metric.multi-core";

interface WorkloadEstimate {
  cpuId: CpuId;
  workloadId: WorkloadId;
  metric: WorkloadMetric;
  score: number;
  confidence: EstimateConfidence;
  dataVersion: string;
  basis: string;
}

type WorkloadEstimateResult = WorkloadEstimate | UnavailableResult;
```

`score` is a points value, not an FPS range. Unknown or unconfirmed version or
metric returns `UnavailableResult`; a missing score is never invented (§3.5).
Use the §2.3 confidence ladder; do not create a separate workload confidence
ladder.

Environment correction does not apply to `WorkloadEstimate` in Phase 1. In
particular, `CorrectionInput` does not adjust Cinebench scores (§3.5; §5).

## 7. Raw benchmark ingestion record

This is the minimal ingestion **record shape** deferred in `STATUS.md` under “아직
정하지 않음” → 실측 벤치마크 원시 스키마. It records one first-party captured run
that could later back a high-confidence `PerformanceEstimate` or `WorkloadEstimate`.
It does not define a runner, capture tool, PresentMon mapping, storage pipeline, or
aggregation algorithm; those are outside this deliverable and explicitly forbidden
by §7.

```typescript
interface RawBenchmarkSource {
  sourceId: string;
  kind: "first-party";
}

interface RawHardware {
  cpuId: CpuId;
  gpuId?: GpuId;
  ramTierId?: RamTierId;
  cpuPowerId?: CpuPowerId;
  gpuPowerId?: GpuPowerId;
}

interface RawPerformanceBenchmarkRecord {
  recordType: "performance";
  recordId: string;
  capturedAt: string; // ISO-8601 timestamp
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

interface RawWorkloadBenchmarkRecord {
  recordType: "workload";
  recordId: string;
  capturedAt: string; // ISO-8601 timestamp
  source: RawBenchmarkSource;
  hardware: RawHardware;
  query: {
    cpuId: CpuId;
    workloadId: WorkloadId;
    metric: WorkloadMetric;
  };
  measurement: {
    score: number;
  };
  dataVersion: string;
}

type RawBenchmarkRecord =
  | RawPerformanceBenchmarkRecord
  | RawWorkloadBenchmarkRecord;
```

`recordId` identifies the captured run. `hardware` identifies the tested CPU/GPU
and relevant power/RAM configuration; `query` identifies the workload configuration;
`corrections` records declared environment inputs when a performance run includes
those conditions; `measurement` contains only what that run measured; `capturedAt`
and `source` provide provenance.

The record's `dataVersion` is copied unchanged to any derived estimate or fixture
row. For Phase 1 stub rows, that value is the contract version declared in §1.
A first-party record may support `confidence: "high"` only under the first-party
controlled-measurement rule in §2.3; the presence of a record alone does not justify
that confidence.

## 8. Zod alignment

Per ADR-003, these types will be expressed as Zod schemas at implementation time.
The existing vs0 schemas live under `src/contract/` (`src/contract/vs0.schema.ts`),
so the Phase 1 implementation should follow that convention with
`src/contract/perf1.ts` for shared types and `src/contract/perf1.schema.ts` for Zod
schemas. This deliverable writes no source or Zod code.

# Estimator data contract (`est1`)

Status: **Draft for M0 package (2026-08-09).**  
Algorithm authority: [`../ALGORITHM_DISCUSSION.md`](../ALGORITHM_DISCUSSION.md) §0 (O1–O9).  
Scope authority: [`phase-4.1.md`](./phase-4.1.md).

Contract version: **`est1`**

`est1` is the **estimation** sidecar. It does **not** replace `prov4` (evidence)
or `perf1` (baseline lookup). Breaking field changes require a new contract
version string.

---

## 0. Temporary draft function

All `est1` results are outputs of a **temporary draft** combination function.
Motherboard, cooling, case airflow, and non-default power limits are **out of
query scope** in M0 and may invalidate or rescale estimates in a later contract
revision. Every successful estimate’s `basis` (or a fixed `draftCaveat` field)
must include a short English caveat to that effect.

---

## 1. Shared types

Reuse without redefinition:

- `EstimateConfidence` from vs0/perf1: `"stub" | "low" | "medium" | "high" | "none"`
- Pilot key dimensions aligned with perf1 / prov4 pilot baseline
- `RayTracingState`: `"off" | "on" | "partial"`

---

## 2. Estimator query

```typescript
interface EstimatorQuery {
  cpuId: "cpu.zen4-7600"; // M0 fixed; widen later
  gpuId: "gpu.rtx4070";
  gameId: "game.cyberpunk-2077";
  presetId: "preset.raster-ultra";
  resolution: "1080p" | "1440p" | "4k";
  upscaleId: "upscale.off";
  frameGenId: "framegen.off";
  rayTracingState: "off";
  ramTierId: "ram.32gb-ddr5";
  powerProfileId: "power.default";
}
```

**Not in M0 query:** motherboardId, coolerId, caseId, psuId, mount orientation.

---

## 3. Method tags

```typescript
type EstimatorMethod =
  | "exact-aggregate"
  | "vendor-anchor"
  | "scaled-combination";
```

| Method | Max confidence (M0) |
|--------|---------------------|
| `exact-aggregate` | `medium` |
| `vendor-anchor` (identity transform only) | `low` |
| `scaled-combination` | **`low` only (O5)** |

`synthetic-stub` is **not** an `EstimatorMethod`.

---

## 4. Scale edges (transform corpus)

```typescript
interface CpuScaleEdge {
  edgeId: string;
  fromCpuId: string;
  toCpuId: string;
  /** Optional band; omit = all resolutions (still subject to O2/O3 policy). */
  resolution?: "1080p" | "1440p" | "4k";
  gameId?: string; // optional narrow scope
  /** Multiplicative factor applied to fps endpoints: to ≈ from * factor */
  factor: number; // finite, > 0
  /** Relative uncertainty (e.g. 0.05 = ±5% width inflate guidance) */
  uncertainty: number; // finite, ≥ 0
  sourceIds: string[]; // registry / rights-bound
  basis: string;
  dataVersion: string;
}
```

```typescript
interface CpuScaleEdgeFile {
  estimatorContractVersion: "est1";
  dataVersion: string;
  edges: CpuScaleEdge[];
}
```

**Rules:**

- No edge ⇒ no CPU transform (O2/O3).
- `factor` must not be free-hand per call site; only fixture rows.
- Applying an edge forces method `scaled-combination` and confidence ≤ `low`.

---

## 5. Vendor anchor fragments (optional M0 corpus)

Minimal shape for manufacturer (or official) published FPS fragments:

```typescript
interface VendorPerformanceAnchor {
  anchorId: string;
  sourceId: string;
  sourceUrl: string;
  publishedAt: string;
  accessedAt: string;
  cpuId?: string; // omit if vendor did not state CPU — weak comparability
  gpuId: string;
  gameId: string;
  presetId?: string;
  exactSettings: string;
  resolution: "1080p" | "1440p" | "4k";
  upscaleId: string;
  frameGenId: string;
  rayTracingState: RayTracingState;
  fpsAverage?: number;
  fpsRangeMin?: number;
  fpsRangeMax?: number;
  testSystem: string;
  sampleNotes?: string;
}
```

```typescript
interface VendorPerformanceAnchorFile {
  estimatorContractVersion: "est1";
  dataVersion: string;
  anchors: VendorPerformanceAnchor[];
}
```

Selection is **comparability-first** against the query (O1). Anchors without
`cpuId` cannot satisfy exact CPU match; they only participate if a policy-legal
scale path exists (normally: **cannot**, unless a documented edge from an
explicit fromCpu is defined — M0 default: treat missing cpuId as
non-scalable without a dedicated edge class; prefer unavailable over guess).

---

## 6. Estimator result

```typescript
type EstimatorContributorRole =
  | "primary-anchor"
  | "exact-observation"
  | "scale-edge"
  | "review-validation";

interface EstimatorContributor {
  role: EstimatorContributorRole;
  refKind: "prov4-observation" | "prov4-aggregate" | "vendor-anchor" | "cpu-scale-edge";
  refId: string;
}

interface CombinationEstimate {
  status: "estimated";
  estimatorContractVersion: "est1";
  query: EstimatorQuery;
  fpsMin: number;
  fpsMax: number;
  fpsAverage: number; // must satisfy fpsMin ≤ fpsAverage ≤ fpsMax
  confidence: "low" | "medium"; // never stub/high from estimator in M0 scaled path
  method: EstimatorMethod;
  basis: string;
  /** Fixed product caveat — temporary draft function */
  draftCaveat: string;
  contributors: EstimatorContributor[];
  exclusionReasons: Array<{ code: string; detail: string }>;
  dataVersion: string;
}

interface CombinationEstimateUnavailable {
  status: "unavailable";
  estimatorContractVersion: "est1";
  query: EstimatorQuery;
  reason:
    | "no_candidates"
    | "missing_scale_edge"
    | "comparability_failed"
    | "range_too_wide"
    | "rights_denied"
    | "validation_failed"
    | "policy_block";
  explanation: string;
  exclusionReasons: Array<{ code: string; detail: string }>;
  dataVersion: string;
  draftCaveat: string;
}

type CombinationEstimateResult =
  | CombinationEstimate
  | CombinationEstimateUnavailable;
```

### 6.1 Invariants

- `status: "estimated"` ⇒ `fpsMin < fpsMax` (strict) and average in range.
- Scaled path ⇒ `confidence === "low"`.
- Exact-aggregate path ⇒ `confidence` ∈ {`low`,`medium`} per prov4 aggregate rules, never `high`.
- No result may use `confidence: "stub"` or method implying synthetic.
- `draftCaveat` non-empty on every result.

### 6.2 Recommended draftCaveat string (M0 constant)

```text
Temporary draft estimate under controlled baseline assumptions. Motherboard,
cooling, case airflow, and non-default power limits are not modeled and may
change real-world results.
```

---

## 7. Pure function signature

```typescript
function estimateCombinationPerformance(input: {
  query: EstimatorQuery;
  /** prov4 external observations + optional precomputed aggregate helpers */
  externalObservations: ExternalPerformanceObservation[];
  sourceRights: SourceRightsRecordFile;
  vendorAnchors: VendorPerformanceAnchor[];
  cpuScaleEdges: CpuScaleEdge[];
  policy?: EstimatorPolicy; // optional; defaults from this contract
}): CombinationEstimateResult;
```

Deterministic; no clock I/O; no network.

---

## 8. Policy constants (M0 defaults)

```typescript
interface EstimatorPolicy {
  /** P1: max relative range width before unavailable */
  maxRelativeRangeWidth: number; // default 0.40
  requireReviewValidationWhenComparable: true; // O4 locked
  allowGpuBoundCpuWaiverWithoutRatio: false; // O2/O3 locked
  scaledConfidenceCeiling: "low"; // O5 locked
}
```

---

## 9. Fixture paths (proposed)

```text
benchmarks/est1/
  cpu-scale-edges.json
  vendor-performance-anchors.json   # may be empty array initially
```

Rights for stored vendor FPS still go through `prov4` source-rights / registry
discipline where sourceIds are shared.

---

## 10. Zod / integrity expectations

- Unique `edgeId` / `anchorId`.
- `factor > 0`, `uncertainty ≥ 0`.
- Estimated rows: strict range ordering.
- Integrity tests: estimator never returns synthetic; scaled never > low;
  missing edge ⇒ unavailable for CPU-mismatched anchors.

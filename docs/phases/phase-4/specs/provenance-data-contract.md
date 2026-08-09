# Provenance Data Contract (Phase 4)

Status: **M0 owner-accepted and implementation authorized (2026-08-09)**;
contract software path implemented, Step 9 evidence-quality closeout pending
**owner PASS**

Contract version: **`prov4`**

Scope authority: [`phase-4.md`](./phase-4.md). This contract is independent
from and does **not** alter the public field shapes of `vs0`, `vs2`,
`compat2`, `perf1`, or `phys3`. Runtime attachment is **sidecar binding only**:
`prov4` records overlay disclosure (and pilot performance display) without
adding provenance fields to existing contract rows.

This document defines provenance identity, evidence binding, freshness,
human verification, and pilot fixture file shapes. It does not define a
benchmark runner, PresentMon integration, ingestion service, or asset
acquisition pipeline.

---

## 1. Contract version

```typescript
export const PROV4_CONTRACT_VERSION = "prov4" as const;
export type Prov4ContractVersion = typeof PROV4_CONTRACT_VERSION;
```

Breaking field or semantic changes require a new contract version. Fixture
refreshes that preserve this shape may advance a dataset `dataVersion` string
without renaming the contract.

---

## 2. Inherited conventions

1. IDs are opaque strings; engines compare equality and do not parse structure.
2. Units remain mm; GLB coordinates remain Y-up where geometry is referenced.
3. Unknown or weakly supported claims return structured `unavailable`,
   withheld, stub, or degraded disclosure — never invented FPS or Verified
   geometry.
4. Repo-root fixture SSOT remains `parts/` and `benchmarks/` with HTTP
   `/parts` and `/benchmarks`.
5. Confidence ladder is reused exactly from Phase 0 / Phase 1:

```typescript
type EstimateConfidence = "stub" | "low" | "medium" | "high" | "none";
```

6. Physical model grade is reused exactly from Phase 3:

```typescript
type PhysicalModelGrade = "Verified" | "Community" | "Experimental";
```

7. **`perf1` / `phys3` public types are not extended.** Pilot performance
   display uses `prov4` sidecar records. Geometry disclosure joins
   `phys3.PhysicalEvidenceRef` to `GeometryEvidenceRecord` via the explicit
   key in §7.3 — not by overloading registry `sourceId` meaning.

---

## 3. Source registry

### 3.1 Source class

```typescript
export type EvidenceSourceClass =
  | "first-party"
  | "project-synthetic"
  | "external-review"
  | "manufacturer-spec";
```

`third-party-mesh` is intentionally absent from the M0 enum. Importing
manufacturer-derived meshes requires a separate rights decision outside this
contract.

### 3.2 Rights class

```typescript
export type EvidenceRightsClass =
  | "apache-2.0-project"
  | "public-spec"
  | "fair-use-citation"
  | "licensed"
  | "unavailable";
```

### 3.3 Registry entry

```typescript
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
```

Schema rules:

- `sourceId` unique within the registry file.
- `external-review` requires non-empty `citation`.
- `project-synthetic` must use `rightsClass: "apache-2.0-project"`.
- `rightsClass: "unavailable"` forbids any claim that depends on redistributing
  the underlying third-party document or mesh.

### 3.4 Registry file

```typescript
export interface EvidenceSourceRegistryFile {
  provenanceContractVersion: Prov4ContractVersion;
  registryVersion: string;
  sources: EvidenceSource[];
}
```

Proposed path:

```text
benchmarks/prov4/evidence-source-registry.json
```

**Registry role (normative):** `EvidenceSource.sourceId` identifies an
*origin* (lab run series, synthetic fixture pack, review URL, datasheet).
It is **not** the Phase 3 per-part geometry evidence id and is **not** the
join key to `physicalSpec.evidence.sourceId`. That join is §7.3.

---

## 4. Freshness

```typescript
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
```

Normative classification:

1. If `asOf` is **omitted**, empty, or not a valid timestamp → `unknown`.
2. If `policy.maxAgeDays` is omitted → `current` with explanation that no
   automatic window applies (timestamp still displayed when present).
3. If age ≤ `maxAgeDays` → `current`.
4. If age > `maxAgeDays` → `stale`.

Default pilot policy (owner-accepted O3-A): `maxAgeDays: 365`.

Domain records that carry a capture/review time (`capturedAt`, `reviewedAt`)
pass that field as `asOf` when calling the classifier. They do not invent a
placeholder timestamp.

---

## 5. Human verification record

```typescript
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
  /** Registry source ids supporting the review (lab notes, photos index, etc.). */
  sourceIds: string[];
  /**
   * Lowercase hex SHA-256 digests the verifier attests.
   * Required non-empty for pass `performance-capture-attestation` used by
   * `"high"` rows; must include `captureConditions.rawArtifact.sha256`.
   */
  attestedArtifactDigests?: string[];
  notes?: string;
}
```

Schema rules:

- `verdict: "pass"` requires non-empty `checklist` and at least one `sourceId`.
- For `performance-capture-attestation` with `pass`, the checklist must
  explicitly attest that recorded protocol/version, tool/version, game patch,
  driver, graphics settings, power/thermal conditions, run count, range
  derivation, charter metrics (average FPS, 1% low, frametime evidence), and
  raw artifact digests match the capture (see §6.5).
- For that same pass verdict when used by a `"high"` performance row,
  `attestedArtifactDigests` must be non-empty and include every
  `RawArtifactReference.sha256` on the bound performance record
  (`captureConditions.rawArtifact` and any frametime raw artifact).
- Failed or incomplete verification must not be used to raise confidence or
  model grade.
- Verification records are stored as fixture JSON for the static SPA; there is
  no account system.

Proposed path:

```text
benchmarks/prov4/human-verification-records.json
```

```typescript
export interface HumanVerificationFile {
  provenanceContractVersion: Prov4ContractVersion;
  records: HumanVerificationRecord[];
}
```

---

## 6. Performance evidence binding

### 6.1 Pilot baseline key

The pilot performance key is the existing `perf1` `BaselineQuery` restricted to
the pilot vocabulary in [`phase-4.md`](./phase-4.md) §2.1.

```typescript
export interface PilotBaselineKey {
  cpuId: "cpu.zen4-7600";
  gpuId: "gpu.rtx4070";
  gameId: "game.cyberpunk-2077";
  presetId: "preset.raster-ultra";
  resolution: "1080p" | "1440p" | "4k";
  upscaleId: "upscale.off";
  frameGenId: "framegen.off";
  ramTierId: "ram.32gb-ddr5";
  powerProfileId: "power.default";
}
```

### 6.2 Charter metrics and display range

The project charter requires every first-party game result to record **average
FPS**, **1% low**, and **frametime distribution** in addition to a range
([`PROJECT_CHARTER.md`](../../../../PROJECT_CHARTER.md) §5). Phase 4 makes
those fields structural. A display range alone never justifies `"high"`.

```typescript
export type RangeDerivationMethod =
  | "repeated-run-min-max"
  | "repeated-run-mean-pm-band"
  | "imported-review-stated-range"
  | "synthetic-fixture-range";

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
 * Display + charter metrics. Discriminated by `metricKind` so stub and
 * external-review rows can mark charter metrics unavailable without inventing
 * averages or percentiles.
 */
export type PerformanceMeasurement =
  | {
      /** First-party controlled measurement — charter metrics required. */
      metricKind: "first-party-measured";
      fpsMin: number;
      fpsMax: number;
      fpsAverage: number;
      fpsOnePercentLow: number;
      frametime: Exclude<FrametimeEvidence, MetricUnavailable>;
    }
  | {
      /** Explicit synthetic pilot residual — range only for UI continuity. */
      metricKind: "synthetic-stub";
      fpsMin: number;
      fpsMax: number;
      fpsAverage: MetricUnavailable;
      fpsOnePercentLow: MetricUnavailable;
      frametime: MetricUnavailable;
    }
  | {
      /**
       * External review import. Range required; charter metrics available only
       * when the review states them; otherwise explicit unavailable.
       */
      metricKind: "external-review";
      fpsMin: number;
      fpsMax: number;
      fpsAverage: number | MetricUnavailable;
      fpsOnePercentLow: number | MetricUnavailable;
      frametime: FrametimeEvidence;
    };

/**
 * Full capture envelope. Required for confidence "low" | "medium" | "high".
 * Forbidden to omit when confidence is not "stub" | "none".
 */
export interface PerformanceCaptureConditions {
  /** Opaque protocol id, e.g. "proto.cp2077-raster-ultra-baseline". */
  protocolId: string;
  /** Protocol document/version string, e.g. "2026.08.1". */
  protocolVersion: string;
  /**
   * Number of timed runs that contributed to the range.
   * When this envelope is attached to a `first-party-measured` row,
   * `runCount` must be an integer `>= 2` (see §6.4 numeric rules). This is
   * not limited to `"high"` confidence.
   */
  runCount: number;
  rangeDerivation: RangeDerivationMethod;
  gamePatchVersion: string;
  gpuDriverVersion: string;
  toolName: string;
  toolVersion: string;
  /**
   * Exact graphics settings beyond the opaque preset id: major toggles
   * (RT off/on, DLSS mode, FG, etc.) as a structured note the UI can show.
   */
  graphicsSettings: {
    presetId: "preset.raster-ultra";
    /** Non-empty human-readable exact settings summary. */
    exactSettings: string;
  };
  powerThermal: {
    /** Must align with key.powerProfileId / declared limits. */
    cpuPowerLimitId: "cpu-power.default" | "cpu-power.reduced";
    gpuPowerLimitId: "gpu-power.default" | "gpu-power.reduced";
    /** Cooling / ambient / sustained notes; non-empty. */
    conditions: string;
  };
  /**
   * Immutable capture artifact (full run package or PresentMon export).
   * Free-form strings are rejected; digest + length are mandatory.
   */
  rawArtifact: RawArtifactReference;
}
```

### 6.3 Raw artifact integrity (normative)

`RawArtifactReference` is an **immutable evidence gate**, not a label.

| Rule | Requirement |
|------|-------------|
| `sha256` | Exactly 64 lowercase hex characters; content digest of the bytes |
| `byteLength` | Positive integer; must match actual payload size |
| `locator` | Non-empty; kind-specific (path, content URI, or archive id) |
| `mediaType` | Non-empty IANA type |
| `kind: "repo-file"` | File exists at repo-relative `locator` at integrity time; on-disk SHA-256 and size **must equal** declared `sha256` / `byteLength` |
| `kind: "content-addressed"` | `locator` must embed or equal the same digest family as `sha256`; payload resolution is implementation-defined but digest is mandatory |
| `kind: "lab-archive"` | `sha256` + `byteLength` still mandatory; archive id alone is insufficient |
| High verification | Pass `performance-capture-attestation` must list the same `sha256` in `attestedArtifactDigests` (see §5 amendment below) |

`"trust-me-run-1"` as a bare string is not representable and must fail schema.

When `frametime.representation` is `raw-artifact` or `summary-and-raw`, that
frametime `artifact` is subject to the same integrity rules. It may equal
`captureConditions.rawArtifact` or be a distinct frametime-series payload.

### 6.4 Performance evidence record

```typescript
export interface PerformanceEvidenceRecord {
  provenanceContractVersion: Prov4ContractVersion;
  evidenceId: string;
  /** Exact pilot baseline key. */
  key: PilotBaselineKey;
  /** Pilot build part ids for disclosure (not all are perf1 lookup keys). */
  buildPartIds: {
    caseId: "case.mid-tower-atx-01";
    motherboardId: "mb.atx-b650-01";
    cpuId: "cpu.zen4-7600";
    gpuId: "gpu.rtx4070";
    coolerId: "cooler.air-twin-tower-01";
    ramId: "ram.ddr5-32gb-6000";
    psuId: "psu.750w-atx";
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
   * Omitted only when confidence is "stub" (explicit synthetic pilot cell).
   */
  captureConditions?: PerformanceCaptureConditions;
  /** Required when confidence is "high". */
  verificationId?: string;
  limitingFactor?: {
    category:
      | "GPU-bound"
      | "CPU-bound"
      | "VRAM pressure"
      | "power limit"
      | "RAM-bound";
    explanation: string;
  };
}
```

Measurement and confidence coupling (normative):

| `confidence` / sources | Allowed `measurement.metricKind` | Charter metrics |
|------------------------|----------------------------------|-----------------|
| `"stub"` + synthetic only | `synthetic-stub` only | `fpsAverage`, `fpsOnePercentLow`, `frametime` must be `MetricUnavailable` |
| `"low"` / `"medium"` with external-review, no first-party | `external-review` | Each of average / 1% low / frametime is number-or-available **or** explicit `unavailable` — never omitted |
| `"low"` / `"medium"` / `"high"` with first-party | `first-party-measured` only | `fpsAverage`, `fpsOnePercentLow` required numbers; `frametime` available (summary and/or raw artifact); `captureConditions.runCount >= 2` |
| `"high"` | `first-party-measured` only | Same as first-party, plus full high gate in §6.5 |

Numeric rules:

- `fpsMin` < `fpsMax` always.
- For `first-party-measured`: `fpsMin ≤ fpsAverage ≤ fpsMax` and
  `fpsOnePercentLow ≤ fpsAverage` (typical ordering; equality allowed).
- **For every `first-party-measured` row (any confidence, including
  `"medium"` under O1-A):** `captureConditions` is required and
  `captureConditions.runCount` must be an integer **`>= 2`**. Values `0` and
  `1` are schema/integrity failures. A single timed run is never a valid
  first-party measured closeout cell.
- External-review rows that carry `captureConditions` (if any) are **not**
  subject to the first-party `runCount >= 2` rule; their run counts, when
  present, follow whatever the cited review states and may remain absent
  when the review does not report a run count (M0 external-review rows
  typically omit `captureConditions` entirely).
- For frametime summary: `sampleCount >= 1`; `p50Ms ≤ p95Ms ≤ p99Ms`; all
  percentiles finite and > 0.
- A single invented point estimate is forbidden.
- For `synthetic-stub`, sources must be `project-synthetic` only; optional
  `captureConditions` if present must use `rangeDerivation:
  "synthetic-fixture-range"` and must **not** claim a first-party raw artifact
  as measured truth (synthetic rows omit `captureConditions` in M0).

### 6.5 Confidence ceilings and `"high"` gate (normative)

| Condition | Max confidence |
|-----------|----------------|
| Only `project-synthetic` sources | `"stub"` |
| Includes `external-review`, no `first-party` | `"medium"` |
| Includes `first-party` without complete captureConditions, without `first-party-measured` metrics, or with `runCount < 2` | **schema fail** |
| Includes `first-party` + complete captureConditions (`runCount >= 2`) + charter metrics, no pass verification | `"medium"` |
| Empty / unresolved sources | `"none"` (integrity fail for pilot production rows) |

**First-party measured precondition (all confidences):** any row with
`measurement.metricKind === "first-party-measured"` must already satisfy
§6.4, including `captureConditions.runCount >= 2`. O1-A may close with a
first-party `"medium"` cell only when that precondition holds; a
`runCount` of `0` or `1` cannot be a closeout measured cell at any
confidence.

**`"high"` is allowed only when all of the following hold:**

1. At least one resolved `sourceIds` entry has `sourceClass: "first-party"`.
2. First-party is present (synthetic may co-appear only as secondary docs).
3. `measurement.metricKind === "first-party-measured"` with required
   `fpsAverage`, `fpsOnePercentLow`, and available `frametime`.
4. `captureConditions` is present and complete:
   - non-empty `protocolId`, `protocolVersion`;
   - `runCount >= 2` (already required for all first-party-measured rows;
     repeated here because high inherits the same floor);
   - `rangeDerivation` is `repeated-run-min-max` or
     `repeated-run-mean-pm-band` (not `synthetic-fixture-range` or
     `imported-review-stated-range`);
   - non-empty `gamePatchVersion`, `gpuDriverVersion`, `toolName`,
     `toolVersion`;
   - non-empty `graphicsSettings.exactSettings`;
   - non-empty `powerThermal.conditions`;
   - power limit ids consistent with the pilot baseline power story
     (`power.default` → both limits `*.default` unless the record is a
     correction cell, which M0 does not ship);
   - `rawArtifact` passes §6.3 integrity (digest + length; repo-file exists
     and matches when kind is `repo-file`).
5. `verificationId` resolves to a `HumanVerificationRecord` with
   `kind: "performance-capture-attestation"` and `verdict: "pass"`.
6. That verification includes `attestedArtifactDigests` containing
   `captureConditions.rawArtifact.sha256` (and any frametime raw artifact
   digests if present), and the checklist attests protocol/tool/patch/driver/
   settings/power-thermal/run count/range derivation (see §5).

A short checklist plus fpsMin/fpsMax alone is **never** sufficient for
`"high"`. Declaring above the applicable ceiling is a schema/integrity
failure.

A record may declare a **lower** confidence than its ceiling.

### 6.6 Pilot file completeness (three cells)

The production pilot performance file **must** contain **exactly three**
rows — one per resolution `1080p`, `1440p`, `4k` — each registry-bound
(`sourceIds` non-empty and resolvable).

- Under owner-accepted **O1-A**, **at least one** of the three rows must
  satisfy the `"high"` gate (or at minimum a valid `first-party-measured` row
  with complete `captureConditions`, **`runCount >= 2`**, charter metrics, and
  confidence `"medium"` or `"high"`). Prefer one fully `"high"` cell when
  capture exists. A first-party `"medium"` cell with `runCount < 2` is not a
  valid O1-A closeout measurement.
- The remaining cells **must still be present** as registry-bound records.
  They may be `confidence: "stub"` with `metricKind: "synthetic-stub"`,
  `project-synthetic` sources, and explicit `MetricUnavailable` for average /
  1% low / frametime, with `basis` explaining residual stub.
- **Missing rows for a pilot resolution are a fixture integrity failure**,
  not a silent fall-through to unlabeled `perf1` stub in the pilot disclosure
  path.

### 6.7 Runtime binding result

```typescript
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
```

Binding policy for M0:

1. Non-pilot key → `not_pilot_key` (caller keeps existing `perf1` stub path;
   no `prov4` performance overlay).
2. Pilot key without row → `missing_evidence_row` (**should not occur** if
   fixture integrity passed; treat as hard disclosure failure, do not invent
   FPS).
3. Pilot key with row → validate sources, measurement metricKind coupling,
   charter metrics, captureConditions, raw artifact integrity, ceiling,
   verification digests; compute freshness from `capturedAt`.
4. Default freshness presentation: **bound + stale disclosure** when stale
   (do not hide the number, do not claim current). Optional
   `stale_withheld` remains available if a later amendment chooses it.

When `status: "bound"`, the UI may present the sidecar record's range and
confidence **instead of** the `perf1` stub row for that exact pilot key only.
The `perf1` fixture table itself is **not modified**. All non-pilot `perf1`
keys remain stub.

### 6.8 Performance evidence file

```typescript
export interface PerformanceEvidenceFile {
  provenanceContractVersion: Prov4ContractVersion;
  dataVersion: string;
  rows: PerformanceEvidenceRecord[];
}
```

Proposed path:

```text
benchmarks/prov4/pilot-performance-evidence.json
```

Uniqueness: exactly one row per pilot resolution; fixed non-resolution key
fields must match §6.1 on every row.

---

## 7. Geometry evidence binding

### 7.1 Part geometry evidence record

```typescript
export interface GeometryEvidenceRecord {
  provenanceContractVersion: Prov4ContractVersion;
  /** Prov4-local id for this geometry evidence row (not the phys3 join key). */
  evidenceId: string;
  partId: string;
  /**
   * Official join key to Phase 3.
   * MUST equal `physicalSpec.evidence.sourceId` for that part exactly.
   * This is the Phase 3 per-part evidence id (e.g.
   * `evidence.phys3.synthetic.cpu.zen4-7600`), NOT a registry origin id.
   */
  phys3EvidenceSourceId: string;
  modelGrade: PhysicalModelGrade;
  geometryDataVersion: string;
  /** Registry EvidenceSource.sourceId values (origins). */
  sourceIds: string[];
  /** ISO-8601 of the dimension/authoring review used for grade. */
  reviewedAt: string;
  freshnessPolicy: FreshnessPolicy;
  /** Required when modelGrade is Community or Verified. */
  verificationId?: string;
  basis: string;
  /**
   * Optional explicit dimension checklist results (mm). Absent means
   * "not claimed as human-measured dimensions".
   */
  measuredDimensionsMm?: Array<{
    label: string;
    valueMm: number;
    toleranceMm?: number;
  }>;
}
```

Pilot part ids (only these may appear in the pilot geometry file for M0):

```text
case.mid-tower-atx-01
mb.atx-b650-01
cpu.zen4-7600
gpu.rtx4070
cooler.air-twin-tower-01
ram.ddr5-32gb-6000
psu.750w-atx
```

Uniqueness:

- `evidenceId` unique in the file.
- `phys3EvidenceSourceId` unique in the file.
- composite `(partId, geometryDataVersion)` unique in the file.

### 7.2 Model grade ceilings (normative)

| Sources + verification | Max grade |
|------------------------|-----------|
| `project-synthetic` only | `Experimental` |
| `manufacturer-spec` without pass verification | `Experimental` |
| `manufacturer-spec` or first-party measure + pass `geometry-dimension-check` | `Community` |
| First-party physical measure + pass dimension **and** mount checks + rights ok | `Verified` |

Owner-accepted **O2-A**: M0 ships **only** `Experimental` geometry grade;
still author `GeometryEvidenceRecord` rows so disclosure works.

### 7.3 Binding to `phys3` (official join)

Phase 4 does not replace `PhysicalEvidenceRef`. IDs mean different things:

| Id field | Namespace | Meaning |
|----------|-----------|---------|
| `physicalSpec.evidence.sourceId` | phys3 | Per-part Phase 3 evidence id on the part fixture |
| `GeometryEvidenceRecord.phys3EvidenceSourceId` | prov4 → phys3 join | **Must equal** the phys3 field above |
| `GeometryEvidenceRecord.evidenceId` | prov4 | Local row id only |
| `GeometryEvidenceRecord.sourceIds[]` | prov4 registry | Origin registry entries (`EvidenceSource.sourceId`) |
| `EvidenceSource.sourceId` | registry | Lab/review/synthetic origin — **not** phys3 join |

**Official join algorithm** for a selected part with `physicalSpec`:

1. Read `phys3SourceId = physicalSpec.evidence.sourceId` and
   `gdv = physicalSpec.evidence.geometryDataVersion` and
   `grade = physicalSpec.evidence.modelGrade`.
2. Find the unique `GeometryEvidenceRecord` where
   `phys3EvidenceSourceId === phys3SourceId`.
3. Require `record.partId === selectedPartId`.
4. Require `record.geometryDataVersion === gdv`.
5. Require `record.modelGrade === grade`.
6. Resolve `record.sourceIds` against the registry.
7. On any failure → geometry binding `unavailable` with
   `phys3_ref_mismatch` or the more specific reason below.

Secondary integrity key: `(partId, geometryDataVersion)` must not collide
across rows. Lookup by that composite alone is **not** the primary join;
`phys3EvidenceSourceId` is.

Mismatch → geometry provenance `unavailable` for disclosure; physical
fit/interference engine behavior remains Phase 3 (do not force `fit` from
provenance failure).

```typescript
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
```

### 7.4 Geometry evidence file

```typescript
export interface GeometryEvidenceFile {
  provenanceContractVersion: Prov4ContractVersion;
  dataVersion: string;
  rows: GeometryEvidenceRecord[];
}
```

Proposed path:

```text
benchmarks/prov4/pilot-geometry-evidence.json
```

Production M0 file must include **all seven** pilot parts, each
registry-bound.

---

## 8. Cooling evidence binding

Phase 3 `CoolingEvidenceRecord` remains the physical cooling row shape. Phase 4
may add optional provenance linkage without changing the `perf1` correction API.

**Owner-accepted M0 choice:** production cooling provenance rows stay **empty**;
runtime cooling remains Phase 3 structured `unavailable`. The empty file shape
is still validated.

```typescript
export interface CoolingEvidenceProvenance {
  provenanceContractVersion: Prov4ContractVersion;
  /** Must match Phase 3 cooling `evidenceSourceId` when rows exist. */
  evidenceSourceId: string;
  sourceIds: string[];
  capturedAt: string;
  freshnessPolicy: FreshnessPolicy;
  verificationId?: string;
  basis: string;
}
```

```typescript
export interface CoolingProvenanceFile {
  provenanceContractVersion: Prov4ContractVersion;
  dataVersion: string;
  rows: CoolingEvidenceProvenance[];
}
```

Proposed path:

```text
benchmarks/prov4/pilot-cooling-provenance.json
```

Automatic `coolingBucketId` mapping and FPS derate remain out of scope.

---

## 9. Aggregate pilot disclosure report

UI and E2E consume a pure aggregate built from bindings:

```typescript
export interface PilotDisclosureReport {
  provenanceContractVersion: Prov4ContractVersion;
  isPilotBuild: boolean;
  buildPartIds: string[];
  /**
   * When isPilotBuild, length is always 3 (one binding attempt per
   * resolution). Entries may be bound stub or bound measured, or
   * unavailable if integrity was violated.
   */
  performance: PerformanceEvidenceBinding[];
  /** When isPilotBuild, one entry per selected pilot part (7 for default). */
  geometry: GeometryEvidenceBinding[];
  cooling:
    | { status: "available"; provenance: CoolingEvidenceProvenance; freshness: FreshnessResult }
    | { status: "unavailable"; reason: string; explanation: string };
  limitations: string[];
}
```

Rules:

- `isPilotBuild` is true only on exact part-set match to the pilot build.
- `limitations` must include residual honesty statements (e.g. residual stub
  resolution cells; non-pilot catalog still stub; prices non-live; geometry
  Experimental; cooling unavailable).
- Aggregate construction is pure and unit-tested.

---

## 10. Integrity validation checklist

- [ ] Registry `sourceId` uniqueness; registry ids are never used as phys3 join.
- [ ] Every evidence `sourceIds` / `verificationId` reference resolves.
- [ ] External-review sources have citations.
- [ ] Performance file has **exactly 3** pilot rows (1080p/1440p/4k), unique,
      registry-bound.
- [ ] Non-stub performance confidence requires complete `captureConditions`
      including structured `rawArtifact` (kind/locator/sha256/mediaType/byteLength).
- [ ] `first-party-measured` rows require numeric `fpsAverage`,
      `fpsOnePercentLow`, available `frametime` (summary and/or raw), and
      `captureConditions.runCount >= 2` at **every** confidence (including
      `"medium"` O1-A cells). Reject `runCount` of `0` or `1`.
- [ ] `synthetic-stub` rows mark average / 1% low / frametime as
      `MetricUnavailable` (never invent charter metrics).
- [ ] `external-review` rows use explicit number or `MetricUnavailable` for
      each charter metric (no omitted fields); not subject to first-party
      `runCount >= 2` unless they also claim first-party-measured (forbidden).
- [ ] Every `RawArtifactReference`: sha256 is 64 lowercase hex; byteLength > 0;
      for `repo-file`, on-disk bytes match digest and size.
- [ ] `"high"` requires first-party + `first-party-measured` + complete
      captureConditions (including `runCount >= 2`) + raw artifact integrity +
      pass verification whose `attestedArtifactDigests` include the capture
      `sha256`.
- [ ] Geometry rows for all 7 pilot parts; `phys3EvidenceSourceId` unique and
      equals the corresponding `physicalSpec.evidence.sourceId`.
- [ ] Geometry `(partId, geometryDataVersion)` unique; grade/version match
      phys3 on bind.
- [ ] Confidence ≤ source-class ceiling; grade ≤ grade ceiling.
- [ ] `fpsMin` < `fpsMax`; first-party ordering constraints hold.
- [ ] Freshness pure function: omitted/invalid `asOf` → unknown; current/stale
      otherwise.
- [ ] Non-pilot selection cannot bind pilot performance rows.
- [ ] Existing `perf1` / `phys3` / `compat2` public schemas remain unmodified
      and green.

---

## 11. Explicit non-goals

- Live network fetch of reviews or prices.
- Automatic scraping of manufacturer sites.
- General RAM SKU ↔ tier mapping beyond the pilot constant.
- Replacing stub rows globally across the 96-cell `perf1` matrix.
- Adding provenance fields onto `perf1` row types or fixture row shapes.
- Defining PresentMon parsers or CI hardware labs.
- New public `perf1` field renames or `phys3` mount/collision math changes.
- Cinebench pilot cells in M0 (out per review).

---

## 12. Zod alignment

Per ADR-003, these types will be expressed as Zod schemas at implementation
time under `src/contract/prov4.ts` and `src/contract/prov4.schema.ts`, matching
existing contract layout. This document is the type and rule authority until
then.

---

## 13. Related documents

| Document | Role |
|----------|------|
| [`phase-4.md`](./phase-4.md) | Scope, pilot inventory, open decisions |
| [`../implementation_plan.md`](../implementation_plan.md) | File-level build order |
| [`../../phase-1/specs/performance-data-contract.md`](../../phase-1/specs/performance-data-contract.md) | `perf1` + raw record sketch (unchanged public types) |
| [`../../phase-3/specs/physical-validation-data-contract.md`](../../phase-3/specs/physical-validation-data-contract.md) | `phys3` evidence refs / cooling rows |
| [`../../../data/BENCHMARK_RAW_RESULT_SCHEMA.md`](../../../data/BENCHMARK_RAW_RESULT_SCHEMA.md) | Future raw-schema placeholder |

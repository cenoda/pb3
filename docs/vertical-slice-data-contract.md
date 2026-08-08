# Vertical Slice Data Contract (Phase 0)

Status: **accepted for phase-0 fixtures** (implementation scaffold still later)  
Contract version: **`vs0`**  
Scope authority: [`phase-0.md`](./phase-0.md)

Fixture locations (checked in):

| Asset | Path |
|-------|------|
| Parts | `parts/{category}/{id}/part.json` + `model.glb` (7 parts) |
| Performance happy path | `benchmarks/vs0/performance-fixtures.json` (12 rows) |
| Unavailable examples (tests only) | `benchmarks/vs0/performance-unavailable.examples.json` |

This document defines the **minimum** data shapes that must connect for phase 0:

```text
PartDefinition  →  BuildState  →  PerformanceQuery  →  PerformanceEstimate
GPU id          →  model.glb
BuildState      ↔  URL
```

It is intentionally incomplete relative to the long-term product. Fields for price,
collision, anchors/sockets, thermal correction, and real bench ingestion are **out of
scope** here and will be added in later phases without pretending they already exist.

Implementers should be able to copy the TypeScript block and the JSON examples almost
as-is into the first scaffold.

---

## 1. Normative rules

1. **IDs are opaque strings.** Do not parse structure out of an id beyond equality checks.
2. **Unknown estimate → structured unavailable**, never invented FPS numbers.
3. **Units:** millimetres in any future geometry notes; phase 0 does not require dimensions on parts.
4. **Coordinates (when GLB exists):** millimetres, Y-up (project charter). Placeholder boxes are fine.
5. **Contract version string:** `vs0`. Bump only when a breaking field change ships.
6. **File encoding:** UTF-8 JSON, 2-space indent in repo fixtures.
7. **No code import cycles through data:** fixtures are static JSON under `parts/` and `benchmarks/` (or `fixtures/`).

---

## 2. TypeScript types (canonical)

Copy into something like `src/contract/vs0.ts` when scaffolding.

```typescript
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
  | "stub" // explicit vertical-slice placeholder
  | "low"
  | "medium"
  | "high"
  | "none"; // used with status === "unavailable"

/** Lifecycle of a performance estimate row. */
export type EstimateStatus = "ok" | "unavailable";

/**
 * On-disk / in-catalog definition of one part.
 * Loaded from parts/{category}/{id}/part.json
 */
export interface PartDefinition {
  /** Contract marker for loaders. */
  contractVersion: Vs0ContractVersion;

  /** Stable id; must match folder name and BuildState fields. */
  id: string;

  category: PartCategory;

  /** Human-readable name for UI. */
  displayName: string;

  /**
   * Relative path to the GLB from the repository root, POSIX separators.
   * Example: "parts/gpu/gpu.rtx4070/model.glb"
   */
  modelGlbPath: string;

  /**
   * Optional free-form notes for authors. Not shown unless UI chooses to.
   */
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

  /** Fixed in phase 0, still stored so the shape survives later expansion. */
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

  /** Echo of the query for traceability. */
  query: PerformanceQuery;

  status: EstimateStatus;

  /**
   * Inclusive expected average-FPS band for the stub/model.
   * Required when status === "ok"; must be omitted or null when unavailable.
   */
  fpsMin: number | null;
  fpsMax: number | null;

  confidence: EstimateConfidence;

  /**
   * Version of the performance fixture / model that produced this row.
   * Independent from VS0_CONTRACT_VERSION.
   */
  dataVersion: string;

  /**
   * Short explanation: data source class, not marketing copy.
   * Example: "phase-0 fixture table; not measured"
   */
  basis: string;

  /** Optional extra detail when status === "unavailable". */
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

/** File shape for benchmarks/vs0/performance-fixtures.json (or equivalent path). */
export interface PerformanceFixtureFile {
  contractVersion: Vs0ContractVersion;
  /** Fixture table version, e.g. "perf-fixture-2026-08-08". */
  dataVersion: string;
  rows: PerformanceFixtureRow[];
}

/** Catalog index optional helper — not required if the app globs part.json files. */
export interface PartCatalogFile {
  contractVersion: Vs0ContractVersion;
  parts: PartDefinition[];
}
```

---

## 3. Fixed fixture IDs

These IDs are part of the contract for phase 0. Implementation must ship definitions for all of them.

| Role | ID |
|------|-----|
| Case | `case.mid-tower-atx-01` |
| Motherboard | `mb.atx-b650-01` |
| CPU A | `cpu.zen4-7600` |
| CPU B | `cpu.zen4-7800x3d` |
| GPU A | `gpu.rtx4070` |
| GPU B | `gpu.rtx4080` |
| Cooler | `cooler.air-twin-tower-01` |
| Game | `game.cyberpunk-2077` |
| Preset | `preset.raster-ultra` |

### Default `BuildState`

```json
{
  "contractVersion": "vs0",
  "caseId": "case.mid-tower-atx-01",
  "motherboardId": "mb.atx-b650-01",
  "cpuId": "cpu.zen4-7600",
  "gpuId": "gpu.rtx4070",
  "coolerId": "cooler.air-twin-tower-01",
  "gameId": "game.cyberpunk-2077",
  "presetId": "preset.raster-ultra"
}
```

---

## 4. `PartDefinition` — on-disk layout and examples

### 4.1 Path rules

```text
parts/
  case/{id}/part.json
  case/{id}/model.glb
  motherboard/{id}/part.json
  motherboard/{id}/model.glb
  cpu/{id}/part.json
  cpu/{id}/model.glb
  gpu/{id}/part.json
  gpu/{id}/model.glb
  cooler/{id}/part.json
  cooler/{id}/model.glb
```

Folder name **must equal** `PartDefinition.id`.

`modelGlbPath` is always repo-root relative:

```text
parts/{category}/{id}/model.glb
```

Category folder names:

| `PartCategory` | folder |
|----------------|--------|
| `case` | `case` |
| `motherboard` | `motherboard` |
| `cpu` | `cpu` |
| `gpu` | `gpu` |
| `cooler` | `cooler` |

### 4.2 Example — GPU A

`parts/gpu/gpu.rtx4070/part.json`

```json
{
  "contractVersion": "vs0",
  "id": "gpu.rtx4070",
  "category": "gpu",
  "displayName": "GeForce RTX 4070 (fixture)",
  "modelGlbPath": "parts/gpu/gpu.rtx4070/model.glb",
  "notes": "Phase-0 placeholder mesh is acceptable."
}
```

### 4.3 Example — GPU B

`parts/gpu/gpu.rtx4080/part.json`

```json
{
  "contractVersion": "vs0",
  "id": "gpu.rtx4080",
  "category": "gpu",
  "displayName": "GeForce RTX 4080 (fixture)",
  "modelGlbPath": "parts/gpu/gpu.rtx4080/model.glb"
}
```

### 4.4 Example — CPU

`parts/cpu/cpu.zen4-7600/part.json`

```json
{
  "contractVersion": "vs0",
  "id": "cpu.zen4-7600",
  "category": "cpu",
  "displayName": "Ryzen 5 7600 (fixture)",
  "modelGlbPath": "parts/cpu/cpu.zen4-7600/model.glb"
}
```

### 4.5 Example — case / motherboard / cooler

`parts/case/case.mid-tower-atx-01/part.json`

```json
{
  "contractVersion": "vs0",
  "id": "case.mid-tower-atx-01",
  "category": "case",
  "displayName": "Mid-tower ATX Case 01 (fixture)",
  "modelGlbPath": "parts/case/case.mid-tower-atx-01/model.glb"
}
```

`parts/motherboard/mb.atx-b650-01/part.json`

```json
{
  "contractVersion": "vs0",
  "id": "mb.atx-b650-01",
  "category": "motherboard",
  "displayName": "ATX B650 Board 01 (fixture)",
  "modelGlbPath": "parts/motherboard/mb.atx-b650-01/model.glb"
}
```

`parts/cooler/cooler.air-twin-tower-01/part.json`

```json
{
  "contractVersion": "vs0",
  "id": "cooler.air-twin-tower-01",
  "category": "cooler",
  "displayName": "Twin-tower Air Cooler 01 (fixture)",
  "modelGlbPath": "parts/cooler/cooler.air-twin-tower-01/model.glb"
}
```

### 4.6 GLB reference behavior

| Event | Behavior |
|-------|----------|
| App loads | Resolve `PartDefinition` for each id in `BuildState` |
| `gpuId` changes | Load `PartDefinition.modelGlbPath` for the new GPU and replace the previous GPU scene node |
| Missing GLB file | Show a clear viewport error; do not silently keep the old GPU mesh |
| Missing `part.json` | Fail catalog load for that id; do not invent a definition |

Phase 0 does **not** require:

- `anchor:*` / `socket:*` / `collision:*` nodes inside the GLB
- Runtime auto-mount math

Simple distinct placeholder meshes (e.g. different colored boxes per GPU) are enough to prove swap.

---

## 5. `BuildState` — runtime and validation

### 5.1 Invariants

A `BuildState` is valid for phase 0 only if:

1. `contractVersion === "vs0"`
2. Every id exists in the loaded part catalog with the expected category:
   - `caseId` → category `case`
   - `motherboardId` → `motherboard`
   - `cpuId` → `cpu`
   - `gpuId` → `gpu`
   - `coolerId` → `cooler`
3. `gameId === "game.cyberpunk-2077"`
4. `presetId === "preset.raster-ultra"`
5. `cpuId` is one of the two fixture CPUs
6. `gpuId` is one of the two fixture GPUs

Invalid URL state → fall back to **default `BuildState`** (section 3) and optionally replace the URL.

### 5.2 Example after user picks the other CPU and GPU

```json
{
  "contractVersion": "vs0",
  "caseId": "case.mid-tower-atx-01",
  "motherboardId": "mb.atx-b650-01",
  "cpuId": "cpu.zen4-7800x3d",
  "gpuId": "gpu.rtx4080",
  "coolerId": "cooler.air-twin-tower-01",
  "gameId": "game.cyberpunk-2077",
  "presetId": "preset.raster-ultra"
}
```

---

## 6. URL state restoration

### 6.1 Rules (accepted)

1. **Authoritative** persistence is the URL query string on the build page.
2. Reload with the same URL must restore the same `BuildState`.
3. **Encoder (canonical write):** always write **every** `BuildState` field to the URL  
   (`v`, `cpu`, `gpu`, `case`, `mb`, `cooler`, `game`, `preset`).  
   The **canonical share link** is the full-field form.
4. **Decoder (lenient read):** missing query keys are filled from the **default fixture**  
   `BuildState` (section 3). Partial links are **compatibility inputs only**, not the
   normal encode output.
5. Present keys must still validate (known ids / categories). Invalid → fall back to defaults
   (and optionally rewrite the URL to the canonical full form).
6. Use stable query keys (below). Query form is required; do not rely on hash-only JSON blobs.
7. `contractVersion` is encoded as `v`.

### 6.2 Query keys

| Query key | BuildState field | Encoder | Decoder if missing |
|-----------|------------------|---------|-------------------|
| `v` | `contractVersion` | always written | default `vs0` |
| `cpu` | `cpuId` | always written | default fixture CPU |
| `gpu` | `gpuId` | always written | default fixture GPU |
| `case` | `caseId` | always written | default fixture case |
| `mb` | `motherboardId` | always written | default fixture motherboard |
| `cooler` | `coolerId` | always written | default fixture cooler |
| `game` | `gameId` | always written | default fixture game constant |
| `preset` | `presetId` | always written | default fixture preset constant |

### 6.3 Encode / decode (normative algorithm)

```typescript
const URL_KEYS = {
  v: "v",
  cpu: "cpu",
  gpu: "gpu",
  case: "case",
  mb: "mb",
  cooler: "cooler",
  game: "game",
  preset: "preset",
} as const;

/** Canonical encoder: always emit every BuildState field. */
export function buildStateToSearchParams(state: BuildState): URLSearchParams {
  const p = new URLSearchParams();
  p.set(URL_KEYS.v, state.contractVersion);
  p.set(URL_KEYS.cpu, state.cpuId);
  p.set(URL_KEYS.gpu, state.gpuId);
  p.set(URL_KEYS.case, state.caseId);
  p.set(URL_KEYS.mb, state.motherboardId);
  p.set(URL_KEYS.cooler, state.coolerId);
  p.set(URL_KEYS.game, state.gameId);
  p.set(URL_KEYS.preset, state.presetId);
  return p;
}

/**
 * Lenient decoder: missing keys use defaults.
 * Partial links (e.g. only cpu+gpu) are accepted as compatibility inputs.
 */
export function buildStateFromSearchParams(
  params: URLSearchParams,
  defaults: BuildState,
  isValid: (state: BuildState) => boolean,
): BuildState {
  const candidate: BuildState = {
    contractVersion: (params.get(URL_KEYS.v) as Vs0ContractVersion) ?? defaults.contractVersion,
    cpuId: params.get(URL_KEYS.cpu) ?? defaults.cpuId,
    gpuId: params.get(URL_KEYS.gpu) ?? defaults.gpuId,
    caseId: params.get(URL_KEYS.case) ?? defaults.caseId,
    motherboardId: params.get(URL_KEYS.mb) ?? defaults.motherboardId,
    coolerId: params.get(URL_KEYS.cooler) ?? defaults.coolerId,
    gameId: params.get(URL_KEYS.game) ?? defaults.gameId,
    presetId: params.get(URL_KEYS.preset) ?? defaults.presetId,
  };

  if (candidate.contractVersion !== "vs0") {
    return defaults;
  }
  return isValid(candidate) ? candidate : defaults;
}
```

### 6.4 Example URL

Empty / no params → decoder yields **default `BuildState`**:

```text
https://example.local/build
```

**Canonical share link** (encoder output — all fields):

```text
https://example.local/build?v=vs0&cpu=cpu.zen4-7800x3d&gpu=gpu.rtx4080&case=case.mid-tower-atx-01&mb=mb.atx-b650-01&cooler=cooler.air-twin-tower-01&game=game.cyberpunk-2077&preset=preset.raster-ultra
```

**Compatibility input only** (not produced by the encoder; decoder fills the rest from defaults):

```text
https://example.local/build?v=vs0&cpu=cpu.zen4-7800x3d&gpu=gpu.rtx4080
```

After a successful decode of a partial link, the app should prefer rewriting the address bar
to the **canonical full** form via `replaceState`.

### 6.5 Update policy

- When the user changes CPU or GPU, update the URL via `history.replaceState` (preferred) or `pushState`.
- Prefer **`replaceState`** for each selector change so the back button is not flooded.
- Always write the **full** query set on update (encoder rules).
- Do not require a backend route; static hosting with a single app shell is enough.

---

## 7. `PerformanceQuery` and `PerformanceEstimate`

### 7.1 Deriving queries from build state

For the performance panel, expand the three resolutions:

```typescript
export function queriesForBuild(state: BuildState): PerformanceQuery[] {
  return RESOLUTIONS.map((r) => ({
    contractVersion: VS0_CONTRACT_VERSION,
    cpuId: state.cpuId,
    gpuId: state.gpuId,
    gameId: state.gameId,
    presetId: state.presetId,
    resolutionId: r.id,
  }));
}
```

### 7.2 Lookup semantics

1. Load `PerformanceFixtureFile`.
2. For each `PerformanceQuery`, find a row where all of  
   `cpuId`, `gpuId`, `gameId`, `presetId`, `resolutionId` match.
3. If found → `status: "ok"` with that row’s range and metadata.
4. If not found → `status: "unavailable"`, `fpsMin/fpsMax: null`, `confidence: "none"`,  
   `basis` explaining missing fixture — **no invented FPS**.

### 7.3 Example — ok estimate

```json
{
  "contractVersion": "vs0",
  "query": {
    "contractVersion": "vs0",
    "cpuId": "cpu.zen4-7600",
    "gpuId": "gpu.rtx4070",
    "gameId": "game.cyberpunk-2077",
    "presetId": "preset.raster-ultra",
    "resolutionId": "1440p"
  },
  "status": "ok",
  "fpsMin": 58,
  "fpsMax": 72,
  "confidence": "stub",
  "dataVersion": "perf-fixture-2026-08-08",
  "basis": "phase-0 fixture table; not measured"
}
```

### 7.4 Example — unavailable estimate

```json
{
  "contractVersion": "vs0",
  "query": {
    "contractVersion": "vs0",
    "cpuId": "cpu.zen4-7600",
    "gpuId": "gpu.unknown",
    "gameId": "game.cyberpunk-2077",
    "presetId": "preset.raster-ultra",
    "resolutionId": "4k"
  },
  "status": "unavailable",
  "fpsMin": null,
  "fpsMax": null,
  "confidence": "none",
  "dataVersion": "perf-fixture-2026-08-08",
  "basis": "no fixture row for this combination",
  "reason": "missing_fixture_row"
}
```

### 7.5 Example performance fixture file

Path suggestion: `benchmarks/vs0/performance-fixtures.json`  
(Exact path is free as long as the app loads one file of this shape.)

Phase 0 must include **all 2 × 2 × 3 = 12** rows (2 CPUs × 2 GPUs × 3 resolutions) for the fixed game/preset so the happy path never hits unavailable.

```json
{
  "contractVersion": "vs0",
  "dataVersion": "perf-fixture-2026-08-08",
  "rows": [
    {
      "cpuId": "cpu.zen4-7600",
      "gpuId": "gpu.rtx4070",
      "gameId": "game.cyberpunk-2077",
      "presetId": "preset.raster-ultra",
      "resolutionId": "1080p",
      "fpsMin": 85,
      "fpsMax": 100,
      "confidence": "stub",
      "dataVersion": "perf-fixture-2026-08-08",
      "basis": "phase-0 fixture table; not measured"
    },
    {
      "cpuId": "cpu.zen4-7600",
      "gpuId": "gpu.rtx4070",
      "gameId": "game.cyberpunk-2077",
      "presetId": "preset.raster-ultra",
      "resolutionId": "1440p",
      "fpsMin": 58,
      "fpsMax": 72,
      "confidence": "stub",
      "dataVersion": "perf-fixture-2026-08-08",
      "basis": "phase-0 fixture table; not measured"
    },
    {
      "cpuId": "cpu.zen4-7600",
      "gpuId": "gpu.rtx4070",
      "gameId": "game.cyberpunk-2077",
      "presetId": "preset.raster-ultra",
      "resolutionId": "4k",
      "fpsMin": 32,
      "fpsMax": 40,
      "confidence": "stub",
      "dataVersion": "perf-fixture-2026-08-08",
      "basis": "phase-0 fixture table; not measured"
    },
    {
      "cpuId": "cpu.zen4-7600",
      "gpuId": "gpu.rtx4080",
      "gameId": "game.cyberpunk-2077",
      "presetId": "preset.raster-ultra",
      "resolutionId": "1080p",
      "fpsMin": 120,
      "fpsMax": 140,
      "confidence": "stub",
      "dataVersion": "perf-fixture-2026-08-08",
      "basis": "phase-0 fixture table; not measured"
    },
    {
      "cpuId": "cpu.zen4-7600",
      "gpuId": "gpu.rtx4080",
      "gameId": "game.cyberpunk-2077",
      "presetId": "preset.raster-ultra",
      "resolutionId": "1440p",
      "fpsMin": 95,
      "fpsMax": 115,
      "confidence": "stub",
      "dataVersion": "perf-fixture-2026-08-08",
      "basis": "phase-0 fixture table; not measured"
    },
    {
      "cpuId": "cpu.zen4-7600",
      "gpuId": "gpu.rtx4080",
      "gameId": "game.cyberpunk-2077",
      "presetId": "preset.raster-ultra",
      "resolutionId": "4k",
      "fpsMin": 55,
      "fpsMax": 68,
      "confidence": "stub",
      "dataVersion": "perf-fixture-2026-08-08",
      "basis": "phase-0 fixture table; not measured"
    },
    {
      "cpuId": "cpu.zen4-7800x3d",
      "gpuId": "gpu.rtx4070",
      "gameId": "game.cyberpunk-2077",
      "presetId": "preset.raster-ultra",
      "resolutionId": "1080p",
      "fpsMin": 95,
      "fpsMax": 112,
      "confidence": "stub",
      "dataVersion": "perf-fixture-2026-08-08",
      "basis": "phase-0 fixture table; not measured"
    },
    {
      "cpuId": "cpu.zen4-7800x3d",
      "gpuId": "gpu.rtx4070",
      "gameId": "game.cyberpunk-2077",
      "presetId": "preset.raster-ultra",
      "resolutionId": "1440p",
      "fpsMin": 62,
      "fpsMax": 76,
      "confidence": "stub",
      "dataVersion": "perf-fixture-2026-08-08",
      "basis": "phase-0 fixture table; not measured"
    },
    {
      "cpuId": "cpu.zen4-7800x3d",
      "gpuId": "gpu.rtx4070",
      "gameId": "game.cyberpunk-2077",
      "presetId": "preset.raster-ultra",
      "resolutionId": "4k",
      "fpsMin": 33,
      "fpsMax": 41,
      "confidence": "stub",
      "dataVersion": "perf-fixture-2026-08-08",
      "basis": "phase-0 fixture table; not measured"
    },
    {
      "cpuId": "cpu.zen4-7800x3d",
      "gpuId": "gpu.rtx4080",
      "gameId": "game.cyberpunk-2077",
      "presetId": "preset.raster-ultra",
      "resolutionId": "1080p",
      "fpsMin": 140,
      "fpsMax": 165,
      "confidence": "stub",
      "dataVersion": "perf-fixture-2026-08-08",
      "basis": "phase-0 fixture table; not measured"
    },
    {
      "cpuId": "cpu.zen4-7800x3d",
      "gpuId": "gpu.rtx4080",
      "gameId": "game.cyberpunk-2077",
      "presetId": "preset.raster-ultra",
      "resolutionId": "1440p",
      "fpsMin": 110,
      "fpsMax": 130,
      "confidence": "stub",
      "dataVersion": "perf-fixture-2026-08-08",
      "basis": "phase-0 fixture table; not measured"
    },
    {
      "cpuId": "cpu.zen4-7800x3d",
      "gpuId": "gpu.rtx4080",
      "gameId": "game.cyberpunk-2077",
      "presetId": "preset.raster-ultra",
      "resolutionId": "4k",
      "fpsMin": 62,
      "fpsMax": 78,
      "confidence": "stub",
      "dataVersion": "perf-fixture-2026-08-08",
      "basis": "phase-0 fixture table; not measured"
    }
  ]
}
```

Stub numbers are **ordinal only** (stronger GPU / better CPU / lower resolution → higher band). They must not be presented as lab measurements. UI should surface `confidence: "stub"` and `basis`.

### 7.6 Estimator function shape

```typescript
export function estimatePerformance(
  query: PerformanceQuery,
  fixtures: PerformanceFixtureFile,
): PerformanceEstimate {
  const row = fixtures.rows.find(
    (r) =>
      r.cpuId === query.cpuId &&
      r.gpuId === query.gpuId &&
      r.gameId === query.gameId &&
      r.presetId === query.presetId &&
      r.resolutionId === query.resolutionId,
  );

  if (!row) {
    return {
      contractVersion: VS0_CONTRACT_VERSION,
      query,
      status: "unavailable",
      fpsMin: null,
      fpsMax: null,
      confidence: "none",
      dataVersion: fixtures.dataVersion,
      basis: "no fixture row for this combination",
      reason: "missing_fixture_row",
    };
  }

  return {
    contractVersion: VS0_CONTRACT_VERSION,
    query,
    status: "ok",
    fpsMin: row.fpsMin,
    fpsMax: row.fpsMax,
    confidence: row.confidence,
    dataVersion: row.dataVersion,
    basis: row.basis,
  };
}
```

---

## 8. Game and preset (phase-0 constants)

Not full catalog entities yet. Treat as constants referenced by id:

```typescript
export const PHASE0_GAME = {
  id: "game.cyberpunk-2077",
  displayName: "Cyberpunk 2077 (fixture label)",
} as const;

export const PHASE0_PRESET = {
  id: "preset.raster-ultra",
  displayName: "Ultra (raster, no upscaling) — fixture",
} as const;
```

No separate `game.json` is required in phase 0. If you add files later, keep these ids.

---

## 9. End-to-end data flow (normative)

```text
[part.json × N] ──load──► PartCatalog
                              │
URL ?cpu&gpu… ──decode──► BuildState ──validate against catalog──► ok / defaults
                              │
                              ├─► resolve GPU PartDefinition.modelGlbPath ──► load GLB ──► viewport swap
                              │
                              └─► queriesForBuild(state) ──► estimatePerformance × 3 ──► UI ranges
```

Acceptance mapping:

| Exit criterion | Contract proof |
|----------------|----------------|
| Select CPU/GPU | Mutate `BuildState.cpuId` / `gpuId` |
| State changes | New `BuildState` object / store snapshot |
| 3D GPU swaps | New `modelGlbPath` loaded for `gpuId` |
| Performance ranges update | Three `PerformanceEstimate` with `status: "ok"` |
| Reload restores config | `buildStateFromSearchParams` yields same selectable ids |

---

## 10. Explicitly out of this contract

Do **not** add these fields “for later” in phase-0 fixture files:

- Price, availability, shop URLs
- Power draw, TDP, PSU requirements
- Socket / chipset compatibility graphs
- Dimensions, weight, clearance
- Collision meshes, anchors, sockets, cable paths
- Driver/game patch versions tied to real PresentMon runs
- Thermal / power-limit correction inputs
- User accounts, saved builds on a server

When phase 1+ needs them, extend with a new contract version (`vs1`, or a separate schema id) rather than silently widening `vs0` loaders without a version bump.

---

## 11. Validation checklist

Fixture integrity (data-only, 2026-08-08):

- [x] All seven part `part.json` files exist with matching folders
- [x] All seven `model.glb` paths resolve (placeholders; GPUs visually distinct)
- [x] Performance fixture has 12 rows covering every CPU×GPU×resolution
- [x] Default `BuildState` ids resolve to fixtures
- [x] Unavailable examples live in a **separate** file and are absent from the 12-row table
- [ ] URL encode(full) / decode(partial→defaults) — requires app runtime
- [ ] Unknown GPU id path in running estimator — requires app runtime
- [ ] Types in section 2 wired via schema validator (e.g. Zod) — requires scaffold

---

## 12. Related documents

| Document | Role |
|----------|------|
| [phase-0.md](./phase-0.md) | Scope, forbidden work, exit criteria |
| [PROJECT_CHARTER.md](../PROJECT_CHARTER.md) | Long-term principles |
| [docs/data/BENCHMARK_RAW_RESULT_SCHEMA.md](./data/BENCHMARK_RAW_RESULT_SCHEMA.md) | Future real bench schema (not required for vs0 stubs) |
| [STATUS.md](../STATUS.md) | Decision log |

# Phase 1 — Implementation Plan

Status: **complete (2026-08-08)** — all steps implemented; closeout verified
Scope authority: [`specs/phase-1.md`](./specs/phase-1.md)
Data authority: [`specs/performance-data-contract.md`](./specs/performance-data-contract.md)
Stack authority: [`ADR-001`](../../decisions/ADR-001-runtime-static-spa.md), [`ADR-002`](../../decisions/ADR-002-stack-core-ts-react-r3f-vite.md), [`ADR-003`](../../decisions/ADR-003-stage3-tooling-and-fixtures.md), [`ADR-004`](../../decisions/ADR-004-license-code-apache-2.0.md)
Predecessor: Phase 0 app under `src/` (Steps 1–8 complete) — [`../phase-0/implementation_plan.md`](../phase-0/implementation_plan.md)
Implementation commit: `38b76d1` (`feat(perf): wire perf1 baseline and correction engine`)

This document turned the flat checklist in [`TODO.md`](./TODO.md) into an ordered,
file-level build plan. **Implementation completed 2026-08-08** per the steps below.
All perf1 fixture values remain `confidence: "stub"` wiring data — not real
benchmark measurements. Thermal simulation and benchmark ingestion are out of scope.

Convention: **every phase gets its own `implementation_plan.md` under
`docs/phases/phase-N/`, written and reviewed before any code for that phase is
written.** Phase 0 established the pattern; this file is the Phase 1 instance.

---

## 1. Preconditions (all satisfied)

| Gate | State |
|------|-------|
| Runtime shape | Static SPA — [`ADR-001`](../../decisions/ADR-001-runtime-static-spa.md) |
| Stack core | TypeScript + React + R3F + Vite — [`ADR-002`](../../decisions/ADR-002-stack-core-ts-react-r3f-vite.md) |
| Tooling | pnpm + Zod + Zustand + Vitest + Playwright; fixture HTTP `/parts` + `/benchmarks` — [`ADR-003`](../../decisions/ADR-003-stage3-tooling-and-fixtures.md) |
| License | Code + data = Apache-2.0 — [`ADR-004`](../../decisions/ADR-004-license-code-apache-2.0.md) |
| Phase 0 app | Implemented under `src/`; exit scenario automated (`e2e/exit-scenario.spec.ts`) |
| Scope lock | Owner-accepted — [`specs/phase-1.md`](./specs/phase-1.md) |
| Data contract | Owner-accepted — `perf1` types in [`performance-data-contract.md`](./specs/performance-data-contract.md) |
| Fixtures on disk | `benchmarks/perf1/` — 96-row baseline, 8-row Cinebench, correction + unavailable examples — owner-accepted |
| Owner “start implementation” | **Given and completed** — `38b76d1` |

If any of these are reopened before implementation starts, this plan must be revised first.

---

## 2. Target directory layout (proposed, at implementation start)

Phase 1 **extends** the existing Phase 0 tree. It does not re-scaffold the app, move
fixtures, or reopen 3D scope.

```text
pb3/
  src/
    contract/
      vs0.ts                        existing — BuildState, URL, EstimateConfidence (reused)
      vs0.schema.ts                 existing — leave intact for URL / part catalog
      perf1.ts                      NEW — types + constants from performance-data-contract.md
      perf1.schema.ts               NEW — Zod schemas for perf1 types + fixture file shapes
    catalog/
      loadPartCatalog.ts            existing — unchanged
      loadPerformanceFixtures.ts    existing vs0 path — keep for regression until UI migrates
      loadPerf1Fixtures.ts          NEW — fetch + parse benchmarks/perf1/*.json (baseline, cinebench;
                                      correction/unavailable examples used in tests, optional load)
    perf/
      queriesForBuild.ts            existing vs0 helper — keep until panel migrates; may wrap or retire
      estimatePerformance.ts        existing vs0 lookup — keep until panel migrates
      baselineQuery.ts              NEW — BuildState + panel dims → BaselineQuery (×3 resolutions)
      estimateBaseline.ts           NEW — BaselineQuery → BaselineEstimateResult (table lookup)
      applyCorrection.ts            NEW — PerformanceEstimate + CorrectionInput → CorrectionResult
      estimateWorkload.ts           NEW — WorkloadQuery → WorkloadEstimateResult (Cinebench table)
    state/
      buildStore.ts                 existing — vs0 BuildState URL keys unchanged
      urlSync.ts                    existing — do not break full encode / partial decode
      perfPanelState.ts             NEW (or store slice) — upscale / framegen / ram / correction
                                      / cinebench selectors; defaults documented below
    ui/
      PerformancePanel.tsx          EXTEND — perf1 ranges, limitingFactor, correction UX, Cinebench
      PartSelector.tsx              existing — CPU/GPU only; unchanged contract
      BuildSummary.tsx              existing
      CorrectionControls.tsx        NEW (optional split) — optional CorrectionInput fields
      WorkloadPanel.tsx             NEW (optional split) — Cinebench score rows
    test/
      perf1.schema.test.ts          NEW
      estimateBaseline.test.ts      NEW — happy-path 96-row coverage sample + full-key lookup
      applyCorrection.test.ts       NEW — ok / withheld / unsupported input
      estimateWorkload.test.ts      NEW — 8-row Cinebench + unknown version unavailable
      loadPerf1Fixtures.test.ts     NEW (optional if pure loaders need isolation)
    App.tsx                         boot: also load perf1 fixtures; fail loud if missing
  benchmarks/perf1/                 existing SSOT (do not move under src/ or public/)
    performance-fixtures.json       96 baseline rows
    cinebench-fixtures.json         8 workload rows
    correction-examples.json        test-only apply / withhold examples
    unavailable-examples.json       test-only unavailable examples
  e2e/
    exit-scenario.spec.ts           Phase 0 regression — must stay green (see Step 7)
```

Notes:

- **Contract file convention matches Phase 0:** types in `src/contract/perf1.ts`, Zod in
  `src/contract/perf1.schema.ts` (see contract §8 and existing `vs0.ts` / `vs0.schema.ts`).
- **`EstimateConfidence` is not redefined.** Import or re-export the vs0 enum so the
  confidence ladder stays a single definition.
- **Fixture SSOT stays at repo root** `benchmarks/perf1/` — HTTP `/benchmarks/perf1/...`
  already works via ADR-003 Vite serve + dist copy; no new plugin required unless paths
  fail in practice (then fix wiring, do not copy fixtures under `src/`).
- **No new 3D files, GLB work, or viewport features** to exit Phase 1.
- **URL / `BuildState`:** Phase 0 keys remain `vs0` and continue to encode case/mb/cpu/gpu/
  cooler/game/preset. Case/mb/cooler are **not** baseline lookup keys (contract §3.2).
  New baseline dimensions (upscale, framegen, ram) and correction inputs live in
  **panel state** for Phase 1 unless a later decision promotes them into the URL — do not
  silently break Phase 0 share links.
- **Default panel dimensions** (must be explicit so default CPU/GPU ranges stay
  deterministic and Phase 0 E2E can remain green):

  | Dimension | Default |
  |-----------|---------|
  | `upscaleId` | `upscale.off` |
  | `frameGenId` | `framegen.off` |
  | `ramTierId` | `ram.32gb-ddr5` |
  | `powerProfileId` | `power.default` |
  | Correction fields | all omitted (no correction applied) |

  With these defaults, `cpu.zen4-7600` + `gpu.rtx4070` @ `1440p` matches the existing
  Phase 0 E2E stub text `52–64 FPS` (same ordinal numbers as vs0 for that cell). Prefer
  keeping those defaults so `e2e/exit-scenario.spec.ts` range assertions need no change
  when the panel switches to perf1. If defaults change, update E2E expected strings in
  the same PR — structure of the exit scenario must still pass.

- Small file splits (e.g. merging `CorrectionControls` into `PerformancePanel`) are fine
  without a plan revision. Structural deviations (backend, new catalog inventory, thermal
  sim, applying correction to Cinebench) need a plan update first.

---

## 3. Build order

Each step names its exit condition. Do not start step *N+1*’s app-behavior work before
step *N* compiles/tests clean — pure contract + loader steps (1–2) can land together.

### Step 1 — Contract types + Zod schemas (`perf1`)

- `src/contract/perf1.ts`: types and fixed-ID unions from
  [`performance-data-contract.md`](./specs/performance-data-contract.md) §§3–6:
  - Vocabulary: `CpuId`, `GpuId`, `GameId`, `PresetId`, `ResolutionId`, `UpscaleId`,
    `FrameGenId`, `RamTierId`, `PowerProfileId`, correction IDs, `WorkloadId`,
    `WorkloadMetric`
  - `BaselineQuery`, `LimitingFactor` / `LimitingFactorCategory`, `PerformanceEstimate`
  - `UnavailableResult`, `BaselineEstimateResult`
  - `CorrectionInput` (including reserved Phase 3 optional fields: `coolingHeadroom`,
    `intakeRestrictionSeverity`, `evidenceSourceId` — typed, not applied)
  - `CorrectedEstimate`, `WithheldCorrection`, `CorrectionResult`
  - `WorkloadEstimate`, `WorkloadEstimateResult`
  - Fixture file shapes for the four JSON files under `benchmarks/perf1/`
  - `export const PERF1_CONTRACT_VERSION = "perf1"` and `dataVersion` convention
  - Reuse `EstimateConfidence` from `vs0` (do not fork the enum)
- `src/contract/perf1.schema.ts`: Zod mirrors for every public type and fixture file
  schema. Strict literals for fixed IDs where the contract uses unions; opaque string
  compare remains the runtime lookup discipline (IDs are not parsed structurally).
- `src/test/perf1.schema.test.ts`:
  - Accepts checked-in `performance-fixtures.json` (96 rows), `cinebench-fixtures.json`
    (8 rows), and both example files
  - Rejects wrong `contractVersion`, missing required fields, unknown
    `limitingFactor.category`, inverted/missing FPS when a row claims a supported shape
- **Out of scope for Step 1:** implementing `RawBenchmarkRecord` ingestion pipeline or
  PresentMon mapping. Types may be declared if useful for docs alignment; no runner.
- **Exit:** `pnpm test` green for `perf1.schema.test.ts`; schemas parse every
  owner-accepted file under `benchmarks/perf1/`.

### Step 2 — Fixture loading (`benchmarks/perf1/`)

- `src/catalog/loadPerf1Fixtures.ts` (name may vary; keep next to existing catalog loaders):
  - `loadBaselineFixtures()` → `/benchmarks/perf1/performance-fixtures.json`
  - `loadCinebenchFixtures()` → `/benchmarks/perf1/cinebench-fixtures.json`
  - Parse with Zod; **fail loud** on HTTP or schema failure (same discipline as
    `loadPerformanceFixtures.ts` / contract §4.6 spirit)
  - Correction and unavailable example files are **test fixtures**: load in unit tests
    from disk (or import JSON) rather than requiring them at app boot
- `App.tsx` boot sequence (extend Phase 0 order; do not reorder existing catalog/URL
  steps incorrectly):
  1. Load part catalog + **perf1** baseline (+ cinebench if UI needs it at first paint)
  2. Decode URL → `BuildState` (vs0 path unchanged)
  3. Init store + canonical `replaceState`
  4. Only then subscribe store → URL
  5. Initialize perf panel state to documented defaults (§2 table)
- Keep vs0 `loadPerformanceFixtures` available until Step 6 switches the panel; remove
  dead vs0 perf load only after the panel no longer references it and unit tests are
  migrated — smallest correct cleanup, not a big-bang delete in Step 2.
- **Exit:** loaders work against `pnpm dev`; unit tests green; missing/malformed fixture
  surfaces a visible boot error (no silent empty table).

### Step 3 — Baseline lookup model

- `src/perf/baselineQuery.ts`:
  - From `BuildState` (cpu/gpu/game/preset) + panel dims (resolution loop, upscale,
    framegen, ram, power) produce three `BaselineQuery` values for `1080p` / `1440p` /
    `4k` (mirror the role of `queriesForBuild` for vs0)
  - Case / motherboard / cooler never appear on `BaselineQuery`
- `src/perf/estimateBaseline.ts`:
  - Exact key equality lookup on the 96-row table (all nine `BaselineQuery` fields)
  - Hit → `PerformanceEstimate` with `fpsMin` / `fpsMax` / `confidence` / `dataVersion` /
    `basis` / `limitingFactor` from the row (always a **range**, never a point invent)
  - Miss → `UnavailableResult` `{ status: "unavailable", reason }` — **no FPS numbers**
  - Do not invent rows, interpolate, or clamp unknown IDs to nearest neighbor
- `src/test/estimateBaseline.test.ts`:
  - Representative supported combos return exact fixture ranges and `limitingFactor`
  - At least one full-matrix integrity check (e.g. 96 unique keys, every row lookup
    returns `PerformanceEstimate` with `confidence: "stub"`)
  - Cases from `unavailable-examples.json` (unknown gpu, unknown upscale) return
    structured unavailable with **no** invented `fpsMin`/`fpsMax`
  - Switching `upscaleId` or `frameGenId` alone changes the looked-up range when the
    fixture matrix differs (completion scenario steps 3–4 at pure-function level)
- **Exit:** `pnpm test` green for baseline tests; no UI required yet.

### Step 4 — Environment correction layer (including withhold)

- `src/perf/applyCorrection.ts`:
  - Inputs: successful baseline `PerformanceEstimate` (or the baseline query + estimate)
    + partial `CorrectionInput`
  - **Allowed Phase 1 dimensions only** (`cpuPowerId`, `gpuPowerId`, `coolingBucketId`,
    `loadProfileId`). Reserved Phase 3 fields (`coolingHeadroom`,
    `intakeRestrictionSeverity`, `evidenceSourceId`) are accepted on the type but
    **not applied** by the Phase 1 model (forward-compatible no-ops with optional
    logging/doc comment — never invent a derate from them)
  - Supported correction with fixture evidence → `CorrectedEstimate` (`status: "ok"`)
    with changed range, retained explainability fields, and a `reason` naming which
    correction applied
  - `load.sustained` **without** applicable correction evidence →
    `WithheldCorrection` `{ status: "withheld", reason }` stating
    sustained-performance correction was **not** computed; baseline (or any valid
    non-sustained partial correction) remains available to the UI — **never** a silent
    skip and **never** a guessed sustained derate
  - Cooling bucket is never inferred; only user-selected / declared input
  - Inputs outside §2.3 vocabulary → clear “not supported in phase 1” outcome (reject or
    ignore with explicit reason), not silent clamp to a default guess
  - Implementation shape: table-driven from `correction-examples.json` patterns and/or a
    small explicit rule set documented in code comments; stub magnitudes stay
    `confidence: "stub"` per epistemic rule (contract §4.5 / phase-1.md §2.3)
- `src/test/applyCorrection.test.ts`:
  - Drive assertions from `benchmarks/perf1/correction-examples.json` (all four examples:
    cpu-power reduced ok, cooling+sustained ok, sustained withheld, gpu-power reduced ok)
  - Empty `CorrectionInput` → no correction result required / identity path documented
  - Unsupported id → not-supported outcome
  - Withheld path never returns a fabricated lower FPS range
- **Exit:** unit tests green; withhold and ok paths both covered.

### Step 5 — Cinebench workload model

- `src/perf/estimateWorkload.ts` (and a tiny query helper if needed):
  - Input: `cpuId` + `workloadId` + `metric` (no gpu/resolution/preset/upscale/framegen)
  - Lookup against `cinebench-fixtures.json` (8 rows)
  - Hit → `WorkloadEstimate` with `score`, `confidence`, `dataVersion`, `basis`
  - Miss / unconfirmed version → `UnavailableResult` (same shape as baseline unavailable)
  - **Do not** apply `CorrectionInput` or environment correction to Cinebench scores
    (phase-1.md §3.5 / §5)
- `src/test/estimateWorkload.test.ts`:
  - All 8 supported rows return exact stub scores
  - Unknown/unconfirmed workload id from `unavailable-examples.json` → unavailable,
    no invented score
- **Exit:** unit tests green; workload path fully independent of FPS baseline module.

### Step 6 — Wire into existing Phase 0 performance panel (no new 3D)

- Extend `PerformancePanel` (and optional small child components) to:
  1. Build three `BaselineQuery`s from `BuildState` + panel defaults/controls
  2. Call `estimateBaseline` for each resolution; render range + confidence +
     dataVersion + basis + **limitingFactor** (category + explanation)
  3. Branch on unavailable: show reason text only — **no FPS numbers** (same UX rule as
     Phase 0 `status !== "ok"`)
  4. Expose controls (or documented test-only controls) for `upscaleId` and
     `frameGenId` (and optionally `ramTierId`) so completion scenario steps 3–4 are
     exercisable without a browser console hack
  5. Expose optional correction controls (power tiers, cooling bucket, load profile);
     when applied, show corrected range + `reason`, or show withheld message alongside
     baseline when status is `withheld`
  6. Show Cinebench workload results for current `cpuId` (version + metric selectors or
     a fixed small matrix of the 8 cells); unknown path covered by unit tests if UI only
     offers confirmed IDs
- **Preserve Phase 0 selectors and testids** used by E2E where possible:
  `performance-panel`, `perf-row-{res}`, `perf-range-{res}`, `cpu-select`, `gpu-select`,
  `build-viewport`, etc. Add new testids for correction/withhold/Cinebench without
  removing the old ones.
- **Do not** change viewport/GLB behavior, expand part inventory, or require new meshes.
- `App.tsx`: pass perf1 fixture data into the panel; CPU/GPU changes still update URL via
  existing store.
- **Exit:** manual or explore walkthrough of phase-1.md §4 steps 1–9 against `pnpm dev`;
  unit tests still green.

### Step 7 — Test coverage + Phase 0 E2E must stay green

| Layer | File / command | Requirement |
|-------|----------------|-------------|
| Schema | `perf1.schema.test.ts` | All perf1 fixture files parse; rejects malformed |
| Baseline lookup | `estimateBaseline.test.ts` | Supported range + unavailable; no invented FPS |
| Correction | `applyCorrection.test.ts` | Apply with reason; withhold without guessed derate |
| Workload | `estimateWorkload.test.ts` | Scored Cinebench; unknown version unavailable |
| Phase 0 regression | `pnpm test:e2e` / `e2e/exit-scenario.spec.ts` | Still passes headless |
| Full gate | `pnpm test:all` | Unit + E2E green before claiming exit |

Phase 0 E2E notes:

- Scenario structure (clean load, CPU change, GPU swap, reload, post-reload selection)
  remains the regression gate.
- Prefer panel defaults in §2 so existing 1440p range strings stay valid under perf1.
- If any assertion must change (e.g. basis text, extra panel chrome), keep behavioral
  coverage equivalent — do not delete the exit scenario.
- Optional: add a small Playwright case for correction withhold or upscale toggle **only
  if** UI exposes those controls and the owner wants E2E expansion; not required to exit
  if unit tests fully cover engine rules (phase-1.md §3.4).

- **Exit:** `pnpm test:all` green on a clean checkout after implementation.

### Step 8 — Exit criteria checklist (phase-1.md §4 / §6)

Walk the completion scenario on a clean checkout with stub fixtures:

1. Supported CPU/GPU build shows explained ranges for `game.cyberpunk-2077` /
   `preset.raster-ultra` at `1080p`, `1440p`, `4k` (basis, confidence, dataVersion,
   limiting factor).
2. Upscale and frame-gen switches update ranges with visible explanation of what changed.
3. Unsupported combo → structured unavailable, never invented FPS.
4. Allowed correction changes range with visible reason.
5. Sustained without evidence → explicit withheld message; no silent derate.
6. Reload preserves build URL state; performance consistent with same inputs + panel dims.
7. Supported Cinebench CPU + version + metric → scored `WorkloadEstimate`; unknown
   version → unavailable.
8. Phase 0 exit scenario still passes (`pnpm test:all`).

Then (owner / hand-off):

1. Record phase-1 completion in [`STATUS.md`](../../../STATUS.md) and [`TODO.md`](./TODO.md).
2. **Lift the Phase 0 3D freeze** per phase-1.md §6 (phase 1 itself still does not
   implement Phase 3 3D work).
3. Do not expand part/game inventory until a later phase reopens catalog scope.

---

## 4. Integration rules (vs0 continuity)

- **vs0 remains** the BuildState / URL / part-catalog contract. Phase 1 does not bump
  URL `v=` to `perf1`.
- **perf1** governs performance-engine estimates, fixture rows, and workload scores
  (`dataVersion: "perf1"` on every stub row).
- Performance panel becomes the consumer of perf1; URL sync and GPU viewport stay on
  Phase 0 paths.
- When both vs0 and perf1 loaders briefly coexist during migration, only one drives the
  visible panel — avoid dual competing range sources in UI.

---

## 5. Testing strategy

Per ADR-003: Vitest for pure logic first; Playwright for Phase 0 regression (and optional
Phase 1 UI if expanded).

| Layer | Covered by |
|-------|------------|
| perf1 schema + fixture parse | `perf1.schema.test.ts` |
| Baseline lookup / unavailable | `estimateBaseline.test.ts` (+ unavailable examples JSON) |
| Correction apply / withhold | `applyCorrection.test.ts` (+ correction-examples.json) |
| Cinebench workload | `estimateWorkload.test.ts` |
| Phase 0 exit scenario | `e2e/exit-scenario.spec.ts` (must stay green) |
| Commands | `pnpm test`, `pnpm test:e2e`, `pnpm test:all`, `pnpm build` when touching loaders/Vite |

Fixture example files under `benchmarks/perf1/*-examples.json` are **test oracles**, not
merged into happy-path tables at runtime.

---

## 6. Explicit non-goals for this plan

Same as [`specs/phase-1.md`](./specs/phase-1.md) §5 — do not let implementation drift into:

| Forbidden | Rationale |
|-----------|-----------|
| Real thermal / airflow / fluid simulation | Phase 3 |
| Inferring cooling bucket without user or evidence | Charter §4 |
| Full logical compatibility engine | Phase 2 |
| 3D collision, clearance, anchors, mounting, cooling mesh | Phase 3; Phase 0 freeze |
| Extra parts/games/presets beyond phase-1.md §2 | Scope lock |
| RGB, cable routing, assembly animation | Frozen non-goals |
| Live price APIs, cart, affiliate, auth, backend, deploy requirement | Static SPA |
| PresentMon / in-app bench runner | Ingestion later |
| Presenting `*.reduced` power offsets as measured | Epistemic rule |
| Applying environment correction to Cinebench | Deferred |
| Inventing Cinebench version IDs or FPS when data is missing | Charter §2 / §5 |

If a step seems to require one of these, stop and flag it rather than adding it quietly.

---

## 7. Checklist (mirrors `TODO.md` Implementation section)

- [x] Step 1 — `perf1` contract types + Zod schemas + schema tests
- [x] Step 2 — load baseline + Cinebench fixtures from `benchmarks/perf1/`; boot fail-loud
- [x] Step 3 — baseline lookup model (`BaselineQuery` → range / unavailable)
- [x] Step 4 — correction layer (apply with reason + withhold without guessed derate)
- [x] Step 5 — Cinebench workload model (score / unavailable; no correction)
- [x] Step 6 — wire engine into existing performance panel (controls + explanations; no 3D)
- [x] Step 7 — unit coverage complete; `pnpm test:all` (Phase 0 E2E green)
- [x] Step 8 — phase-1.md §4 completion scenario + §6 exit / freeze lift (recorded in STATUS.md)

---

## 8. Exit-criteria checklist (mirrors phase-1.md §4)

Automated and/or manual verification — **all passed at closeout (2026-08-08)**:

- [x] Supported baseline combo returns explained range for all three resolutions.
- [x] Unsupported combo returns structured unavailable.
- [x] Allowed correction input changes range with visible reason.
- [x] Withheld correction never triggers a guessed sustained derate.
- [x] Supported Cinebench CPU + version + metric returns scored `WorkloadEstimate`.
- [x] Unknown/unconfirmed Cinebench version returns structured unavailable.
- [x] Phase 0 exit scenario still passes (`pnpm test:all`).

---

## 9. Related documents

| Document | Role |
|----------|------|
| [`specs/phase-1.md`](./specs/phase-1.md) | Scope, inventory, forbidden work, exit criteria |
| [`specs/performance-data-contract.md`](./specs/performance-data-contract.md) | `perf1` types, correction/withhold, workload, Zod path convention |
| [`TODO.md`](./TODO.md) | Flat phase-1 checklist (this plan is its ordered expansion) |
| [`../phase-0/implementation_plan.md`](../phase-0/implementation_plan.md) | Structural precedent |
| [`../phase-0/specs/vertical-slice-data-contract.md`](../phase-0/specs/vertical-slice-data-contract.md) | vs0 BuildState / URL / confidence enum |
| [`benchmarks/perf1/README.md`](../../../benchmarks/perf1/README.md) | Fixture file index |
| [`AGENTS.md`](../../../AGENTS.md) | Cross-agent gates on when implementation may start |
| [`STATUS.md`](../../../STATUS.md) | Project-wide decided vs open |

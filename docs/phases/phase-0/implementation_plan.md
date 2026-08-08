# Phase 0 — Implementation Plan

Status: **implementation complete (Step 8 verified 2026-08-08)** — tag `vertical-slice-v0` remains owner-only
Scope authority: [`specs/phase-0.md`](./specs/phase-0.md)
Data authority: [`specs/vertical-slice-data-contract.md`](./specs/vertical-slice-data-contract.md)
Stack authority: [`ADR-001`](../../decisions/ADR-001-runtime-static-spa.md), [`ADR-002`](../../decisions/ADR-002-stack-core-ts-react-r3f-vite.md), [`ADR-003`](../../decisions/ADR-003-stage3-tooling-and-fixtures.md), [`ADR-004`](../../decisions/ADR-004-license-code-apache-2.0.md)

This document turns the flat checklist in [`TODO.md`](./TODO.md) into an ordered,
file-level build plan. It does **not** authorize scaffolding, `pnpm install`, or any
source file under an app root. Per [`AGENTS.md`](../../../AGENTS.md) and
[`CLAUDE.md`](../../../CLAUDE.md), that requires the owner's explicit "start
implementation" (or equivalent) after this plan is reviewed.

Convention going forward: **every phase gets its own `implementation_plan.md` under
`docs/phases/phase-N/`, written and reviewed before any code for that phase is
written.** This file is the first instance of that convention.

---

## 1. Preconditions (all satisfied)

| Gate | State |
|------|-------|
| Runtime shape | Static SPA — [`ADR-001`](../../decisions/ADR-001-runtime-static-spa.md) |
| Stack core | TypeScript + React + R3F + Vite — [`ADR-002`](../../decisions/ADR-002-stack-core-ts-react-r3f-vite.md) |
| Tooling | pnpm + Zod + Zustand + Vitest, fixture HTTP `/parts` + `/benchmarks` — [`ADR-003`](../../decisions/ADR-003-stage3-tooling-and-fixtures.md) |
| License | Code + data = Apache-2.0 — [`ADR-004`](../../decisions/ADR-004-license-code-apache-2.0.md) |
| Data contract | `vs0` types + fixture IDs — [`vertical-slice-data-contract.md`](./specs/vertical-slice-data-contract.md) |
| Fixtures on disk | `parts/**` (7 parts), `benchmarks/vs0/**` (12-row table + unavailable examples) — integrity-checked |
| Owner "start implementation" | **Given** — scaffold shipped 2026-08-08 |

If any of these are reopened before implementation starts, this plan must be revised first.

---

## 2. Target directory layout (proposed, at implementation start)

```text
pb3/
  package.json                      pnpm, scripts: dev / build / preview / test / test:e2e / test:all
  pnpm-lock.yaml
  tsconfig.json
  vite.config.ts                    fixture serve (dev) + static copy (build), see §4
  vitest.config.ts                  or merged into vite.config.ts
  playwright.config.ts              headless Chromium E2E (Step 8)
  e2e/
    exit-scenario.spec.ts           Phase 0 exit scenario + fixture HTTP on dist
  index.html
  src/
    main.tsx                        app entry, mounts <App/>
    App.tsx                         single build screen shell
    contract/
      vs0.ts                        types + constants, copied from the data contract §2
      vs0.schema.ts                 Zod schemas mirroring vs0.ts, used at every fixture/URL boundary
    catalog/
      loadPartCatalog.ts            fetch + parse all `parts/**/part.json` → PartCatalog
      loadPerformanceFixtures.ts    fetch + parse `benchmarks/vs0/performance-fixtures.json`
    state/
      buildStore.ts                 Zustand store wrapping BuildState
      urlSync.ts                    buildStateToSearchParams / buildStateFromSearchParams (contract §6.3) + replaceState wiring
    perf/
      queriesForBuild.ts            contract §7.1
      estimatePerformance.ts        contract §7.6
    viewport/
      BuildViewport.tsx             R3F <Canvas>, scene setup
      GpuModel.tsx                  loads modelGlbPath for current gpuId, swaps on change
    ui/
      PartSelector.tsx              generic CPU/GPU selector (id + displayName list)
      BuildSummary.tsx              read-only case/board/cooler/game/preset display
      PerformancePanel.tsx          three resolution rows, range + confidence + basis
    test/
      urlSync.test.ts
      estimatePerformance.test.ts
      vs0.schema.test.ts
      loadPartCatalog.test.ts
  parts/                            existing fixtures, unchanged (SSOT stays repo root — ADR-003)
  benchmarks/                       existing fixtures, unchanged
```

Notes:

- This is a **starting shape**, not a lock — small deviations during scaffold (e.g. merging two files) are fine without a plan revision. Structural deviations (new top-level layers, moving fixtures, adding a backend) need a plan update first.
- No CSS framework / design system per phase-0 non-goals; inline styles or a single minimal stylesheet is enough.
- No router library needed — one screen, query-string state only (contract §6).
- **App path is `/` (site root), not `/build`.** The data contract's `https://example.local/build?...` examples are illustrative only — phase 0 does not need a route for the exit scenario, and adding one would need SPA-fallback hosting config for zero benefit at this scope. Query-string rules (contract §6) apply unchanged at `/`.
- No `localStorage`. The spec allows it as a non-authoritative cache, but phase 0 deliberately omits it — the URL alone is the persistence layer to keep the reload-restore path (contract §6, phase-0 spec §3.3) unambiguous to test.

---

## 3. Build order

Each step names its exit condition. Do not start step *N+1*'s app-behavior work before step *N* compiles/tests clean — but doc/config steps (1–2) can land together.

### Step 1 — Scaffold + tooling wiring

- `pnpm create vite` (react-ts template) or hand-rolled equivalent; add R3F (`@react-three/fiber`, `three`), `@react-three/drei` (for `useGLTF` in Step 6 — small, R3F-ecosystem-standard, allowed under ADR-002 "add R3F helpers when needed"), Zod, Zustand, Vitest per ADR-002/003.
- `pnpm-lock.yaml` committed.
- Configure `vite.config.ts` fixture serving per [`ADR-003`](../../decisions/ADR-003-stage3-tooling-and-fixtures.md) fixture HTTP strategy: dev serves `/parts` and `/benchmarks` from repo-root directories; build copies both into `dist/` at the same paths.
- **Exit:** `pnpm dev` serves an empty shell; `curl localhost:<port>/parts/gpu/gpu.rtx4070/part.json` and `/benchmarks/vs0/performance-fixtures.json` both return the real fixture files.

### Step 2 — Contract layer

- `src/contract/vs0.ts`: copy types/constants from data contract §2 verbatim (or near-verbatim).
- `src/contract/vs0.schema.ts`: Zod schemas for `PartDefinition`, `BuildState`, `PerformanceFixtureFile`, `PerformanceEstimate`.
- `src/test/vs0.schema.test.ts`: schema accepts the checked-in fixtures, rejects malformed samples (missing field, wrong `contractVersion`).
- **Exit:** `pnpm test` green for this file; schemas parse every checked-in `part.json` and the fixture table without error.

### Step 3 — Catalog + fixture loaders

- `loadPartCatalog.ts`: fetch all 7 known part paths (fixed list from contract §3 for phase 0 — no directory listing needed since the inventory is fixed), parse with the Zod schema, return a lookup by id with category.
- `loadPerformanceFixtures.ts`: fetch `/benchmarks/vs0/performance-fixtures.json`, parse with schema.
- `src/test/loadPartCatalog.test.ts`: loader resolves all fixed IDs from contract §3; a missing/malformed part fails loudly (per contract §4.6 — no silent fallback).
- **Exit:** loaders work against the dev server from Step 1; tests green.

### Step 4 — Build state + URL sync

- `state/buildStore.ts`: Zustand store holding `BuildState`, exposing `setCpu(id)`, `setGpu(id)` (case/mb/cooler/game/preset fixed for phase 0 but still part of the shape). `setCpu`/`setGpu` no-op on an id outside the fixed two-per-category set (invalid selector input is not a realistic UI path with a closed dropdown, but the store should not silently accept garbage).
- `state/urlSync.ts`: implement `buildStateToSearchParams` / `buildStateFromSearchParams` exactly per contract §6.3.
- **Boot sequence (must run in this order in `App.tsx` / entry point, before the store subscribes to anything):**
  1. Load part catalog + performance fixtures (Step 3 loaders). Fail loud (visible error) if either is missing — do not fall back to a default `BuildState` because fixtures failed to load.
  2. Decode the current URL with `buildStateFromSearchParams`, using the loaded catalog to build `isValid` (contract §5.1 invariants).
  3. Initialize the Zustand store with the decoded (or default-fallback) `BuildState`.
  4. Immediately `replaceState` with the **canonical full-field encode** of that state — this is what turns a partial/compatibility link (contract §6.4) into the canonical share-link form on load, before the user does anything.
  5. **Only after step 4** does the store subscribe `replaceState` on every subsequent `setCpu`/`setGpu` change.

  Doing this in the wrong order is the easy way to break the contract: validating against an empty catalog (steps 1/2 swapped) forces everything to default, and subscribing before the initial canonical rewrite (steps 4/5 swapped) can double-write or race the mount-time URL update.
- `src/test/urlSync.test.ts`: full-field encode is canonical; partial query decodes against defaults (contract §6.4 examples); invalid ids fall back to default `BuildState` (contract §5.1 invariants).
- **Exit:** tests green; manual check that (a) opening a hand-typed **partial** URL (e.g. only `cpu`+`gpu`) rewrites the address bar to the full canonical query on load, and (b) changing CPU/GPU afterward keeps updating that full query via `replaceState`, and (c) a full reload restores the same `BuildState`.

### Step 5 — Performance path

- `perf/queriesForBuild.ts` and `perf/estimatePerformance.ts`: port directly from contract §7.1 / §7.6.
- `src/test/estimatePerformance.test.ts`: all 12 known combos return `status: "ok"` with the fixture's exact range; an unknown combo (use `performance-unavailable.examples.json`) returns `status: "unavailable"` with `fpsMin`/`fpsMax` null and no invented numbers.
- **Exit:** tests green, including at least one case from the separate unavailable-examples file.

### Step 6 — 3D viewport + GPU swap

- `viewport/BuildViewport.tsx`: R3F `<Canvas>` with the case model always mounted (or a placeholder scene) and lighting/camera enough to see the GPU.
- `viewport/GpuModel.tsx`: given `gpuId`, resolve `PartDefinition.modelGlbPath` from the catalog, load via `useGLTF` (or equivalent), render; unmount/replace the previous GPU node when `gpuId` changes. Missing GLB → visible error state, not a silent stale mesh (contract §4.6).
- **Exit:** manual check — selecting the other GPU in a temporary/dev-only control swaps the visible mesh (placeholder boxes are fine per ADR-003 / phase-0 spec §3.2).

### Step 7 — UI shell

- `ui/PartSelector.tsx`, `ui/BuildSummary.tsx`, `ui/PerformancePanel.tsx`, wired into `App.tsx` with `BuildViewport`.
- CPU and GPU selectors call the store's `setCpu`/`setGpu`; summary shows fixed case/board/cooler/game/preset display names; performance panel renders 3 rows from `queriesForBuild` + `estimatePerformance`, showing range, `confidence`, and `dataVersion`/`basis` (small text is enough per phase-0 spec §3.1).
- `PerformancePanel` must branch on `status`: `"ok"` → render `fpsMin`–`fpsMax` + confidence/basis; `"unavailable"` → render the `basis`/`reason` text with **no FPS numbers at all** (not `null`, not `0`, not a dash standing in for a number — just the unavailable message). All 12 happy-path fixture rows are `"ok"` so this branch is untested by the exit scenario itself; cover it with the Step 5 unit test data instead.
- **Exit:** single screen shows all required elements from phase-0 spec §3.1.

### Step 8 — End-to-end exit scenario verification

Walk the exact scenario from [`specs/phase-0.md`](./specs/phase-0.md) §4 on a clean checkout:

1. Open app with a clean URL → default `BuildState` loads, performance ranges show for all 3 resolutions.
2. Select the other CPU → ranges update, GPU mesh unchanged.
3. Select the other GPU → mesh swaps, ranges update.
4. Copy the URL / reload → same CPU + GPU restored, ranges match.
5. Change CPU/GPU again post-reload → still works.

**Automated regression (required going forward):** `pnpm test:e2e` runs Playwright headless Chromium against `vite preview` (built `dist/`) via `e2e/exit-scenario.spec.ts`. Manual walkthrough remains useful for visual GLB sanity; URL/state/perf/selector paths are covered headless.

Check off phase-0.md §4's checklist and this plan's own checklist below when all five pass.

### Step 9 — Tag

- Once Step 8 passes on a clean checkout, tag `vertical-slice-v0` (owner performs the tag/push per existing convention) and freeze further 3D feature work per phase-0 spec §6.

---

## 4. Fixture HTTP wiring detail (ADR-003 compliance)

- Do **not** copy `parts/` or `benchmarks/` under `src/` or `public/` as a second source of truth.
- Dev: a small Vite plugin or `server.fs.allow` + static middleware maps `/parts` → repo-root `parts/` and `/benchmarks` → repo-root `benchmarks/`.
- Build: copy both directories into `dist/parts` and `dist/benchmarks` (e.g. `vite-plugin-static-copy`) so `vite preview` and later static hosting serve identical paths.
- `base: '/'` (site-root deploy assumption, no live host yet — ADR-001 deploy deferred).

---

## 5. Testing strategy

Per [`ADR-003`](../../decisions/ADR-003-stage3-tooling-and-fixtures.md): Vitest for pure logic first.
**Owner update (2026-08-08):** Step 8 exit scenario is also automated with **Playwright** headless Chromium (ADR-003 allowed optional browser E2E later; now required for regression).

| Layer | Covered by |
|-------|-----------|
| Schema validation | `vs0.schema.test.ts` |
| Catalog loading | `loadPartCatalog.test.ts` |
| URL encode/decode | `urlSync.test.ts` |
| Performance lookup | `estimatePerformance.test.ts` |
| Full exit scenario | `e2e/exit-scenario.spec.ts` (Playwright, headless) — replaces manual-only Step 8 as the regression gate |
| Commands | `pnpm test` (Vitest), `pnpm test:e2e` (Playwright via preview build), `pnpm test:all` |

---

## 6. Explicit non-goals for this plan

Same as [`specs/phase-0.md`](./specs/phase-0.md) §5 — do not let scaffold work drift into: extra parts/games, collision/anchors, RGB, real performance model, backend/auth, pricing, design system, or model authoring tools. If a step above seems to require one of these, stop and flag it rather than adding it quietly.

---

## 7. Checklist (mirrors `TODO.md` Implementation section)

- [x] Step 1 — scaffold + fixture serving (dev + build)
- [x] Step 2 — contract types + Zod schemas
- [x] Step 3 — catalog + performance fixture loaders
- [x] Step 4 — `BuildState` store + URL encode/decode + reload restore
- [x] Step 5 — performance query + estimate functions
- [x] Step 6 — 3D viewport + GPU GLB swap
- [x] Step 7 — single build screen UI
- [x] Step 8 — exit scenario passes end-to-end on a clean checkout
- [ ] Step 9 — tag `vertical-slice-v0` (owner)

---

## 8. Related documents

| Document | Role |
|----------|------|
| [`specs/phase-0.md`](./specs/phase-0.md) | Scope, exit criteria, forbidden work |
| [`specs/vertical-slice-data-contract.md`](./specs/vertical-slice-data-contract.md) | Canonical types, JSON shapes, URL algorithm |
| [`TODO.md`](./TODO.md) | Flat phase-0 checklist (this plan is its ordered expansion) |
| [`AGENTS.md`](../../../AGENTS.md) | Cross-agent gates on when implementation may start |

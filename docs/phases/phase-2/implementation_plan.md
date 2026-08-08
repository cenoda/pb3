# Phase 2 — Implementation Plan

Status: **M0 draft — written for review; implementation not authorized**
Scope authority: [`specs/phase-2.md`](./specs/phase-2.md)
Data authority: [`specs/compatibility-data-contract.md`](./specs/compatibility-data-contract.md)
Stack authority: [`ADR-001`](../../decisions/ADR-001-runtime-static-spa.md), [`ADR-002`](../../decisions/ADR-002-stack-core-ts-react-r3f-vite.md), [`ADR-003`](../../decisions/ADR-003-stage3-tooling-and-fixtures.md), [`ADR-004`](../../decisions/ADR-004-license-code-apache-2.0.md)
Predecessor: Phase 0 app under `src/` + Phase 1 `perf1` engine — both complete
and closed out ([`../phase-1/implementation_plan.md`](../phase-1/implementation_plan.md))

This document is the ordered, file-level build plan required by the
plan-before-code convention ([`docs/phases/README.md`](../README.md) "Rule:
plan before code"). Per that convention, **no scaffold or source file for
phase 2 exists yet and none is created by this document.** It is written
alongside `specs/phase-2.md` and `specs/compatibility-data-contract.md` so the
full M0 package can be reviewed together; implementation begins only after the
owner accepts all three.

---

## 1. Preconditions

| Gate | State |
|------|-------|
| Runtime shape | Static SPA — [`ADR-001`](../../decisions/ADR-001-runtime-static-spa.md) |
| Stack core | TypeScript + React + R3F + Vite — [`ADR-002`](../../decisions/ADR-002-stack-core-ts-react-r3f-vite.md) |
| Tooling | pnpm + Zod + Zustand + Vitest + Playwright; fixture HTTP `/parts` + `/benchmarks` — [`ADR-003`](../../decisions/ADR-003-stage3-tooling-and-fixtures.md) |
| License | Code + data = Apache-2.0 — [`ADR-004`](../../decisions/ADR-004-license-code-apache-2.0.md) |
| Phase 0 app | Implemented under `src/`; exit scenario automated (`e2e/exit-scenario.spec.ts`) |
| Phase 1 `perf1` engine | Implemented, verified, closed out (`38b76d1`) |
| Phase 2 scope lock | **Draft, not yet owner-accepted** — [`specs/phase-2.md`](./specs/phase-2.md) |
| Phase 2 data contract | **Draft, not yet owner-accepted** — `vs2`/`compat2` types in [`compatibility-data-contract.md`](./specs/compatibility-data-contract.md) |
| Fixtures on disk | **Not started** |
| Owner "start implementation" | **Not given** |

**This plan cannot be executed as-is.** Step 1 below cannot begin until the
owner accepts `specs/phase-2.md` and `specs/compatibility-data-contract.md`,
and resolves the open decisions listed in phase-2.md §9 (PSU headroom
multiplier, currency, RAM-tier mapping stance, exact fixture paths). If any
precondition or open decision changes before implementation starts, this plan
must be revised first.

---

## 2. Inherited contracts (do not modify)

- `vs0` `BuildState` core fields and URL keys (`v`, `cpu`, `gpu`, `case`,
  `mb`, `cooler`, `game`, `preset`) keep their existing meaning; phase 2 only
  adds `ram`/`psu` keys and bumps `v` to `vs2` (contract §3).
- `perf1` `BaselineQuery`, correction, and workload types/behavior are
  **unchanged**. The only open question — mapping a selected RAM SKU to a
  `perf1` RAM tier — stays unresolved and unimplemented until a separate
  decision (phase-2.md §9); phase 2 must not silently wire this.
- Phase 0 fixture SSOT convention (`parts/{category}/{id}/part.json` +
  `model.glb`, repo-root `parts/` and `benchmarks/`) is reused, not replaced.
- Phase 0 exit scenario (`e2e/exit-scenario.spec.ts`) remains the regression
  gate and must stay green throughout phase 2.

---

## 3. Target directory layout (proposed, at implementation start)

Phase 2 **extends** the existing tree. It does not re-scaffold the app, move
fixtures, or reopen 3D/Phase-3 scope.

```text
pb3/
  src/
    contract/
      vs0.ts / vs0.schema.ts        existing — do not fork; vs2 supersedes for BuildState shape
      perf1.ts / perf1.schema.ts    existing — unchanged
      vs2.ts                        NEW — BuildStateV2, URL keys, vs0→vs2 decode/backward-compat
      vs2.schema.ts                 NEW — Zod schemas for BuildStateV2 + vs0 legacy decode input
      compat2.ts                    NEW — CompatibilityCheckResult, CompatibilityReport, price types
      compat2.schema.ts             NEW — Zod schemas for compat2 types + fixture file shapes
    catalog/
      loadPartCatalog.ts             existing — extend to load ram/psu categories + new case/mb ids
      loadPerf1Fixtures.ts           existing — unchanged
      loadCompat2Fixtures.ts         NEW — fetch + parse benchmarks/compat2/*.json
    compat/
      compatibilityInputs.ts         NEW — BuildStateV2 → per-check spec lookups (contract §4.3)
      checkCpuSocket.ts               NEW — contract §4.4 row 1
      checkChipsetBios.ts             NEW — contract §4.4 row 2
      checkRamSupport.ts              NEW — contract §4.4 row 3
      checkPsuWattage.ts              NEW — contract §4.4 row 4 (headroom multiplier constant, value TBD)
      checkCaseFormFactor.ts          NEW — contract §4.4 row 5
      buildCompatibilityReport.ts     NEW — runs all five checks, aggregates overallStatus
    price/
      loadPriceFixtures.ts            NEW — price-fixtures.json loader
      buildPriceSummary.ts            NEW — BuildStateV2 → BuildPriceSummary (contract §5.2)
    state/
      buildStore.ts                   existing — extend BuildState → BuildStateV2 (ram/psu fields)
      urlSync.ts                      existing — extend encode/decode for vs2 + vs0 backward-compat (contract §3.3–§3.4)
    ui/
      PerformancePanel.tsx             existing — unchanged behavior
      PartSelector.tsx                 EXTEND — generalize from CPU/GPU-only to all 7 categories
      PartFilterControls.tsx           NEW — simple attribute filters per category
      BuildSummary.tsx                 existing — extend to show case/mb/ram/psu selections
      CompatibilityPanel.tsx           NEW — renders CompatibilityReport (5 checks + overall status)
      PriceSummaryPanel.tsx            NEW — renders BuildPriceSummary (lines + subtotal + partial flag)
    test/
      vs2.schema.test.ts               NEW
      compat2.schema.test.ts           NEW
      urlSync.vs2.test.ts              NEW — vs2 encode/decode + vs0 legacy decode backward-compat
      compatibilityChecks.test.ts      NEW — all 5 checks: compatible / incompatible / unavailable
      buildPriceSummary.test.ts        NEW — ok / unavailable / partial total
    App.tsx                            EXTEND: also load compat2 fixtures + expanded catalog
  benchmarks/compat2/                  NEW SSOT (path per contract §6, to confirm at implementation start)
    compatibility-examples.json         test-only compatible/incompatible/unavailable examples
    price-fixtures.json                 price rows for all phase-2 part ids
  parts/
    case/case.mid-tower-atx-01/         existing — unchanged
    case/{new-case-id}/                 NEW — second case fixture (phase-2.md §2.2)
    motherboard/mb.atx-b650-01/         existing — unchanged
    motherboard/{new-mb-id}/            NEW — second motherboard fixture
    ram/{ram-id-1}/, ram/{ram-id-2}/    NEW — RAM category
    psu/{psu-id-1}/, psu/{psu-id-2}/    NEW — PSU category
  e2e/
    exit-scenario.spec.ts               Phase 0 regression — must stay green
    phase2-compat-price.spec.ts         NEW (optional split) — phase-2 completion scenario
```

Notes:

- **Contract file convention matches Phase 0/1:** types in `src/contract/*.ts`,
  Zod in `src/contract/*.schema.ts`.
- **`EstimateConfidence` is not redefined** — reused from `vs0` (contract §2).
- **Fixture SSOT stays at repo root**, matching ADR-003's fixture HTTP
  strategy; `benchmarks/compat2/` needs no new Vite plugin beyond the existing
  `/benchmarks/**` serve + dist-copy wiring, unless practice shows otherwise.
- **No 3D/GLB work.** New parts (RAM, PSU, second case/motherboard) need
  `part.json` + a placeholder `model.glb` only to satisfy the existing part
  loader contract (`vs0` §4.6) — no new viewport features, no anchors.
- Small file splits/merges (e.g. folding `PriceSummaryPanel` into
  `BuildSummary`) are fine without a plan revision. Structural deviations
  (backend, live pricing, RAM-tier auto-mapping, physical validation) need a
  plan update first.

---

## 4. Data and fixture migration strategy

1. **Additive, not destructive.** `parts/case/case.mid-tower-atx-01/` and
   `parts/motherboard/mb.atx-b650-01/` are kept as-is; a sibling id is added
   per category (phase-2.md §2.2). No existing `vs0`/`perf1` fixture file is
   deleted or renamed.
2. **New categories are new folders** (`parts/ram/`, `parts/psu/`) following
   the existing `parts/{category}/{id}/part.json` + `model.glb` layout — no
   parallel fixture tree.
3. **Compat spec fields land on `part.json`.** Each part's `part.json` gains
   the fields its category needs from contract §4.3 (e.g. `cpu.socket`,
   `motherboard.chipset`). This is an additive field change to the existing
   `PartDefinition` shape — implementation must decide (and document in code)
   whether this is a `PartDefinition` shape bump or an additional optional
   `compatSpec` block, per contract §6's open note.
4. **Price fixtures are a new file**, not embedded in `part.json` — keeps
   compatibility/spec data and commercial data separated (charter §2 "관심사를
   명확히 분리한다"), consistent with how `benchmarks/` is already separate
   from `parts/`.
5. **`vs0` fixture table (`benchmarks/vs0/`) is untouched.** It remains the
   Phase 0 regression reference; the phase-2 catalog loader is additive to,
   not a replacement of, the existing part catalog loader.
6. **Migration order for implementation (informational, not binding until a
   step below is executed):** contract types/schemas first (Step 1), then
   fixtures (Step 2 in §5 relies on fixtures existing on disk before loader
   tests can run against real data — fixture authoring itself is folded into
   Step 2, not a separate numbered step, to avoid a fixture-only PR with no
   consuming code).

---

## 5. Build order

Each step names its exit condition. Do not start step *N+1*'s app-behavior
work before step *N* compiles/tests clean.

### Step 0 — Owner acceptance gate (precondition, not implementation)

- Owner reviews and accepts `specs/phase-2.md` and
  `specs/compatibility-data-contract.md`.
- Owner resolves the open decisions in phase-2.md §9: PSU headroom
  multiplier value, fixture currency, RAM-tier-mapping stance (defer vs.
  decide now), exact `benchmarks/compat2/` path.
- **Exit:** `STATUS.md` records phase-2 scope + contract as owner-accepted,
  same pattern as Phase 1's `phase-1.md`/`performance-data-contract.md`
  acceptance record.

### Step 1 — Contract types + Zod schemas (`vs2`, `compat2`)

- `src/contract/vs2.ts`: `BuildStateV2`, `PartCategoryV2`, URL key map,
  default `BuildStateV2`, `vs0`→`vs2` normalization function signature
  (contract §3.1–§3.4).
- `src/contract/vs2.schema.ts`: Zod schema for `BuildStateV2`; a separate
  lenient schema/parser path for decoding legacy `v=vs0` query params before
  normalization.
- `src/contract/compat2.ts`: `CompatibilityCheckId`, `CompatibilityStatus`,
  `CompatibilityCheckResult`, `CompatibilityReport`, the five `*CompatSpec`
  interfaces, `PricedPart`, `BuildPriceSummary` (contract §4, §5).
- `src/contract/compat2.schema.ts`: Zod mirrors for every public type and the
  two fixture file shapes (contract §6). Schema must reject an
  `incompatible` result with no `explanation` (contract §4.2 note).
- `src/test/vs2.schema.test.ts`, `src/test/compat2.schema.test.ts`: accept
  well-formed examples; reject malformed ones (wrong version, missing
  required explanation, inverted price partial flag).
- **Exit:** `pnpm test` green for both new schema test files; no fixture data
  required yet (types validated against hand-written example objects).

### Step 2 — Fixtures on disk + loaders

- Author `part.json` + placeholder `model.glb` for: second case, second
  motherboard, 2 RAM, 2 PSU (phase-2.md §2.5, 13 parts total across all
  categories after this step).
- Add compat spec fields to all phase-2 part fixtures (existing 7 + 6 new),
  including the two existing CPUs' `socket`/`tdpWatts` and the two existing
  GPUs' `tdpWatts`, since contract §4.4 checks need them even though Phase
  0/1 fixtures never declared them.
- Author `benchmarks/compat2/compatibility-examples.json` (at least one
  compatible, one incompatible with `explanation`, one `unavailable` case per
  contract §8 checklist) and `benchmarks/compat2/price-fixtures.json` (price
  row per phase-2 part id, plus at least one deliberately missing row to
  exercise the `unavailable` price path).
- `src/catalog/loadCompat2Fixtures.ts`: fetch + Zod-parse both files; fail
  loud on HTTP or schema failure, matching `loadPerf1Fixtures.ts` discipline.
- Extend `loadPartCatalog.ts` (or add a sibling loader) to include `ram` and
  `psu` categories and the new case/motherboard ids.
- **Exit:** loaders work against `pnpm dev`; a data-only fixture integrity
  check (mirroring the Phase 0/1 one-time checks in `STATUS.md`) passes:
  every part has required compat fields, default `BuildStateV2` resolves to
  fixtures and reports `overallStatus: "compatible"`, price fixture covers
  every part id or documents the intentional gap.

### Step 3 — Compatibility engine

- `src/compat/compatibilityInputs.ts`: `BuildStateV2` + catalog → the five
  `*CompatSpec` lookups.
- `src/compat/checkCpuSocket.ts`, `checkChipsetBios.ts`, `checkRamSupport.ts`,
  `checkPsuWattage.ts`, `checkCaseFormFactor.ts`: one pure function per check,
  each returning `CompatibilityCheckResult` per contract §4.4. `PSU_HEADROOM_MULTIPLIER`
  is declared as a single named constant sourced from the Step 0 owner
  decision — not hardcoded inline in multiple places.
- `src/compat/buildCompatibilityReport.ts`: runs all five, aggregates
  `overallStatus` per contract §4.2 rule.
- `src/test/compatibilityChecks.test.ts`: each check exercised for
  `compatible`, `incompatible` (with non-empty `explanation`), and
  `unavailable`, using `compatibility-examples.json` plus targeted unit
  cases; aggregate `overallStatus` logic covered for all three precedence
  cases (any incompatible → incompatible; else any unavailable → unavailable;
  else compatible).
- **Exit:** `pnpm test` green; no UI required yet.

### Step 4 — Price aggregation

- `src/price/loadPriceFixtures.ts`: parse `price-fixtures.json` via the
  `compat2.schema.ts` price types.
- `src/price/buildPriceSummary.ts`: `BuildStateV2` + price fixtures →
  `BuildPriceSummary` (sum over `status: "ok"` lines only; `isPartial: true`
  if any selected part has no price row).
- `src/test/buildPriceSummary.test.ts`: full-price build sums correctly;
  build with a missing price line reports `isPartial: true` and a correct
  partial subtotal (never a silently short total presented as complete).
- **Exit:** unit tests green.

### Step 5 — General part selection + filtering UI

- Extend `PartSelector.tsx` from CPU/GPU-only to all seven categories (case,
  motherboard, cpu, gpu, cooler, ram, psu). Existing CPU/GPU selection UX and
  test ids are preserved; new selectors for the five newly-real categories
  follow the same pattern.
- `PartFilterControls.tsx`: filter each category list by at least one
  declared attribute (e.g. RAM by capacity, PSU by wattage, motherboard by
  form factor) — exact filterable attribute set is an implementation
  decision within this step, not fixed by the data contract.
- `BuildSummary.tsx`: extend to display the current case/motherboard/RAM/PSU
  selection alongside existing CPU/GPU/cooler display.
- **Exit:** manual `pnpm dev` walkthrough confirms all seven categories are
  selectable and update `BuildStateV2`; unit/URL tests still green.

### Step 6 — Compatibility + price panels wired into the app

- `CompatibilityPanel.tsx`: renders all five `CompatibilityCheckResult`s plus
  `overallStatus`; incompatible checks show their `explanation` prominently;
  unavailable checks show their reason, not a blank/compatible-looking row.
- `PriceSummaryPanel.tsx`: renders `PricedPart` lines, subtotal, currency,
  and a visible "partial total" label when `isPartial === true`.
- `App.tsx`: boot sequence loads compat2 fixtures (compatibility examples are
  test-only, not loaded at boot; price fixtures load at boot) alongside
  existing part catalog + perf1 fixtures; recompute `CompatibilityReport` and
  `BuildPriceSummary` whenever `BuildStateV2` changes.
- **Do not** wire any RAM-tier auto-mapping into `perf1` here — that stays an
  open decision (phase-2.md §9) unless the owner separately accepts it before
  this step.
- **Exit:** manual walkthrough of phase-2.md §8 draft completion scenario
  steps 1–4, 7 against `pnpm dev`.

### Step 7 — URL/save/share migration (`vs0` → `vs2`)

- `urlSync.ts`: extend encoder to always write the full `vs2` query set
  (contract §3.3); extend decoder to accept `v=vs2` directly and to normalize
  a legacy `v=vs0` link per contract §3.4 (fill `ram`/`psu` from defaults,
  then validate and optionally rewrite the address bar to canonical `vs2`).
- `buildStore.ts`: `BuildState` → `BuildStateV2`; ensure store initialization
  order still loads catalog before decoding the URL (same order Phase 1 §2
  established), now also loading compat2 price fixtures before first paint
  if the price panel needs them at initial render.
- `src/test/urlSync.vs2.test.ts`: full `vs2` encode/decode round-trip;
  legacy `v=vs0` link (including a `vs0` link with only `cpu`/`gpu`, i.e. a
  doubly-partial legacy+partial case) decodes to a valid `BuildStateV2` with
  RAM/PSU defaults filled; invalid ids in either version fall back to
  defaults.
- **Exit:** `pnpm test` green; manual check that a hand-constructed `v=vs0`
  URL from before phase 2 still loads a valid build in `pnpm dev`.

### Step 8 — Test coverage + Phase 0 regression must stay green

| Layer | File / command | Requirement |
|-------|-----------------|-------------|
| Schema | `vs2.schema.test.ts`, `compat2.schema.test.ts` | All phase-2 types + fixture files parse; rejects malformed |
| Compatibility | `compatibilityChecks.test.ts` | All 5 checks: compatible / incompatible (with explanation) / unavailable |
| Price | `buildPriceSummary.test.ts` | Full total, partial total, no invented amounts |
| URL | `urlSync.vs2.test.ts` | vs2 round-trip; vs0 legacy backward-compat |
| Phase 0 regression | `pnpm test:e2e` / `e2e/exit-scenario.spec.ts` | Still passes headless, unchanged behavior |
| Phase 2 E2E (optional split) | `e2e/phase2-compat-price.spec.ts` | Draft completion scenario (phase-2.md §8), if the owner wants E2E coverage beyond unit tests |
| Full gate | `pnpm test:all` | Unit + E2E green before claiming exit |
| Build | `pnpm build` | New fixture paths (`benchmarks/compat2/`, `parts/ram/`, `parts/psu/`) copy into `dist/` correctly |

- **Exit:** `pnpm test:all` and `pnpm build` green on a clean checkout.

### Step 9 — Exit criteria checklist (phase-2.md §8, finalized at this step)

Walk a finalized version of the phase-2.md §8 draft scenario on a clean
checkout with stub fixtures. This plan does not pre-declare the checklist
"done" — it becomes the actual phase-2 exit checklist only after Steps 1–8
are implemented and verified, mirroring how Phase 1's plan §8 was written
in-progress and checked off at closeout.

Then (owner / hand-off):

1. Record phase-2 completion in [`STATUS.md`](../../../STATUS.md) and
   [`TODO.md`](./TODO.md).
2. Do not expand phase-2 inventory or reopen physical/Phase-3 scope as part
   of this closeout.
3. Any deferred open decision from phase-2.md §9 that was *not* resolved
   before implementation (e.g. RAM-tier mapping, if the owner chose to defer
   it) is explicitly still open after phase-2 exit — closeout must not imply
   it was silently decided.

---

## 6. Compatibility engine boundaries

- Pure functions only (`src/compat/*`): input is spec data already resolved
  from the catalog, output is a `CompatibilityCheckResult` or
  `CompatibilityReport`. No network calls, no 3D/geometry access, no mutation
  of `BuildStateV2` or `perf1` state.
- The engine never returns `compatible` when a required spec field is
  missing — missing data always routes to `unavailable`, never a default
  "assume fine."
- The engine is invoked from UI state changes (Step 6), not from the URL
  decode path directly — decode only restores `BuildStateV2`; compatibility
  is derived, not persisted.

## 7. UI integration boundaries

- New UI components (`PartFilterControls`, `CompatibilityPanel`,
  `PriceSummaryPanel`) are additive to the existing Phase 0/1 screen; the
  existing `PerformancePanel` is not restructured beyond what's needed to sit
  alongside the new panels.
- Existing Playwright test ids (`performance-panel`, `perf-row-{res}`,
  `cpu-select`, `gpu-select`, `build-viewport`, etc., per Phase 1's plan §6
  Step 6 note) are preserved; new test ids are additive.
- No new 3D viewport behavior. RAM/PSU/second case/second motherboard need
  only a resolvable placeholder `model.glb`; no swap logic beyond what
  already exists for GPU (case/motherboard/RAM/PSU are not required to swap
  visually in phase 2 — only GPU swap remains mandatory, per `vs0` §3.1).

## 8. URL/save/share migration behavior

- Covered in detail in §5 Step 7 and contract §3.3–§3.4. Summary invariant
  for review: **every `v=vs0` link that worked before phase 2 must still
  produce a valid, loadable build after phase 2 ships** — this is the single
  hard regression check for save/share continuity, verified in
  `urlSync.vs2.test.ts` and manually in Step 7's exit condition.

## 9. Unit and E2E test strategy

Per ADR-003: Vitest for pure logic first; Playwright for Phase 0 regression
(mandatory) and optional phase-2 E2E expansion.

| Layer | Covered by |
|-------|------------|
| vs2 / compat2 schema + fixture parse | `vs2.schema.test.ts`, `compat2.schema.test.ts` |
| Compatibility checks (5×, all 3 statuses) | `compatibilityChecks.test.ts` |
| Price aggregation (ok / partial) | `buildPriceSummary.test.ts` |
| URL vs2 round-trip + vs0 backward-compat | `urlSync.vs2.test.ts` |
| Phase 0 exit scenario | `e2e/exit-scenario.spec.ts` (must stay green) |
| Phase 2 completion scenario (optional E2E) | `e2e/phase2-compat-price.spec.ts` |
| Commands | `pnpm test`, `pnpm test:e2e`, `pnpm test:all`, `pnpm build` |

`benchmarks/compat2/compatibility-examples.json` is a **test oracle**, not
merged into any happy-path runtime table — same discipline as
`benchmarks/perf1/*-examples.json`.

---

## 10. Exit criteria (plan-level)

This `implementation_plan.md` itself exits (is "done" as a planning
deliverable) when:

- [x] Directory layout, build order, and step-level exit conditions are
      written (this document).
- [ ] Owner accepts this plan alongside `specs/phase-2.md` and
      `specs/compatibility-data-contract.md` (Step 0).
- [ ] Open decisions in phase-2.md §9 are resolved or explicitly deferred by
      owner decision before Step 1 begins.

Phase-2 **implementation** (Steps 1–9) exits per §5 Step 9 once executed —
not yet reached.

---

## 11. Explicit non-goals for this plan

Same as [`specs/phase-2.md`](./specs/phase-2.md) §10 — do not let
implementation drift into:

| Forbidden | Rationale |
|-----------|-----------|
| Physical collision, clearance, mounting, cooling geometry | Phase 3 |
| GLB anchor/socket runtime validation | Phase 3 |
| Live price APIs, cart, affiliate, checkout | Needs its own decision |
| Accounts, auth, server-mediated share/sync | Static SPA (ADR-001) |
| Expanding CPU/GPU/cooler/game/preset counts | Scope lock, unchanged |
| Storage or any category beyond phase-2.md §2.1–§2.3 | Scope lock |
| Auto-mapping selected RAM SKU to `perf1` RAM tier | Open decision, not resolved |
| Inventing compatibility, price, or performance values | Charter §2 |
| Modifying `perf1` baseline/correction/workload code | Out of phase-2 scope |
| Starting any step in §5 before Step 0's owner acceptance | Plan-before-code convention |

If a step seems to require one of these, stop and flag it rather than adding
it quietly.

---

## 12. Risks and unresolved decisions

| Risk / decision | Impact if unresolved | Owner action needed |
|---|---|---|
| PSU headroom multiplier value undecided | `checkPsuWattage` cannot be implemented correctly; a placeholder value risks being mistaken for a real safety margin | Confirm a specific multiplier (e.g. a percentage) before Step 3 |
| Fixture currency undecided | Price fixtures block on a currency choice | Confirm `"USD"` (proposed) or another currency before Step 2 |
| RAM-tier ↔ RAM-SKU mapping stance undecided | Ambiguity about whether phase 2 silently should/shouldn't touch `perf1`; risk of scope creep into performance-engine changes | Explicit decision: defer (phase 2 ships without the mapping) or scope a follow-up |
| Exact fixture paths under `benchmarks/compat2/` not finalized | Minor — low-cost to change before Step 2, higher cost after | Confirm during Step 0/1 |
| `PartDefinition` shape change (inline compat fields vs. nested `compatSpec`) undecided | Affects Zod schema design and every phase-2 part fixture's shape | Decide during Step 1 (contract §6 open note) |
| Whether phase-2 E2E (`phase2-compat-price.spec.ts`) is required or optional | Affects Step 8/9 scope and effort | Owner call at Step 0 or Step 8 |
| Two-motherboard / two-case set may reveal additional compatibility edge cases once real specs are chosen (e.g. a third form factor) | Could pressure inventory beyond §2.2 boundaries | Hold the line at 2/2 per phase-2.md §2; open a new decision rather than expanding silently |

---

## 13. Related documents

| Document | Role |
|----------|------|
| [`specs/phase-2.md`](./specs/phase-2.md) | Scope, inventory, forbidden work, open decisions |
| [`specs/compatibility-data-contract.md`](./specs/compatibility-data-contract.md) | `vs2`/`compat2` types |
| [`TODO.md`](./TODO.md) | Flat phase-2 checklist |
| [`../phase-1/implementation_plan.md`](../phase-1/implementation_plan.md) | Structural precedent |
| [`../phase-0/specs/vertical-slice-data-contract.md`](../phase-0/specs/vertical-slice-data-contract.md) | `vs0` BuildState / URL / confidence enum |
| [`AGENTS.md`](../../../AGENTS.md) | Cross-agent gates on when implementation may start |
| [`STATUS.md`](../../../STATUS.md) | Project-wide decided vs open |

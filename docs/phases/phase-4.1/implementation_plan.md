# Phase 4.1 — Implementation plan (`est1` combination estimator)

Status: **Planning package complete (2026-08-09). Implementation not started.**  
Requires separate owner implementation-start instruction.

Scope: [`specs/phase-4.1.md`](./specs/phase-4.1.md)  
Contract: [`specs/estimator-data-contract.md`](./specs/estimator-data-contract.md)  
Algorithm: [`ALGORITHM_DISCUSSION.md`](./ALGORITHM_DISCUSSION.md) §0 (O1–O9)

Stack: ADR-001–004 unchanged (static SPA, TS/React/R3F/Vite, pnpm/Zod/Zustand/Vitest,
Apache-2.0).

---

## 0. Temporary draft function

Implement `draftCaveat` on every `est1` result. Do not add motherboard/cooler
keys to the M0 query. Document in UI copy that cooling/motherboard functions may
later revise estimates.

---

## 1. Preconditions

| Gate | State |
|------|-------|
| Phase 0–3 closed | Yes |
| Phase 4 external-evidence pipeline | On `main` (`6f0a306`+) |
| O1–O9 algorithm lock | Yes (2026-08-09) |
| M0 scope + est1 contract + this plan | Drafted; owner package accept + **separate start** |
| Phase 5 | Not in scope |

---

## 2. Do not modify (public shapes)

- `perf1` types and `benchmarks/perf1/*` row shapes
- `prov4` evidence semantics (consume only; additive helpers OK)
- `vs2` / `phys3` / catalog inventory

---

## 3. Target layout

```text
src/
  contract/
    est1.ts                         NEW — types + EST1_CONTRACT_VERSION + DRAFT_CAVEAT
    est1.schema.ts                  NEW — Zod
  estimate/
    estimateCombinationPerformance.ts   NEW pure
    selectComparableAnchors.ts          NEW pure (comparability-first ranking)
    applyCpuScaleEdge.ts                NEW pure
    validateWithReviews.ts              NEW pure (O4 mandatory when comparable)
  provenance/                       EXISTING — load prov4 observations/rights (reuse)
  estimate/loadEst1Fixtures.ts      NEW — fetch /benchmarks/est1/*
  ui/
    PerformancePanel.tsx            EXTEND — show est1 vs outer synthetic residual
    EvidenceDisclosurePanel.tsx     EXTEND — est1 method/contributors/draftCaveat
    computeFpsSummaryChips.ts       EXTEND — prefer est1 estimated over synthetic when pilot
  test/
    est1.schema.test.ts             NEW
    estimateCombinationPerformance.test.ts  NEW — exact/scaled/unavailable + O2–O5/O9
    est1.integrity.test.ts          NEW — fixtures parse + path matrix
benchmarks/est1/
  cpu-scale-edges.json              NEW (may include test-oriented edges)
  vendor-performance-anchors.json   NEW (may start empty or minimal curated)
e2e/
  phase41-estimator.spec.ts         NEW — pilot shows est1 unavailable or estimate + caveat
docs/phases/phase-4.1/TODO.md       UPDATE checkboxes after steps
```

Vite already serves `/benchmarks/**` (ADR-003).

---

## 4. Ordered steps

### Step 1 — `est1` contract + Zod

- Add `src/contract/est1.ts` / `est1.schema.ts` per estimator-data-contract.md.
- Unit: schema accepts valid estimate/unavailable; rejects scaled+medium;
  rejects missing draftCaveat; rejects fpsMin ≥ fpsMax.

### Step 2 — Fixtures

- Add `benchmarks/est1/cpu-scale-edges.json` and `vendor-performance-anchors.json`.
- For **path proof** (O7), tests may inject in-memory fixtures; on-disk files
  must be rights-honest (no fake vendor FPS without citation).
- Prefer: on-disk edges only when a real sourced ratio exists; otherwise empty
  edges + unit-level synthetic edges **only inside tests**, not shipped as product truth.

### Step 3 — Pure estimator core

- Implement `estimateCombinationPerformance` per §0.1 control flow:
  1. Collect candidates from vendor anchors + prov4 observations (rights fail-closed).
  2. Rank comparability-first (O1).
  3. Exact path → aggregate (reuse `aggregateComparableObservations` where possible).
  4. Scaled path only with matching `CpuScaleEdge` (O2/O3).
  5. O4: if comparable reviews exist, must validate/bound.
  6. P1 width check → unavailable if too wide.
  7. Never return synthetic (O9).
- Unit matrix: exact / scaled / unavailable; waiver attempts fail; O5; O4.

### Step 4 — Loaders + App boot

- `loadEst1Fixtures`; wire into boot alongside prov4 (fail loud if missing files).
- Do not block app if est1 empty arrays — empty is valid (all unavailable).

### Step 5 — UI binding

- Pilot performance: call estimator with pilot query × 3 resolutions.
- Display classes:
  - `est1-estimated` (exact or scaled)
  - `est1-unavailable` (show reason)
  - outer `synthetic-perf1` only as **non-estimate residual** when est1 unavailable
- Always surface `draftCaveat` in disclosure or basis line.

### Step 6 — E2E + verification

- E2E: pilot load shows estimator path labeling + draft caveat string (or data attribute).
- `pnpm test`, `pnpm test:e2e` (or targeted), `pnpm build`, `git diff --check`.
- Update phase-4.1 TODO.

### Step 7 — Stop

- No Phase 5 docs, no motherboard/cooling transform creep, no perf1 rewrites.

---

## 5. Reuse map

| Existing | Use |
|----------|-----|
| `groupComparablePerformance` / `aggregateComparableObservations` | Exact path + review comparability |
| `sourceRightsEligibility` | Fail-closed store permission |
| `bindPerformanceEvidence` | Keep for prov4 disclosure; do not overload as est1 |
| `pilotBaselineKeyFor` | Build `EstimatorQuery` |

---

## 6. Explicit non-steps

- Scraping vendor sites at runtime
- Inventing CPU scale factors in code constants without fixture rows
- GPU-bound waiver helper
- Cooling derate from phys3 geometry

---

## 7. Done definition (implementer)

- [x] Steps 1–6 complete
- [x] O1–O9 encoded in tests
- [x] Temporary draft caveat user-visible on pilot performance surface
- [x] Green verification commands
- [x] Short STATUS / phase-4.1 TODO update
- [ ] Commit/push — owner may authorize in start prompt (commit requested)

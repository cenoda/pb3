# Phase 4 — Implementation Plan

Status: **Historical accepted plan. Corrective gate reopened (2026-08-09).**
Steps 1–8 were implemented, but the invalid first-party fixture was removed.
External-evidence replacement is governed by
[`../../corrections/phase4-external-evidence-1/`](../../corrections/phase4-external-evidence-1/)
and was separately owner-accepted and authorized for Cursor on 2026-08-09.

Scope authority: [`specs/phase-4.md`](./specs/phase-4.md)

Data authority: [`specs/provenance-data-contract.md`](./specs/provenance-data-contract.md)

Stack authority: [`ADR-001`](../../decisions/ADR-001-runtime-static-spa.md),
[`ADR-002`](../../decisions/ADR-002-stack-core-ts-react-r3f-vite.md),
[`ADR-003`](../../decisions/ADR-003-stage3-tooling-and-fixtures.md),
[`ADR-004`](../../decisions/ADR-004-license-code-apache-2.0.md)

This is the ordered, file-level plan required by the plan-before-code rule.
Owner accepted the scope, contract, this plan, and O1–O4 / D1–D16 on
2026-08-09. Implementation start was authorized separately on 2026-08-09.

---

## 1. Preconditions

| Gate | State |
|------|-------|
| Phase 0–3 app, docs, fixtures | Complete and closed out |
| Runtime / stack / tooling | Locked ADR-001–003 |
| License (code + data + synthetic GLB) | Apache-2.0 ADR-004; third-party GLB still open |
| Phase 4 brief / pilot path | Owner-selected **single-build evidence pilot** |
| Phase 4 scope / contract / plan | **Owner-accepted (2026-08-09)** |
| Open decisions O1–O4 / D1–D16 | **Resolved (2026-08-09)** |
| Explicit owner start | **Given (2026-08-09)** |

---

## 2. Inherited contracts (do not modify public shapes)

- `vs0` part identity / model path / legacy URL behavior.
- `vs2` `BuildStateV2`, URL encode/decode, 13-part inventory.
- `compat2` logical checks and price aggregation (non-live).
- `perf1` baseline / correction / workload types and 96-row stub table —
  **public types and fixture row shapes stay unchanged** (no provenance fields
  added to `perf1` rows).
- `phys3` mount, collision/clearance, assembly state, empty production cooling —
  public types unchanged; join uses `phys3EvidenceSourceId`.
- Fixture SSOT at repo-root `parts/` + `benchmarks/`.
- GLB prefixes, mm, Y-up.

Phase 4 adds independent **`prov4`** types plus loaders/UI. Runtime uses
**sidecar binding only**: pilot performance display overlays exact keys from
`prov4` records; geometry disclosure joins phys3 evidence ids without rewriting
`physicalSpec` field meanings.

---

## 3. Proposed target layout

```text
src/
  contract/
    prov4.ts                            NEW
    prov4.schema.ts                     NEW
  provenance/
    loadEvidenceRegistry.ts             NEW
    loadPerformanceEvidence.ts          NEW
    loadGeometryEvidence.ts             NEW
    loadCoolingProvenance.ts            NEW
    loadHumanVerification.ts            NEW
    classifyFreshness.ts                NEW pure (asOf?: string)
    bindPerformanceEvidence.ts          NEW pure
    bindGeometryEvidence.ts             NEW pure (join on phys3EvidenceSourceId)
    buildPilotDisclosureReport.ts       NEW pure
    pilotBuild.ts                       NEW constants (exact pilot part set + baseline key)
  ui/
    EvidenceDisclosurePanel.tsx         NEW
    PerformancePanel.tsx                EXTEND — pilot sidecar overlay only
    PhysicalValidationPanel.tsx         EXTEND — show prov4 geometry binding
    CoolingEvidencePanel.tsx            EXTEND — empty/unavailable path
  test/
    prov4.schema.test.ts                NEW
    classifyFreshness.test.ts           NEW
    bindPerformanceEvidence.test.ts     NEW
    bindGeometryEvidence.test.ts        NEW
    pilotDisclosure.test.ts             NEW
benchmarks/prov4/
  evidence-source-registry.json         NEW (at implementation)
  pilot-performance-evidence.json       NEW — exactly 3 rows
  pilot-geometry-evidence.json          NEW — 7 pilot parts
  pilot-cooling-provenance.json         NEW — empty rows
  human-verification-records.json       NEW — required entries for high cells
e2e/
  phase4-pilot-evidence.spec.ts         NEW, required
```

Small file splits are allowed. Inventory expansion, new dependencies, or
breaking existing contracts require a plan revision.

---

## 4. Data and fixture strategy

1. **No inventory migration.** Keep all 13 part IDs and paths.
2. **`benchmarks/prov4/` tree** (O4-A). Do not rewrite `benchmarks/perf1/`
   global stubs as measured and do not add provenance columns to perf1 JSON.
3. **Pilot performance rows — exactly three, all registry-bound:**
   - one row each for `1080p`, `1440p`, `4k` with full pilot key fields;
   - **O1-A:** ≥1 row is `metricKind: "first-party-measured"` with complete
     `captureConditions`, **`runCount >= 2`**, charter metrics (`fpsAverage`,
     `fpsOnePercentLow`, frametime summary and/or raw), and structured
     `rawArtifact` that passes digest integrity (verification digests if
     claiming `"high"`);
   - remaining cells are **present** as `confidence: "stub"` +
     `metricKind: "synthetic-stub"` with explicit `MetricUnavailable` charter
     fields, **not** omitted;
   - missing pilot resolution rows are an **integrity failure**.
4. **Pilot geometry rows:** one per pilot part; `phys3EvidenceSourceId` equals
   that part's `physicalSpec.evidence.sourceId`; grade `Experimental` (O2-A).
5. **Cooling provenance:** production rows **empty**; runtime unavailable.
6. **Human verification:** required for any `"high"` performance cell; empty
   only if no upgraded claims ship.
7. **No GLB rewrite** for M0 (O2-A).
8. **No Cinebench** pilot cells.
9. **Vite fixture copy:** assert `dist/benchmarks/prov4` in Step 8.

---

## 5. Ordered build steps

### Step 0 — Owner M0 gate (planning only) — CLEARED

- [x] Owner accepts `specs/phase-4.md` (2026-08-09).
- [x] Owner accepts `specs/provenance-data-contract.md` (2026-08-09).
- [x] Owner accepts this plan (2026-08-09).
- [x] Owner formally accepts O1–O4 / D1–D16 (2026-08-09).
- [x] Receive a separate explicit implementation-start instruction.
- **Exit:** planning gates complete; implementation began on start instruction.

### Step 1 — `prov4` types and Zod schemas

- Add `src/contract/prov4.ts` and `prov4.schema.ts` from the accepted contract.
- Enforce:
  - source-class ceilings;
  - unique ids;
  - fpsMin < fpsMax;
  - external-review citation;
  - measurement `metricKind` coupling (first-party-measured vs synthetic-stub
    vs external-review);
  - first-party required `fpsAverage`, `fpsOnePercentLow`, available frametime;
  - **first-party-measured cross-field: `captureConditions.runCount >= 2` at
    every confidence** (Zod superRefine / equivalent); reject `0` and `1`;
  - stub/external-review explicit `MetricUnavailable` where applicable;
  - complete `captureConditions` when confidence is not stub, including
    structured `RawArtifactReference` (kind/locator/sha256/mediaType/byteLength);
  - `"high"` gate + `attestedArtifactDigests` must include capture sha256;
  - geometry `phys3EvidenceSourceId` required;
  - optional `asOf` on freshness input.
- Add `src/test/prov4.schema.test.ts` including deliberate high-gate failures
  and first-party `runCount: 0` / `runCount: 1` rejections (including
  `confidence: "medium"` cases).
- **Do not edit** existing contract public types (`perf1`, `phys3`, etc.).
- **Exit:** new schema tests and all existing unit tests pass.

### Step 2 — Pilot constants and pure freshness/binding

- `provenance/pilotBuild.ts`: exact part set, baseline key factory, RAM mapping
  constant, `isPilotBuild(state)`.
- `classifyFreshness.ts` + tests: omitted/invalid `asOf` → unknown; current;
  stale.
- `bindPerformanceEvidence.ts`: every unavailable reason including
  `incomplete_capture_conditions`.
- `bindGeometryEvidence.ts`: join **only** on
  `phys3EvidenceSourceId === physicalSpec.evidence.sourceId`, then assert
  partId / geometryDataVersion / modelGrade.
- `buildPilotDisclosureReport.ts`: when pilot, **always three** performance
  binding attempts + seven geometry entries + cooling unavailable.
- **Exit:** pure logic complete without network or React.

### Step 3 — Fixture authoring and integrity tests

- Author `benchmarks/prov4/*` per accepted O1–O4.
- Integrity tests:
  - exactly three performance rows, all registry-bound;
  - ≥1 first-party measured cell (O1-A) with charter metrics and
    `runCount >= 2` (medium or high);
  - residual stub cells use `synthetic-stub` + MetricUnavailable charter fields;
  - high gate cannot pass on fps-only records or bare-string artifact refs;
  - first-party rows with `runCount: 0` or `1` fail integrity at any confidence;
  - for each `repo-file` raw artifact: file exists, SHA-256 and byteLength match;
  - high verification digests include capture `sha256`;
  - seven geometry rows; each `phys3EvidenceSourceId` matches on-disk
    `physicalSpec.evidence.sourceId`;
  - empty cooling file valid.
- **Exit:** fixtures schema-parse; integrity green.

### Step 4 — Loaders

- Fetch `/benchmarks/prov4/...` with Zod parse (existing loader style).
- Fail closed on malformed production files.
- Empty cooling file remains valid.
- **Exit:** loaders unit-tested.

### Step 5 — Performance panel pilot sidecar overlay

- For each resolution: if pilot build and pilot key → display **prov4 sidecar**
  range, confidence, basis, capture summary (when present), provenance,
  freshness.
- Do **not** mutate `perf1` types or global 96-row table.
- Non-pilot builds: existing perf1 numbers unchanged.
- Missing pilot row (should be impossible post-integrity) → hard disclosure
  failure / unavailable, never invent FPS.
- **Exit:** unit tests cover measured vs residual-stub overlay; existing perf
  tests green.

### Step 6 — Physical / cooling disclosure extensions

- Show geometry provenance via `phys3EvidenceSourceId` join.
- Cooling stays unavailable with empty production provenance.
- Do not change mount/collision math or epsilon policy.
- **Exit:** pilot parts disclose Experimental grade + sources; mismatch fails
  closed for disclosure only.

### Step 7 — Evidence disclosure panel

- `EvidenceDisclosurePanel.tsx` consumes `PilotDisclosureReport`.
- Show pilot active/inactive, all three performance bindings (including stub
  residuals), geometry bindings, cooling unavailable, limitations.
- **Exit:** completion-scenario fields visible to E2E testids/roles.

### Step 8 — Unit, E2E, build, regression gate

| Layer | Required coverage |
|-------|-------------------|
| Schema/fixtures | 3 perf rows; charter metrics; raw artifact digest; 7 geometry joins; high-gate negatives; empty cooling |
| Freshness | omitted asOf → unknown; current; stale |
| Binding | every performance + geometry unavailable reason (incl. incomplete_charter_metrics, raw_artifact_integrity_failed) |
| Disclosure | pilot vs non-pilot; residual stub cells visible |
| Existing unit | vs0/vs2/compat2/perf1/phys3 remain green |
| Existing E2E | Phase 0 + 2 + 3 remain green |
| Phase 4 E2E | `e2e/phase4-pilot-evidence.spec.ts` |
| Build | `dist/benchmarks/prov4` present |

- Run `pnpm test`, `pnpm test:e2e`, `pnpm test:all`, `pnpm build`.
- **Exit:** all green on clean checkout.

### Step 9 — Evidence-quality closeout

- Walk `phase-4.md` §9 completion scenario.
- Record test counts, registry version, pilot data versions, accepted O1–O4,
  residual stub resolutions, cooling empty, Experimental geometry.
- Satisfy evidence-quality gate §13.2 (O1-A first-party cell present).
- Optional keepsake screenshot of pilot disclosure panel.
- **Exit:** owner explicitly accepts Phase 4 closeout.
- **Not done at plan acceptance time.**

---

## 6. Engine / UI boundaries

### 6.1 Provenance engine (pure)

- No React, Zustand, URL, or network inside binders/freshness/report builders.
- Inputs: parsed registry, evidence files, build state, optional assembly state,
  clock (`nowIso`).
- Outputs: discriminated bindings and disclosure report only.

### 6.2 Performance integration

- `perf1` stub table remains SSOT for non-pilot keys and is never rewritten as
  measured.
- Pilot path is an exact-key **sidecar overlay** in the panel/selector — not a
  `perf1` schema change and not a global confidence bump.

### 6.3 Physical integration

- Collision/mount engines unchanged.
- Geometry provenance join key is `phys3EvidenceSourceId` only (plus equality
  checks on partId / geometryDataVersion / modelGrade).
- Registry `sourceId` is origin identity, never the phys3 join key.

### 6.4 UI

- No design-system project, no new dependency, no animation framework.
- Evidence panel is the cross-cutting honesty layer.

---

## 7. Exit criteria (plan ready vs phase done)

### 7.1 This plan is ready for execution when

- [x] scope, contract, layout, steps, boundaries, tests, non-goals, risks are
      documented;
- [x] owner accepted scope + contract + plan (2026-08-09);
- [x] owner formally accepted O1–O4 / D1–D16 (2026-08-09);
- [x] owner separately authorizes implementation.

### 7.2 Phase 4 itself exits when

- Steps 1–9 complete;
- software gate and evidence-quality gate both pass;
- owner records closeout in `STATUS.md`.

---

## 8. Explicit non-goals

- Catalog / game / preset expansion.
- Full matrix remeasurement.
- Cinebench pilot cells.
- Production cooling evidence / derate.
- Third-party mesh import.
- Backend, auth, live price, deploy.
- CFD / thermal simulation / bucket auto-map FPS derate.
- New npm dependencies for provenance.
- Breaking or widening `perf1` / `phys3` / `vs2` public contracts.
- Missing pilot performance rows “because residual stub”.

---

## 9. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Stub rows relabeled as measured | False product claims | High gate + ceilings + integrity tests |
| Incomplete capture labeled high | Fake evidence-grade | Charter metrics + captureConditions + digest artifact + verification digests |
| Bare-string rawArtifactRef | Non-immutable "evidence" | Structured RawArtifactReference + on-disk digest checks |
| Ambiguous phys3 join | Wrong geometry disclosure | Single join field `phys3EvidenceSourceId` |
| Missing residual pilot cells | Disclosure hole / O1 conflict | Exactly-3-row integrity rule |
| Pilot evidence leaks to near builds | Wrong GPU/CPU inherits FPS | Exact key match only |
| Owner cannot capture first-party data | O1-A blocked | Capture is a closeout dependency, not optional under O1-A |
| Freshness clock flakiness | CI noise | Inject `nowIso`; optional `asOf` |
| Fixture copy path miss | Runtime 404 | Build asserts `dist/benchmarks/prov4` |

---

## 10. Accepted decisions (2026-08-09)

| ID | Resolution |
|----|------------|
| O1 | **A** — ≥1 first-party measured cell with `runCount >= 2`; all 3 cells registry-bound |
| O2 | **A** — Experimental only |
| O3 | **A** — 365 days |
| O4 | **A** — `benchmarks/prov4/` |
| Cinebench | Out |
| Cooling | Empty / unavailable |
| D1–D16 | Accepted as recorded in `specs/phase-4.md` §11 |

---

## 11. Related documents

| Document | Role |
|----------|------|
| [`specs/phase-4.md`](./specs/phase-4.md) | Accepted scope and pilot definition |
| [`specs/provenance-data-contract.md`](./specs/provenance-data-contract.md) | Accepted `prov4` types |
| [`TODO.md`](./TODO.md) | Gate checklist |
| [`BRIEF.md`](./BRIEF.md) | Direction brief |
| [`../phase-3/implementation_plan.md`](../phase-3/implementation_plan.md) | Structural precedent |
| [`../../../STATUS.md`](../../../STATUS.md) | Live project status |

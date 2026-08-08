# Phase 1 TODO

## Done

- [x] Scope lock (`specs/phase-1.md`)
- [x] Baseline + correction model types and normative rules (`specs/performance-data-contract.md`)
- [x] `WorkloadEstimate` type for Cinebench CPU-only scores (distinct from `PerformanceEstimate`)
- [x] Raw benchmark ingestion record shape (deferred runner; defined in contract doc)
- [x] Contract version string chosen and documented (`perf1`)
- [x] Baseline performance fixture table (96 rows; all rows `confidence: "stub"`)
- [x] Cinebench workload fixture table (8 rows; §2.5)
- [x] Environment-correction fixture examples (allowed correction inputs only)
- [x] Unavailable / withheld-correction examples (tests only)
- [x] Data-only fixture integrity check
- [x] `implementation_plan.md` written (ordered, file-level build plan)
- [x] `perf1` contract types + Zod schemas (`src/contract/perf1.ts`, `perf1.schema.ts`)
- [x] perf1 fixture loaders (`src/catalog/loadPerf1Fixtures.ts`)
- [x] Baseline performance model — 96-row lookup (`estimateBaseline.ts`, `baselineQuery.ts`)
- [x] Environment correction layer — apply with reason + withhold without guessed derate (`applyCorrection.ts`)
- [x] Correction interface stable for future Phase 3 cooling outputs (reserved fields on `CorrectionInput`)
- [x] Bottleneck / limiting-factor explanation on supported estimates
- [x] Cinebench workload model (`estimateWorkload.ts`)
- [x] Wire engine into Phase 0 performance panel (`PerformancePanel.tsx`, `perfPanelState.ts`)
- [x] Unit tests — baseline, unavailable, correction apply/withhold, workload, schema, loaders
- [x] Phase 0 E2E exit scenario still green (`pnpm test:all`)
- [x] Exit checklist green → Phase 1 complete; Phase 0 3D freeze lifted (2026-08-08)

## Open

### Parallel / inherited

- [ ] 3D asset license (`model.glb`) — still open from Phase 0; resolve before real hardware models ship

## Explicit non-goals (do not add here)

- Real thermal or fluid simulation
- Full logical compatibility engine (Phase 2)
- 3D collision, anchors, mounting, cooling mesh work (Phase 3)
- Expanding part or game inventory beyond `specs/phase-1.md` §2
- Live pricing, accounts, backend, auth, public deploy requirement
- Inventing FPS when data or correction evidence is missing
- Real benchmark ingestion / PresentMon runner (record shape only in contract)

## Notes

- Phase 0 remains the regression baseline; do not break `vertical-slice-v0` exit scenario.
- Stack is locked (ADR-001–003); do not re-litigate tooling in this phase folder.
- All perf1 fixture values remain `confidence: "stub"` — wiring fixtures, not measured benchmarks.
- Owner handles `git push`.

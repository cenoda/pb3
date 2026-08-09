# TODO — Phase 4.1 combination performance estimator

## Discussion gate

- [x] Create `docs/phases/phase-4.1/` sub-path
- [x] Algorithm discussion + O1–O9 owner lock
- [x] Temporary draft function caveat (motherboard/cooling out of M0)

## Planning gate

- [x] Write `specs/phase-4.1.md`
- [x] Write `specs/estimator-data-contract.md` (`est1`)
- [x] Write `implementation_plan.md`
- [x] Owner M0 package accept (via implementation-start prompt, 2026-08-09)
- [x] Separate implementation-start authorization (2026-08-09)

## Implementation gate (after start)

- [x] Step 1 — est1 types + Zod
- [x] Step 2 — benchmarks/est1 fixtures
- [x] Step 3 — pure estimator + unit matrix (exact/scaled/unavailable)
- [x] Step 4 — loaders + boot
- [x] Step 5 — UI binding + draftCaveat
- [x] Step 6 — e2e + full verification
- [x] Step 7 — stop (no Phase 5 / no perf1 rewrite)

## Path A — data curation (product numbers)

- [ ] Follow [`DATA_CURATION_CHECKLIST.md`](./DATA_CURATION_CHECKLIST.md)
- [ ] P0 rights/registry hygiene (TPU URL fix if needed)
- [ ] P2 at least one evidenced CPU scale edge (or document blocked)
- [ ] P3/P4 vendor and/or review FPS for pilot material match
- [ ] P5 verify: ≥1 resolution `est1-estimated` if data allows; else honest unavailable

## Explicitly out

- Runtime scraping
- GPU-bound waiver without CPU ratio
- Motherboard/cooling transforms in M0
- Estimator returning synthetic-stub
- Invented scale factors / chart-only FPS

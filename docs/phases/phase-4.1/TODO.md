# TODO — Phase 4.1 combination performance estimator

## Discussion gate

- [x] Create `docs/phases/phase-4.1/` sub-path
- [x] Algorithm discussion + O1–O9 owner lock
- [x] Temporary draft function caveat (motherboard/cooling out of M0)

## Planning gate

- [x] Write `specs/phase-4.1.md`
- [x] Write `specs/estimator-data-contract.md` (`est1`)
- [x] Write `implementation_plan.md`
- [ ] Owner M0 package accept (or accept via implementation-start prompt)
- [ ] Separate implementation-start authorization

## Implementation gate (after start)

- [ ] Step 1 — est1 types + Zod
- [ ] Step 2 — benchmarks/est1 fixtures
- [ ] Step 3 — pure estimator + unit matrix (exact/scaled/unavailable)
- [ ] Step 4 — loaders + boot
- [ ] Step 5 — UI binding + draftCaveat
- [ ] Step 6 — e2e + full verification
- [ ] Step 7 — stop (no Phase 5 / no perf1 rewrite)

## Explicitly out

- Runtime scraping
- GPU-bound waiver without CPU ratio
- Motherboard/cooling transforms in M0
- Estimator returning synthetic-stub

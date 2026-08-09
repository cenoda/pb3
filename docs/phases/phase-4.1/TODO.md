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

**Paused at Phase 4/4.1 freeze (2026-08-09).** Resume only after unfreeze.

- [ ] Follow [`DATA_CURATION_CHECKLIST.md`](./DATA_CURATION_CHECKLIST.md)
- [x] AMD specs catalog auto-harvest spine (`vendor-catalog/`)
- [ ] Map catalog names → `cpuId` / `gpuId`
- [ ] Spec-driven sim beyond M0 anchor/scale (separate package when unfrozen)
- [ ] Optional calibration / O4 reviews

## Explicitly out

- Runtime scraping
- GPU-bound waiver without CPU ratio
- Motherboard/cooling transforms in M0
- Estimator returning synthetic-stub
- Invented scale factors / chart-only FPS

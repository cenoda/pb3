# Phase 6 — TODO

Home: [`README.md`](./README.md) · Scope: [`specs/phase-6.md`](./specs/phase-6.md)
· Contract: [`specs/catalog-data-contract.md`](./specs/catalog-data-contract.md)
· Plan: [`implementation_plan.md`](./implementation_plan.md)

## M0 (planning)

- [x] Phase opened and scope drafted (2026-08-10)
- [x] `cat6` catalog data contract drafted
- [x] Implementation plan drafted (Steps 1–12)
- [x] **Owner decisions O1–O8 locked** (2026-08-10)
- [x] Owner acceptance of the M0 package (2026-08-10, by starting implementation)
- [x] Implementation started (2026-08-10)

## Implementation

- [x] Step 1 — `cat6` types + Zod + schema tests, no data (2026-08-10; 21 schema tests)
- [x] Step 1.1 — contract amendment found by the cost probe (2026-08-10):
      product-relative `DimensionsMm` + `raw` + `assignmentBasis`,
      `boostClockBasis`, rules C10–C11
- [x] Step 2 — source registry + one GPU end to end (2026-08-10):
      `gpu.asus-dual-rtx4070-o12g`, 2 sources, no invented field
- [ ] Step 3 — `ID_MIGRATION.md` map, reviewed before any rename
- [ ] Step 4 — execute the migration repo-wide; assert no legacy id remains
- [ ] Step 5 — `parts/catalog-manifest.json` + loader; retire `PHASE2_PART_PATHS`
- [ ] Step 6 — geometry generated from `dimensionsMm`; re-derive `phys3`
      verdicts; re-point `prov4` geometry version
- [ ] Step 7 — default build assembles on real dimensions; Phase 0 exit scenario
      re-run
- [ ] Step 8 — `src/perf/**` unavailable reasons say the estimator is in
      preparation; test asserts no presentable value
- [ ] Step 9 — grow to ≈30 parts, including a genuine interference pair
- [ ] Step 10 — MSRP + dated street snapshots; unsourced → `unavailable`,
      total `isPartial`
- [ ] Step 11 — `cat6.integrity` tests + E2E re-anchoring
- [ ] Step 12 — owner spot-check of three random parts

## Closeout

- [ ] `STEPS.md` — what was built, every changed `phys3` verdict with its
      arithmetic, deviations
- [ ] `CLOSEOUT.md` — owner result, what it rests on, gaps carried forward
- [ ] `STATUS.md` / [`../README.md`](../README.md) updated

## Carried into later phases (do not start here)

- **Phase 7** — catalog browser: browse-and-pick dialog, filters, comparison
- **Part images** — needs a rights ADR before any file lands
- **Real-hardware meshes** — `cat6` boxes are dimension-accurate, not
  shape-accurate
- **Platform breadth** — LGA1851 / LGA1700 / AM4, with the `compat2` widening
  that requires (**O2**)
- **Performance coverage** — the `est1` formula that makes most of the catalog
  answerable; needs a Phase 4 / 4.1 unfreeze decision (**O1**)

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
- [x] Step 3 — [`ID_MIGRATION.md`](./ID_MIGRATION.md) map, owner-approved
      2026-08-10: 13 legacy slots + slot 14 (**O7** reachability witness),
      decisions D1–D4, invariants I1–I9, blockers B1–B11
- [x] Step 3.1 — **B1/B2 contract policy** (2026-08-10): `maxMemorySpeedMtS` =
      vendor-published maximum (**D2**, contract rule **C14**) and the narrow
      non-AM5 negative-fixture exception (**D1**, contract rule **C15** + `identity.roleNote`)
      — both written into `specs/catalog-data-contract.md` before any motherboard
      was authored
- [x] Step 4 — execute the migration repo-wide; assert no legacy id remains
      (2026-08-10; 14 parts, `cat6.integrity` guard; price fixtures re-pointed, **B11**)
- [x] Step 5 — `parts/catalog-manifest.json` + manifest loader (**O8**); `PHASE2_PART_PATHS` retired (2026-08-10). Runtime manifest holds 14 parts after Step 6 slot 14 admission
- [x] Step 6 — visual geometry + physical authority boundary (2026-08-10):
      authority model implemented — clearance-limit checks authoritative, OBB
      `collision` / `clearance` advisory only; `conditional` status +
      conservative `appliesWhen` pruning (**B3**); synthetic CPU collision
      geometry removed with stale cooler `allowedContacts` (**B8**, **B12**); no
      envelope boxes from scalar limits (**B14**); slot 14 slice (plane GLB,
      collision-less physicalSpec, manifest admission, O7 E2E green); **`prov4`
      geometry-version re-point not required** — no new geometry representation
      dataset, `phys3-exp-20260808` retained (implementation plan Step 6).
      **RK1** clearance-limit arithmetic recorded in [`STEPS.md`](./STEPS.md)
- [x] Step 7 — default build assembles on real dimensions; Phase 0 exit scenario
      re-run (2026-08-11): default `BuildState` unchanged (North TG Dark +
      NH-D15 G2 + RM750e fits published limits); unit
      `phase6-step7-default-assembly.test.ts` + E2E
      `phase6-step7-default-assembly.spec.ts` + exit-scenario + O7 witness green;
      evidence in [`STEPS.md`](./STEPS.md) §5
- [ ] Step 8 — `src/perf/**` unavailable reasons say the estimator is in
      preparation; test asserts no presentable value
- [ ] Step 9 — grow to ≈30 parts, including a genuine interference pair
- [ ] Step 10 — MSRP + dated street snapshots; unsourced → `unavailable`,
      total `isPartial`
- [ ] Step 11 — `cat6.integrity` tests + E2E re-anchoring
- [ ] Step 12 — owner spot-check of three random parts

## Closeout

- [x] `STEPS.md` — Step 6 (authority / RK1, 2026-08-10) + Step 7 (default
      assembly evidence, 2026-08-11)
- [ ] `CLOSEOUT.md` — owner result, what it rests on, gaps carried forward
- [x] `STATUS.md` / [`../README.md`](../README.md) updated (2026-08-11 Step 7 truth-sync)

## Carried into later phases (do not start here)

- **Phase 7** — catalog browser: browse-and-pick dialog, filters, comparison
- **Part images** — needs a rights ADR before any file lands
- **Real-hardware meshes** — visual meshes may approximate published dimensions;
  authoritative physical checks use published specs + scalar rules (**C4**, **C16**)
- **Platform breadth** — LGA1851 / LGA1700 / AM4, with the `compat2` widening
  that requires (**O2**)
- **Performance coverage** — the `est1` formula that makes most of the catalog
  answerable; needs a Phase 4 / 4.1 unfreeze decision (**O1**)
- **Hardcoded GPU preload in `src/viewport/GpuModel.tsx`** — the file preloads a
  hardcoded list of exactly two GPUs, so a new catalog GPU gets no preload
  without a code edit; the same problem **O8** solves for catalog loading. Phase
  6 allows the **path re-point only**
  ([`ID_MIGRATION.md`](./ID_MIGRATION.md) §7)

## Escalated out of "later phases"

- **`conditional` physical-validation status** (**D4**, blocker **B3**) — the
  three-outcome rule is *all branches fit → `fit`*, *all fail →
  `interference`*, *mixed → `conditional`*. **Resolved 2026-08-10 (Step 6):**
  `conditional` is a `PhysicalValidationStatus` member and the clearance-limit
  evaluator reports `fit` / `interference` / `conditional` with conservative
  `appliesWhen` branch pruning (contract **C13**). The Phase 6 default build is
  chosen to clear every published branch unconditionally (**I5**) so it never
  depends on this
- **Permanent `caution` on every build** (**D3**, blocker **B4**) — under **O6**
  no board carries `biosMinVersionForCpu`, so `checkChipsetBios` is always
  `unavailable` and every clean build is demoted to `caution`. **Not accepted**
  as the phase's UX outcome. **Status: still open (2026-08-10).** To be resolved
  in its own bounded step together with
  `benchmarks/compat2/compatibility-examples.json` and verdict semantics. **No
  invented BIOS minimum may be written to make the banner go away**

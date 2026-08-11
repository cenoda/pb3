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
- [x] Step 8 — `src/perf/**` unavailable reasons say the estimator is in
      preparation; test asserts no presentable value (2026-08-11; unit
      `estimateBaseline.test.ts` + `estimateWorkload.test.ts`; `pnpm test` 38
      files / 320 tests)
- [x] Step 9 — grow the catalog (2026-08-11): 8 fully sourced parts added
      (14 → 22): `gpu.asus-dual-rtx4060-o8g`,
      `motherboard.asus-tuf-gaming-b650-plus-wifi`,
      `case.fractal-design-meshify-2-compact-black-solid`,
      `case.nzxt-h5-flow`, `psu.corsair-rm850e-cp-9020263-na`,
      `cooler.deepcool-ak620`, `cooler.coolermaster-hyper-212-halo-black`,
      `ram.teamgroup-t-create-expert-ddr5-6000-64gb`. The pre-existing O7
      interference pair (A3-mATX × NH-D15 G2) is untouched and still
      authoritative. **Did not reach ≈30**: AMD.com (sole AM5 CPU vendor),
      GIGABYTE.com, Noctua.at, Thermalright, Kingston, Arctic and be quiet!
      were unfetchable this session (timeouts / 403 / 429) and are not
      guessed around; per the plan's decision gate, only fully sourced
      candidates were added and the shortfall is reported rather than
      forced. See [`STEPS.md`](./STEPS.md) §Step 9 for the full record.
- [x] Step 10 — MSRP + dated street snapshots (2026-08-11): **historical**
      14 price rows in `benchmarks/cat6/catalog-prices.json` for 22 manifest
      parts — 12 street (KRW), 2 MSRP-only, 0 with both, 8 parts with no row
      at all (unsourceable this session, not fabricated). `buildPriceSummary`
      rewritten to map street snapshots only; MSRP never summed; missing/
      MSRP-only/non-KRW rows → `unavailable`, total `isPartial`.
      `benchmarks/price2/` deleted (B11 closed). See `STEPS.md` §Step 10.
      **Current after Step 12 corrective (2026-08-12):** 13 rows (11 street /
      2 MSRP-only / 9 absent) after removing revision-unverified GIGABYTE
      B650M Rev. 1.3 street row
- [x] Step 11 — `cat6.step11.integrity.test.ts` (9 tests) + rewritten
      `buildPriceSummary.test.ts` (9 tests) + 3 `catalogPriceFileSchema`
      tests + E2E re-anchoring in `phase2-compat-price.spec.ts` and
      `phase5-exit-conditions.spec.ts` (2026-08-11). Historical `pnpm test`
      39/339, `pnpm test:e2e` 19/19. See `STEPS.md` §Step 11
- [x] Step 12 — exhaustive factual audit packet (2026-08-11; corrective
      2026-08-12): [`STEP12_AUDIT.md`](./STEP12_AUDIT.md) — Playwright-backed
      audit of 22 parts; corrected ASUS B650-PLUS WIFI open-ended memory
      ceiling (`maxMemorySpeedMtS` removed); Lian Li A3 clearance charts
      visually re-verified PASS; GIGABYTE B650M Rev. 1.3 street price
      FIXED-REMOVED (no revision on Danawa/11st); evidence ledger rebuilt
      with exact citation URLs; misleading `scripts/step12-playwright-audit.mjs`
      deleted. Current: 17 PASS / 1 FIXED / 4 BLOCKED parts; 12 PASS / 1
      BLOCKED prices over 13 rows
- [x] Step 12 — **owner-accepted 2026-08-12** (after corrective audit
      `260169e` independent review). Acceptance gate closed
- [x] **B4** corrective packet (2026-08-12): `chipset-bios: unavailable`
      remains raw under O6 (no invented BIOS minima) but is **non-blocking**
      for aggregate compatibility and UI verdict; other unavailable checks
      still block / caution. Shared policy in `src/compat/unavailablePolicy.ts`

## Closeout

- [x] `STEPS.md` — Step 6 (authority / RK1, 2026-08-10) + Step 7 (default
      assembly evidence, 2026-08-11) + Step 8 (unavailable-reason wording,
      2026-08-11) + Step 12 / B4 truth-sync (2026-08-12)
- [ ] `CLOSEOUT.md` — owner result, what it rests on, gaps carried forward
      (**not** claimed; final Phase 6 owner closeout still pending)
- [x] `STATUS.md` / [`../README.md`](../README.md) updated (2026-08-12 B4
      truth-sync)

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
- **Permanent `caution` on every build** (**D3**, blocker **B4**) —
  **Resolved 2026-08-12.** Under **O6**, no board carries
  `biosMinVersionForCpu`, so `checkChipsetBios` still returns raw
  `unavailable` (transparency; BIOS coverage not modeled). B4 policy:
  only `checkId === "chipset-bios"` unavailable is non-blocking for
  `CompatibilityReport.overallStatus` and the UI verdict; every other
  unavailable check id keeps `unavailable` / `caution`. No BIOS data was
  fabricated. Shared SSOT: `src/compat/unavailablePolicy.ts`

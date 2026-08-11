# Phase 6 — Real parts catalog

The phase that replaces the invented data the Phase 0–5 work runs on.

**Status: M0 package drafted and accepted 2026-08-10. Owner decisions O1–O8
locked. Steps 1–12 complete and Step 12 owner-accepted 2026-08-12. Step 6
authority boundary (2026-08-10), Step 7 default-build assembly verification
(2026-08-11), Step 8 unavailable-reason wording (2026-08-11), Step 9 catalog
growth to 22 parts (2026-08-11), Step 10 sourced catalog prices + Step 11
integrity/E2E re-anchoring (2026-08-11) are recorded in [`STEPS.md`](./STEPS.md).
Step 12 exhaustive factual audit packet recorded 2026-08-11 and correctively
reviewed 2026-08-12 ([`STEP12_AUDIT.md`](./STEP12_AUDIT.md)). **B4 resolved
2026-08-12:** raw `chipset-bios: unavailable` preserved under O6 (BIOS not
modeled); non-blocking for aggregate compatibility and UI verdict. Final Phase
6 owner closeout still pending; Phase 7 not started.**

Phase 6 is **primarily a catalog/data phase** — the display layer stays as it
is. It is not purely data-only: Step 6 includes the narrowly scoped
physical-authority contract and evaluator changes that **B3** / **O7** required
(`conditional` status; scalar clearance-limit evaluation). No display-layer
redesign, performance-model expansion, price-engine redesign, or Phase 4/4.1
unfreeze occurred. It is the exact inverse of Phase 5 in direction — Phase 5
changed the display layer and no data.

| Artifact | Purpose |
|----------|---------|
| [`specs/phase-6.md`](./specs/phase-6.md) | Scope, exit conditions, the no-FPS consequence, the SKU id migration, out-of-scope list, locked decisions O1–O8, risks RK1–RK9 |
| [`specs/catalog-data-contract.md`](./specs/catalog-data-contract.md) | `cat6` — identity, dimensions, SKU performance spec, provenance, image fields, id convention, manifest, dual-price model, validation split |
| [`implementation_plan.md`](./implementation_plan.md) | Ordered Steps 1–12, untouchable boundary, verification, honest failure modes |
| [`TODO.md`](./TODO.md) | Checklist |
| [`STEPS.md`](./STEPS.md) | Step 6–11 closeout records — RK1 arithmetic, default-build assembly evidence, unavailable-reason wording, catalog growth to 22 parts, sourced catalog prices, integrity/E2E re-anchoring |
| [`../phase-5/CLOSEOUT.md`](../phase-5/CLOSEOUT.md) | The direction this phase answers: real catalog first, catalog browser second |

## The gate

The owner picks three parts at random and follows every engine-consumed field —
socket, chipset, memory, wattage, TDP, form factor, dimensions, boost clock,
power limit — to a citation with a retrieval date, in one hop. The phase passes
or fails on that.

Green tests and accepted documents are inputs, not the gate. Phase 5 established
this shape: the gate measures the thing itself, not a proxy for it.

## The three things to know before agreeing

1. **Most valid builds will show no FPS.** `perf1` covers 2 CPUs and 2 GPUs, and
   Phase 4.1 — the attempt to close exactly that gap — is frozen. Instead of a
   number, the product says the combination estimator is still in preparation.
   Disclosure, not regression: the fixture catalog was shaped to fit the
   evidence.
2. **Every share link produced so far breaks, once.** Part ids become real SKU
   ids, and the URL carries part ids. Old links open on the default build rather
   than erroring. Accepted deliberately — they pointed at parts that were never
   real.
3. **SKU granularity is the point.** An ASUS and an MSI RTX 4070 differ in
   dimensions *and* in clocks and power limits, so `cat6` records both. Calling
   them one product would erase two claims this project makes.

## Sequence

| Step | State |
|------|-------|
| M0 scope + contract + plan drafted | **Done — 2026-08-10** |
| Owner decisions O1–O8 | **Locked — 2026-08-10** |
| Owner acceptance + implementation start | **Done — 2026-08-10** (accepted by starting Step 1; no separate written acceptance) |
| Step 1 — `cat6` contract, no data | **Done — 2026-08-10** (`pnpm test` 32 files / 236 tests, `pnpm build` clean) |
| Steps 2–5 — source registry, id migration, manifest | **Done — 2026-08-10** (14 authored `cat6` parts; `parts/catalog-manifest.json` lists 14) |
| Step 6 — physical authority boundary + O7 witness | **Done — 2026-08-10** (clearance-limit checks authoritative, OBB advisory; slot 14 admitted; O7 E2E green; RK1 record in `STEPS.md`) |
| Step 7 — default build assembly verification | **Done — 2026-08-11** (default build fits; Phase 0 exit scenario + O7 re-run green; no `DEFAULT_BUILD_STATE_V2` change) |
| Step 8 — unavailable reasons say estimator in preparation | **Done — 2026-08-11** (`src/perf/estimateBaseline.ts`, `estimateWorkload.ts`; unit tests green; `pnpm test` 38 / 320, `pnpm test:e2e` 19) |
| Step 9 — grow the catalog | **Done — 2026-08-11** (14 → 22 parts, 8 fully sourced additions; ≈30 not reached — several manufacturer sites unfetchable this session; O7 pair untouched and still authoritative) |
| Step 10 — sourced catalog prices (**O5**) | **Done — 2026-08-11** (historical: 14 price rows for 22 parts — 12 street/KRW, 2 MSRP-only, 8 absent; `benchmarks/price2/` deleted). **Current after Step 12 corrective (2026-08-12):** 13 rows (11 street / 2 MSRP-only / 9 absent) after removing revision-unverified GIGABYTE B650M Rev. 1.3 street row |
| Step 11 — integrity + E2E re-anchoring | **Done — 2026-08-11** (9 new integrity tests, price mapping unit tests, 2 E2E specs re-anchored) |
| Step 12 — exhaustive factual audit packet | **Recorded — 2026-08-11; corrective review 2026-08-12** ([`STEP12_AUDIT.md`](./STEP12_AUDIT.md); ASUS B650 `maxMemorySpeedMtS` corrected; Lian Li A3 charts visually PASS; GIGABYTE Rev. 1.3 price FIXED-REMOVED; 17 PASS / 1 FIXED / 4 BLOCKED parts; 12 PASS / 1 BLOCKED prices over 13 rows) |
| Owner spot-check (Step 12 acceptance) | **Owner-accepted 2026-08-12** |
| B4 — permanent-caution under O6 | **Resolved 2026-08-12** — `chipset-bios: unavailable` informational/non-blocking; other unavailable checks still caution; no BIOS data invented |
| Final Phase 6 owner closeout | Pending — `CLOSEOUT.md` not written; Phase 7 not started |

## Relationship to other work

- **Phase 4 / 4.1 stay frozen.** No new evidence claim. Three mechanical
  carve-outs, all id-, version-, or wording-level: `prov4` pilot ids and geometry
  version, `perf1` fixture ids, and the `src/perf/**` unavailable reason strings
  (**Step 8 done — 2026-08-11**).
  The geometry-version carve-out was **not** exercised: no new geometry
  representation dataset exists, so `phys3-exp-20260808` is retained (see
  [`implementation_plan.md`](./implementation_plan.md) Step 6).
- **Phase 5 is closed and its surface is read-only.** If real data makes a screen
  wrong, that is recorded for the next phase.
- **Phase 7 (catalog browser) depends on this.** The `cat6` image fields exist so
  that phase has somewhere to read from; no image file ships here.
- **Later platform breadth** — LGA1851, LGA1700, AM4 — is intended and deferred.
  It will require a deliberate, versioned widening of `compat2`'s DDR5 and form
  factor literals (**O2**).

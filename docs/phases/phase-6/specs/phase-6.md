# Phase 6 — Real parts catalog (M0 scope)

Status: **M0 drafted 2026-08-10. Owner decisions O1–O8 locked 2026-08-10
(§7). Package accepted and implementation started 2026-08-10 — the owner
accepted by implementing Step 1; no separate written acceptance was recorded.**

Charter authority: [`../../../../PROJECT_CHARTER.md`](../../../../PROJECT_CHARTER.md)
§2 (깊이 우선), §5 (성능 데이터 원칙), §6 (부품 데이터 모델 원칙).
Direction: [`../../phase-5/CLOSEOUT.md`](../../phase-5/CLOSEOUT.md) — "real
catalog first, catalog browser second".
Contract: [`catalog-data-contract.md`](./catalog-data-contract.md) (`cat6`).
Build plan: [`../implementation_plan.md`](../implementation_plan.md).

---

## 0. Purpose

Phases 0–4 built engines. Phase 5 built a surface. Both run on a **13-part
synthetic fixture catalog** in which every number was authored by this project
to make the engines demonstrable: sockets, wattages, dimensions, and prices are
invented, and the geometry is hand-tuned so that one specific cooler rotation
collides with one specific case.

Phase 6 replaces the invented data with **real, sourced manufacturer data at SKU
granularity**, at the same evidence standard `prov4` applies to performance
numbers.

This is a **data phase**. It mirrors the discipline of Phase 5 in the opposite
direction: Phase 5 changed the display layer and no data; Phase 6 changes the
data and no display layer.

### Why this is the next phase

Phase 5 carried out three known gaps — no part photos, dropdown instead of a
browse-and-pick picker, box-shaped 3D models — and recorded that all three are
blocked on the same prerequisite. That prerequisite is this phase. Building a
catalog browser over 13 invented parts would repeat the `product-ux-1` failure:
a gate that passes on shell properties while the thing itself is not real.

---

## 1. Exit conditions (normative)

The phase ends when all six hold.

1. **Every catalog part is a real product at SKU granularity.** Each entry names
   a manufacturer and a specific retail model — `ASUS Dual RTX 4070 OC`, not
   `RTX 4070`. No entry is a project invention. The `(fixture)` suffix required
   by Phase 5 **D2** is gone, because the condition that required it is gone.

2. **Every engine-consumed field traces to a source in one hop.** Socket,
   chipset, memory type and speed, capacity, wattage, TDP, form factor, physical
   dimensions, and the SKU-level clock and power fields each resolve — through
   the part's recorded source ids — to a registry entry carrying a citation and
   a retrieval date. The owner picks any three parts at random and verifies every
   such field against its cited source.

3. **Nothing unsourced is present.** Where a real value could not be sourced, the
   field is **absent** and the dependent engine check reports `unavailable` with
   a reason. No value is invented, estimated, or carried over from the fixture
   catalog to fill a hole (Charter §2).

4. **Physical validation runs on sourced dimensions.** Every physical-core part's
   collision box derives from its cited dimensions, and at least one **genuine**
   interference case exists in the catalog — a real part pair that really does
   not fit — replacing the hand-tuned synthetic collision.

5. **The app runs on the new catalog with no display-layer change.** Every part is
   selectable, the default build assembles in 3D, the canonical URL still
   round-trips, and `pnpm test:all` and `pnpm build` are green.

6. **Missing performance coverage presents as missing, and says why.** Any CPU ×
   GPU pair without a `perf1` row shows no FPS at all — not a nearest-neighbour
   value, not a carried-over range — and the reason states that the combination
   estimator is still in preparation (§3).

**Owner gate:** the owner performs exit condition 2 (the random spot-check of
three parts) and reviews the source registry, and passes or fails the phase on
that basis. Green tests are an input, not the gate. This mirrors Phase 5, where
the gate was a browser walkthrough rather than a test count.

---

## 2. Scope

| In | Out |
|----|-----|
| Real sourced SKU-level part data for all 7 categories | Any display-layer change |
| A source registry for catalog data, with citations and retrieval dates | New performance measurements or added `perf1` coverage |
| `cat6` contract: identity, dimensions, SKU performance spec, provenance, image **fields** | Image **files** (§5) |
| A one-time part-id migration to real SKU ids (§4) | Real-hardware 3D meshes |
| Manifest-driven catalog loading | A catalog browser / picker dialog (Phase 7) |
| Collision geometry regenerated from sourced dimensions | Live or scraped pricing |
| MSRP **and** dated street-price snapshots (**O5**) | BIOS-revision compatibility (**O6**) |

### Target size (owner-selected: few and curated)

Roughly 30 parts, ≈3–6 per category, on **AM5 / DDR5 only** (**O2**). A part
enters the catalog only if every field in exit condition 2 can be sourced for it.

---

## 3. Principal consequence: most builds will show no FPS

`benchmarks/perf1/performance-fixtures.json` holds 96 rows spanning exactly
**2 CPUs × 2 GPUs**. A catalog with 5 CPUs and 5 GPUs has 25 pairs, of which
**4** are covered. At SKU granularity the gap is wider still: a `perf1` row
re-pointed to one specific RTX 4070 SKU covers that SKU only, and the other 4070
SKUs in the catalog have no row (**O3**, **RK8**).

**Phase 4.1 (`est1`) was the attempt to close exactly this gap, and it is
frozen** ([`../../phase-4/FREEZE.md`](../../phase-4/FREEZE.md)). No coverage may
be added here.

So the product must say what is true: *the estimator is still being built.*
Concretely (**O1**):

- No FPS number is shown for an uncovered combination — no interpolation, no
  nearest neighbour, no fixture carry-over.
- The reason states that the combination estimator is in preparation, not that
  the app is broken and not that the parts are incompatible.
- This is delivered by rewriting the **unavailable reason strings in
  `src/perf/**`**, which the existing surface already renders
  (`ResultBar.tsx` composes `"No estimate is available for this combination."`
  plus the engine's reason). No display-layer file is touched. The current
  strings — `"No fixture row for gpuId … in perf1 baseline table."` — leak
  internal ids and jargon and are replaced with user language, which is also
  what Phase 5 **R4** requires.

This is disclosure, not regression. The fixture catalog was, in effect, a catalog
shaped to fit the evidence; making the catalog real makes the size of the gap
visible, and that gap is the stated driver for whichever phase resumes
performance work.

---

## 4. Part-id migration to real SKUs (**O3**, **O4**)

The fixture ids (`gpu.rtx4070`, `mb.micro-b450-01`, …) are retired. Real ids are
**SKU-level**, because at SKU granularity the differences are real ones this
project claims to model:

- **Physically**, an ASUS and an MSI RTX 4070 have different lengths, heights,
  and slot widths — which is precisely what `phys3` judges.
- **In performance**, they differ too: factory boost clocks, power limits, and
  cooler capability change sustained clocks. The difference is small relative to
  a `perf1` stub range, but it is real, and a catalog that pretends the two are
  one product cannot represent it.

`cat6` therefore records the SKU-level clock and power fields (contract §2) so
that the distinction is a modelled fact rather than a naming convention.

### What this breaks, once

Part ids are the join key across the repository. Renaming is a **single
mechanical migration**, executed in one step with a recorded mapping table:

| Consumer | Migration |
|----------|-----------|
| `benchmarks/perf1/performance-fixtures.json` (96 rows) | `cpuId` / `gpuId` re-pointed to the chosen SKU ids. **Coverage count unchanged** — 4 pairs before, 4 pairs after. Values stay `confidence: "stub"`; re-pointing does not make a stub a measurement of that SKU |
| `benchmarks/perf1/cinebench-fixtures.json`, `correction-examples.json`, `unavailable-examples.json` | Same re-point |
| `src/perf/applyCorrection.ts`, `src/estimate/estimatorQuery.ts` | Hardcoded example ids re-pointed. Mechanical string change; no logic change |
| `benchmarks/price2/price-fixtures.json` | Superseded by `benchmarks/cat6/catalog-prices.json` (**O5**) |
| `benchmarks/prov4/pilot-*.json`, `PROV4_PILOT_PART_IDS` in `src/contract/prov4.ts` | Pilot re-pointed to the SKU ids. Maintenance only — no grade change, no new measurement claim, freeze respected |
| `src/contract/vs2.ts` | `DEFAULT_BUILD_STATE_V2`, `PHASE2_*_IDS`, `PHASE2_PART_PATHS` replaced by the manifest (**O8**) |
| `e2e/**` | Selections re-pointed; each assertion's meaning preserved (**RK4**) |
| **Every share URL ever produced** | **Breaks.** See below |

### Share links break, once, deliberately

The canonical URL carries part ids, so every link produced before this phase
stops resolving to the same build. The decoder is lenient — unknown ids fall back
to defaults — so an old link opens the app on the default build rather than
erroring.

This is accepted: the links point at parts that were never real. It is recorded
here so it is a decision and not a surprise.

### Migration guard

The mapping table lives at `docs/phases/phase-6/ID_MIGRATION.md`, and an
integrity test asserts that **no legacy fixture id appears anywhere** in
`src/**`, `parts/**`, `benchmarks/**`, or `e2e/**` after the migration step. A
half-migrated repository is the failure mode this guard exists to catch.

---

## 5. Images: contract only, no files (owner-selected)

The `cat6` contract defines the image field and its licence and source fields so
Phase 7's browser has a place to read from. **No image file is added.**

The reason is the one that left the 3D asset licence open in
[`ADR-004`](../../../decisions/ADR-004-license-code-apache-2.0.md): manufacturer
product photography carries rights this project has not resolved. Shipping an
empty, well-specified field is honest; shipping a photo without a recorded
licence is the same error class as shipping a measured FPS number without a
capture record.

A separate ADR is required before any image file lands, and it is **not** part of
this phase.

---

## 6. Out of scope (binding)

As normative as the scope. It exists because this project's failure mode is drift
into whatever is technically interesting nearby.

- **No display-layer change.** `src/App.tsx`, `src/ui/**`, `src/styles/**` are
  read-only, exactly inverting Phase 5's boundary. If the new catalog makes a
  screen look wrong, that is recorded for Phase 7, not fixed here.
- **No Phase 4 / 4.1 unfreeze.** No new performance evidence, no new `prov4`
  claim, no `est1` coverage. Two mechanical carve-outs, both id- or
  version-level and neither asserting anything new about measurement:
  re-pointing `prov4` pilot ids and geometry versions, and re-pointing `perf1`
  fixture ids (§4).
- **One further carve-out:** the `unavailable` **reason strings** in
  `src/perf/**` may be rewritten to user language (§3). No logic, no signature,
  no numeric change.
- **No new games, presets, or resolutions.** The Phase 0 constants stand.
- **No catalog browser, filters, comparison, or picker dialog.** Phase 7.
- **No real-hardware meshes.** Boxes derived from real dimensions; grade stays
  `Experimental` because the mesh is still a box, even when the dimensions are
  cited.
- **No BIOS-revision compatibility** (**O6**). Socket compatibility only.
- **No live, scraped, or auto-refreshed pricing.** No server (ADR-001). Street
  prices are manually curated dated snapshots.
- **No new runtime dependencies.** Curation scripts may be added under
  `scripts/`, run offline, and are not part of the app bundle.
- **No inventory expansion beyond the accepted list.** The part list is fixed at
  acceptance.

---

## 7. Owner decisions (locked 2026-08-10)

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| **O1** | Accept that most valid builds will show **no FPS**? | **Accept — and state that the estimator is in preparation.** | Phase 4.1 was the attempt to close this gap and is frozen. The honest message is "the formula is being built", not silence and not a fabricated number. Delivered through `src/perf/**` reason strings; no UI change (§3). |
| **O2** | Platform coverage | **AM5 / DDR5 only — as a temporary narrowing.** LGA1851, LGA1700, and AM4 are all intended later; they are deferred because this phase is about getting a minimal surface right, not about breadth. | Keeps `compat2`'s `"DDR5"` literals valid for now. **Known future contract change:** adding DDR4 or a second socket family will require widening `MotherboardCompatSpec.supportedMemoryType`, `RamCompatSpec.memoryType`, and probably `formFactor` — a deliberate, versioned change in that later phase, not a silent widening. |
| **O3** | Existing 13 part ids | **Rename to real SKU-level ids.** | An ASUS 4070 and an MSI 4070 are different products — different dimensions, and different clocks and power limits, so different sustained performance. A catalog that calls both `gpu.rtx4070` cannot represent either claim this project makes. `perf1` rows are re-pointed to specific SKUs; coverage count is unchanged (§4). |
| **O4** | Fixture ids with no real counterpart | **Remove them.** No fixture id survives the phase. | The point of the phase is proximity to real products; keeping a placeholder id alive would preserve the thing being removed. |
| **O5** | Price data | **Record both:** manufacturer MSRP *and* a dated domestic street-price snapshot, each with its own source and retrieval date. | MSRP is stable and cleanly citable but far from a Korean buyer's real cost; a street snapshot is what a user recognises but goes stale immediately. Recording both keeps each fact honest about what it is. Totals are computed from **one** currency — see contract §2 and **RK9**. |
| **O6** | Motherboard BIOS revision | **Not considered.** Socket compatibility only; `biosMinVersionForCpu` is not populated. | `checkChipsetBios` already returns `unavailable` when the map is absent, so this needs **no engine change** — the check simply reports that BIOS compatibility is not covered by this catalog. |
| **O7** | Genuine interference case | **Required.** | Dimension-based interference is the project's distinguishing capability; a catalog that cannot demonstrate it removes that capability from the running app. |
| **O8** | Catalog loading | **Manifest** (`parts/catalog-manifest.json`), replacing `PHASE2_PART_PATHS`. | Charter §6 — adding a part should be data, not a code edit. At 30 parts the hardcoded array is already the wrong shape. |

---

## 8. Risks

| # | Risk | Handling |
|---|------|----------|
| **RK1** | Regenerating geometry from real dimensions changes `phys3` verdicts. The current cooler-rotated-180 interference is **engineered**: `clearance:cooler-sidekeepout` in the case GLB exists to be hit. | Every changed verdict is re-derived from the new dimensions and recorded with its arithmetic in `STEPS.md`. `benchmarks/phys3/physical-validation-examples.json` is rewritten from real cases. A verdict that changes without a recorded derivation fails review. |
| **RK2** | `prov4` rows carry `geometryDataVersion: "phys3-exp-20260808"` and the pilot part ids; new geometry and new ids invalidate them, and the loaders are fail-closed. | Mechanical re-point under the §6 carve-out. No `modelGrade` upgrade, no new claim. Any grade change is out of scope and needs the freeze lifted. |
| **RK3** | Sourcing ~30 parts × ~10 fields is the bulk of the work and is where invented values creep back in under time pressure. | Exit condition 3 plus the owner's random spot-check. A part with an unsourceable field is dropped rather than completed by guesswork. |
| **RK4** | E2E specs select parts by id and assert on fixture-derived outcomes. Real data and new ids change both. | Phase 5's re-anchoring discipline: each assertion's *meaning* is preserved; an assertion that cannot survive real data is raised as a scope question, not deleted. |
| **RK5** | Real dimensions may make the default build fail to assemble, breaking the Phase 0 exit scenario that has held since the first tag. | The default build is chosen from real parts that actually fit, verified in a browser before anything is retired. |
| **RK6** | Manufacturer spec pages move or disappear, breaking citations. | Registry entries record a retrieval date and, for file sources such as PDF datasheets, a digest — the pattern `prov4` established for raw artifacts. |
| **RK7** | The id migration is repo-wide and touches engine files, fixtures, and tests. A partial migration leaves silent broken joins — a row that matches nothing simply returns `unavailable`, which looks like normal missing coverage. | Single-step migration with a recorded mapping table plus an integrity test asserting no legacy id remains anywhere (§4). This risk is the reason that guard exists. |
| **RK8** | SKU granularity dilutes `perf1` further: with three 4070 SKUs in the catalog, the re-pointed row covers one and two show nothing. | Accepted under **O1**. The reason string says the estimator is in preparation, which is the accurate description of why the sibling SKU has no number. |
| **RK9** | `BuildPriceSummary` carries a single `currency` and `subtotalAmount`, so MSRP (USD) and street price (KRW) cannot both feed the total. | One currency drives the total — the street snapshot; MSRP travels as reference metadata on the row and is never summed. Parts without a street snapshot make the total `isPartial`, which `compat2` already models. No `compat2` change. |

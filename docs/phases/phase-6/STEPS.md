# Phase 6 — STEPS.md

Step closeout records. Home: [`README.md`](./README.md) ·
Plan: [`implementation_plan.md`](./implementation_plan.md) ·
Migration: [`ID_MIGRATION.md`](./ID_MIGRATION.md)

---

# Step 6 — Visual geometry and physical authority boundary

## 1. What was built (Step 6, 2026-08-10)

- **Authority model.** `kind === "clearance-limit"` checks from published catalog
  facts are authoritative. OBB `collision` / `clearance` geometry (from GLB
  bounds, overlap, missing `physicalSpec`) is **advisory-only**: it supports 3D
  preview, assembly visualization, and debug overlap signals, and never sets
  `overallStatus`, build verdict, blocked/caution/showResults, or factual reason
  text.
- **Scalar clearance-limit evaluator**
  (`src/physical/clearanceLimit/evaluateClearanceLimits.ts`): evaluates
  `maxCpuCoolerHeight` / `maxGpuLength` / `maxPsuLength` from published case
  `clearanceLimits` against selected parts' `dimensionsMm`, reporting `fit` /
  `interference` / `conditional` / `unavailable` per **C13** with conservative
  `appliesWhen` pruning. `conditional` is now a `PhysicalValidationStatus`
  member (**B3** resolved).
- **CPU collision geometry removed.** The synthetic `collision:cpu-die` node is
  gone; both CPU `physicalSpec.collisionNodes` are empty, and the stale cooler
  `allowedContacts` reference went with it (**B8**, **B12** closed).
- **No invented envelope boxes.** The generator derives no internal clearance
  volumes or case envelope boxes from scalar limits or case exterior
  `dimensionsMm` (**B14** closed).
- **Slot 14 admitted**
  (`motherboard.gigabyte-b650m-aorus-elite-ax-rev-1-3`): visual-only plane GLB,
  collision-less `physicalSpec`, runtime manifest entry — 14 of 14 parts
  loadable.
- **O7 witness proven in the running app** by
  `e2e/phase6-o7-slot14-witness.spec.ts`.
- **Geometry data version unchanged.** No re-point: no new geometry
  representation dataset exists; `phys3-exp-20260808` is retained (plan Step 6).
  Coverage note: **10 of 14** parts carry `physicalSpec`; the other four — the
  A3 case, the TUF B860M, the V550 SFX, and the G.SKILL kit — carry none; their
  GLBs are visual-only.

## 2. Authoritative clearance-limit arithmetic (**RK1**)

### The O7 interference verdict — the changed `phys3` verdict

| Input | Value | Where it comes from |
|---|---|---|
| LIAN LI A3-mATX `maxCpuCoolerHeight` | **165 mm** | published `clearanceLimits` (single limit; no branches) |
| Noctua NH-D15 G2 `dimensionsMm.heightMm` | **168 mm** | published "Height with fan(s): 168 mm" |
| Comparison | **168 mm > 165 mm** | scalar rule: `heightMm > limitMm` → `interference` |
| Excess | **3 mm** | |

Result: check `clearance-limit:cpu-cooler-height` → `interference`; overall
physical status `interference`; verdict **"do not physically fit"** (blocked).

**Authority, stated plainly:** this result comes from **published catalog facts
and the clearance-limit evaluator** — `clearanceLimits` and `dimensionsMm`,
each provenance-backed in `benchmarks/cat6/catalog-source-registry.json` — and
**not** from OBB geometry, GLB mesh bounds, or engineered mesh collision. The
A3 case carries no `physicalSpec` at all; the limit lives in catalog facts,
which is exactly the point of the authority boundary.

### The O7 reachability route (why slot 14)

Before slot 14, every build containing the A3 case was compat-blocked before the
physical stage — `case-form-factor` with the ATX boards, `cpu-socket` with the
LGA1851 board — so the interference existed in the data but could not be shown
in the app. Slot 14 (GIGABYTE B650M AORUS ELITE AX Rev. 1.3 — AM5 · DDR5 ·
Micro-ATX) opens the compat-clean path:

| Check | Arithmetic | Result |
|---|---|---|
| `case-form-factor` | A3 `["Micro-ATX"]` ∋ Micro-ATX | compatible |
| `cpu-socket` | AM5 ↔ AM5 | compatible |
| `ram-support` | DDR5 ↔ DDR5, 6000 ≤ 8000 | compatible |
| `psu-wattage` | (65 + 200) × 1.3 = 344.5 W ≤ 750 W | compatible |
| `chipset-bios` | no map under O6 | unavailable — does not hide the physical stage |
| physical | 168 > 165 | **interference** |

Witness build: A3 + slot 14 + NH-D15 G2 + Ryzen 5 7600 + T-CREATE
DDR5-6000 + ASUS Dual RTX 4070 OC + Corsair RM750e. The E2E asserts
`physical-validation-panel[data-overall-status="interference"]` and check
`clearance-limit:cpu-cooler-height[data-status="interference"]`.

### Counter-check on the default build (unchanged verdict, recorded)

The default build (Fractal Design North TG Dark + NH-D15 G2 + RM750e) stays
`fit` under the same evaluator: `maxCpuCoolerHeight` 170 mm ("without Fan
Bracket") ≥ 168 mm → fit with 2 mm clearance; RM750e 140 mm ≤ 155 mm and
≤ 255 mm → fit in every published PSU branch (**I5**). The O7 verdict is not a
special case of the rule.

## 3. Deviations from the M0 plan

- **No new `geometryDataVersion`** (`cat6-spec-⟨date⟩` was never created). The
  M0 text assumed Step 6 would produce a new dimensions-driven geometry dataset;
  it did not, so no re-point (plan Step 6). `phys3-exp-20260808` retained
  everywhere.
- **No GLB-vs-`dimensionsMm` tolerance gate** (the planned 0.1 mm
  render-equality contract) — superseded by **C16**: visual geometry is not
  catalog truth.
- **OBB geometry demoted, not deleted.** The fixture mechanics
  (`clearance:cooler-sidekeepout`, OBB overlap) remain in the GLBs for preview
  and debug but no longer set verdicts; the OBB engine stays.
- **Fixture-era verdicts superseded.** The default-build `fit` and the O7
  interference now rest on published scalar limits instead of tuned collision
  geometry.

## 4. Status after this record

Step 6 is **complete**. Step 7 follows below. Steps 8–12 remain open. Phase 7
has not started.

---

# Step 7 — Default build assembly verification

## 5. What was verified (Step 7, 2026-08-11)

Default build (`DEFAULT_BUILD_STATE_V2`) was audited against the live
manifest-loaded 14-part `cat6` catalog. **It assembles.** No change to the
default part set was required (**RK5**).

### Default build (unchanged)

| Slot | Part id |
|------|---------|
| Case | `case.fractal-design-north-tg-dark` |
| Motherboard | `motherboard.gigabyte-b650-aorus-elite-ax-v2` |
| CPU | `cpu.amd-ryzen-5-7600` |
| GPU | `gpu.asus-dual-rtx4070-o12g` |
| Cooler | `cooler.noctua-nh-d15-g2` |
| RAM | `ram.teamgroup-t-create-expert-ddr5-6000-32gb` |
| PSU | `psu.corsair-rm750e` |

### Catalog + assembly

| Check | Evidence |
|-------|----------|
| Manifest size | `parts/catalog-manifest.json` → 14 parts, `catalogContractVersion: "cat6"` |
| Default ids resolve | all 7 default part ids present in manifest / `loadPartCatalog` |
| Mounts | `buildAssemblyState` → `allMounted === true`, 6 selections, empty `unavailableReasons` |
| 3D viewport | `data-assembly-status="fit"`; `data-assembly-poses` includes mb / cooler / psu / gpu |

### Authoritative clearance-limit arithmetic (default)

| Family | Measurement | Published limits | Result |
|--------|-------------|------------------|--------|
| CPU cooler height | NH-D15 G2 **168 mm** | North **170 mm** ("without Fan Bracket") | **fit** (2 mm clearance) |
| PSU length | RM750e **140 mm** | **255 mm** (1 HDD Tray) and **155 mm** (2 HDD Tray) | **fit** on **both** branches (**I5**) |
| GPU length | Dual RTX 4070 OC **267.01 mm** | North **355 mm** | **fit** |

OBB `collision` / `clearance` checks on the default orientation: all **fit** —
no false advisory interference, and none of them set authoritative status
(Step 6 authority boundary).

### Browser / E2E evidence (2026-08-11)

Commands:

```bash
pnpm exec vitest run src/test/phase6-step7-default-assembly.test.ts
pnpm exec playwright test \
  e2e/phase6-step7-default-assembly.spec.ts \
  e2e/exit-scenario.spec.ts \
  e2e/phase6-o7-slot14-witness.spec.ts
```

Results:

| Suite | Result |
|-------|--------|
| Unit `phase6-step7-default-assembly.test.ts` | **3/3 PASS** |
| E2E `phase6-step7-default-assembly.spec.ts` | **1/1 PASS** — clean `/` load, 14-part manifest via HTTP, default selectors, viewport poses, cooler/PSU/GPU clearance-limit `fit`, zero OBB interference |
| E2E `exit-scenario.spec.ts` (Phase 0 path) | **4/4 PASS** — clean load, CPU change, GPU swap, reload/share-link restore, invalid-part fallback, fixture HTTP |
| E2E `phase6-o7-slot14-witness.spec.ts` | **1/1 PASS** — O7 still reachable; `clearance-limit:cpu-cooler-height` interference; verdict blocked |

### Truth-sync artifacts added

- `src/test/phase6-step7-default-assembly.test.ts` — locks catalog size, mounts,
  cooler/PSU branch arithmetic, no OBB interference
- `e2e/phase6-step7-default-assembly.spec.ts` — locks the same criteria in the
  running SPA against `vite preview` + dist fixtures

### Status after this record

Step 7 is **complete**. Default build unchanged. Steps 8–12 are open. Do not
start catalog growth, price work, or Phase 7 from this record.

---

# Step 8 — Unavailable reasons say "in preparation" (**O1**)

## 1. What changed (2026-08-11)

- **`src/perf/estimateBaseline.ts`** — missing baseline coverage and vocabulary
  validation reasons no longer mention `perf1`, fixture rows, or internal table
  names. Uncovered combinations return a single preparation-oriented message.
- **`src/perf/estimateWorkload.ts`** — same treatment for uncovered workload rows
  and unsupported CPU coverage; vocabulary errors use supported-setting wording
  without internal jargon.
- **No UI, schema, fixture data, or estimator logic changes.** Function
  signatures, unavailable status semantics, and numeric outputs are unchanged.

## 2. User-facing missing-coverage reason (canonical)

```text
The combination performance estimator is still in preparation; performance data is not available yet.
```

## 3. Verification

| Suite | Result |
|-------|--------|
| Unit `estimateBaseline.test.ts` | **7/7 PASS** — includes uncovered baseline combination (no FPS, preparation reason, no internal table jargon) |
| Unit `estimateWorkload.test.ts` | **3/3 PASS** — includes uncovered workload row + covered rows unchanged |
| `pnpm test` (full unit) | **38 files / 320 tests PASS** (+2 tests vs Step 7) |
| `pnpm test:e2e` | **19/19 PASS** |
| `pnpm build` | **clean** |

## 4. Status after this record

Step 8 is **complete**. **Next open step: Step 9** (grow catalog to ≈30 parts).
Do not start catalog growth, price work, or Phase 7 from this record alone.

---

# Step 9 — Grow the catalog (audit + partial growth, 2026-08-11)

## 1. Pre-implementation audit

Before adding anything, the existing 14-part catalog was counted by category
and the growth precondition (does a part *need* `physicalSpec`?) was checked
against the running pipeline rather than assumed:

| Category | Count before | Count after |
|---|---|---|
| case | 2 | 4 |
| motherboard | 3 | 4 |
| cpu | 2 | 2 |
| gpu | 2 | 3 |
| cooler | **1** | 3 |
| ram | 2 | 3 |
| psu | 2 | 3 |
| **Total** | **14** | **22** |

**Key finding that shaped the approach:** 4 of the original 14 parts
(`case.lian-li-a3-matx-black`, `motherboard.asus-tuf-gaming-b860m-plus-wifi`,
`psu.cooler-master-v550-sfx-gold`, `ram.gskill-trident-z5-rgb-ddr5-8400`)
already ship with **no `physicalSpec`**. Tracing the pipeline confirmed this is
fully supported, not a gap: `buildAssemblyState` marks a `physicalSpec`-less
part `status: "unavailable", reason: "missing_physical_spec"` with no crash,
and the authoritative **clearance-limit evaluator reads `dimensionsMm` /
`clearanceLimits` from `part.json` directly**, independent of `physicalSpec`.
Only the advisory 3D/OBB layer is affected. This meant Step 9 did not need to
hand-author per-category collision/anchor geometry for every new part — a
sourced `dimensionsMm` plus a minimal visual placeholder GLB is sufficient and
honest (**C16**: render geometry is not catalog truth; no tolerance gate).

**O7 re-verification (unchanged):** `case.lian-li-a3-matx-black`
`maxCpuCoolerHeight` 165 mm vs `cooler.noctua-nh-d15-g2` `heightMm` 168 mm
→ `168 > 165` → authoritative `interference`, both figures still cited in
`benchmarks/cat6/catalog-source-registry.json`. Neither part was touched by
Step 9; the witness remains reachable exactly as Step 6 left it.

## 2. Sourcing constraints found during the audit

`WebFetch` was exercised against every candidate vendor before any part was
authored. Working manufacturer domains: ASUS (GPU + motherboard techspec),
NVIDIA (chip-level TGP), Corsair (PSU), Fractal Design (case), NZXT (case),
DeepCool (cooler), Cooler Master (cooler; already a catalog vendor for PSU),
TEAMGROUP (RAM; already a catalog vendor). **Unfetchable this session** (403 /
429 / 60s timeout, each retried at least twice): **AMD.com** (domain-wide
timeout, including the plain model-listing page — this blocks all new CPU
candidates, since AMD is the sole AM5 vendor in scope), **GIGABYTE.com** (403),
**Noctua.at** (429, persisted across a multi-minute spread of retries),
**Thermalright.com** (403), **Kingston.com** (403), **Arctic.de** (no
machine-readable spec content returned), **bequiet.com** (403). No candidate
resting on these sources was added, and none was guessed around with a
retailer or review-site substitute standing in as "manufacturer-spec".

**One further self-imposed exclusion:** ASUS Dual GeForce RTX 4060 Ti OC
8GB was researched and dropped. ASUS's own techspec page publishes no TDP
field for it, and NVIDIA's chip-level reference table lists Total Graphics
Power for the RTX 4060 Ti as **"165 or 160" W without splitting the figure by
8GB/16GB memory configuration** — confirmed by three separate targeted
re-fetches of the same table asking for the per-column breakdown. Recording
either number would assert a precision the source does not give (**C1**), so
the unambiguous RTX 4060 (single TGP figure, 115 W) was catalogued instead.

## 3. Parts added (14 → 22)

None of the eight carry `physicalSpec` (visual-only placeholder box GLB from
`scripts/author-cat6-step9-glbs.mjs`, generator string
`pb3-cat6-step9-visual-placeholder`).

| Id | Category | Sourced fields | Primary source(s) |
|---|---|---|---|
| `gpu.asus-dual-rtx4060-o8g` | gpu | dims 227.2×123.24×49.6 mm; boost 2505/2535 MHz; `tdpWatts` 115 | ASUS techspec; NVIDIA RTX 4060/4060 Ti family page |
| `motherboard.asus-tuf-gaming-b650-plus-wifi` | motherboard | AM5/AMD B650/ATX/DDR5; `maxMemorySpeedMtS` absent (`7600+(OC)` open-ended ceiling, same "+" rule as the B860M); dims 305×244 mm, no thickness | ASUS techspec |
| `case.fractal-design-meshify-2-compact-black-solid` | case | dims 424×210×475 mm (labelled LxWxH); `maxGpuLength` 341/360 mm (front-fan branches); `maxCpuCoolerHeight` 169 mm; `maxPsuLength` 200/165 mm (HDD-cage branch); `supportedFormFactors` [ATX, Micro-ATX] (Mini-ITX dropped) | Fractal Design product page |
| `case.nzxt-h5-flow` | case | dims 430×465×225 mm (labelled H×W×D, D→length); `maxGpuLength` 410 mm; `maxCpuCoolerHeight` 170 mm; `maxPsuLength` 200 mm; `supportedFormFactors` [ATX, Micro-ATX] (E-ATX, Mini-ITX dropped) | NZXT product page |
| `psu.corsair-rm850e-cp-9020263-na` | psu | dims 140×150×86 mm (unlabelled triplet; length assigned by comparison with the RM750e sibling SKU, which does label Length and shares the identical triplet); `wattage` 850 | Corsair product page |
| `cooler.deepcool-ak620` | cooler | dims 129×138×160 mm (labelled L×W×H, with-fan/installed envelope) | DeepCool product page |
| `cooler.coolermaster-hyper-212-halo-black` | cooler | dims 124×73×154 mm (labelled L×W×H) | Cooler Master product page |
| `ram.teamgroup-t-create-expert-ddr5-6000-64gb` | ram | DDR5, `speedMtS` 6000, `capacityGb` 64; dims 133×32×7 mm (same module design as the existing 32 GB CL30 kit) | TEAMGROUP product page |

9 new source registry entries were added to
`benchmarks/cat6/catalog-source-registry.json` (18 → 27 sources;
`registryVersion: "cat6-registry-20260811"`), each with citation and
`retrievedAt: "2026-08-11"`. `parts/catalog-manifest.json` bumped to
`catalogVersion: "cat6-20260811"` and now lists 22 parts.

## 4. Truth-sync (pre-existing tests that pinned "14")

Three tests hard-coded the prior catalog size and were updated to 22, with no
change to what they otherwise assert:

- `src/test/loadPartCatalog.test.ts` — `catalog.byId.size`
- `src/test/compatibilityChecks.test.ts` — same assertion, plus the test name
- `src/test/phase6-step7-default-assembly.test.ts` +
  `e2e/phase6-step7-default-assembly.spec.ts` — manifest/parts length; the
  default-build, mount, and clearance-limit assertions these specs make are
  unchanged and still pass, because `DEFAULT_BUILD_STATE_V2`
  (`src/contract/vs2.ts`) was not touched.

No `src/contract/cat6.ts`, `cat6.schema.ts`, `src/physical/**`,
`src/compat/**`, `src/App.tsx`, `src/ui/**`, or pricing file was touched.

## 5. Verification

| Gate | Command | Result |
|---|---|---|
| Unit | `pnpm test` | **38 files / 320 tests PASS** |
| Build | `pnpm build` | clean; `dist/parts/**` (22 parts) and `dist/benchmarks/cat6/**` present |
| E2E | `pnpm test:e2e` | **19/19 PASS**, including the O7 witness spec and the re-anchored Step 7 default-assembly spec |
| Legacy-id guard | `cat6.integrity.test.ts` | PASS — no legacy fixture id introduced |
| Whitespace | `git diff --check` | clean |
| Default `BuildState` | `git diff -- src/contract/vs2.ts` | empty — untouched |
| O7 witness | `e2e/phase6-o7-slot14-witness.spec.ts` | PASS — still reachable, still `interference` |

## 6. Deviations from the M0 plan / open gaps

- **Catalog lands at 22, not ≈30.** Per the plan's own decision gate
  ("approximately 30 is subordinate to source completeness... do not add
  half-sourced parts"), growth stopped at the point where remaining
  candidates required a source that could not be fetched this session (AMD,
  GIGABYTE, Noctua, Thermalright, Kingston, Arctic, be quiet!) or where the
  only available figure was ambiguous (RTX 4060 Ti TGP). This is a **carried
  gap**, not a silent shortfall: **cpu stays at 2** because AMD is the sole
  AM5 CPU vendor in scope and AMD.com was unfetchable end-to-end (including
  its plain listing page) across repeated retries.
- **No new `physicalSpec` was authored.** All 8 additions follow the
  already-established visual-only pattern; this is a deliberate simplification
  enabled by the audit finding in §1, not an oversight.
- **Re-attempting Step 9** in a future session should retry the blocked
  domains (network conditions may differ) before falling back to any
  non-manufacturer source, and should keep excluding ambiguous chip-vendor
  figures like the RTX 4060 Ti TGP rather than picking a number.

## 7. Status after this record

Step 9 is **complete, catalog at 22 parts**. Steps 10–12 are open. Do not
start price work (Step 10), integrity/E2E re-anchoring (Step 11), the owner
spot-check (Step 12), or Phase 7 from this record.

---

# Step 10 — Sourced catalog prices (**O5**, 2026-08-11)

## 1. What was built

- `benchmarks/cat6/catalog-prices.json` — new file, `CatalogPriceFile`
  envelope (`catalogContractVersion: "cat6"`, `dataVersion:
  "cat6-prices-20260811"`, `rows: CatalogPriceRow[]`). Minimal envelope
  type/schema added to `src/contract/cat6.ts` / `cat6.schema.ts` per the
  existing `CatalogMsrp` / `CatalogStreetPrice` / `CatalogPriceRow` shapes —
  those were not redesigned. Schema enforces unique `partId` and rows sorted
  ascending by `partId` (deterministic ordering, mechanically checked, not
  just a convention).
- `src/price/loadCatalogPrices.ts` — fetches and Zod-validates the file;
  replaces `src/price/loadPriceFixtures.ts` (deleted).
- `src/price/buildPriceSummary.ts` — rewritten to map `CatalogPriceRow` into
  the unchanged `compat2` `PricedPart` / `BuildPriceSummary` shapes:
  - Street snapshot alone drives `status: "ok"` lines; `basis` is exactly
    `"<retailer> listing in <region>, retrieved <retrievedAt>; snapshot, not
    a live quote"`.
  - A missing row, an MSRP-only row, or a street price in a currency other
    than KRW all map to `status: "unavailable"` with a specific reason —
    MSRP is never read into `amount` and never summed.
  - `dataVersion` on the summary and every line comes from the loaded file's
    `dataVersion`, not a hardcoded string (`"compat2-fixture-draft"` is
    gone).
  - Runtime total currency is `KRW`, enforced in code: a street price whose
    `currency !== "KRW"` is withheld from the sum rather than added.
- `src/App.tsx` — `loadPriceFixtures()` / `PriceFixtureFile` replaced with
  `loadCatalogPrices()` / `CatalogPriceFile`; `boot.priceFixtures` renamed
  `boot.catalogPrices`. No other `App.tsx` diff.
- `benchmarks/price2/` **deleted** (the B11 disposition recorded in
  `ID_MIGRATION.md`: deletion was deferred until sourced catalog prices
  existed; they now do). `src/price/loadPriceFixtures.ts` deleted.
  `PriceFixtureFile`, `COMPAT2_FIXTURE_BASIS`, `COMPAT2_PRICE_FIXTURES_PATH`
  (contract/compat2.ts) and `priceFixtureFileSchema`
  (contract/compat2.schema.ts) deleted as dead code — `PricedPart` and
  `BuildPriceSummary`, the actual `compat2` price surface, are unchanged.
- `src/ui/ResultBar.tsx` and `src/ui/WhyThisResult.tsx` — two hardcoded
  copy strings corrected under the re-anchoring requirement "no
  demo/fixture/live-price false claim remains": `"Fixed demo prices, not
  live shop prices"` → `"Prices are dated domestic street-price snapshots,
  not live quotes"`; `"fixture prices, not live market quotes"` /
  `"some parts lack fixture prices"` → `"domestic street-price snapshots,
  not live market quotes"` / `"some parts lack a street-price snapshot"`.
  No other `src/ui/**` diff — this is data-honesty text tied directly to
  the price model this step changes, not a display-layer redesign.

## 2. Source coverage (owner-facing counts)

22 manifest parts; sourcing was attempted for all 22.

| Count | Value |
|---|---|
| Rows with MSRP | 2 (`psu.corsair-rm750e`, `case.nzxt-h5-flow`) |
| Rows with street price | 12 |
| Rows with both MSRP and street | 0 |
| Manifest parts with no street price | 10 |
| Manifest parts with **no price row at all** (neither sourced) | 8 |
| Total rows in `catalog-prices.json` | 14 |

Street prices are Danawa (다나와) price-comparison snapshots in KRW, region
`KR`, retrieved 2026-08-11, each tied to the specific SKU already authored in
the part record (color/revision/CL-rating/ATX-cert checked against the part's
own `identity`/`notes`, not assumed from the product name alone). MSRP prices
are the manufacturer's own store-listed price in USD, also retrieved
2026-08-11.

**8 parts carry no price row at all** — no empty or fabricated row was
created for them, per contract **C1**:

- `cpu.amd-ryzen-5-7600` — the 정품 (official retail box) listing is
  discontinued on Danawa; no MSRP source was reachable (AMD.com timed out,
  consistent with Step 9's finding)
- `gpu.asus-dual-rtx4070-o12g`, `gpu.asus-proart-rtx4080-o16g`,
  `gpu.asus-dual-rtx4060-o8g` — all three non-Super/non-Ti original RTX
  40-series O-series SKUs are discontinued on Danawa (confirmed by repeated,
  independent fetches); no MSRP source was reachable
- `cooler.deepcool-ak620`, `cooler.coolermaster-hyper-212-halo-black` — out
  of stock / discontinued on Danawa; no manufacturer store price published
- `ram.gskill-trident-z5-rgb-ddr5-8400` — the white `TZ5RW` SKU this catalog
  records is not carried by Korean retail (only the black `TZ5RK` variant is
  listed, a different SKU); no MSRP found
- `psu.cooler-master-v550-sfx-gold` — not listed on Danawa at all; no MSRP
  found

**2 parts carry MSRP only:**

- `psu.corsair-rm750e` — Corsair.com lists $114.99. Danawa's ATX3.1 listing
  for this model prints a **Platinum** ETA certification, which does not
  match this catalog's own **Cybenetics Gold** citation for `CP-9020295-NA`;
  rather than force an ambiguous SKU match, the street price is left
  unsourced (contract §7 stop condition: "a source value is ambiguous or
  cannot be tied to the exact SKU")
- `case.nzxt-h5-flow` — NZXT.com lists $94.99. The original (non-V2) H5 Flow
  matte black is discontinued on Danawa

**12 parts carry a street price**, including the default build's case,
motherboard, cooler, and RAM.

**Consequence for the running app:** the default build's CPU
(`cpu.amd-ryzen-5-7600`) and GPU (`gpu.asus-dual-rtx4070-o12g`) carry no
price row, and its PSU (`psu.corsair-rm750e`) is MSRP-only — so the default
build's total is **always `isPartial: true`** under this sourcing state. This
is disclosed on the surface (`price-partial-label`, the ResultBar trust
line), not hidden. It is a direct, honestly-reported consequence of these
specific SKUs' Danawa listing status on the retrieval date, not a shortfall
in sourcing effort — see the source-access gaps below.

## 3. Source-access gaps (parity with Step 9's blocker record)

- **AMD.com** — domain-wide timeout, as in Step 9. No CPU MSRP reachable.
- **ASUS store** (`store.asus.com`, `row.store.asus.com`) — DNS/403 failures.
  No GPU or motherboard MSRP reachable from ASUS directly.
- **GIGABYTE.com store**, **Noctua.at store**, **TEAMGROUP store**,
  **G.SKILL** — not fetchable for price this session (GIGABYTE and Noctua
  consistent with Step 9's blocker list; TEAMGROUP's product page 404'd on
  the attempted path; G.SKILL does not appear to publish direct pricing).
- **DeepCool** and **Cooler Master** manufacturer pages loaded but published
  no price field (only a "Buy Now" link to third-party retailers).
- **Fractal Design** manufacturer pages loaded but published no price field.
- Several exact-SKU Danawa listings (original RTX 4070/4080/4060 O-series,
  AK620, Hyper 212 Halo Black, Ryzen 5 7600 정품, RM750e ATX3.1 Gold) show
  **"가격비교 중지" (price comparison discontinued)** or zero active sellers
  as of 2026-08-11 — verified by repeated independent fetches, not a single
  flaky read. Given the ~3.5-year age of the RTX 40 non-Super/non-Ti SKUs and
  the ATX3.0→3.1 PSU refresh cycle, this reads as genuine retail EOL rather
  than a fetch failure, but it is recorded as a finding, not asserted as
  certain.
- Retailer access was **not broadly blocked** — Danawa, Corsair.com, and
  NZXT.com all returned usable content, so this is reported as partial
  coverage with specific per-part reasons, not a stop-and-report blocker.

## 4. Verification

| Gate | Command | Result |
|---|---|---|
| Unit | `pnpm test` | **39 files / 339 tests PASS** (+1 file, +19 tests vs Step 9's 38/320) |
| Build | `pnpm build` | clean; `dist/benchmarks/cat6/catalog-prices.json` present; `dist/benchmarks/price2/` absent |
| E2E | `pnpm test:e2e` | **19/19 PASS** |
| `git diff --check` | — | clean |

## 5. Status after this record

Step 10 is **complete**. Step 11 follows below.

---

# Step 11 — Integrity gates and E2E re-anchoring (2026-08-11)

## 1. Integrity coverage added

`src/test/cat6.step11.integrity.test.ts` (new, 9 tests), on top of the
integrity coverage Steps 1–9 already established
(`cat6.integrity.test.ts` legacy-id guard; `cat6.manifest.test.ts` T1–T6
manifest/join guards; `phys3.integrity.test.ts` node-reference/mount guards
for the 10 `physicalSpec`-bearing parts):

- every manifest `part.json` parses strictly as `cat6`
  (`partDefinitionV3Schema`, not the lenient runtime `partDefinitionV2Schema`)
- every manifest part's GLB parses as valid glTF 2.0 (all 22, not only the
  10 `physicalSpec`-bearing parts `phys3.integrity.test.ts` already covers)
- no authored `cat6` part populates `image` (**C7**)
- no image file exists under any `parts/**` folder
- every `dimensionsMm` on an authored part carries `provenance.dimensions`
- every `cat6` catalog price source (`msrp.sourceId` / `street.sourceId`)
  resolves in `catalog-source-registry.json`, exactly once
- `catalog-prices.json` `partId`s are unique and every row carries `msrp`
  and/or `street`
- every street price is `KRW` / region `KR` (the runtime total currency)
- no mixed-currency street snapshot exists in the price file

`cat6.manifest.test.ts` T6 was rewritten (was: price2 rows are a manifest
subset) to check the same join guard against `catalog-prices.json`, plus a
category-match assertion the old test did not make.

## 2. Unit tests for price mapping

`src/test/buildPriceSummary.test.ts` rewritten (2 tests → 9 tests):

- full street-price total (7/7 `ok`, `isPartial: false`, `currency: "KRW"`)
- MSRP-only row → `unavailable`, `amount` absent, reason mentions MSRP
- missing row → `unavailable` for all 7, subtotal 0
- partial total sums only the priced subset
- exact snapshot basis wording, byte-for-byte
- no `"phase-2"` / `"fixture price"` text anywhere in `basis`/`reason`
- a non-KRW street price is withheld, not summed; total currency stays KRW
- `dataVersion` on the summary and every line comes from the loaded file
- a live-data lock test against the real `catalog-prices.json` + default
  build, documenting the current honest partial state (cpu/gpu/psu
  unavailable) — an intentional lock to be updated deliberately, not
  silently, if sourcing coverage changes

`src/test/cat6.schema.test.ts` gained 3 tests for `catalogPriceFileSchema`
(accepts sorted+unique, rejects duplicate `partId`, rejects out-of-order
rows).

## 3. E2E re-anchoring (one assertion at a time, meaning preserved)

- `e2e/phase2-compat-price.spec.ts` — the default-build price assertions
  (`price-partial-label` count, `price-subtotal` currency text,
  `result-price` currency symbol) re-anchored from the old all-priced USD
  fixture total to the real, honestly-partial KRW total. Meaning preserved:
  *the total is on the surface and its partial/complete state is visibly
  correct* — the assertion now checks the true partial state instead of a
  stale complete one.
- `e2e/phase5-exit-conditions.spec.ts` test 4 — renamed from "the price is
  readable and marked as demo pricing" to "...truthfully marked as a dated
  snapshot, not a live quote"; asserts `₩` instead of `$`, `"not live
  quotes"` instead of `"not live shop prices"`, and explicitly asserts the
  word `"demo"` is **gone** (the total is real sourced data now, not a
  demo). Meaning preserved: *price is readable, and its staleness/snapshot
  disclosure is truthful* — strengthened, not weakened, since "demo" was no
  longer an accurate description.
- No assertion was deleted. No other E2E spec referenced price/fixture text
  requiring a change (`phase3-physical-validation.spec.ts` and
  `phase6-o7-slot14-witness.spec.ts` only assert `result-price` has count 0
  for compat-blocked builds, which is price-summary-independent and
  unchanged).

## 4. Verification

Same run as Step 10 §4 (Steps 10 and 11 were verified together as one
packet): `pnpm test` **39/339 PASS**, `pnpm test:e2e` **19/19 PASS**,
`pnpm build` clean, `git diff --check` clean.

## 5. Status after this record

Steps 10 and 11 are **complete**. Step 12 owner acceptance and **B4** were
closed 2026-08-12 (see below and the B4 corrective record). Phase 6 received
final owner closeout on 2026-08-12; Phase 7 has not started.

---

# Step 12 — Exhaustive factual audit packet (2026-08-11; corrective 2026-08-12)

Agent-delivered audit packet before owner spot-check. Full record:
[`STEP12_AUDIT.md`](./STEP12_AUDIT.md).

## 2026-08-11 (original)

- Playwright-backed verification of all 22 manifest parts and (historical)
  14 price rows.
- **Required product correction (preserved):** removed false
  `maxMemorySpeedMtS: 7200` from `motherboard.asus-tuf-gaming-b650-plus-wifi`
  (ASUS publishes `7600+(OC)` as open-ended ceiling; aligned with B860M
  `8800+` rule). `checkRamSupport` → `unavailable`.
- Part totals after product correction: **17 PASS / 1 FIXED / 4 BLOCKED**
  (GIGABYTE ×2, Corsair PSU product pages ×2). AMD CPU pages verified via
  HTTP/1.1 fetch of server-rendered specs; NVIDIA TGP via specsmodal — PASS.
- Historical price totals at that draft: 14 rows / 13 PASS / 1 BLOCKED
  (superseded by the 2026-08-12 corrective below).

## 2026-08-12 (corrective review — independent findings 1–4)

- **Finding 1 — Lian Li A3:** visual re-read of manufacturer hardware-
  compatibility chart images (`a3-h-025a.webp`, `a3-h-026a.webp`,
  `a3-h-030c.webp` on https://lian-li.com/product/a3-matx/). All catalog
  GPU-clearance branches, dimensions, CPU 165 mm, PSU 220 mm, Micro-ATX,
  and Black variant match. **PASS retained**; `part.json` unchanged.
- **Finding 2 — GIGABYTE B650M Rev. 1.3 street price:** Danawa
  `pcode=18113015` and one-hop 11st product page print only the model-family
  name; **no Rev. 1.3**. Price row **FIXED — REMOVED** from
  `catalog-prices.json`; unused Danawa street registry entry removed.
  Current coverage: **13 of 22** priced (11 street / 2 MSRP-only / 9 absent).
  Historical Step 10 count (14 rows) preserved as historical only.
- **Finding 3 — evidence ledger:** `STEP12_AUDIT.md` rebuilt with exact
  citation URLs, per-field-group sourceIds, G.SKILL FAQ dimensions group
  (`Trident Z5 RGB: 44 mm`), and aggregates recalculated from row-level
  verdicts.
- **Finding 4 — audit helper:** deleted misleading
  `scripts/step12-playwright-audit.mjs` (not a permanent Phase 6
  deliverable; future pipeline needs its own plan).
- **Current part totals (unchanged product set):** **17 PASS / 1 FIXED /
  4 BLOCKED**.
- **Current price totals:** **12 PASS / 1 BLOCKED** over **13** remaining
  rows (+ 1 FIXED-REMOVED historical row).
- **Owner Step 12 acceptance:** closed 2026-08-12 (after corrective
  `260169e` review).
- **B4:** resolved 2026-08-12 — see following section.
- Phase 6 final owner closeout accepted 2026-08-12. Phase 7 not started.
  Automation pipeline not implemented.

---

# B4 — Permanent-caution resolution under O6 (2026-08-12)

Owner decisions locked 2026-08-12:

1. Step 12 is owner-accepted.
2. Preserve raw `chipset-bios: unavailable` for transparency.
3. Under O6, BIOS revision compatibility is intentionally not modeled.
4. Therefore `chipset-bios: unavailable` is informational and non-blocking:
   it must not downgrade an otherwise compatible report, and must not turn
   an otherwise clean UI verdict into `caution`.
5. Every other genuinely unavailable compatibility check retains
   `unavailable` / `caution`.
6. Never invent `biosMinVersionForCpu` values to remove the warning.

## Implementation

| Piece | Location |
|-------|----------|
| Shared policy (checkId only) | `src/compat/unavailablePolicy.ts` — only `chipset-bios` unavailable is non-blocking |
| Report aggregation | `src/compat/buildCompatibilityReport.ts` — incompatible → blocking unavailable → else compatible; `dataVersion` `compat2-b4-20260812` |
| UI verdict | `src/ui/buildVerdict.ts` — uses the same policy |
| Check engine | `checkChipsetBios` **unchanged** — still returns raw `unavailable` when the map is empty |
| Fixtures | `benchmarks/compat2/compatibility-examples.json` re-anchored |

## Honesty constraints preserved

- No BIOS minimum data authored.
- Raw BIOS check remains present and `unavailable` on the default build.
- Detailed "Why this result?" evidence still exposes BIOS coverage as not modeled.
- Non-BIOS unavailable (e.g. open-ended ASUS memory ceiling → `ram-support`) still overall `unavailable` and UI `caution`.
- Physical interference / unavailable / conditional behavior unchanged.

## Status after B4

Step 12 owner-accepted; B4 resolved; final Phase 6 owner closeout accepted
2026-08-12; Phase 7 **not** started.

---

# Final closeout (owner, 2026-08-12)

The owner accepted the completed Phase 6 package after independent verification
of the B4 corrective commit `83510fe`. Phase 6 is complete. The close rests on:

- Step 12's exhaustive factual audit and corrective review, accepted by the
  owner on 2026-08-12;
- B4's shared, checkId-based unavailable policy, independently verified with
  raw BIOS coverage still visible and every other unavailable check still
  cautioning;
- `pnpm test:all`: 40 unit-test files / 344 tests and 19 Playwright tests,
  all passing;
- `pnpm build`: clean; `git diff --check`: clean.

The final owner record, shipped scope, and deliberately carried gaps are in
[`CLOSEOUT.md`](./CLOSEOUT.md). This close does not start or authorize Phase 7.

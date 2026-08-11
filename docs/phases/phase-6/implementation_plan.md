# Phase 6 — Implementation plan

Derived from [`specs/phase-6.md`](./specs/phase-6.md) and
[`specs/catalog-data-contract.md`](./specs/catalog-data-contract.md). Required by
the "plan before code" rule in [`../README.md`](../README.md).

Status: **Accepted 2026-08-10. Owner decisions O1–O8 locked. Steps 1–11
complete. Step 6 implementation complete (2026-08-10); Step 7 default-build
assembly verification complete (2026-08-11); Step 8 unavailable-reason wording
complete (2026-08-11); Step 9 catalog growth to 22 parts complete (2026-08-11,
short of ≈30 — see STEPS.md for the sourcing blockers); Step 10 sourced
catalog prices complete (2026-08-11, partial coverage — 14 of 22 parts priced,
see STEPS.md for the sourcing gaps); Step 11 integrity gates and E2E
re-anchoring complete (2026-08-11). Records in [`STEPS.md`](./STEPS.md). Step
12 exhaustive audit + owner acceptance **complete 2026-08-12**. **B4**
(permanent-caution under O6) resolved 2026-08-12 by the carve-out below —
raw `chipset-bios: unavailable` preserved, non-blocking for aggregate and
verdict. Final Phase 6 owner closeout still pending; Phase 7 not started.**

---

## Method: source first, data second

For every field of every part, in this order:

1. Find the manufacturer's published statement of the value.
2. Record it as a registry source with a citation and a retrieval date.
3. Only then write the value into `part.json`, pointing at that source.

The reverse direction — writing a plausible value and looking for a citation
afterwards — is how the fixture catalog came to exist and is prohibited here. A
field that stalls at step 1 is **omitted**, and if a part stalls on a field the
engines need, the part does not enter the catalog.

**Every step ends with a check that the app still runs**: `pnpm test` at an
unchanged-or-higher pass count and, from Step 5 on, a loaded catalog in a
browser. Phase 5 ended each step with a screenshot; this phase ends each step
with a green suite and a live catalog.

---

## What is untouchable

Exactly inverting Phase 5's boundary.

| Area | Action |
|------|--------|
| `parts/**`, `benchmarks/cat6/**` | **The work.** Replaced with sourced SKU-level data |
| `src/contract/cat6.ts`, `cat6.schema.ts`, `src/catalog/**` | New / modified: contract, manifest loading, price mapping |
| `scripts/author-phys3-glbs.mjs` | May use published `dimensionsMm` as visual scale guidance; does not establish authoritative compatibility truth |
| `benchmarks/phys3/physical-validation-examples.json` | May retain historical/advisory geometry examples; only clearance-limit-backed rows are authoritative witnesses (**RK1**) |
| `benchmarks/perf1/**` | **Ids re-pointed only** (**O3**). No row added, removed, or revalued; every row stays `confidence: "stub"` |
| `benchmarks/prov4/pilot-*.json`, `PROV4_PILOT_PART_IDS` | **Ids re-pointed only** (**RK2**). `geometryDataVersion` is **not** re-pointed — no new geometry representation dataset exists (`phys3-exp-20260808` retained; see Step 6). No grade change, no new claim |
| `src/perf/applyCorrection.ts`, `src/estimate/estimatorQuery.ts` | Hardcoded example ids re-pointed. Mechanical strings; no logic change |
| `src/perf/**` unavailable **reason strings** | Rewritten to user language stating the estimator is in preparation (**O1**). No logic, no signature, no numeric change |
| `src/App.tsx`, `src/ui/**`, `src/styles/**` | **Untouchable except the Step 6, Step 10, and B4 carve-outs**: `src/ui/buildVerdict.ts` and `src/ui/WhyThisResult.tsx` changed (Step 6) to route verdicts through the new physical authority. `src/App.tsx` (loader/state rename only), `src/ui/WhyThisResult.tsx`, and `src/ui/ResultBar.tsx` changed (Step 10) — two hardcoded copy strings ("fixed demo prices" / "fixture prices, not live market quotes") corrected to describe real dated street-price snapshots, required by the re-anchoring rule that no demo/fixture/live-price false claim may remain. **B4 (2026-08-12):** `src/ui/buildVerdict.ts` only — treat `chipset-bios: unavailable` as non-blocking for the UI verdict (shared policy with `src/compat/`); no broad UI redesign. A diff anywhere else here fails review. If real data makes a screen wrong, it is recorded for Phase 7 |
| `src/physical/` | **Untouchable except the Step 6 carve-out**: physical-authority boundary (`buildPhysicalValidationReport.ts`, `collision/types.ts`) and the scalar clearance-limit evaluator (`clearanceLimit/evaluateClearanceLimits.ts`). No other `src/physical/` diff |
| `src/contract/phys3.schema.ts` | **Untouchable except the Step 6 carve-out**: `conditional` added to `PhysicalValidationStatus` (**B3** / D4). No other `phys3` contract diff |
| `src/compat/`, `src/price/`, `src/provenance/`, `src/state/` | **Untouchable** except where a loader signature must change for the manifest, **and the B4 carve-out (2026-08-12)** on `src/compat/` only: one shared checkId-based policy so `chipset-bios: unavailable` is informational/non-blocking for `overallStatus` aggregation while every other unavailable check stays blocking; `checkChipsetBios` itself must still return raw `unavailable` (no invented BIOS minima, no silent compatible). `src/price/`, `src/provenance/`, `src/state/` remain untouchable |
| `src/test/**`, `e2e/**` | Step 6 re-anchored only the directly related physical/verdict tests (`buildVerdict`, `clearanceLimitEvaluator`, `physicalValidation`, `phys3.schema`, `phys3.integrity`, `phase3-physical-validation.spec.ts`) and added `phase6-o7-slot14-witness.spec.ts`. Step 7 added `phase6-step7-default-assembly.test.ts` + `phase6-step7-default-assembly.spec.ts` only (default-build assembly lock). **B4 (2026-08-12):** re-anchor compatibility aggregation, verdict, and default-build E2E expectations only (plus `benchmarks/compat2/compatibility-examples.json` dataVersion/semantics). Other tests untouched |
| `benchmarks/compat2/**` | **B4 carve-out (2026-08-12):** rewrite example overall statuses under the non-blocking BIOS policy; bump compatibility `dataVersion` with the production aggregator. Contract version string `compat2` unchanged (serialized shape unchanged) |
| `benchmarks/est1/**` | **Untouchable** beyond id re-pointing. Phase 4.1 stays frozen |
| `docs/decisions/ADR-00*` | Unchanged. An image-rights ADR is a separate future decision |

---

## Steps

### Step 1 — `cat6` contract, no data
`src/contract/cat6.ts` + `cat6.schema.ts` + schema tests. Types and Zod per the
contract doc: id pattern, group-presence refinement, `(fixture)` rejection, ISO
date validation, positive dimensions and clocks, complete `image` when present.
No `part.json` is touched. Existing suites stay green because nothing reads
`cat6` yet.

### Step 2 — Source registry and one part, end to end
`benchmarks/cat6/catalog-source-registry.json` plus **one** part — a GPU, the
category where SKU variance is largest — fully authored: real identity, sourced
compat spec, sourced dimensions, sourced boost clock and power limit, provenance
for each group, registry entries with citations.

This step exists to find out what sourcing actually costs before committing to
30 parts. If a single part cannot be completed to exit condition 2, that is
reported to the owner as a scope finding, not worked around.

### Step 3 — Id migration map
`docs/phases/phase-6/ID_MIGRATION.md`: every legacy fixture id, the real SKU id
replacing it, and the specific product chosen. Written and reviewed **before**
any rename lands, because the rename is executed once across the whole
repository and a mistake here is expensive to unwind.

Under **O2** (AM5 / DDR5), the AM4-era `mb.micro-b450-01` has no direct
counterpart; it maps to a real Micro-ATX AM5 board or is dropped, and the map
records which.

### Step 4 — Execute the migration
All 13 parts replaced by real SKU parts with new ids, in one step, together with
every consumer listed in scope §4: `perf1` fixtures, `prov4` pilot rows and
`PROV4_PILOT_PART_IDS`, `applyCorrection.ts` and `estimatorQuery.ts` examples,
`vs2` defaults, and the E2E selections.

Ends with the integrity assertion that **no legacy id string remains anywhere**
(**RK7**). A half-migrated repository fails silently — an unmatched row just
returns `unavailable`, which looks like ordinary missing coverage — so this
assertion is the step's real exit condition.

`perf1` coverage is unchanged by construction: 4 CPU × GPU pairs before, the same
4 after, now naming specific SKUs.

### Step 5 — Manifest and loader
`parts/catalog-manifest.json`; `loadPartCatalog` reads it instead of
`PHASE2_PART_PATHS`; `PHASE2_PART_PATHS` is retired. Vite dev serving and the
`dist/` copy already handle `parts/**` as a tree, so no build config change is
expected — verified with `pnpm build`, not assumed.

### Step 6 — Visual geometry and physical authority boundary

**Authority model (implemented; supersedes the M0 assumption that collision boxes
derived from `dimensionsMm` are factual compatibility truth):**

- **Authoritative:** `kind === "clearance-limit"` checks from published
  `clearanceLimits` and other catalog facts via explicit scalar rules (**C13**,
  **B3** resolved).
- **Advisory-only:** `kind === "collision"` and `kind === "clearance"` from GLB
  geometry, OBB overlap, missing collision geometry, missing `physicalSpec`, and
  project-authored mount/assembly mechanics. These support 3D preview, assembly
  visualization, and debug overlap signals; they do **not** set `overallStatus`,
  build verdict, blocked/caution/showResults, or factual compatibility reason text.
- **No authoritative checks:** `overallStatus === "unavailable"` — absence of
  evidence must not silently become fit.

`scripts/author-phys3-glbs.mjs` may use published `dimensionsMm` as scale and
proportion guidance for visual meshes. There is **no** normative GLB-vs-spec
tolerance gate (no 0.1 mm / 1% / 5% render-equality contract). The hardcoded
half-extents and engineered `clearance:cooler-sidekeepout` tuning are removed as
**authoritative** demo mechanics; OBB overlap from mesh geometry remains
non-authoritative and the OBB engine is neither deleted nor scheduled for removal.

Per-category mapping from product-relative `dimensionsMm` to scene axes
(+X/+Y/+Z) stays in the generator for visual assembly; it is not stored in
`part.json` (**C11**).

For cases, published `clearanceLimits` are evaluated by a **scalar clearance-limit
evaluator** at runtime (separate from the OBB collision engine), reporting
`fit` / `interference` / `conditional` per **C13** with conservative branch
applicability filtering. The generator does **not** derive internal clearance
volumes or invented case envelope boxes from scalar limits or case exterior
`dimensionsMm` — **B14**, closed 2026-08-10.

**Geometry data version — no re-point (decided 2026-08-10).** The M0 text
assumed Step 6 would produce a new geometry representation dataset and tag it
`cat6-spec-⟨date⟩`. It did not. `geometryDataVersion` tags the project's
geometry/model **representation** dataset (**C5**): the `phys3` `model.glb`
meshes and `physicalSpec` evidence. That dataset is unchanged from Phase 3 —
the generator is still `pb3-phys3-synthetic-20260808`, and the ten of fourteen
parts that carry `physicalSpec` tag `phys3-exp-20260808` in
`physicalSpec.evidence`; the other four (the A3 case, the TUF B860M, the V550
SFX, and the G.SKILL kit) carry no `physicalSpec` — their GLBs are visual-only
and the A3's authoritative limits are catalog facts in `clearanceLimits`. Step 6
changed authority semantics (clearance-limit checks authoritative, OBB
advisory-only) and trimmed synthetic CPU collision geometry, both *within* the
existing dataset. The new `clearanceLimits` / `dimensionsMm` are published
catalog facts with their own provenance
(`benchmarks/cat6/catalog-source-registry.json`), not geometry representation,
so they are not tagged by `geometryDataVersion`. A new version string would tag
a dataset that does not exist; `phys3-exp-20260808` is retained and nothing is
re-pointed. `modelGrade` stays `Experimental` (**C5**).

Anchor and socket positions are assembly semantics, not dimensions; they stay
hand-placed and their `basis` says so (**C17**).

**O7 witness (proven in the running app):** slot 2 LIAN LI A3-mATX
`maxCpuCoolerHeight` 165 mm vs slot 3 Noctua NH-D15 G2 height 168 mm →
authoritative `clearance-limit` interference (`168 > 165`). OBB is not the
authority source. Slot 14 opens the compat-clean reachability path (**I8**). Do
not claim all Phase 6 physical-rule coverage is complete.

Authoritative clearance-limit arithmetic is recorded in
[`STEPS.md`](./STEPS.md) (**RK1**). `benchmarks/phys3/physical-validation-examples.json` may
retain historical/advisory geometry examples; only published-rule-backed
clearance-limit results are authoritative — do not edit that benchmark file in
doc-only slices. `benchmarks/prov4/pilot-geometry-evidence.json` is **not**
re-pointed for geometry — see the no-re-point decision above (**RK2** applies to
ids only).

**Step 6 implementation status (2026-08-10):** authority model implemented —
`clearance-limit` checks authoritative, OBB `collision` / `clearance` advisory
only; scalar clearance-limit evaluator with `fit` / `interference` /
`conditional` and conservative `appliesWhen` pruning (**B3**); synthetic CPU
collision geometry removed with the stale cooler `allowedContacts` reference
(**B8**, **B12**); no envelope boxes derived from scalar limits (**B14**); slot
14 admitted (plane GLB, collision-less `physicalSpec`, manifest entry) and the
O7 witness proven in the running app (`e2e/phase6-o7-slot14-witness.spec.ts`).
The **RK1** clearance-limit arithmetic is recorded in
[`STEPS.md`](./STEPS.md). Step 7 is complete (2026-08-11); Step 8 unavailable-reason wording complete (2026-08-11); Steps 9–12 are open.

### Step 7 — Default build must assemble
Before the catalog grows: the default build is verified in a browser to assemble
in 3D on real dimensions, and the Phase 0 exit scenario is re-run (**RK5**). If
the real default build does not fit, the default is changed to one that does and
the change is recorded.

**Step 7 status (2026-08-11): complete — default build passes; no default
change.** Verified against the live 14-part `cat6` manifest catalog:

| Check | Result |
|-------|--------|
| Default parts in manifest | 7/7 ids resolve; catalog has 14 parts |
| 3D assembly | `allMounted`; 6 mount selections; viewport poses present |
| Cooler clearance-limit | 168 mm ≤ 170 mm ("without Fan Bracket") → **fit** |
| PSU clearance-limit | 140 mm ≤ 155 mm and ≤ 255 mm (both published branches) → **fit** |
| GPU clearance-limit | 267.01 mm ≤ 355 mm → **fit** |
| OBB advisory | no collision/clearance interference on default orientation |
| Authoritative overall | `fit` (no interference / unavailable clearance-limit) |
| Phase 0 exit scenario | clean load / CPU / GPU / reload / invalid-part fallback green |
| O7 witness | still reachable; cooler height interference still reported |

Default `BuildState` unchanged (`DEFAULT_BUILD_STATE_V2` in `src/contract/vs2.ts`).
Evidence and commands: [`STEPS.md`](./STEPS.md) §5. Truth-sync tests:
`src/test/phase6-step7-default-assembly.test.ts`,
`e2e/phase6-step7-default-assembly.spec.ts`.

### Step 8 — Unavailable reasons say "in preparation" (**O1**)
The `src/perf/**` reason strings — formerly internal table/fixture jargon such as
`"No fixture row for gpuId … in perf1 baseline table."` — are rewritten to state
that the combination estimator is still being built and performance data is not
available yet. No UI file is touched; `ResultBar` already renders the engine's
reason.

**Step 8 status (2026-08-11): complete.** User-facing missing-coverage message:
`The combination performance estimator is still in preparation; performance data
is not available yet.` Unit tests in `estimateBaseline.test.ts` and
`estimateWorkload.test.ts` assert uncovered combinations return `unavailable` with
no presentable FPS/score and a preparation-oriented reason (no `perf1`, fixture
row, or table names). `pnpm test` **38 files / 320 tests**; `pnpm test:e2e`
**19**; `pnpm build` clean.

### Step 9 — Grow the catalog to target size
New parts up to ≈30 on AM5 / DDR5, each entering only when complete to exit
condition 2. Includes the deliberate genuine-interference pair (**O7**) whose
authority comes from published clearance limits, not engineered mesh collision.

This is where scope §3 becomes fully visible: most CPU × GPU pairs, including
sibling SKUs of covered chips (**RK8**), present no FPS and say why.

**Step 9 status (2026-08-11): complete, short of ≈30.** 8 fully sourced parts
added (14 → 22): `gpu.asus-dual-rtx4060-o8g`,
`motherboard.asus-tuf-gaming-b650-plus-wifi`,
`case.fractal-design-meshify-2-compact-black-solid`, `case.nzxt-h5-flow`,
`psu.corsair-rm850e-cp-9020263-na`, `cooler.deepcool-ak620`,
`cooler.coolermaster-hyper-212-halo-black`,
`ram.teamgroup-t-create-expert-ddr5-6000-64gb`. None carry `physicalSpec`
(visual-only placeholder GLBs), matching the precedent already set by 4 of the
original 14 parts — the clearance-limit evaluator reads `dimensionsMm` /
`clearanceLimits` from `part.json` directly and does not require
`physicalSpec`. The pre-existing O7 pair (`case.lian-li-a3-matx-black` ×
`cooler.noctua-nh-d15-g2`) is unmodified and remains the catalog's only
authoritative interference. AMD.com (the sole AM5 CPU vendor), GIGABYTE.com,
Noctua.at, Thermalright, Kingston, Arctic and be quiet! were unfetchable this
session; per this step's decision gate, no candidate depending on those
sources was added. Full record: [`STEPS.md`](./STEPS.md).

### Step 10 — Prices
`benchmarks/cat6/catalog-prices.json` with MSRP **and** dated street snapshots
(**O5**), manually curated. The loader maps to `PricedPart` using the street
snapshot; MSRP is never summed; parts without a street snapshot map to
`unavailable` and make the total `isPartial` (**RK9**). `compat2` is not
modified.

**Step 10 status (2026-08-11): complete, partial coverage.** 14 of 22 parts
priced (12 street/KRW, 2 MSRP-only, 8 unsourced this session); `RK9`'s
single-currency rule is enforced at runtime, not only by convention — a
non-KRW street price is withheld rather than summed. `benchmarks/price2/`
deleted (closing **B11**). Full coverage counts and the source-access gaps
that produced the 8 unpriced parts: [`STEPS.md`](./STEPS.md) §Step 10.

### Step 11 — Integrity and test re-anchoring
`src/test/cat6.integrity.test.ts` per contract §5, including the join guard, the
legacy-id guard, and contract-honest geometry checks (model exists, GLB parses,
declared node references valid, mounts present when declared, no fabricated
dimensions). E2E specs re-anchored one at a time, preserving each assertion's
meaning (**RK4**); an assertion that cannot survive real data is raised as a
scope question, not deleted.

**Step 11 status (2026-08-11): complete.** Contract-honest geometry checks
(GLB parses as glTF 2.0 for all 22 manifest parts, not only the 10
`physicalSpec`-bearing ones already covered by `phys3.integrity.test.ts`),
`image`/`(fixture)` absence, price-source registry resolution, and the
single-currency rule added in `src/test/cat6.step11.integrity.test.ts`; price
mapping covered in `buildPriceSummary.test.ts`. Two E2E specs re-anchored
(`phase2-compat-price.spec.ts`, `phase5-exit-conditions.spec.ts`); no
assertion deleted. Full record: [`STEPS.md`](./STEPS.md) §Step 11.

### Step 12 — Owner gate
The owner picks three parts at random, follows every engine-consumed field to its
citation, and reviews the source registry. Pass or fail on that alone.

---

## Verification

| Gate | Command | Requirement |
|------|---------|-------------|
| Unit | `pnpm test` | Pass count unchanged or higher at every step |
| E2E | `pnpm test:e2e` | Green after re-anchoring, every preserved assertion accounted for |
| Build | `pnpm build` | Clean; `dist/parts/**` and `dist/benchmarks/cat6/**` present |
| Integrity | `pnpm test` | `cat6.integrity` green: sources resolve, joins hold, no legacy id, contract-honest geometry checks, no images, no `(fixture)` |
| Product | Browser | Default build assembles; every part selectable; uncovered pairs show no FPS and say the estimator is in preparation |
| **Phase gate** | Owner spot-check | Exit condition 2 on three randomly chosen parts |

The first five are necessary and not sufficient. The phase passes on the sixth.

---

## What would make this phase fail honestly

Recorded up front so the outcome is not rationalised later:

- Sourcing proves too expensive and the catalog ships partly unsourced → the
  phase fails. A half-real catalog is worse than an honestly synthetic one,
  because the labelling that made the fixture catalog honest is gone.
- Real dimensions produce no **authoritative** interference case anywhere in the
  catalog and **O7** cannot be satisfied from published clearance limits → report
  to the owner; do **not** reintroduce a tuned mesh to keep the demo alive.
- The frozen `perf1` coverage makes the product feel broken enough that the owner
  wants estimates back → that is a Phase 4 / 4.1 unfreeze decision, made
  explicitly by the owner, not smuggled in here.
- Street prices cannot be sourced for enough parts to make a meaningful total →
  totals stay `isPartial` and say so. MSRP is not substituted into the sum
  (**RK9**).

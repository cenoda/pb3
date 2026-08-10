# Phase 6 — Implementation plan

Derived from [`specs/phase-6.md`](./specs/phase-6.md) and
[`specs/catalog-data-contract.md`](./specs/catalog-data-contract.md). Required by
the "plan before code" rule in [`../README.md`](../README.md).

Status: **Accepted 2026-08-10. Owner decisions O1–O8 locked. Implementation
started — Step 1 complete; Steps 2–12 open.**

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
| `scripts/author-phys3-glbs.mjs` | Rewritten to generate boxes from `dimensionsMm` instead of hardcoded half-extents |
| `benchmarks/phys3/physical-validation-examples.json` | Re-derived from real dimensions (**RK1**) |
| `benchmarks/perf1/**` | **Ids re-pointed only** (**O3**). No row added, removed, or revalued; every row stays `confidence: "stub"` |
| `benchmarks/prov4/pilot-*.json`, `PROV4_PILOT_PART_IDS` | **Ids and `geometryDataVersion` re-pointed only** (**RK2**). No grade change, no new claim |
| `src/perf/applyCorrection.ts`, `src/estimate/estimatorQuery.ts` | Hardcoded example ids re-pointed. Mechanical strings; no logic change |
| `src/perf/**` unavailable **reason strings** | Rewritten to user language stating the estimator is in preparation (**O1**). No logic, no signature, no numeric change |
| `src/App.tsx`, `src/ui/**`, `src/styles/**` | **Untouchable.** A diff here fails review. If real data makes a screen wrong, it is recorded for Phase 7 |
| `src/compat/`, `src/physical/`, `src/price/`, `src/provenance/`, `src/state/` | **Untouchable** except where a loader signature must change for the manifest |
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

### Step 6 — Geometry from sourced dimensions
`scripts/author-phys3-glbs.mjs` reads `dimensionsMm` from the catalog and emits
boxes; the hardcoded half-extents and the engineered
`clearance:cooler-sidekeepout` tuning are removed. The generator owns the
per-category mapping from product-relative `dimensionsMm` fields to phys3 scene
axes (+X/+Y/+Z); that mapping is not stored in `part.json` (see contract **C11**).
New `geometryDataVersion: "cat6-spec-⟨date⟩"`; `modelGrade` stays `Experimental`
(**C5**).

Anchor and socket positions are **not** dimensions and cannot be sourced from a
spec sheet; they stay hand-placed and their `basis` says so.

Every `phys3` verdict that changes is re-derived and its arithmetic recorded in
`STEPS.md` (**RK1**). `benchmarks/phys3/physical-validation-examples.json` is
rewritten from the new dimensions; `benchmarks/prov4/pilot-geometry-evidence.json`
is re-pointed to the new geometry version and nothing else (**RK2**).

### Step 7 — Default build must assemble
Before the catalog grows: the default build is verified in a browser to assemble
in 3D on real dimensions, and the Phase 0 exit scenario is re-run (**RK5**). If
the real default build does not fit, the default is changed to one that does and
the change is recorded.

### Step 8 — Unavailable reasons say "in preparation" (**O1**)
The `src/perf/**` reason strings — currently
`"No fixture row for gpuId … in perf1 baseline table."` — are rewritten to state
that the combination estimator is still being built and this pair is not covered
yet. No UI file is touched; `ResultBar` already renders the engine's reason.

A unit test asserts that an uncovered pair produces **no presentable performance
value** and a reason mentioning preparation rather than an internal table name.

### Step 9 — Grow the catalog to target size
New parts up to ≈30 on AM5 / DDR5, each entering only when complete to exit
condition 2. Includes the deliberate genuine-interference pair (**O7**) that
replaces the engineered collision removed in Step 6.

This is where scope §3 becomes fully visible: most CPU × GPU pairs, including
sibling SKUs of covered chips (**RK8**), present no FPS and say why.

### Step 10 — Prices
`benchmarks/cat6/catalog-prices.json` with MSRP **and** dated street snapshots
(**O5**), manually curated. The loader maps to `PricedPart` using the street
snapshot; MSRP is never summed; parts without a street snapshot map to
`unavailable` and make the total `isPartial` (**RK9**). `compat2` is not
modified.

### Step 11 — Integrity and test re-anchoring
`src/test/cat6.integrity.test.ts` per contract §5, including the join guard, the
legacy-id guard, and the GLB-versus-`dimensionsMm` check. E2E specs re-anchored
one at a time, preserving each assertion's meaning (**RK4**); an assertion that
cannot survive real data is raised as a scope question, not deleted.

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
| Integrity | `pnpm test` | `cat6.integrity` green: sources resolve, joins hold, no legacy id, geometry matches dimensions, no images, no `(fixture)` |
| Product | Browser | Default build assembles; every part selectable; uncovered pairs show no FPS and say the estimator is in preparation |
| **Phase gate** | Owner spot-check | Exit condition 2 on three randomly chosen parts |

The first five are necessary and not sufficient. The phase passes on the sixth.

---

## What would make this phase fail honestly

Recorded up front so the outcome is not rationalised later:

- Sourcing proves too expensive and the catalog ships partly unsourced → the
  phase fails. A half-real catalog is worse than an honestly synthetic one,
  because the labelling that made the fixture catalog honest is gone.
- Real dimensions produce no interference case anywhere in the catalog and **O7**
  cannot be satisfied → report to the owner; do **not** reintroduce a tuned mesh
  to keep the demo alive.
- The frozen `perf1` coverage makes the product feel broken enough that the owner
  wants estimates back → that is a Phase 4 / 4.1 unfreeze decision, made
  explicitly by the owner, not smuggled in here.
- Street prices cannot be sourced for enough parts to make a meaningful total →
  totals stay `isPartial` and say so. MSRP is not substituted into the sum
  (**RK9**).

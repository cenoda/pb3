# Data curation checklist — fill `est1` / `prov4` for product paths (Path A)

**Status:** active work queue (2026-08-09)  
**Near-term goal:** Make pilot × 3 resolutions leave pure `est1-unavailable` by
curating **honest** anchors, scale edges, and/or exact observations — not
invented FPS.

**Long-term goal (owner):** The same pipeline must support investigation and
estimation for **most catalog CPUs**, not only `cpu.zen4-7600`. That is why
curation is **manufacturer-centric**:

> **Primary source = manufacturer catalogs** (e.g. **AMD product/performance
> catalog**, NVIDIA GeForce materials) — **not** third-party review sites.

Reviews are secondary validators (O4) only. Do not burn curation cycles on
TPU/Tom’s as the main path.

Related:

- Algorithm locks: [`ALGORITHM_DISCUSSION.md`](./ALGORITHM_DISCUSSION.md) §0 (O1–O9)
- Strategic stance: manufacturer-primary multi-CPU graph (same doc, “Strategic corpus stance”)
- Contract: [`specs/estimator-data-contract.md`](./specs/estimator-data-contract.md)
- Prior source investigation: [`../phase-4/SOURCE_INGESTION_INVESTIGATION.md`](../phase-4/SOURCE_INGESTION_INVESTIGATION.md)
- Empty shipped corpus: `benchmarks/est1/*`, audit-only near-misses in `benchmarks/prov4/external-performance-observations.json`

---

## 0. Manufacturer-centric multi-CPU model

```text
                    ┌─────────────────────────┐
  NVIDIA/AMD/…      │ Vendor anchors          │  GPU × game × settings × res
  product briefs ──►│ (manufacturer-primary)  │  cpuId when stated
                    └───────────┬─────────────┘
                                │ scale edges (evidenced only)
                    ┌───────────▼─────────────┐
  Official CPU      │ CpuScaleEdge graph      │  fromCpu → toCpu
  relative charts ─►│ (any catalog cpuId)     │  resolution/game scoped
                    └───────────┬─────────────┘
                                │ O4 when comparable
                    ┌───────────▼─────────────┐
  TPU / Tom’s / …   │ Review observations     │  auxiliary validation
                    │ (comparability-first)   │  never weaker-than-vendor win
                    └─────────────────────────┘
```

| Principle | Practice |
|-----------|----------|
| **Pilot is first instance** | Ship 7600+4070 cells first; do not hard-code 7600-only logic |
| **Opaque CPU ids** | New bench CPUs enter as ids (`cpu.intel-13900k`, …) usable as `fromCpuId` for *all* future `toCpuId`s |
| **Edges are reusable** | One 13900K→7600 edge helps pilot; later 13900K→7800X3D is another edge, same graph |
| **Manufacturer catalog harvest** | **AMD / NVIDIA / … product catalogs** are the spine (relative CPU charts, game FPS tables) |
| **Not review-site harvest** | TPU/Tom’s/etc. are not the primary queue |
| **No silent fan-out** | Adding a CPU to the catalog does **not** invent estimates; it only becomes estimable when anchors+edges exist |
| **No runtime scrape in SPA** | Curator/build-time extraction into JSON fixtures only (ADR-001 static SPA) |

M0 still proves paths on **one** pilot CPU. Schema/process must stay multi-CPU ready.

---

## 1. What “done” looks like for Path A (pilot slice)

For pilot query  
`cpu.zen4-7600 + gpu.rtx4070 + game.cyberpunk-2077 + preset.raster-ultra + upscale.off + framegen.off + RT off`:

| Resolution | Prefer | Acceptable M0 success | Still fail |
|------------|--------|----------------------|------------|
| 1080p | exact-aggregate **or** scaled with **sourced** CPU edge | `est1-estimated`, confidence ≤ low if scaled | waiver without edge; chart guess |
| 1440p | same | same | GPU-bound story without ratio (O2) |
| 4k | same | same | same |

UI after success:

- `data-evidence-class="est1-estimated"` (or equivalent)
- `method` + `draftCaveat` visible
- comparable reviews **bound** the range when present (O4)
- outer synthetic residual **not** used as the product number for that cell

Path proof already exists in **unit tests**. Path A is about **shipped fixtures**
that fire those paths for the real pilot.

---

## 2. Priority order (manufacturer catalog sequence)

```text
P0  Rights + registry for AMD / NVIDIA / other official sourceIds
P1  AMD catalog harvest (CPU relative performance, product pages, tech docs)
    — multi-SKU spine for most catalog cpuIds over time
P2  NVIDIA (and other GPU vendors) official game/FPS tables for anchors
P3  Encode CpuScaleEdge + VendorPerformanceAnchor from those catalogs only
    when G1–G7 pass (no invented factors)
P4  Optional: third-party reviews for O4 validation only
P5  Wire + verify + integrity + e2e
```

**Owner intent (plain language):** “긁자” = **curate/extract from AMD (and
peer vendor) catalogs into fixtures**, not scrape review sites, and not
runtime network from the SPA.

Do **not** store CPU-unknown marketing blobs as exact anchors — without
`cpuId` or a legal scale path they stay non-productive (O1/O2).

---

## 3. Global acceptance gates (every row)

Before any FPS number enters a fixture:

| # | Gate | Fail if |
|---|------|---------|
| G1 | **Citable URL** + access date | “I remember ~90 fps” |
| G2 | **Settings recoverable** in text (or table we may cite as facts) | Chart-only with no textual restatement |
| G3 | **Rights** | `source-rights-record.json`: `approved` + `storeExtractedObservation: true` for FPS store |
| G4 | **Registry** | `sourceId` exists in `evidence-source-registry.json` |
| G5 | **No pretend measurement** | Do not set first-party / high / rawArtifact for curated public numbers |
| G6 | **Pilot material match** | RT off, DLSS off, FG off for raster-ultra native cells — else exclude or different query |
| G7 | **CPU honesty** | Store real bench CPU id; never label 13900K row as `cpu.zen4-7600` |

---

## 4. Checklists by artifact

### 4.1 P0 — Rights & registry

- [ ] Confirm Tier A/B sources still `approved` + store flags for any **new** publisher
- [ ] Fix stale TPU URL if still pointing at 404 MSI Ventus page  
  (prefer FE review: `https://www.techpowerup.com/review/nvidia-geforce-rtx-4070-founders-edition/`)
- [ ] Add registry entries for any new vendor source ids (e.g. NVIDIA game performance brief)

### 4.2 P1 — Exact path (`prov4` observations → `exact-aggregate`)

**Need for product exact cell:** ≥2 independent sources with averages (or 1 with published range) that match **full** pilot key including **`cpu.zen4-7600`**.

| Check | 1080p | 1440p | 4k |
|-------|-------|-------|-----|
| Source A exact 7600+4070+CP2077+raster native | [ ] | [ ] | [ ] |
| Source B independent exact | [ ] | [ ] | [ ] |
| FPS fields filled (avg and/or range) | [ ] | [ ] | [ ] |
| Rights + registry | [ ] | [ ] | [ ] |

**Known as of 2026-08-09:** TPU / Tom’s 4070 reviews use **i9-13900K** (or similar flagship), **not** 7600.  
Exact path for pilot is **unlikely** from those two alone. Exact path may stay unfilled; that is OK if scaled path works.

**Search targets (exact 7600+4070+CP2077):**

- [ ] YouTube/text benches that **state** Ryzen 5 7600 (not 7600X unless we add id / edge)
- [ ] OEM system reviews with full part list
- [ ] Community benches only if settings + CPU fully stated and rights allow store

If exact found → add to `benchmarks/prov4/external-performance-observations.json`  
(remove or keep audit near-misses separately).

### 4.3 P2 — CPU scale edges (`benchmarks/est1/cpu-scale-edges.json`)

**This is the critical unlock** under O2/O3.

Needed edge pattern for flagship-review → pilot:

```text
fromCpuId:  <bench CPU opaque id we introduce, e.g. cpu.intel-13900k>
toCpuId:    cpu.zen4-7600
resolution: per-band preferred (1080p / 1440p / 4k separate factors)
gameId:     game.cyberpunk-2077  (prefer game-scoped; global only if source is multi-game mean and labeled)
factor:     to/from ratio from SAME GPU class study
uncertainty: from spread / source quality
sourceIds:  real citations
basis:      human chain
```

| Check | Notes |
|-------|--------|
| [ ] Source measures **same game** (or clearly multi-game gaming mean — weaker) at stated resolution | CP2077 preferred |
| [ ] Same GPU tier or fixed GPU across CPU swap | 4070 or 4090-class “CPU limit” study — document GPU used |
| [ ] Factor derived from published numbers, not invented | Show arithmetic in `basis` |
| [ ] Separate edges for 1080p vs 1440p/4k if ratios differ | 1080p more CPU-sensitive |
| [ ] Registry + rights for scale sources | May be review sources already approved |
| [ ] Introduce `cpu.intel-13900k` (or similar) **only as scale/from id** if needed | Opaque id; not full catalog part unless accepted |

**Candidate research leads (must verify before encoding):**

1. TechPowerUp / HWU / similar **CPU vs CPU** gaming sheets that include 7600 and 13900K (or 7600X — then need 7600 vs 7600X edge or treat as different id).
2. Reviews that retest one GPU across CPUs (rare).
3. If **no defensible ratio** for CP2077 band → **do not invent**; leave that resolution unavailable.

**Hard ban:** `factor: 0.97` “because GPU-bound at 1440p” without a cited study.

### 4.4 P3 — Vendor anchors (`benchmarks/est1/vendor-performance-anchors.json`)

Harvest **manufacturer / official** first (O1 harvest order).

| Check | Detail |
|-------|--------|
| [ ] NVIDIA (or AMD) page states game + resolution + settings + FPS | |
| [ ] `cpuId` present? | If **missing** → M0 default: **do not scale**; unused until CPU known (contract) |
| [ ] Raster ultra native (RT/DLSS/FG off)? | MSI/partner “RT on” rows are **wrong cell** |
| [ ] Citation + accessedAt | |
| [ ] Rights / registry | |

**Leads (verify; many fail G6):**

- NVIDIA GeForce product / news performance briefs for RTX 4070 (often RT/DLSS focused)
- Board partners (MSI etc.) — often **RT on** or DLSS on → reject for pilot raster-native
- Do **not** use YouTuber as `vendor-anchor`

If vendor only publishes RT/DLSS numbers → either expand pilot query later or skip vendor path for M0 pilot cells.

### 4.5 P4 — Review observations with FPS (auxiliary + O4)

For scaled or vendor path to be **validated**, need comparable reviews:

| Check | Detail |
|-------|--------|
| [ ] Fill FPS on TPU/Tom’s rows **only if** settings match pilot material profile | Today audit rows intentionally have **no FPS** |
| [ ] `cpuId` = real bench CPU (`cpu.intel-13900k` etc.), not 7600 | |
| [ ] After scale to 7600, O4 intersects/inflates with these reviews | Implementer already has `validateWithReviews` |
| [ ] Prefer 1440p/4k for lower CPU sensitivity **after** ratio exists | |

Digitize FPS only from **text or accessible table values**, not eyeballed chart bars unless values are also written in the article.

### 4.6 P5 — Verify after fill

```bash
pnpm test
pnpm test:e2e   # or focused phase41 + phase4
pnpm build
```

- [ ] Unit: still pass with real fixtures
- [ ] Integrity: rights, unique ids, no fake digests
- [ ] Manual or e2e: at least one resolution `est1-estimated` if data supports it
- [ ] Still-unavailable resolutions show reason (e.g. `missing_scale_edge`)
- [ ] `draftCaveat` still visible
- [ ] Update `dataVersion` strings when corpus changes
- [ ] Short STATUS / phase-4.1 TODO note

---

## 5. Suggested M0 “minimum product” (realistic) + multi-CPU seed

Given exact 7600 rows are scarce:

| Piece | Minimum | Multi-CPU note |
|-------|---------|----------------|
| 1 | Opaque from-CPU id (`cpu.intel-13900k`) in edges + observation `cpuId` | Reusable hub node for later `toCpuId`s |
| 2 | Prefer **manufacturer** 4070+CP2077 raster-native anchor if CPU known; else review FPS @ 13900K | Vendor-first harvest |
| 3 | **One** evidenced scale edge → `cpu.zen4-7600` @ **1440p** (vendor relative or cited CPU sheet) | Same pattern later for other catalog CPUs |
| 4 | Comparable review for O4 bound when present | Validates any target CPU path |
| 5 | Estimator → `scaled-combination` @ 1440p, confidence `low` | Template for N CPUs, not a 7600 exception |

1080p / 4k: add edges only when separately evidenced; else leave unavailable.

**After pilot:** extend graph by new `toCpuId` edges and anchors — do not fork
estimator logic per CPU.

---

## 6. Work log (fill as you curate)

| Date | Item | Result | Fixture path / id |
|------|------|--------|-------------------|
| 2026-08-09 | Path A checklist created | open | this file |
| | TPU/Tom’s CPU | 13900K class — not 7600 | SOURCE_INGESTION_INVESTIGATION |
| | est1 on-disk corpus | empty edges/anchors | benchmarks/est1/* |
| 2026-08-09 | Multi-CPU manufacturer-centric strategy | locked in docs | ALGORITHM / checklist §0 |
| 2026-08-09 | **P1 spot-check NVIDIA CP2077** | **No usable pilot raster-native anchor** | Official pages emphasize **RT Overdrive / DLSS 3.5 / FG**. Not pilot raster-native. |
| 2026-08-09 | Owner correction | **Primary = AMD (manufacturer) catalog**, not review harvest | Path A queue reordered; TPU/Tom’s demoted to optional O4 |
| 2026-08-09 | Next | Map AMD Zen4 desktop catalog / relative performance surfaces | §9 worksheet |
| | | | |

---

## 7. Explicit non-goals while curating

- Inventing scale factors “because GPU-bound”
- Chart-only FPS without textual support
- Labeling marketing RT/DLSS as pilot raster-ultra native
- Filling perf1 stub table instead of est1/prov4
- Claiming Step 9 / owner evidence PASS without review
- Phase 5

---

## 8. Automatable AMD catalog (done research)

See **[`AMD_CATALOG_AUTOMATION.md`](./AMD_CATALOG_AUTOMATION.md)**.

| Automatable now | Not in table |
|-----------------|--------------|
| Processor specs bulk JSON (742 → desktop Ryzen filter) | Game FPS |
| Graphics specs bulk JSON (203) | Relative gaming % / scale factors |
| Curator script `scripts/curate-amd-product-catalog.py` | Runtime SPA scrape |

Shipped spine (build-time snapshot):

- `benchmarks/est1/vendor-catalog/amd-processors-desktop-ryzen.json`
- `benchmarks/est1/vendor-catalog/amd-graphics.json`

Refresh:

```bash
python3 scripts/curate-amd-product-catalog.py --kind both
```

## 9. Still needed for product est1 FPS (not auto from specs table)

1. Official **performance** materials (relative gaming charts or game FPS with
   settings) — separate from specs compare table.
2. Map AMD catalog `name` → project `cpuId` / `gpuId`.
3. Optional O4 reviews only after manufacturer spine is useful.

## 10. AMD catalog harvest worksheet

| Field | Status 2026-08-09 |
|-------|-------------------|
| Bulk processors URL | specs/processors.html — **auto** via `data-json` |
| Bulk graphics URL | specs/graphics.html — **auto** via `data-json` |
| Ryzen 5 7600 in dump | **Yes** (6C/12T, 3.8/5.1 GHz, 65 W, AM5) |
| Desktop Ryzen count | ~484 in filtered dump |
| Game FPS in dump | **No** |
| Scale factor auto | **No** — needs performance charts |

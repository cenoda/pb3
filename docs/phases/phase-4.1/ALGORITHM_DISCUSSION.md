# Algorithm discussion — combination performance estimator

**Status:** algorithm direction **owner-locked (O1–O9, 2026-08-09)**  
**M0 scope/contract/plan:** drafted under `specs/` + `implementation_plan.md` ·  
**implementation:** not authorized until separate start instruction

Locked decisions live in **§0**. Earlier sections retain rationale; where they
conflict with §0, **§0 wins**.

### Temporary draft function

This estimator is a **temporary draft pure function**. It does **not** yet
account for motherboard/platform, cooling/thermal limits, case airflow, or
non-default power limits. Those factors are expected to revise or gate results
in a later accepted revision (`est1` bump or successor). M0 must surface an
explicit `draftCaveat` on every result (see estimator-data-contract.md).

### Strategic corpus stance (owner — 2026-08-09)

**M0 inventory is pilot-only (`cpu.zen4-7600`), but the design target is
coverage of most catalog CPUs over time.**

That is why the owner recommends **manufacturer-centric** corpus building:

| Approach | Scales to many CPUs? | Notes |
|----------|----------------------|--------|
| Exact review match only | **No** | Public GPU benches almost always use flagship CPUs |
| Review-first + endless near-misses | Poor | High curation cost; still CPU-skewed |
| **Manufacturer-primary anchors + evidenced scale graph** | **Yes** | GPU/game FPS tables + official relative CPU/GPU materials become reusable nodes; any catalog `cpuId` is a path through the graph when edges exist |

Manufacturer-centric means:

1. **Harvest and store** official/OEM performance fragments as first-class
   anchors (with full settings when possible).
2. Prefer **vendor relative-performance / product-brief series** as scale-edge
   sources when they state enough conditions to be honest.
3. Keep reviews as **comparability-first validators (O4)** and occasional
   primary only when they beat weak vendor blobs (O1).
4. Never encode a one-off “7600 hack”; pilot rows are the first **instances**
   of a multi-CPU graph, not a special code path.

M0 still only **ships** pilot query coverage proof; schema and curation process
must not assume a single mid-range CPU forever.

---

## 0. Owner-locked decisions (2026-08-09)

| ID | Choice | Normative meaning |
|----|--------|-------------------|
| **O1** | **A + comparability-first** | Search manufacturer materials first, but **never prefer weaker evidence** over stronger comparable evidence. Comparability quality outranks “vendor vs review” brand when both apply. |
| **O2** | **B** | At **1440p and 4K**, CPU mismatch may be transformed **only** if an evidenced CPU ratio edge exists. **No GPU-bound waiver** that skips the ratio. |
| **O3** | **A** | At **1080p**, CPU impact **must not** be papered over with a GPU-bound waiver. Require comparable CPU or an evidenced scale edge; else unavailable for that path. |
| **O4** | **A** | If **comparable** review observations exist, they **must** be used for validation (bound / cross-check). Optional bounding is not allowed when comparability holds. |
| **O5** | **A** | M0 **`scaled-combination` confidence ceiling = `low`**. |
| **O6** | **A** | Do **not** widen or rewrite `perf1` for this work. Estimator lives in a **sidecar**. |
| **O7** | **A+** | M0 inventory: **single pilot build × 3 resolutions**, but the implementation must **prove all three paths**: `exact-aggregate`, `scaled-combination`, and `unavailable`. |
| **O8** | **B** | New contract family **`est1`**: estimation responsibility. **`prov4` remains evidence**; est1 consumes evidence, does not replace it. |
| **O9** | **A** | If the estimator cannot fire under policy → **`unavailable`**. **`synthetic-stub` is not an estimator output**; UI may still show perf1/prov4 synthetic **outside** the estimator. |

### 0.1 Locked hybrid control flow (normative sketch)

```text
estimateCombinationPerformance(query, corpus_est1, evidence_prov4, policy) -> Estimate | Unavailable

  # Strength order is comparability-first (O1), not "vendor always wins".
  candidates = collect_anchors(query, vendor_fragments, review_fragments)
  best = pick_best(candidates by comparability_rank then source_trust)

  if best is exact-comparable multi-source aggregate:
     est = exact_aggregate(best)
     # O4: if additional comparable reviews exist, must validate/bound
     est = must_validate_with_comparable_reviews(est, query)  # no-op if none
     return Estimate(method=exact-aggregate, confidence≤medium, ...)

  if best requires transforms (e.g. CPU scale):
     if missing required scale edge:
        # O2/O3: no waiver — including 1440p/4K without ratio
        skip this candidate
     else:
        est = apply_scale_graph(best, query)   # O5: confidence ≤ low
        est = must_validate_with_comparable_reviews(est, query)  # O4
        return Estimate(method=scaled-combination, confidence≤low, ...)

  if no candidate survives:
     return Unavailable   # O9 — never synthetic-stub from estimator

  # UI layer (outside est1): may still display perf1 synthetic residual
  # for pilot continuity; that is not an est1 success path.
```

### 0.2 Comparability-first (O1) — ranking sketch

When two fragments both claim relevance to the query:

1. **Field match score** (cpu, gpu, game, preset, res, upscale, fg, rt, material settings)
2. **Metric completeness** (range vs average-only; settings disclosed)
3. **Source class** (lab > vendor-official table > external-review > marketing-thin)
4. **Recency / rights** (approved store + freshness)

A highly comparable review **outranks** a weakly comparable vendor marketing
blob. “Manufacturer-primary” means **search and harvest vendor corpora first**,
not “always pick vendor even when worse.”

### 0.3 Consequences for rejected earlier drafts

| Earlier draft idea | Status after O1–O9 |
|--------------------|--------------------|
| GPU-bound CPU waiver at 1440p/4K without ratio | **Rejected** (O2) |
| 1080p waiver | **Rejected** (O3) |
| Optional review bounding | **Rejected** when reviews are comparable (O4) |
| scaled confidence medium in M0 | **Rejected** (O5) |
| Write estimates into perf1 | **Rejected** (O6) |
| Estimator returns synthetic-stub | **Rejected** (O9) |
| Extend prov4 as the estimate contract | **Rejected** (O8 — est1 is estimate) |

---

## 1. Problem statement

### 1.1 Product need

User selects a **combination** (CPU × GPU × game × preset × resolution ×
upscale × frame-gen × …). The product must return:

```text
fpsMin, fpsMax, confidence, method, basis, contributingEvidenceIds, dataVersion
```

…or a structured **unavailable** with reasons — never a single fake point FPS
presented as measured truth.

### 1.2 What we already have

| Layer | Does | Fails at |
|-------|------|----------|
| `perf1` baseline table | Exact-key lookup + withheld correction | Almost all rows are **stub** wiring data |
| `prov4` external exact aggregate | Deterministic merge of exact-comparable public observations | Public benches use **flagship CPUs** → pilot mid-range combos stay empty |
| Synthetic residual rows | Honest “not real” labels | No product predictive value |

### 1.3 Owner seed (accepted as discussion premise, not final lock)

1. **Primary job:** from **manufacturer-published** performance materials
   (and similarly official vendor data), **predict** the outcome of the
   **actual user combination**.
2. **Trusted third-party reviews:** use when available, but as **auxiliary**
   (calibrate, cross-check, bound) — not the sole product path.
3. Exact-only public aggregation alone is **product no-go**.

### 1.4 Charter tension (must resolve in this phase)

Charter: *“Do not invent numbers when you do not know.”*

Phase 4.1 interpretation candidate:

| Claim type | Allowed? |
|------------|----------|
| Measured / first-party with inspectable raw | Yes, strict gates |
| External exact aggregate | Yes, Phase 4 rules |
| **Modeled combination estimate** with explicit method + uncertainty | **Yes if labeled** — this is the product’s job |
| Modeled number dressed as measurement | **Never** |

So the fundamental function is not “only return measured truth”; it is:

> **Return the best honest prediction the evidence supports, or unavailable.**

---

## 2. The fundamental function

Name (working):

```text
estimateCombinationPerformance(query, corpus, policy) -> Estimate | Unavailable
```

### 2.1 Inputs

```text
query:
  cpuId, gpuId, gameId, presetId, resolution,
  upscaleId, frameGenId, rayTracingState,
  optional: ramTierId, powerProfileId, driverClass, gamePatchClass

corpus:          versioned evidence store (see §4)
policy:          accepted rules for which methods may fire and confidence ceilings
now / asOf:      for freshness (injected; pure function otherwise)
```

### 2.2 Output (conceptual)

```text
Estimate:
  fpsMin, fpsMax           # range required
  fpsAverage?              # optional center
  confidence               # stub | low | medium | high (high reserved)
  method                   # see §3 method tags
  basis                    # human-readable chain
  contributors[]           # evidence ids + roles (primary | auxiliary | scale)
  exclusions[]             # near-misses and why
  dataVersion
  limitingFactor?

Unavailable:
  reason[]                 # insufficient_corpus | policy_block | ...
  explanation
  exclusions[]
```

### 2.3 Required properties

| Property | Meaning |
|----------|---------|
| Pure / deterministic | Same corpus + query + policy → same result |
| Explainable | UI can show the chain (which fragments, which scale, which bound) |
| Fail-closed | Missing critical fragment → unavailable, not a guess |
| Monotone confidence | Weaker method ⇒ lower ceiling |
| Provenance-preserving | Every number traces to corpus rows or declared model coefficients |
| No silent interpolation | Any scale/model step is a first-class method tag |

---

## 3. Method tags (output vocabulary)

Proposed `method` values (draft):

| Tag | Meaning |
|-----|---------|
| `exact-aggregate` | Phase 4 path: ≥ threshold exact observations merged |
| `vendor-anchor` | Primary number from manufacturer/official published combo or GPU SKU table |
| `scaled-combination` | Anchor transformed by accepted scale factors (CPU, res, settings…) |
| `bounded-by-reviews` | Model output intersected with review-derived bounds |
| `synthetic-stub` | Explicit non-predictive residual (current pilot fallback) |
| `unavailable` | No allowed method could fire |

Confidence ceilings (draft, open decision):

| Method | Max confidence |
|--------|----------------|
| `exact-aggregate` (multi independent) | medium |
| `vendor-anchor` alone | low or medium (O?) |
| `scaled-combination` | low (medium only with multi-anchor + tight bounds) |
| `bounded-by-reviews` | ≤ underlying model |
| `synthetic-stub` | stub only |

---

## 4. Corpus shape (what the function reads)

Not a single FPS table. A **typed fragment store**:

### 4.1 Fragment kinds (draft)

| Kind | Example | Role |
|------|---------|------|
| `vendor.gpu_game_fps` | NVIDIA “RTX 4070 / CP2077 / 1440p / settings X → N fps” | **Primary anchor candidates** |
| `vendor.cpu_relative` | AMD comparative charts (weaker; often non-game-specific) | Scale prior only if policy allows |
| `vendor.system_req` | CDPR min/rec — usually **not** FPS truth | Metadata / floor hints only |
| `review.observation` | TPU/Tom’s exact or near-miss rows (Phase 4) | **Auxiliary** bounds / calibration |
| `lab.first_party` | Future inspectable captures | Highest trust when valid |
| `scale.cpu` | Declared factor table: fromCpu→toCpu @ resolutionBand × gameClass | Transform |
| `scale.resolution` | Optional; prefer not inventing if vendor already multi-res | Transform |
| `policy.gpu_bound` | Rule: at 4K ultra RT-off, treat CPU mismatch as GPU-bound with uncertainty | Gate |

### 4.2 Manufacturer-first reading order (owner-aligned)

```text
1. Find vendor anchors closest to query (GPU + game + settings + resolution).
2. If vendor anchor CPU ≠ query CPU:
     apply accepted CPU scale OR gpu-bound waiver OR unavailable.
3. If multiple vendor anchors disagree: merge with uncertainty (range), not mean-only.
4. If review observations exist:
     - exact → may replace or tighten (policy)
     - near-miss → optional bounds only
5. If nothing fires under policy → unavailable (or explicit synthetic residual for pilot UI only).
```

Reviews never silently become the only story when a vendor path exists; when
vendor is missing, reviews may promote under stricter confidence rules (O?).

---

## 5. Algorithm families

### Family A — Exact lookup only (status quo stack)

```text
if exact aggregate: return aggregate
else if perf1 row: return stub/synthetic
else unavailable
```

| Pros | Cons |
|------|------|
| Simplest; Phase 4 complete | **Product no-go** for open combination space |
| Hard to lie | Almost never has mid-range CPU rows |

**Verdict for 4.1:** keep as **fast path special case**, not the product core.

---

### Family B — GPU-bound waiver + exact GPU key

```text
if exact full key: aggregate
else if policy.gpu_bound(query) and exact GPU+game+settings+res:
  use flagship-CPU observations with widened range + low confidence
else unavailable
```

| Pros | Cons |
|------|------|
| Unlocks 1440p/4K review data quickly | Weak at 1080p CP2077 (CPU-sensitive) |
| Small delta from Phase 4 | Still review-primary, not manufacturer-primary |

**Verdict:** useful **layer**, insufficient alone for owner direction.

---

### Family C — Manufacturer anchor + scale graph (owner-primary)

```text
anchor = select_vendor_anchor(query, corpus)   # closest legal fragment
if no anchor: try review path (B/A) or unavailable

x = anchor.fps  # or range
for edge in required_transforms(anchor.key → query):
  x = apply_scale(x, edge)   # multiplies range endpoints; grows uncertainty

if reviews available:
  x = intersect_or_inflate(x, review_bounds)

return Estimate(method=scaled-combination|vendor-anchor, ...)
```

**Transforms** are explicit edges, e.g.:

- `cpu: i9-class-bench → zen4-7600` @ `resBand=1080p` @ `gameClass=cpu-heavy`
- `settings: psycho → ultra` (only if fragment exists; else unavailable)
- `upscale: native → quality` (prefer vendor DLSS tables over invented)

| Pros | Cons |
|------|------|
| Matches “predict real combo from published fragments” | Needs curated scale tables + vendor harvest discipline |
| Explainable chain | Bad scales ⇒ systematic bias (must bound) |
| Reviews become optional bounds | Vendor marketing numbers can be optimistic |

**Mitigations:**

- Always emit **range**, never point.
- Prefer vendor numbers that state full settings; else exclude.
- Auxiliary reviews **cap** optimistic vendor anchors (e.g. if reviews sit 15% below, widen/shift).
- Scale factors themselves are corpus rows with sources + confidence.

**Verdict:** strongest match to owner seed; recommended **core family**.

---

### Family D — Factorized model (log-additive / bottleneck)

Classic hardware-estimator style:

```text
score = f(GPU_capability, CPU_capability, res_cost, settings_cost, rt_cost, ...)
fps ~ g(score)
calibrate g on corpus
```

| Pros | Cons |
|------|------|
| Covers huge combination space | Easy to become opaque “AI FPS” |
| One model for all | Calibration data still required; overfit risk |
| | Conflicts with “depth over fake breadth” if rushed |

**Verdict:** **later** (post-4.1 M0). May sit behind the same output interface.

---

### Family E — Retrieval + constrained regression (hybrid ML)

Retrieve k nearest published points; fit local model; conformal intervals.

| Pros | Cons |
|------|------|
| Modern; good intervals if done well | Ops/complexity; hard to explain in M0 |
| | Out of static-SPA comfort if training is heavy |

**Verdict:** research track; not M0.

---

## 6. M0 hybrid (locked by §0; historical proposal superseded)

The control flow in **§0.1** is normative. Family **C** (anchor + scale graph)
remains the core; Family **A** is the exact fast path; Family **B** GPU-bound
**waiver without ratio is out**. Reviews are auxiliary **inputs** but
**mandatory validators** when comparable (O4).

### 6.1 Uncertainty rule (draft for plan phase)

Every transform multiplies an uncertainty factor:

```text
range_width := max(range_width * u_edge, absolute_floor)
```

If final width exceeds policy max → **unavailable** (preferred under O9), not
silent point estimate. Exact threshold is plan-phase detail.

### 6.2 What “manufacturer-published” means here

In scope candidates:

- NVIDIA / AMD product pages and downloadable performance briefs that state
  **game + resolution + settings + FPS** (or clear chart with textual
  restatement we can cite without redistributing the chart binary).
- OEM board-partner pages that clearly restate the same class of numbers
  (lower trust).

Out of scope for primary anchors:

- Influencer thumbnails
- Undated marketing without settings
- System requirements “60 FPS” without configuration

Rights: extend Phase 4 source-rights discipline to vendor fragments
(`storeExtractedObservation`, citation, no chart dump).

---

## 7. Worked micro-example (illustrative numbers are fake)

Query: `7600 + 4070 + CP2077 + raster-ultra + 1440p + native`

| Step | Fragment | Action |
|------|----------|--------|
| 1 | Vendor: 4070 @ 1440p ultra RT-off = 90 fps (bench CPU unspecified or 13900K) | anchor |
| 2 | Scale `cpu: flagship→7600 @ 1440p @ gpu-bound-class` = 0.97 ± 0.05 | apply |
| 3 | Reviews TPU/Tom’s 4070 @ 1440p on 13900K ≈ 88–95 (auxiliary) | bound |
| 4 | Output | e.g. 82–98, confidence low, method scaled-combination, basis lists 1–3 |

If step 2 scale edge **missing** for 1080p cpu-heavy class → **unavailable**
or review-only path with low confidence — do not invent 0.97.

---

## 8. Open decisions

**O1–O9 locked** — see **§0**. Remaining plan-phase details (not algorithm
family choices):

| ID | Still open for plan/contract |
|----|------------------------------|
| **P1** | Max range width before unavailable |
| **P2** | Exact `est1` type shapes and dataVersion string |
| **P3** | Where CPU scale edges are curated (fixture schema) |
| **P4** | How UI composes est1 unavailable + outer synthetic residual |
| **P5** | Test matrix that proves exact / scaled / unavailable on pilot × 3 |

---

## 9. Non-goals for 4.1 M0 (proposed)

- Runtime scraping
- Full ML training pipeline
- Cooling/power geometry → FPS coefficients (still separate correction rows)
- Claiming `high` confidence from public data alone
- Phase 5 features (pricing live, accounts, …)
- Expanding part catalog solely to feed the model

---

## 10. Next discussion / planning prompts

1. Vendor anchor **without stated CPU**: unusable until CPU known, or attach only
   with an explicit “CPU unknown” scale class that still needs a ratio edge? (O2/O3 lean unusable / require edge.)
2. What corpus supplies M0 **CPU ratio edges** for 7600 vs flagship without inventing them?
3. P1–P5 defaults for the first `est1` contract draft?

---

## 11. Convergence path (current)

```text
O1–O9 locked (this section 0)          ← done 2026-08-09
  → specs/phase-4.1.md + est1 contract
  → implementation_plan.md
  → peer review
  → owner M0 package accept
  → separate implementation start
```

---

## 12. References

- Phase 4 external exact path: `docs/corrections/phase4-external-evidence-1/`
- Source investigation (why exact path is empty): `docs/phases/phase-4/SOURCE_INGESTION_INVESTIGATION.md`
- ADR-005 rights: `docs/decisions/ADR-005-external-benchmark-observations.md`
- Phase 1 baseline/correction split: `docs/phases/phase-1/specs/performance-data-contract.md`
- Charter performance principles: `PROJECT_CHARTER.md` §1–2

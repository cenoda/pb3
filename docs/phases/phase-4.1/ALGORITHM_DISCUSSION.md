# Algorithm discussion — combination performance estimator

**Status:** open discussion (2026-08-09)  
**Not accepted · not an implementation plan · not authorization to code**

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

## 6. Recommended hybrid for Phase 4.1 M0 (discussion proposal)

Not locked — proposal to argue against:

```text
estimateCombinationPerformance(query):

  # Path 0 — hard exact (best)
  if exact_aggregate(query):
     return tag exact-aggregate, confidence ≤ medium

  # Path 1 — manufacturer primary
  anchor = best_vendor_anchor(query)
  if anchor:
     est = scale_anchor_to_query(anchor, query)   # may be identity
     est = optional_bound_with_reviews(est, query)
     return tag vendor-anchor | scaled-combination

  # Path 2 — review auxiliary promotion (only if no vendor)
  if gpu_bound_or_exact_review(query):
     return tag exact-aggregate | scaled-combination (review-primary), low

  # Path 3 — residual
  if pilot_synthetic_allowed(query):
     return synthetic-stub
  return unavailable
```

### 6.1 Uncertainty rule (draft)

Every transform multiplies an uncertainty factor:

```text
range_width := max(range_width * u_edge, absolute_floor)
```

If final width exceeds policy max (e.g. > 40% of center) → **unavailable**
or force `confidence: low` with UI warning — open decision.

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

## 8. Open decisions (for owner)

| ID | Question | Options (sketch) |
|----|----------|------------------|
| **O1** | Primary corpus | **A)** Manufacturer-first (recommended) **B)** Review-first **C)** Equal hybrid |
| **O2** | CPU mismatch at 1440p/4K | **A)** GPU-bound waiver with width inflate **B)** require CPU scale edge **C)** unavailable |
| **O3** | CPU mismatch at 1080p CP2077 | **A)** require CPU scale **B)** unavailable **C)** wide low-confidence scale |
| **O4** | Vendor-only optimism | **A)** always bound with reviews when present **B)** optional **C)** vendor trust tiers |
| **O5** | Max confidence for scaled-combination | **A)** low only **B)** medium if multi-anchor + bounds |
| **O6** | Relation to `perf1` | **A)** estimator writes sidecar only **B)** estimator fills perf1-shaped rows at build time **C)** runtime replaces estimateBaseline |
| **O7** | Pilot scope for M0 | **A)** single pilot build × 3 resolutions **B)** full 2 CPU × 2 GPU × 3 res matrix **C)** catalog-wide |
| **O8** | Contract bump | **A)** extend `prov4` **B)** new `est1` sidecar **C)** widen `perf1` |
| **O9** | Unavailable vs synthetic-stub when model cannot fire | **A)** unavailable **B)** stub residual for UI continuity (pilot only) |

---

## 9. Non-goals for 4.1 M0 (proposed)

- Runtime scraping
- Full ML training pipeline
- Cooling/power geometry → FPS coefficients (still separate correction rows)
- Claiming `high` confidence from public data alone
- Phase 5 features (pricing live, accounts, …)
- Expanding part catalog solely to feed the model

---

## 10. Discussion prompts (for next turn)

1. Is **Family C (manufacturer anchor + scale graph)** the right core, with A/B as layers?
2. Should manufacturer anchors without stated CPU be treated as **GPU-bound class** by default, or **unusable** until CPU is known?
3. For M0, is pilot-only (O7-A) enough to prove the function, or do we need the 2×2×3 matrix?
4. Prefer new `est1` contract (O8-B) vs loading more into `prov4`?
5. How hard should we **bound** vendor optimism with reviews (O4)?

---

## 11. Suggested convergence path

```text
Owner picks O1–O9 leanings
  → thin ALGORITHM_DISCUSSION to “Accepted direction”
  → specs/phase-4.1.md + estimator contract
  → implementation_plan.md
  → peer review
  → owner M0 accept
  → separate implementation start
```

---

## 12. References

- Phase 4 external exact path: `docs/corrections/phase4-external-evidence-1/`
- Source investigation (why exact path is empty): `docs/phases/phase-4/SOURCE_INGESTION_INVESTIGATION.md`
- ADR-005 rights: `docs/decisions/ADR-005-external-benchmark-observations.md`
- Phase 1 baseline/correction split: `docs/phases/phase-1/specs/performance-data-contract.md`
- Charter performance principles: `PROJECT_CHARTER.md` §1–2

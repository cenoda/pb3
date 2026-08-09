# Phase 4.1 — Combination performance estimator (M0 scope)

Status: **Planning package complete (2026-08-09).**  
Algorithm direction **O1–O9 owner-locked**.  
Implementation **not started** until a separate start instruction is given.

Scope authority for algorithm: [`../ALGORITHM_DISCUSSION.md`](../ALGORITHM_DISCUSSION.md) §0.  
Data authority: [`estimator-data-contract.md`](./estimator-data-contract.md) (`est1`).  
Build plan: [`../implementation_plan.md`](../implementation_plan.md).

---

## 0. Temporary draft function (normative product caveat)

The Phase 4.1 estimator is a **temporary draft pure function**.

It deliberately **omits** later environmental and platform effects that will
change estimates when those layers are accepted:

| Future factor | Today | Later |
|---------------|-------|--------|
| Motherboard / platform (chipset, memory topology, PCIe) | Not in `est1` query | May scale or gate estimates |
| Cooling solution / thermal limit | Not in `est1` query | Correction path (existing perf1 correction style or new) |
| Power limits / undervolt / dual-BIOS | Only pilot `power.default` | Expand |
| Case airflow / ambient | Out | Optional correction |
| Driver / game patch class | Metadata only unless corpus edge exists | Stronger freshness coupling |

**UI and `basis` text must state** that results are draft combination estimates
under controlled baseline assumptions, not final system-level predictions.

A later accepted plan may version-bump `est1` or introduce `est2` when
motherboard/cooling functions enter the transform graph. Until then, **do not**
silently fold those effects into FPS.

---

## 1. Goal

Prove a pure, explainable **combination estimator** for the pilot build that:

1. Prefers **comparability-first** evidence (O1), harvesting manufacturer
   materials first without ranking weak vendor blobs over stronger comparable
   reviews.
2. Applies **only evidenced** scale transforms — **no** CPU GPU-bound waiver
   without a ratio edge at any resolution (O2, O3).
3. **Must** validate with comparable reviews when they exist (O4).
4. Caps scaled confidence at **`low`** (O5).
5. Lives in **`est1` sidecar** — does not modify `perf1` public shapes (O6, O8).
6. Covers **pilot × 3 resolutions** and **proves three paths**: exact,
   scaled, unavailable (O7).
7. Returns **`unavailable`** when policy cannot fire — never `synthetic-stub`
   from the estimator (O9). Synthetic remains a separate outer UI/perf1 path.

---

## 2. Inventory (M0)

### 2.0 Multi-CPU product intent (not M0 inventory expansion)

M0 **query surface** is pilot-only. The **product intent** is that the same
`est1` function and manufacturer-centric corpus can later cover most catalog
CPUs by adding anchors and scale edges — without a per-CPU code fork. Review
sites alone cannot provide that coverage. See ALGORITHM_DISCUSSION “Strategic
corpus stance” and DATA_CURATION_CHECKLIST §0.

### 2.1 Query surface (pilot only)

Same controlled baseline as Phase 4 pilot performance cells:

| Dimension | Values |
|-----------|--------|
| CPU | `cpu.zen4-7600` |
| GPU | `gpu.rtx4070` |
| Game / preset | `game.cyberpunk-2077` / `preset.raster-ultra` |
| Resolution | `1080p`, `1440p`, `4k` |
| Upscale / FG | `upscale.off` / `framegen.off` |
| RAM tier / power | `ram.32gb-ddr5` / `power.default` |
| RT | `off` (raster-ultra) |

Motherboard, cooler, case, PSU are **not** `est1` query keys in M0 (see §0).

### 2.2 Path proof requirement (O7 A+)

Automated tests must show all three outcomes are reachable under fixtures:

| Path | `method` / status | How proven in M0 |
|------|-------------------|------------------|
| Exact | `exact-aggregate` | Fixture with ≥2 independent exact-comparable observations (or published-range rule) |
| Scaled | `scaled-combination` | Vendor (or strong) anchor + evidenced CPU scale edge → query CPU; confidence ≤ low |
| Unavailable | `unavailable` | Missing scale edge and no exact path |

Real shipped corpus may still be sparse; **unit fixtures** must force each path.

---

## 3. Non-goals (M0)

- Expanding catalog beyond pilot query surface
- Writing into or reshaping `perf1` baseline rows
- GPU-bound CPU waiver without ratio
- Estimator emitting `synthetic-stub` or `confidence: "high"`
- Runtime scraping
- Motherboard / cooling / power-limit transforms (deferred; §0)
- Phase 5 features
- Full factorized ML model (Families D/E)

---

## 4. Relationship to other contracts

| Contract | Role in 4.1 |
|----------|-------------|
| `perf1` | Unchanged lookup/correction API; outer UI may fall back to stub **outside** est1 |
| `prov4` | Evidence corpus (observations, rights, registry); **input** to estimator |
| `est1` | **Estimation** result + scale-edge fixtures + estimator policy version |
| `vs2` / `phys3` | Build identity only; no geometry→FPS inventing |

---

## 5. Exit criteria (software gate)

1. `est1` types + Zod parse shipped fixtures.
2. Pure `estimateCombinationPerformance` implements §0 control flow.
3. Unit tests: exact / scaled / unavailable (O7); O2/O3 no waiver; O4 mandatory
   bound when comparable review present; O5 scaled ≤ low; O9 no synthetic out.
4. Integrity: scale edges cite sources; rights fail-closed for stored FPS fragments.
5. UI: pilot panel can show est1 result **distinct** from synthetic residual;
   temporary-draft caveat visible in basis or disclosure.
6. `pnpm test`, relevant e2e, `pnpm build` green.
7. No Phase 5 planning in the same change set.

Owner evidence-quality style PASS for est1 numbers is **separate** from the
software gate (same spirit as Phase 4 Step 9).

---

## 6. Plan-phase defaults (P1–P5)

| ID | Default for M0 |
|----|----------------|
| **P1** | If `(fpsMax - fpsMin) / max(fpsAverage, midpoint) > 0.40` after transforms → `unavailable` (too wide) |
| **P2** | Contract version string `est1`; fixture `dataVersion` e.g. `est1-20260809` |
| **P3** | Scale edges in `benchmarks/est1/cpu-scale-edges.json` (curated, sourced) |
| **P4** | UI: if est1 bound → show estimate; else if est1 unavailable → show unavailable reason **and** optional outer synthetic residual labeled non-estimate |
| **P5** | Vitest matrix covers three paths + O2/O3/O4/O5/O9 negatives |

---

## 7. Acceptance

Owner acceptance of this scope + `est1` contract + implementation plan is
required before code. Algorithm O1–O9 are already locked. Implementation start
is a **separate** instruction (see handoff prompt after package push).

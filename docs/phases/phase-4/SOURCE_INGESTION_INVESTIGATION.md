# Source ingestion investigation — pilot external FPS

| Field | Value |
|-------|--------|
| Date | **2026-08-09** |
| Author | **Aria (investigation)** |
| Related package | [`docs/corrections/phase4-external-evidence-1/`](../../corrections/phase4-external-evidence-1/) |
| Related ADR | [`docs/decisions/ADR-005-external-benchmark-observations.md`](../../decisions/ADR-005-external-benchmark-observations.md) |
| Baseline commit | `6f0a306` (external-evidence corrective on `main`) |
| Question | Can we curate **product FPS** observations for the Phase 4 pilot key from Tier A/B public sources? |

---

## 1. Verdict (executive)

| Question | Answer |
|----------|--------|
| Exact pilot-key product FPS from TechPowerUp / Tom's Hardware / ComputerBase? | **No — not defensible under current exact-match rules** |
| Should we fill `external-performance-observations.json` with product averages now? | **No** |
| Should we start Phase 5? | **No** — Phase 4 Step 9 remains open |
| Recommended next step | Keep synthetic/unavailable product path; decide Step 9 closeout criteria with owner (honest external-unavailable vs pilot-key change vs first-party raw) |

**One line:** Major GPU review sites measure RTX 4070 on **flagship CPUs** (typically Core i9-13900K class), not **Ryzen 5 7600**. Under the accepted corrective plan, that is a hard `cpu_mismatch`, so product aggregation correctly stays empty.

---

## 2. Pilot comparability key (what “exact” means)

From `prov4` pilot baseline + corrective plan §3 + grouping engine:

| Field | Required pilot value |
|-------|----------------------|
| `cpuId` | `cpu.zen4-7600` (**exact match required** for first implementation) |
| `gpuId` | `gpu.rtx4070` |
| `gameId` | `game.cyberpunk-2077` |
| `presetId` | `preset.raster-ultra` |
| `resolution` | `1080p` / `1440p` / `4k` (per cell) |
| `upscaleId` | `upscale.off` |
| `frameGenId` | `framegen.off` |
| `rayTracingState` | `off` (raster-ultra) |
| `exactSettings` | Must not introduce material mismatch (quality class / RT / DLSS / FG contradictions) |

Also required before product use:

- source-rights: `decision === "approved"` **and** `storeExtractedObservation === true`
- No invented FPS; single average-only observation → product range **unavailable**
- Two independent sources with averages → low-confidence range (if exact-comparable)

---

## 3. Sources investigated

### 3.1 TechPowerUp — NVIDIA GeForce RTX 4070 Founders Edition Review

| Item | Finding |
|------|---------|
| Canonical URL | https://www.techpowerup.com/review/nvidia-geforce-rtx-4070-founders-edition/ |
| Test setup page | https://www.techpowerup.com/review/nvidia-geforce-rtx-4070-founders-edition/5.html |
| Published | 2023-04-12 (launch window) |
| Test system label | **GPU 2023.1** |
| **CPU** | **Intel Core i9-13900K** (Raptor Lake, PL1=PL2=320 W) |
| Platform | EVGA Z790 Dark, DDR5-6000, Win11 22H2 |
| Driver (4070 press) | 531.42 (press driver noted on setup page) |
| Resolutions tested | 1920×1080, 2560×1440, 3840×2160 |
| Game suite | Includes Cyberpunk 2077 (listed in review game index) |
| Quality policy | “All games are set to their highest quality setting unless indicated otherwise” |
| Registry id | `src.external-review.techpowerup-rtx4070` (rights: approved / store OK) |

**Exact-key result:** **FAIL — `cpu_mismatch`**

- Pilot requires `cpu.zen4-7600`.
- Published bench CPU is **i9-13900K**, not any Ryzen 5 7600 / 7600X.
- No separate “RTX 4070 + Ryzen 5 7600” table was found in this review’s public pages during this investigation.

**Fixture note:** `source-rights-record.json` previously pointed at an MSI Ventus 3X page (`…/msi-geforce-rtx-4070-ventus-3x/45.html`). That URL returned **404** at investigation time. Prefer the FE review + its test-setup page as the stable citation for methodology; update rights/registry URLs when next touching fixtures.

**What may still be true (non-product):**

- GPU-bound 1440p/4K raster charts exist for RTX 4070 on a high-end CPU.
- They are **reference-only** under current policy, not pilot product FPS.

---

### 3.2 Tom's Hardware — Nvidia GeForce RTX 4070 Founders Edition Review

| Item | Finding |
|------|---------|
| Canonical URL | https://www.tomshardware.com/reviews/nvidia-geforce-rtx-4070-review |
| Test setup page | https://www.tomshardware.com/reviews/nvidia-geforce-rtx-4070-review/3 |
| **Primary CPU for this review** | **Intel Core i9-13900K** (explicit: “review will focus on the 13900K performance, which ensures … that we're not CPU limited”) |
| Secondary system | Core i9-12900K (2022 hierarchy continuity) |
| Settings policy | Ultra / highest preset at 1080p, 1440p, 4K; separate 1080p medium; separate DLSS/FSR pages |
| DXR | Enabled only in a subset of titles (not “all games RT on”) |
| Registry id | `src.external-review.toms-hardware-rtx4070` (rights: approved / store OK) |

**Exact-key result:** **FAIL — `cpu_mismatch`**

- Neither 13900K nor 12900K equals `cpu.zen4-7600`.
- Tom’s deliberately uses a flagship CPU to **remove** CPU limit — opposite of pilot’s mid-range Zen4 6-core.

**Related article (not a substitute):**

- https://www.tomshardware.com/news/rtx-4070-tested-with-pentium — contrasts weak CPU vs **13900K** for an RTX 4070; reinforces that Tom’s standard GPU numbers are **not** 7600-class.

---

### 3.3 ComputerBase (Tier B spot-check)

| Item | Finding |
|------|---------|
| Example modern GPU bench | e.g. RTX 4070 Super test (Jan 2024) documents **AMD Ryzen 9 7950X3D** as GPU-test CPU |
| Cyberpunk rows often shown | Frequently **path tracing / DLSS / FG** mixes, not pilot raster-ultra native |
| Registry id | `src.external-review.computerbase-cp2077` (rights: approved when settings disclosed) |

**Exact-key result:** **FAIL for pilot**

- CPU is still not Ryzen 5 7600.
- Many published CP2077 rows fail upscale/RT/FG material match even if GPU matches.

---

### 3.4 Hardware Unboxed / manufacturers (out of product FPS)

Already locked as **metadata-only** in ADR-005 / source-rights:

- Hardware Unboxed: no FPS store without inspectable published table
- NVIDIA / CDPR: identity / patch metadata only

Not re-opened by this investigation.

---

## 4. Comparability matrix (summary)

| Source | GPU RTX 4070 | CP2077 present | CPU = 7600 | Raster ultra / RT off / DLSS off / FG off verifiable | Product ingest? |
|--------|:------------:|:--------------:|:----------:|:----------------------------------------------------:|:---------------:|
| TechPowerUp 4070 FE | Yes | Yes (suite) | **No** (13900K) | Partial (highest quality; per-game RT not fully text-audited here) | **No** |
| Tom's Hardware 4070 FE | Yes | Yes (suite) | **No** (13900K / 12900K) | Ultra preset; RT only in subset; DLSS on separate page | **No** |
| ComputerBase (typical) | Often | Often | **No** (X3D flagship) | Often RT/DLSS/FG | **No** (for pilot) |
| Shipped fixture near-misses | Yes | Claimed | **No** (already `cpu.zen4-7800x3d` style) | Near-miss audit only, **no FPS** | **No** |

**Exact product rows available today for pilot key: 0.**

---

## 5. Why “just use 1440p GPU-bound numbers” is rejected

Corrective plan and ADR-005 require **exact CPU match** for the first implementation. Reasons that still hold:

1. **1080p** CP2077 is frequently **CPU-sensitive**; flagship vs 7600 is not free.
2. Even at 1440p/4K, the project chose **fail-closed exact keys** over “probably GPU-bound” interpolation.
3. GPU-bound exception is **documented as not exercised** in the accepted plan.
4. Filling FPS from 13900K benches and labeling them as `cpu.zen4-7600` would reintroduce the same class of **false claim** that failed Step 9 for first-party evidence.

---

## 6. Access / rightsability caveats (investigation method)

| Caveat | Detail |
|--------|--------|
| Automated fetch | Some TPU pages trigger bot challenges; setup page and FE intro were successfully retrieved for this report |
| Charts | Many FPS numbers are chart images; this report does **not** invent numeric FPS from charts |
| Scope | Investigation targets **ingestability**, not a complete digitization of every chart bar |
| Rights | Rights rows remain curator policy fixtures, not legal counsel clearance (ADR-005) |

---

## 7. Implications for Step 9 and product

| Path | Meaning | Fits current gates? |
|------|---------|---------------------|
| **A. Keep empty external product FPS** | UI stays synthetic-perf1 / unavailable; pipeline proven by near-miss exclusions | Yes — honest |
| **B. Owner accepts Step 9 with external-unavailable** | Close evidence quality on “no defensible exact external rows; stubs labeled” | Possible with explicit owner PASS criteria |
| **C. First-party measure on real 7600 + 4070** | PresentMon (or equivalent) inspectable raw + runCount ≥ 2 | Possible later; heavier |
| **D. Change pilot CPU to match review benches** | e.g. document a “GPU review CPU” pilot — **scope change**, needs new acceptance | Not silent |
| **E. Allow GPU-bound CPU exception** | Plan amendment + re-review | Not silent |
| **F. Phase 5 now** | **Blocked** until Step 9 decision | **No** |

**Investigation recommendation:** **A + B discussion.** Do **not** fill product FPS from TPU/Tom’s as-is. Do **not** start Phase 5.

---

## 8. Fixture hygiene follow-ups (non-blocking)

When next editing `benchmarks/prov4/`:

1. Point TechPowerUp `canonicalUrl` / registry citation at the **FE review + test setup** URLs that resolve.
2. Keep audit-only near-miss rows **without** FPS (current discipline is correct).
3. If a future observation ever ships FPS, integrity already requires `approved` + `storeExtractedObservation: true`.
4. Optional: add a short `sampleNotes` cross-link from near-miss rows to this investigation file.

---

## 9. Evidence links (primary)

1. TechPowerUp RTX 4070 FE — intro:  
   https://www.techpowerup.com/review/nvidia-geforce-rtx-4070-founders-edition/
2. TechPowerUp RTX 4070 FE — test system (i9-13900K):  
   https://www.techpowerup.com/review/nvidia-geforce-rtx-4070-founders-edition/5.html
3. Tom’s Hardware RTX 4070 — intro:  
   https://www.tomshardware.com/reviews/nvidia-geforce-rtx-4070-review
4. Tom’s Hardware RTX 4070 — OC + test setup (13900K focus):  
   https://www.tomshardware.com/reviews/nvidia-geforce-rtx-4070-review/3
5. ADR-005 source shortlist:  
   `docs/decisions/ADR-005-external-benchmark-observations.md`
6. Rights SSOT:  
   `benchmarks/prov4/source-rights-record.json`
7. Current observations (audit-only, no product FPS):  
   `benchmarks/prov4/external-performance-observations.json`

---

## 10. Sign-off

| Item | Status |
|------|--------|
| Investigation complete | Yes (2026-08-09) |
| Product FPS fill authorized by findings | **No** |
| Independent re-audit of this report | Optional (Nox) if owner wants a second opinion before Step 9 |
| Owner action needed | Choose Step 9 closeout path among §7 A–E |

*This document is an investigation report, not an implementation authorization and not a Phase 5 start.*

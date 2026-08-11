# Phase 6 Step 12 — Exhaustive factual audit

Original audit date: **2026-08-11**

Corrective review date: **2026-08-12** (independent review findings 1–4)

Audited HEAD before original corrections: **`cd6dc83`** (`feat(phase6): add sourced catalog prices and integrity gates`)

## Method

- **2026-08-11 (original packet):** Playwright headless Chromium against manufacturer/retailer citation URLs; NZXT Dimensions/Clearance accordions expanded by click; NVIDIA GeForce `#specsmodal` ("View Full Specs") opened for Total Graphics Power; AMD product pages recovered over HTTP/1.1 (Chromium HTTP/2 handshake fails on this network) because those pages are server-rendered.
- **2026-08-12 (corrective review):** Playwright visual re-check of Lian Li A3 hardware-compatibility **chart images** (DOM text alone insufficient for conditional GPU clearance); Danawa + one-hop 11st product page check for GIGABYTE B650M Rev. 1.3 price revision evidence; mechanical rebuild of this ledger so every engine-consumed field group carries `sourceId`, exact citation URL, short observed value, and PASS / FIXED / BLOCKED; deletion of the misleading helper script `scripts/step12-playwright-audit.mjs` (it was never a permanent Phase 6 deliverable and mislabeled failures as FIXED).

## Counts (current, post-corrective)

| Artifact | Count |
|----------|------:|
| Manifest parts | 22 |
| Source registry entries | 40 (`registryVersion: cat6-registry-20260812-step12-corrective`) |
| Price rows | 13 (`dataVersion: cat6-prices-20260812-step12-corrective`) |

Historical Step 10/11 counts (do not overwrite): 41 registry sources; 14 price rows (12 street / 2 MSRP-only).

## Known product correction (2026-08-11 — preserved)

**`motherboard.asus-tuf-gaming-b650-plus-wifi`** — ASUS techspec publishes memory list beginning `7600+(OC)/ 7200(OC)/ …`. The trailing `+` on `7600+(OC)` is an open-ended overclocking floor, not an exact ceiling (same rule as `motherboard.asus-tuf-gaming-b860m-plus-wifi` / `8800+MT/s`). The part incorrectly recorded `compatSpec.maxMemorySpeedMtS: 7200`.

**Actions taken (2026-08-11, still correct):** removed `maxMemorySpeedMtS`; updated part `notes`; corrected registry notes for `source.cat6.asus.tuf-gaming-b650-plus-wifi.techspec`; corrected Step 9 row in `STEPS.md`; added `src/test/cat6.step12.open-ended-ceiling.test.ts` (3 tests). Runtime: `checkRamSupport` for this board is now `unavailable` (not a false compatible/incompatible ceiling).

Playwright re-check (ASUS techspec, 2026-08-11): observed verbatim list includes `7600+(OC)/ 7200(OC)/ …`, AM5, B650, DDR5.

## Corrective review (2026-08-12)

### Finding 1 — Lian Li A3 `clearanceLimits` visual chart verification

Product page: https://lian-li.com/product/a3-matx/
Registry: `source.cat6.lian-li.a3-matx.product`

**DOM / spec table (page text, 2026-08-12):**

| Fact | Observed |
|------|----------|
| Dimensions | `(D) 443mm x (W) 194mm x (H) 321.5mm` |
| Motherboard support | `M-ATX/ITX` (catalog records Micro-ATX) |
| CPU cooler | `CPU HEIGHT CLEARANCE Max 165mm` |
| PSU | `ATX/SFX/SFX-L (Max 220mm)` |
| Black variant | Model table: `A3-mATX BLACK` / color Black |

**GPU clearance branches — visual inspection of rendered chart images** (opened as image assets in Playwright; values read from the chart pixels / OCR of those images, not from prior owner notes):

| Chart | Exact image URL | Observed branches |
|-------|-----------------|-------------------|
| ATX PSU FRONT | https://lian-li.com/wp-content/uploads/2024/05/a3-h-025a.webp | F1, ATX ≤140 mm → **415** mm; F1, ATX >140 ≤220 mm → **334** mm; F2, ATX ≤200 mm → **334** mm; F2.5, ATX ≤182 mm → **334** mm; F3, ATX ≤165 mm → **334** mm |
| ATX PSU FRONT with offset bracket | https://lian-li.com/wp-content/uploads/2024/05/a3-h-026a.webp | F1 → **415** mm; F2 → **344** mm; F2.5 → **344** mm |
| ATX PSU SIDE | https://lian-li.com/wp-content/uploads/2024/05/a3-h-030c.webp | S0.5, ATX ≤150 mm → **415** mm; S0.5, ATX >150 mm → **258** mm; S1, ATX ≤140 mm → **415** mm; S1, ATX >140 mm → **258** mm; S2 → **258** mm; S3 → **258** mm |

**S4 / ATX:** the ATX PSU SIDE chart lists only S0.5–S3. Position S4 is not a listed ATX configuration on that chart (the SFX SIDE chart does list S4). Catalog keeps S4 as a mounting-position note (`notes` / `clearanceLimits.raw`), not as an engine-consumed `maxGpuLength` branch — consistent with the charts.

**Verdict:** all engine-consumed `clearanceLimits` / dimensions / identity / compatSpec groups for `case.lian-li-a3-matx-black` remain **PASS**. `part.json` values unchanged (no mismatch).

### Finding 2 — GIGABYTE B650M Rev. 1.3 street price removed

| Check | Result |
|-------|--------|
| Danawa | https://prod.danawa.com/info/?pcode=18113015 — title/product name `GIGABYTE B650M AORUS ELITE AX 피씨디렉트`; **no PCB revision** printed |
| One-hop 11st | https://www.11st.co.kr/products/8028069743 — same model-family title; **no Rev. 1.3** in product page or description frame |
| Acceptable revision evidence | none found (no exact retailer Rev. 1.3 print; no model code uniquely tied to Rev. 1.3 on the listing; no one-hop official/retailer citation identifying this listing as Rev. 1.3) |

A generic model-name listing cannot price the revision-specific catalog part `motherboard.gigabyte-b650m-aorus-elite-ax-rev-1-3` (exact SKU/variant/revision rule; C1 — unsupported facts must be absent).

**Actions (2026-08-12):**

1. Removed the price row from `benchmarks/cat6/catalog-prices.json`.
2. Removed unused registry entry `source.cat6.danawa.motherboard-gigabyte-b650m-aorus-elite-ax-rev-1-3.street`.
3. Recorded former row as **FIXED — REMOVED** below (not retained as BLOCKED runtime data).
4. Updated price `dataVersion` and registry `registryVersion` to the 2026-08-12 corrective labels.

Part manufacturer provenance (`source.cat6.gigabyte.b650m-aorus-elite-ax-rev-1-3.spec`) is unchanged and remains **BLOCKED** (HTTP 403) for the part itself — separate from the price removal.

### Finding 3 — evidence ledger rebuilt

This document now lists every present engine-consumed field group with `sourceId`, exact citation URL, short observed value, and verdict. Abbreviated URLs from the 2026-08-11 draft are replaced with full registry citations. G.SKILL dimensions use `source.cat6.gskill.dram-memory-faq` separately from the SKU specification source.

### Finding 4 — audit helper deleted

Deleted `scripts/step12-playwright-audit.mjs`. It did not implement NVIDIA modal expansion, NZXT accordion expansion, or AMD HTTP/1.1 recovery; applied shared needles to every source; labeled failures `FIXED` without fixing anything; and wrote an untracked JSON under `docs/` by default. A future catalog-authoring/audit pipeline needs its own accepted implementation plan — not this packet.

---

## Part audit (22) — field-group evidence ledger

Field-group verdicts: **PASS** (citation matches catalog), **FIXED** (catalog corrected this audit cycle), **BLOCKED** (manufacturer citation not reachable by any reasonable recovery this session — no inferred PASS).

A **part-level** verdict is PASS only when every present engine-consumed field group is PASS (or FIXED after correction). One BLOCKED group → part BLOCKED.

| Part id | Field group | sourceId | Citation | Observed (short) | Verdict |
|---------|-------------|----------|----------|------------------|---------|
| `case.fractal-design-north-tg-dark` | identity, dimensions, clearanceLimits, compatSpec | `source.cat6.fractal-design.north-tg-dark.product` | https://www.fractal-design.com/products/cases/north/north/black-tg-dark/ | GPU 355 mm; CPU cooler 170 mm (without fan bracket branch); ATX/mATX | PASS |
| `case.lian-li-a3-matx-black` | identity | `source.cat6.lian-li.a3-matx.product` | https://lian-li.com/product/a3-matx/ | A3-mATX BLACK named in model table | PASS |
| | dimensions | `source.cat6.lian-li.a3-matx.product` | https://lian-li.com/product/a3-matx/ | 443 D × 194 W × 321.5 H mm | PASS |
| | clearanceLimits | `source.cat6.lian-li.a3-matx.product` | https://lian-li.com/product/a3-matx/ + chart images `a3-h-025a.webp`, `a3-h-026a.webp`, `a3-h-030c.webp` (URLs above) | CPU 165 mm; PSU 220 mm; all ATX FRONT / offset / SIDE GPU branches match catalog (visual chart read 2026-08-12) | PASS |
| | compatSpec | `source.cat6.lian-li.a3-matx.product` | https://lian-li.com/product/a3-matx/ | M-ATX/ITX support; catalog Micro-ATX | PASS |
| `motherboard.gigabyte-b650-aorus-elite-ax-v2` | identity, dimensions, compatSpec | `source.cat6.gigabyte.b650-aorus-elite-ax-v2.spec` | https://www.gigabyte.com/Motherboard/B650-AORUS-ELITE-AX-V2/sp | — | **BLOCKED** (HTTP 403; consistent with Step 9) |
| `motherboard.gigabyte-b650m-aorus-elite-ax-rev-1-3` | identity, dimensions, compatSpec | `source.cat6.gigabyte.b650m-aorus-elite-ax-rev-1-3.spec` | https://www.gigabyte.com/Motherboard/B650M-AORUS-ELITE-AX-rev-13/sp | — | **BLOCKED** (HTTP 403) |
| `motherboard.asus-tuf-gaming-b860m-plus-wifi` | identity, dimensions, compatSpec | `source.cat6.asus.tuf-gaming-b860m-plus-wifi.techspec` | https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b860m-plus-wifi/techspec/ | LGA1851, B860, DDR5, `8800+` ceiling (no numeric max recorded) | PASS |
| `cpu.amd-ryzen-5-7600` | identity, compatSpec, performanceSpec | `source.cat6.amd.ryzen-5-7600.product` | https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-5-7600.html | Max. Boost Clock Up to 5.1 GHz; Base 3.8 GHz; Default TDP 65W; CPU Socket AM5; Product ID Boxed 100-100001015BOX; Launch 01/14/2023 | PASS |
| `cpu.amd-ryzen-7-7800x3d` | identity, compatSpec, performanceSpec | `source.cat6.amd.ryzen-7-7800x3d.product` | https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-7-7800x3d.html | Max. Boost Clock Up to 5 GHz; Base 4.2 GHz; Default TDP 120W; CPU Socket AM5; Product ID Boxed 100-100000910WOF; Launch 04/06/2023 | PASS |
| `gpu.asus-dual-rtx4070-o12g` | identity, dimensions, performanceSpec | `source.cat6.asus.dual-rtx4070-o12g.techspec` | https://www.asus.com/motherboards-components/graphics-cards/dual/dual-rtx4070-o12g/techspec/ | 267.01 x 133.94 x 51.13 mm; 2.56 Slot; Default 2520 MHz / OC 2550 MHz | PASS |
| | compatSpec (TGP) | `source.cat6.nvidia.rtx4070-family.reference-tgp` | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/ | specsmodal: RTX 4070 Total Graphics Power 200 W; FE/reference-design note | PASS |
| `gpu.asus-proart-rtx4080-o16g` | identity, dimensions, performanceSpec | `source.cat6.asus.proart-rtx4080-o16g.techspec` | https://www.asus.com/us/motherboards-components/graphics-cards/proart/proart-rtx4080-o16g/techspec/ | 300 x 120 x 50 mm; 2.5 Slot; Default 2595 MHz / OC 2625 MHz | PASS |
| | compatSpec (TGP) | `source.cat6.nvidia.rtx4080-family.reference-tgp` | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4080-family/ | specsmodal: RTX 4080 Total Graphics Power 320 W; Required System Power 750 W | PASS |
| `cooler.noctua-nh-d15-g2` | identity, dimensions | `source.cat6.noctua.nh-d15-g2.specifications` | https://www.noctua.at/en/products/nh-d15-g2/specifications | Height with fan(s) 168 mm | PASS |
| `ram.teamgroup-t-create-expert-ddr5-6000-32gb` | identity, dimensions, compatSpec | `source.cat6.teamgroup.t-create-expert-ddr5-6000-32gb.product` | https://www.teamgroupinc.com/en/product-detail/memory/T-CREATE/expert-u-dimm-ddr5-black/expert-u-dimm-ddr5-black-CTCED532G6000HC30DC01/ | 32GB kit; 6000 MHz; module dims 32×133×7 mm | PASS |
| `ram.gskill-trident-z5-rgb-ddr5-8400` | identity | `source.cat6.gskill.f5-8400j4052g24gx2-tz5rw.specification` | https://www.gskill.com/specification/165/374/1696494301/F5-8400J4052G24GX2-TZ5RW-Specification | F5-8400J4052G24GX2-TZ5RW; TZ5RW white SKU | PASS |
| | dimensions | `source.cat6.gskill.dram-memory-faq` | https://www.gskill.com/faq/1502180912/DRAM-Memory | FAQ “How tall are the memory modules?”: **Trident Z5 RGB: 44mm** (1.73in) | PASS |
| | compatSpec | `source.cat6.gskill.f5-8400j4052g24gx2-tz5rw.specification` | https://www.gskill.com/specification/165/374/1696494301/F5-8400J4052G24GX2-TZ5RW-Specification | Tested Speed (XMP) 8400 MT/s; Capacity 48GB (24GBx2) | PASS |
| `psu.corsair-rm750e` | identity, dimensions, compatSpec | `source.cat6.corsair.rm750e-cp-9020295-na.product` | https://www.corsair.com/us/en/p/psu/cp-9020295-na/rme-series-rm750e-fully-modular-low-noise-atx-power-supply-cp-9020295-na | — | **BLOCKED** (HTTP 403 product page) |
| `psu.cooler-master-v550-sfx-gold` | identity, dimensions, compatSpec | `source.cat6.cooler-master.v550-sfx-gold.product` | https://www.coolermaster.com/en-global/products/v550-sfx-gold.html | 550 W SFX Gold | PASS |
| `gpu.asus-dual-rtx4060-o8g` | identity, dimensions, performanceSpec | `source.cat6.asus.dual-rtx4060-o8g.techspec` | https://www.asus.com/us/motherboards-components/graphics-cards/dual/dual-rtx4060-o8g/techspec/ | 227.2 x 123.24 x 49.6 mm; 2.5 Slot; Default 2505 MHz / OC 2535 MHz | PASS |
| | compatSpec (TGP) | `source.cat6.nvidia.rtx4060-4060ti-family.reference-tgp` | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/ | specsmodal: RTX 4060 Total Graphics Power 115 W; RTX 4060 Ti "165 or 160" W (Ti not catalogued for this reason) | PASS |
| `motherboard.asus-tuf-gaming-b650-plus-wifi` | identity, dimensions, compatSpec | `source.cat6.asus.tuf-gaming-b650-plus-wifi.techspec` | https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b650-plus-wifi/techspec/ | `7600+(OC)/ 7200(OC)/ …`; **no** `maxMemorySpeedMtS` after fix | **FIXED** |
| `case.fractal-design-meshify-2-compact-black-solid` | identity, dimensions, clearanceLimits, compatSpec | `source.cat6.fractal-design.meshify-2-compact.product` | https://www.fractal-design.com/products/cases/meshify/meshify-2-compact/black-solid/ | 424×210×475 mm; GPU 341/360 branches; CPU 169 mm | PASS |
| `case.nzxt-h5-flow` | identity, dimensions, clearanceLimits, compatSpec | `source.cat6.nzxt.h5-flow.product` | https://www.nzxt.com/products/h5-flow | Dimensions 465×225×430 mm (accordion); GPU 410 mm; CPU 170 mm | PASS |
| `psu.corsair-rm850e-cp-9020263-na` | identity, dimensions, compatSpec | `source.cat6.corsair.rm850e-cp-9020263-na.product` | https://www.corsair.com/us/en/p/psu/cp-9020263-na/rme-series-rm850e-fully-modular-low-noise-atx-power-supply-cp-9020263-na | — | **BLOCKED** (HTTP 403 product page) |
| `cooler.deepcool-ak620` | identity, dimensions | `source.cat6.deepcool.ak620.product` | https://www.deepcool.com/products/Cooling/cpuaircoolers/AK620-High-Performance-CPU-Cooler-1700-AM5/2021/13067.shtml | With-fans 129×138×160 mm | PASS |
| `cooler.coolermaster-hyper-212-halo-black` | identity, dimensions | `source.cat6.coolermaster.hyper-212-halo-black.product` | https://www.coolermaster.com/en-global/products/hyper-212-halo-black/ | 124×73×154 mm | PASS |
| `ram.teamgroup-t-create-expert-ddr5-6000-64gb` | identity, dimensions, compatSpec | `source.cat6.teamgroup.t-create-expert-ddr5-6000-64gb.product` | https://www.teamgroupinc.com/en/product-detail/memory/T-CREATE/expert-u-dimm-ddr5-black/expert-u-dimm-ddr5-black-CTCED564G6000HC34BDC01/ | 64GB, 6000 MHz CL34; same module dims as 32 GB kit | PASS |

### Part aggregate (post-corrective; recalculated from row-level verdicts)

| Part-level verdict | Count | Parts |
|--------------------|------:|-------|
| PASS | 17 | North TG Dark; Lian Li A3; ASUS B860M; Ryzen 5 7600; Ryzen 7 7800X3D; ASUS Dual 4070; ASUS ProArt 4080; NH-D15 G2; TEAMGROUP 32GB; G.SKILL TZ5 RGB; Cooler Master V550 SFX; ASUS Dual 4060; Meshify 2 Compact; NZXT H5 Flow; DeepCool AK620; Hyper 212 Halo Black; TEAMGROUP 64GB |
| FIXED | 1 | ASUS TUF Gaming B650-PLUS WIFI |
| BLOCKED | 4 | GIGABYTE B650 AORUS ELITE AX V2; GIGABYTE B650M AORUS ELITE AX Rev. 1.3; Corsair RM750e; Corsair RM850e |

**BLOCKED parts:** both GIGABYTE boards and both Corsair PSU **product** pages (HTTP 403). AMD CPU pages verified via HTTP/1.1 recovery; NVIDIA TGP field groups verified via specsmodal — PASS, not BLOCKED.

---

## Price audit

### Current rows (13) — post-corrective 2026-08-12

All remaining street rows retrieved **2026-08-11** unless noted. Street = Danawa aggregator snapshots (KRW/KR). MSRP = manufacturer store USD.

| partId | Type | Recorded | sourceId | Citation | Observed (short) | Verdict |
|--------|------|----------|----------|----------|------------------|---------|
| `case.fractal-design-meshify-2-compact-black-solid` | street | 174,840 KRW | `source.cat6.danawa.case-fractal-design-meshify-2-compact.street` | https://prod.danawa.com/info/?pcode=13489595 | Lowest listing ~174,840 KRW | PASS |
| `case.fractal-design-north-tg-dark` | street | 234,060 KRW | `source.cat6.danawa.case-fractal-design-north-tg-dark.street` | https://prod.danawa.com/info/?pcode=18448748 | ~234,060 KRW | PASS |
| `case.lian-li-a3-matx-black` | street | 118,980 KRW | `source.cat6.danawa.case-lian-li-a3-matx-black.street` | https://prod.danawa.com/info/?pcode=60069011 | ~118,980 KRW | PASS |
| `case.nzxt-h5-flow` | MSRP | $94.99 USD | `source.cat6.nzxt.h5-flow.msrp` | https://www.nzxt.com/products/h5-flow | Regular price $94.99 | PASS |
| `cooler.noctua-nh-d15-g2` | street | 246,720 KRW | `source.cat6.danawa.cooler-noctua-nh-d15-g2.street` | https://prod.danawa.com/info/?pcode=67683362 | ~246,720 KRW; standard NH-D15 G2 | PASS |
| `cpu.amd-ryzen-7-7800x3d` | street | 702,150 KRW | `source.cat6.danawa.cpu-amd-ryzen-7-7800x3d.street` | https://prod.danawa.com/info/?pcode=19627808 | 정품 box ~702,150 KRW | PASS |
| `motherboard.asus-tuf-gaming-b650-plus-wifi` | street | 260,990 KRW | `source.cat6.danawa.motherboard-asus-tuf-gaming-b650-plus-wifi.street` | https://prod.danawa.com/info/?pcode=18044558 | ~260,990 KRW; B650-PLUS ATX | PASS |
| `motherboard.asus-tuf-gaming-b860m-plus-wifi` | street | 278,400 KRW | `source.cat6.danawa.motherboard-asus-tuf-gaming-b860m-plus-wifi.street` | https://prod.danawa.com/info/?pcode=74254814 | ~278,400 KRW | PASS |
| `motherboard.gigabyte-b650-aorus-elite-ax-v2` | street | 260,580 KRW | `source.cat6.danawa.motherboard-gigabyte-b650-aorus-elite-ax-v2.street` | https://prod.danawa.com/info/?pcode=32070719 | ~260,580 KRW | PASS |
| `psu.corsair-rm750e` | MSRP | $114.99 USD | `source.cat6.corsair.rm750e-cp-9020295-na.msrp` | https://www.corsair.com/us/en/p/psu/cp-9020295-na/rm750e-fully-modular-low-noise-atx-power-supply-cp-9020295-na | — | **BLOCKED** (HTTP 403; dated snapshot retained, not re-verified live) |
| `psu.corsair-rm850e-cp-9020263-na` | street | 149,000 KRW | `source.cat6.danawa.psu-corsair-rm850e-cp-9020263-na.street` | https://prod.danawa.com/info/?pcode=74813786 | ~149,000 KRW; 850 W Gold ATX3.1 | PASS |
| `ram.teamgroup-t-create-expert-ddr5-6000-32gb` | street | 794,360 KRW | `source.cat6.danawa.ram-teamgroup-t-create-expert-ddr5-6000-32gb.street` | https://prod.danawa.com/info/?pcode=20546438 | ~794,360 KRW; CL30 black kit | PASS |
| `ram.teamgroup-t-create-expert-ddr5-6000-64gb` | street | 1,480,000 KRW | `source.cat6.danawa.ram-teamgroup-t-create-expert-ddr5-6000-64gb.street` | https://prod.danawa.com/info/?pcode=19566788 | ~1,480,000 KRW; CL34 64 GB kit | PASS |

### Former row (not in current file)

| partId | Former type | Former amount | Former sourceId | Former citation | Verdict |
|--------|-------------|---------------|-----------------|-----------------|---------|
| `motherboard.gigabyte-b650m-aorus-elite-ax-rev-1-3` | street | 314,900 KRW | `source.cat6.danawa.motherboard-gigabyte-b650m-aorus-elite-ax-rev-1-3.street` | https://prod.danawa.com/info/?pcode=18113015 (+ 11st https://www.11st.co.kr/products/8028069743) | **FIXED — REMOVED** (2026-08-12): generic model listing; Rev. 1.3 not printed on Danawa or 11st; cannot support revision-specific `partId` under C1 |

### Price aggregate (current rows only; recalculated)

| Verdict | Count |
|---------|------:|
| PASS | 12 |
| BLOCKED | 1 |

Coverage (current): **13 of 22** parts priced — **11 street/KRW**, **2 MSRP-only**, **9** with no price row (includes the removed Rev. 1.3 board plus the previous 8 unsourced parts).

Historical Step 10 coverage (do not overwrite): 14 of 22 (12 street / 2 MSRP-only / 8 absent).

---

## Corrections applied

### 2026-08-11 (original packet — preserved)

1. **`motherboard.asus-tuf-gaming-b650-plus-wifi/part.json`** — removed `compatSpec.maxMemorySpeedMtS`; rewrote `notes` (open-ended `7600+(OC)` → absent field).
2. **`benchmarks/cat6/catalog-source-registry.json`** — registry notes for B650-PLUS WIFI techspec aligned with B860M `+` rule.
3. **`docs/phases/phase-6/STEPS.md`** — Step 9 addition row corrected.
4. **`src/test/cat6.step12.open-ended-ceiling.test.ts`** — regression (3 tests).

### 2026-08-12 (corrective review)

1. **Lian Li A3** — visual chart re-verification; PASS retained; no `part.json` change.
2. **`benchmarks/cat6/catalog-prices.json`** — removed revision-unverified street row for `motherboard.gigabyte-b650m-aorus-elite-ax-rev-1-3`; `dataVersion` → `cat6-prices-20260812-step12-corrective`.
3. **`benchmarks/cat6/catalog-source-registry.json`** — removed now-unused Danawa street source for that part; `registryVersion` → `cat6-registry-20260812-step12-corrective`.
4. **This document** — rebuilt as a one-hop evidence ledger with exact URLs; G.SKILL FAQ dimensions group recorded; aggregates recalculated from row-level verdicts.
5. **Deleted** `scripts/step12-playwright-audit.mjs`.

No runtime architecture changes. No Phase 4/4.1 frozen evidence touched. No inventory expansion. No image files or populated image fields. ASUS B650 product correction not reverted.

## Runtime verdict change (explicit)

**`motherboard.asus-tuf-gaming-b650-plus-wifi` + any DDR5 kit:** `checkRamSupport` changes from **compatible/incompatible against a 7200 MT/s ceiling** to **`unavailable`** (no published exact ceiling). Socket, chipset, and form-factor checks unchanged.

Removing the Rev. 1.3 street price row does not change part compatibility runtime; the part remains in the manifest without a price row (honest partial totals).

## Remaining inaccessible sources / uncertainty

| Source / part | Failure mode | Notes |
|---------------|--------------|-------|
| GIGABYTE.com spec pages | HTTP 403 | Both motherboard parts; manufacturer specs not re-read live. Consistent with Step 9's block record. Street price for V2 remains; Rev. 1.3 street **removed** (revision evidence missing) |
| Corsair.com PSU **product** pages (CP-9020295, CP-9020263) | HTTP 403 | RM850e street verified via Danawa; RM750e MSRP snapshot retained but not re-verified live |

Resolved recovery routes (blocked in the plain harness, verified this packet):

| Source | Recovery | Verified result |
|--------|----------|-----------------|
| AMD.com CPU product pages (`ERR_HTTP2_PROTOCOL_ERROR` in Chromium/HTTP2) | HTTP/1.1 fetch-tool retrieval of the server-rendered spec sheet | Ryzen 5 7600: Max Boost 5.1 GHz, Base 3.8 GHz, TDP 65 W, AM5; Ryzen 7 7800X3D: Max Boost 5 GHz, Base 4.2 GHz, TDP 120 W, AM5 |
| NVIDIA GeForce family TGP tables (hidden behind `#specsmodal`) | Open the "View Full Specs" modal on the cited page | RTX 4070 = 200 W; RTX 4080 = 320 W (RSP 750 W); RTX 4060 = 115 W; RTX 4060 Ti = "165 or 160" W |
| Lian Li A3 conditional GPU clearance (image charts) | Open chart image assets and read values visually (2026-08-12) | All catalog ATX FRONT / offset / SIDE branches match |
| G.SKILL module height | Expand DRAM FAQ “How tall are the memory modules?” | Trident Z5 RGB: 44 mm |

## Verification (end of packet)

| Gate | Result |
|------|--------|
| Focused Step 12 regression | `src/test/cat6.step12.open-ended-ceiling.test.ts` — **3/3 PASS** |
| `pnpm test` | **40 files / 342 tests PASS** (Step 11 historical: **39 / 339**) |
| `pnpm test:e2e` | **19 / 19 PASS** |
| `pnpm build` | clean |
| `git diff --check` | clean |
| `git diff --check cd6dc83..HEAD` | clean (after amend) |
| Manifest entries | 22, each resolves exactly once |
| Provenance refs | all resolve exactly once in registry |
| Price source refs | all remaining resolve exactly once; no orphaned price source after Rev. 1.3 removal |
| Image fields / files | none added |

## Owner gate

- **Exhaustive audit packet:** recorded (this document), with 2026-08-12 corrective review.
- **Step 12 owner acceptance:** **accepted 2026-08-12** (after corrective commit `260169e` independent review). Four parts remain **BLOCKED** on primary manufacturer citations and one MSRP row remains **BLOCKED** as honest catalog gaps — acceptance closed the Step 12 gate, not the claim that every citation is green.
- **B4** (permanent `caution`): **resolved 2026-08-12** in a separate corrective packet — raw `chipset-bios: unavailable` preserved under O6; non-blocking for aggregate/verdict; other unavailable checks still caution. No BIOS data invented.
- **Phase 6 final owner closeout:** **accepted 2026-08-12** after the separate
  B4 corrective passed independent verification; see [`CLOSEOUT.md`](./CLOSEOUT.md).
- **Phase 7:** not started.
- **Catalog-authoring automation pipeline:** not implemented.
- **Push:** not performed.

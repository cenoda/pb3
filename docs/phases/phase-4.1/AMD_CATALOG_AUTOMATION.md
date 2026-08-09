# AMD product catalog — automatable harvest

**Status:** research result 2026-08-09  
**Intent:** Primary Path A corpus = **manufacturer catalogs**, not review sites.  
**Runtime:** SPA must **not** fetch AMD at runtime (ADR-001). Curator / CI
**build-time** extraction only.

---

## 1. What is automatable today

AMD embeds a full compare-table payload as **HTML-escaped JSON** on public
specifications pages:

| Surface | URL | Approx size | Items (2026-08-09) |
|---------|-----|-------------|--------------------|
| **Processors** | https://www.amd.com/en/products/specifications/processors.html | ~11 MB HTML | **742** CPU/APU rows |
| **Graphics** | https://www.amd.com/en/products/specifications/graphics.html | ~4.5 MB HTML | **203** GPU rows |

### Extraction shape

```text
<div id="product-specs-table-…"
     data-table-type="table-compare"
     data-language="en"
     data-json="{&#34;items&#34;:[ … ]}">
```

After HTML-entity unescape →:

```json
{
  "items": [
    {
      "title": "…",
      "model": "amd-site/models/processors",
      "productPages": { "en": "https://…", "…": "…" },
      "elements": {
        "name": { "formatValue": "AMD Ryzen™ 5 7600", "metaType": "text-single", … },
        "numOfCpuCores": { "formatValue": 6, … },
        "maxBoostClock": { "formatValue": "5.1 GHz", … },
        …
      }
    }
  ]
}
```

### Processor fields present (all 742)

Including: `name`, `family`, `series`, `formFactor`, `numOfCpuCores`,
`numOfThreads`, `maxBoostClock`, `baseClock`, `l1Cache`/`l2Cache`/`l3Cache`,
`defaultTdp`, `cpuSocket`, `productIdBoxed`/`productIdTray`, `launchDate`,
`unlockedForOverclocking`, memory/PCIe/tech flags, …

**Verified:** `AMD Ryzen™ 5 7600` appears with 6C/12T, 3.8 / 5.1 GHz, 65 W, AM5,
L3 32 MB, product ids `100-100001015BOX` / `100-000001015`.

### Graphics fields present

Including: `name`, `computeUnits`, `baseFrequency`, `boostFrequency`,
`gameFrequency`, `memoryType`/`memoryInterface`, `maxMemorySize`, TDP-ish
`gpuPower`, peak compute rates, display outputs, …

---

## 2. What this catalog *is* (and is not)

### It is: manufacturer **product specification** features

Static, SKU-level attributes AMD publishes for every processor/GPU in the compare
table — the **inputs** to a combination simulator / estimator:

```text
CPU: cores, threads, base/boost clock, caches, TDP, socket, architecture, …
GPU: compute units, clocks, memory bus/size/type, board power, …
```

**Game FPS is not supposed to be here.** FPS is a **function of a combination**
(CPU × GPU × game × settings × resolution × …). That is **our job** to compute
(`estimateCombinationPerformance` / future sim layers), not AMD’s product table.

### It is not: a performance chart brief

| Artifact | What it contains | Role for us |
|----------|------------------|---------------|
| **Specs catalog** (what we auto-pull) | Identity + electrical/compute specs | **Feature vectors** for every catalog CPU/GPU |
| **Performance chart / game brief** (optional later) | Published FPS or relative % in named games | Calibration / validation of the sim — **not** the primary product number source if we own the sim |
| **Third-party review** | Same as charts, third party | O4 validation only |

Owner direction: primary path is **manufacturer specs → our simulation function
→ estimated FPS range**. Missing FPS in the catalog is **expected and correct**.

### Gap to be honest about (current est1 M0)

M0 `est1` as implemented is still largely **anchor + evidenced scale graph**,
not yet a full **spec-driven hardware simulator**. The AMD dump is the right
**input corpus** for that sim; the next design step is to define how cores /
clocks / CU / memory map into the pure function (and what confidence that gets),
rather than hunting the catalog for FPS that will never be there.

---

## 3. Official API?

No documented public REST/GraphQL “AMD Product Catalog API” was found for these
tables. The **specifications compare pages are the practical bulk endpoint**:
one GET → full JSON in `data-json`.

Individual PDP HTML (e.g. Ryzen 5 7600 product page) also contains a
`.product-specifications` article (scrapeable per SKU) but is worse than the
bulk table for multi-CPU coverage.

---

## 4. Curator tool (repo)

```text
scripts/curate-amd-product-catalog.py
  --kind processors|graphics|both
  --out-dir benchmarks/est1/vendor-catalog/
```

Behavior:

1. HTTP GET the specifications page(s) (User-Agent identified as curator).
2. Parse `data-json`, unescape, JSON load.
3. Normalize rows (flat `formatValue` map + stable hash).
4. Write versioned JSON fixtures under `benchmarks/est1/vendor-catalog/`.
5. Print counts; exit non-zero on parse failure.

**Not** wired into the SPA. Optional CI / manual refresh.

### Rights / discipline

- Store **factual specs** already published on AMD product pages.
- Record `sourceUrl`, `accessedAt`, `sourceId` (e.g. `src.manufacturer-spec.amd-processors-catalog`).
- Extend `source-rights-record.json` / registry when first committed.
- Respect robots/ToS; rate-limit; do not DDoS; prefer infrequent refresh.

---

## 5. How this feeds multi-CPU estimation

```text
AMD processor catalog (auto)  ─┐
                               ├─► feature vectors per cpuId / gpuId
AMD graphics catalog (auto)  ──┘         │
                                         ▼
                         estimateCombinationPerformance / sim
                                         │
                                         ▼
                              fpsMin..fpsMax + method + confidence
                                         ▲
                    optional calibration (charts/reviews) ─┘
```

Pilot `cpu.zen4-7600` is one **mapped node** among many extractable SKUs — not a
one-off. Coverage of “most CPUs” = most nodes have specs in the manufacturer
dump + a sim that accepts those features.

---

## 6. Next automation steps (after this doc)

1. [x] Prove bulk JSON extract (processors + graphics)
2. [ ] Land curator script + empty-or-sample output path
3. [ ] Registry + rights rows for AMD catalog sources
4. [ ] Map AMD `name` → project `cpuId` / `gpuId` table (data, not code fork)
5. [ ] Search AMD-hosted **performance** PDFs/pages separately (not this table)
6. [ ] NVIDIA equivalent bulk catalog probe (if any)

---

## 7. Probe commands (reproducible)

```bash
curl -sL -A 'pb3-curator/0.1' --compressed \
  'https://www.amd.com/en/products/specifications/processors.html' \
  -o /tmp/amd-processors.html

python3 scripts/curate-amd-product-catalog.py --kind processors --out-dir /tmp/amd-out
```

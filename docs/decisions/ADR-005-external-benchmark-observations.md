# ADR-005: External benchmark observations — source rights and prov4 sidecar ingestion

- **Status:** Accepted (corrective `phase4-external-evidence-1`, 2026-08-09)
- **Date:** 2026-08-09
- **Deciders:** Project owner (package acceptance)
- **Related:** [`../corrections/phase4-external-evidence-1/corrective_plan.md`](../corrections/phase4-external-evidence-1/corrective_plan.md), [`prov4` contract](../phases/phase-4/specs/provenance-data-contract.md)

---

## Context

Phase 4 Step 9 remains blocked because the prior first-party pilot claim lacked
independently inspectable raw capture. The owner-accepted corrective package
authorizes a **build-time curated** external-observation sidecar under `prov4`,
with deterministic aggregation and explicit unavailable paths. Runtime scraping
from the static SPA is forbidden.

Before ingesting factual FPS observations from third-party reviews, each
candidate publisher must pass citation, access, and rights review. Candidate tier
status is **not** ingestion permission.

---

## Decision

1. **Ingestion model:** Public benchmark observations are authored into
   `benchmarks/prov4/external-performance-observations.json` at build time.
   The SPA loads and validates them like other fixtures; no live network
   scraping.

2. **Rights record SSOT:** Per-source access/citation/rights findings are
   recorded in `benchmarks/prov4/source-rights-record.json` and summarized here.
   Observations reference registry `sourceId` values only after the matching
   rights row is `approved` or `approved-metadata-only`.

3. **Comparability:** Observations aggregate only when `cpuId`, `gpuId`,
   `gameId`, `presetId`, `resolution`, `upscaleId`, `frameGenId`, and
   `rayTracingState` match exactly, **and** free-text `exactSettings` does not
   introduce a material settings mismatch (quality-class conflicts or
   contradictions with structured fields / pilot material profile). No
   coefficients.

4. **Aggregation thresholds** (corrective plan §4.2):
   - 3+ independent sources with average FPS → weighted median center; weighted
     20th/80th percentiles; confidence ≤ `medium`
   - 2 independent averages → min/max of averages; confidence `low`
   - 1 observation with source-published range → preserve range; confidence `low`
   - 1 average-only → sidecar reference only; **product range unavailable**
   - 0 exact matches → unavailable

5. **Confidence ceiling:** External-review and external-aggregated paths cap at
   `medium`. `high` remains first-party + verification only.

6. **perf1 boundary:** `perf1` public types unchanged. Aggregates live in the
   `prov4` sidecar; perf1 stub rows are not silently rewritten.

7. **Product UI:** Prefer a valid external aggregate for the exact pilot key.
   Otherwise label perf1 as synthetic and disclose external evidence as
   unavailable or reference-only. Observed / aggregated / synthetic /
   unavailable remain visually distinct.

---

## Source-specific rights review (2026-08-09)

**Scope of claim:** Rights findings are **curator-authored policy rows** in
`benchmarks/prov4/source-rights-record.json` (`recordVersion`, `reviewedAt`,
`reviewerLabel`). They are inspectable fixture data used for fail-closed engine
gating. They are **not** a legal opinion, not counsel-reviewed robots/terms
clearance, and not a claim that live site access was independently re-audited
beyond what the fixture rows themselves record.

The engine consults `decision` + `storeExtractedObservation` before any
observation can enter product aggregation. `approved-metadata-only` or
`storeExtractedObservation: false` excludes FPS contribution with reason
`source_rights_denied`.

| Registry `sourceId` | Publisher | Access / robots (fixture policy summary) | Citation of factual FPS | Store extracted observation | Decision |
|---------------------|-----------|------------------------------------------|-------------------------|----------------------------|----------|
| `src.external-review.techpowerup-rtx4070` | TechPowerUp GPU review | Public HTML; automated fetch may hit bot challenge | Fair-use citation of disclosed test conditions + numeric values without reproducing charts/prose | Yes, numeric fact + URL + conditions only | **approved** (no FPS rows ingested until exact pilot match verified) |
| `src.external-review.toms-hardware-rtx4070` | Tom's Hardware GPU review | Public HTML | Same as above | Yes, numeric fact + URL + conditions only | **approved** (no FPS rows ingested until exact pilot match verified) |
| `src.external-review.computerbase-cp2077` | ComputerBase DE | Public HTML (German) | Same; settings must be verbatim-disclosed | Yes when settings disclosed | **approved** (no FPS rows ingested until exact pilot match verified) |
| `src.external-review.hwunboxed-rtx4070` | Hardware Unboxed | YouTube + companion pages; no chart redistribution | Citation only when configuration recoverable from published materials | Conditional | **approved-metadata-only** (FPS not ingested without inspectable published table) |
| `src.manufacturer-spec.nvidia-rtx4070` | NVIDIA | Public product spec | Hardware identity / feature metadata only | Metadata only; not independent FPS truth | **approved-metadata-only** |
| `src.manufacturer-spec.cdpr-cp2077` | CD Projekt RED | Public patch notes / settings docs | Game patch / preset naming metadata only | Metadata only | **approved-metadata-only** |

**Pilot ingestion outcome (2026-08-09):** No defensible exact-match observation
for `cpu.zen4-7600` + `gpu.rtx4070` + `game.cyberpunk-2077` +
`preset.raster-ultra` + native DLSS/FG off was verified during implementation.
Fixture ships audit-only excluded near-miss rows without product FPS. Engine and
UI implement truthful unavailable paths until independently verified observations
are curated.

---

## Consequences

- Positive: Restores evidence discipline; aggregation logic is testable without
  inventing FPS.
- Negative: Pilot product FPS remains perf1 synthetic / unavailable until
  verified observations exist.
- Revisit: When owner or curator adds verified observations to the fixture file,
  re-run integrity tests and independent re-audit; no contract bump required for
  additive observation rows.

---

## Compliance

- No runtime scraping.
- No CPU/GPU interpolation in this corrective path.
- No arbitrary ±% bands.
- Cooling / power corrections are not manufactured from geometry.

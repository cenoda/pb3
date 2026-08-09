# Corrective plan — public benchmark evidence and deterministic aggregation

Status: **Owner-accepted; implementation authorized for Cursor (2026-08-09)**
Work id: `phase4-external-evidence-1`

## 1. Product rule

The shipped static SPA reads versioned repository fixtures. It does not scrape
review sites at runtime. Public benchmark observations are curated at build
time, validated, normalized, and published as static JSON with provenance.

The engine may aggregate only comparable observations. Insufficient evidence
produces `unavailable`; it never produces a guessed range.

## 2. Source policy

### 2.1 Candidate source tiers

| Tier | Candidate | Intended use |
|------|-----------|--------------|
| A | TechPowerUp GPU reviews | Game/resolution observations with documented test system and settings |
| A | Tom's Hardware GPU reviews and game benchmark methodology | Independent cross-check and compatible observations |
| B | ComputerBase game/GPU benchmark articles | Additional independent observation when exact settings are disclosed |
| B | Hardware Unboxed published benchmark material | Cross-check when the exact tested configuration is recoverable and citable |
| Metadata only | NVIDIA, AMD, CD Projekt RED | Hardware identity, driver/game/settings metadata; not independent FPS truth |

Candidate status is not ingestion permission. Before a source is used, record:

- canonical URL, publisher, author/title, publication date, and access date;
- whether the relevant value and test conditions are visible and citable;
- source-specific access/robots/terms findings;
- whether storing the extracted factual observation is acceptable without
  copying charts, prose, or a substantial source dataset.

If those checks are unresolved, the source is excluded.

### 2.2 Minimum observation fields

```text
sourceId, sourceUrl, publishedAt, accessedAt
cpuId, gpuId, gameId, gamePatchVersion?
presetId, exactSettings, resolution
upscaleId, frameGenId, rayTracingState
fpsAverage?, fpsOnePercentLow?, frametime?
testSystem, driverVersion?, sampleNotes
```

Omitted metrics remain structured unavailable. They are never inferred from a
chart that does not publish them.

## 3. Comparability

Observations may enter the same aggregation group only when these fields match:

```text
gpuId, gameId, presetId, resolution,
upscaleId, frameGenId, rayTracingState
```

CPU must also match unless the observation is explicitly classified as
GPU-bound by evidence accepted in this package. The initial implementation
does not exercise that exception: exact CPU match is required.

Game patch and driver differences are retained as uncertainty metadata. A
material settings mismatch excludes the observation; it is not repaired with
a coefficient.

## 4. Aggregation function

### 4.1 Inputs and output

```text
aggregateComparableObservations(exactKey, observations)
  -> aggregated estimate | unavailable
```

The function is pure, deterministic, and clock-independent. Freshness is
classified separately by the existing `prov4` path.

### 4.2 Evidence thresholds

| Comparable evidence | Result |
|---------------------|--------|
| 3+ independent observations with average FPS | Weighted median center; weighted 20th/80th percentiles form the expected range; confidence at most `medium` |
| 2 independent observations with average FPS | Ordered observed averages form the range; confidence `low`, upgradeable to `medium` only by an accepted completeness rule |
| 1 observation with a source-published repeatability/range measure | Preserve that published range; confidence `low` |
| 1 average-only observation | Evidence sidecar only; product range `unavailable` |
| No exact observations | `unavailable` |

No synthetic padding is added when percentiles collapse or the sample is too
small. The result carries contributing source IDs and the complete exclusion
reasons for nearby but non-comparable observations.

### 4.3 Weighting

Weights are categorical and declared in fixtures, not fitted to desired FPS:

```text
source-method quality × condition completeness × recency class
```

The first implementation locks a small reviewed vocabulary. It does not use a
free-form numeric score authored per row. Sensitivity tests must prove that one
source cannot dominate three independent observations unexpectedly.

### 4.4 Confidence ceiling

- public external reviews: `medium` maximum;
- incomplete or single-source evidence: `low` or `unavailable`;
- `high`: unavailable in this corrective path;
- synthetic fixtures: `stub` only.

## 5. Baseline and correction boundaries

- `perf1` remains the stable exact-key baseline lookup API.
- New observations and aggregates live in a `prov4` sidecar dataset; do not
  silently rewrite all 96 `perf1` stub rows.
- The pilot UI prefers a valid external aggregate for the exact key. Otherwise
  it labels the `perf1` result as synthetic and exposes external evidence as
  unavailable or reference-only.
- `applyCorrection()` remains withheld unless a separately evidenced
  correction row exists. This package does not manufacture cooling or power
  derates from geometry.
- CPU/GPU interpolation and modeled estimates require a later accepted plan.

## 6. Ordered implementation

### Step 0 — accept package (**complete 2026-08-09**)

- Independent peer review of this package and the safety-removal diff.
- Owner accepts source policy, aggregation semantics, and scope. **Done.**
- Owner separately authorizes implementation for Cursor. **Done.**

### Step 1 — source rights and observation contract

Likely files:

- `docs/decisions/ADR-005-external-benchmark-observations.md`
- `src/contract/prov4.ts`
- `src/contract/prov4.schema.ts`
- `src/test/prov4.schema.test.ts`

Lock the observation shape, source-use decisions, exact-key rules, and
structured exclusion reasons. Prefer an additive `prov4` amendment; do not
widen `perf1`.

### Step 2 — curated pilot observations

Likely files:

- `benchmarks/prov4/external-performance-observations.json`
- `benchmarks/prov4/evidence-source-registry.json`
- `src/test/prov4.integrity.test.ts`

Ingest only observations whose conditions and citation rights passed Step 1.
No automated scraping in this milestone.

### Step 3 — normalization and aggregation

Likely files:

- `src/provenance/groupComparablePerformance.ts`
- `src/provenance/aggregatePerformanceEvidence.ts`
- corresponding unit tests

Implement exact grouping, deterministic weighted statistics, evidence
thresholds, contributor lists, and unavailable paths.

### Step 4 — pilot binding and disclosure

Likely files:

- `src/provenance/bindPerformanceEvidence.ts`
- `src/provenance/buildPilotDisclosureReport.ts`
- `src/ui/PerformancePanel.tsx`
- `src/ui/EvidenceDisclosurePanel.tsx`

Display observed/aggregated/synthetic/unavailable distinctly. Preserve the
pilot-only non-carry rule.

### Step 5 — verification and closeout

- Unit tests: grouping, percentile boundaries, source independence, missing
  metrics, exclusion reasons, confidence ceilings, and no interpolation.
- E2E: external aggregate disclosure and all-unavailable fallback.
- `pnpm test:all`, `pnpm build`, `git diff --check`.
- Independent re-audit, then explicit owner Phase 4 Step 9 PASS.
- Stop before Phase 5 planning.

## 7. Acceptance questions

Owner acceptance must explicitly approve:

1. build-time curated fixtures, not runtime scraping;
2. the source shortlist subject to per-source rights checks;
3. exact CPU/config matching for the first implementation;
4. the evidence thresholds in §4.2;
5. external-review confidence capped at `medium`;
6. no interpolation or modeled estimates in this correction;
7. separate implementation authorization after package acceptance.

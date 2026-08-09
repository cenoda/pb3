# Phase 4 — Evidence-grade data and validation

Status: **Historical accepted M0 spec; corrective gate reopened (2026-08-09).**
The invalid first-party pilot fixture was removed. External-evidence replacement
is proposed under
[`../../../corrections/phase4-external-evidence-1/`](../../../corrections/phase4-external-evidence-1/)
and is not yet owner-accepted or implementation-authorized.

Scope authority: owner-selected Phase 4 direction from
[`../BRIEF.md`](../BRIEF.md) — **single-build evidence pilot**. Detailed
versioned types live in
[`provenance-data-contract.md`](./provenance-data-contract.md).

This document is the **accepted M0 scope lock**. It fixes the pilot path,
inventory, evidence bar, and exit criteria. The owner separately authorized
implementation on 2026-08-09. Steps 1–8 are complete; software green does not
close Step 9 without explicit owner acceptance of evidence quality.

---

## 1. Goal

Phases 0–3 proved the application architecture end to end. Runtime results are
still epistemically weak: `perf1` rows are `confidence: "stub"`, physical
geometry is synthetic `Experimental`, cooling evidence is empty, and prices are
static fixtures.

Phase 4 M0 proves **one complete evidence path** for **one fixed pilot build**:

1. attach versioned **provenance** to every pilot claim surface via `prov4`
   sidecar records (including residual stub cells that remain honestly labeled);
2. distinguish **stub / synthetic / source-backed / measured** honestly;
3. record **conditions, license/rights class, data version, and freshness**;
4. expose why a result is available, degraded, stale, or `unavailable`;
5. require **human verification** and **complete capture conditions** where
   automation cannot establish measurement truth.

This phase is not catalog expansion, not a production launch, and not a claim
that the whole catalog becomes evidence-grade.

---

## 2. Accepted pilot path (owner-selected)

| Decision | Resolution |
|----------|------------|
| Phase direction / title | **Evidence-grade data and validation** |
| Pilot path | **Single-build evidence pilot** — tightly bounded end-to-end path for one fixed build |
| Not selected | Broad performance-only catalog fill; broad geometry-only catalog fill; multi-build matrix expansion |

The pilot is a **vertical evidence slice** over the existing default ATX build:

```text
BuildStateV2 (DEFAULT_BUILD_STATE_V2)
  case.mid-tower-atx-01
  mb.atx-b650-01
  cpu.zen4-7600
  gpu.rtx4070
  cooler.air-twin-tower-01
  ram.ddr5-32gb-6000
  psu.750w-atx
  game.cyberpunk-2077
  preset.raster-ultra
```

Mount orientation for cooling/physical evidence lookup remains the Phase 3
default cooler orientation (`normal`) unless a later accepted amendment adds
another exact mount configuration.

### 2.1 Pilot workload surface (performance)

For the pilot build only, Phase 4 covers the **controlled baseline** cells:

| Dimension | Pilot values |
|-----------|--------------|
| CPU / GPU | `cpu.zen4-7600` / `gpu.rtx4070` |
| Game / preset | `game.cyberpunk-2077` / `preset.raster-ultra` |
| Resolutions | `1080p`, `1440p`, `4k` |
| Upscaling | `upscale.off` |
| Frame generation | `framegen.off` |
| RAM tier | `ram.32gb-ddr5` (mapped from the pilot RAM kit capacity class; see §5.3) |
| Power profile | `power.default` |

That is **exactly 3 baseline cells**, not the full 96-row `perf1` matrix.

**Pilot claim rule (normative):** each of the three cells is a **pilot claim**
and **must** have a registry-bound `prov4` performance evidence row. Cells may
differ in confidence:

- at least one first-party measured cell under O1-A (see §12);
- residual cells may be explicit `confidence: "stub"` with
  `project-synthetic` provenance — still rows, never silent omission.

**Out of M0 (review-aligned):**

- Cinebench stretch — **excluded**
- Sustained-load / cooling-linked correction evidence — **excluded** (cooling
  production rows stay empty)

### 2.2 Pilot geometry surface (physical)

For the **seven selected pilot part IDs only**, Phase 4 attaches `prov4`
geometry evidence records joined to existing `phys3` `physicalSpec.evidence`
via the official key
`GeometryEvidenceRecord.phys3EvidenceSourceId === physicalSpec.evidence.sourceId`
(see provenance contract §7.3).

It does **not** expand the physical core, does not promote visual-only parts,
does not require manufacturer GLB replacement, and under O2-A does **not**
raise model grade above `Experimental`.

### 2.3 Pilot cooling surface

Production cooling evidence and cooling provenance rows remain **empty**.
Runtime cooling stays structured `unavailable` (Phase 3 behavior preserved).
Phase 4 does **not** invent a cooling bucket or FPS derate.

---

## 3. Inventory boundary (do not expand silently)

| Rule | M0 position |
|------|-------------|
| New part IDs | **None** |
| New games / presets / resolutions | **None** |
| New categories | **None** |
| Catalog selection UI | Unchanged Phase 2 pickers |
| Physical-core / visual-only partition | Unchanged Phase 3 |

Non-pilot builds keep existing Phase 0–3 behavior. Pilot evidence never
carries over to a near match.

---

## 4. Evidence domains and quality bar

### 4.1 Domains in scope

| Domain | Pilot claim surface | Quality bar |
|--------|---------------------|-------------|
| Provenance registry | Shared origin identity for all pilot records | Every pilot claim row cites one or more registry entries |
| Performance baseline | **All 3** resolution cells | Each cell has a `prov4` row; measured cells need complete capture conditions; residual cells are explicit stub rows with synthetic provenance |
| Geometry / model grade | 7 pilot parts | Join via `phys3EvidenceSourceId`; O2-A keeps `Experimental` |
| Cooling | Empty / unavailable | No production row; disclosure states unavailable |
| Price disclosure | Existing fixture prices | Labeled static / non-live only |
| UI disclosure | Pilot and non-pilot states | Grade, confidence, source class, version, freshness, limitations |

### 4.2 Permitted source classes

| Class | Allowed for pilot M0 | Max confidence (performance) | Max model grade (geometry) |
|-------|----------------------|------------------------------|----------------------------|
| `first-party` controlled measurement | Yes, preferred | `"high"` only when capture-conditions gate + verification pass (contract §6.4) | Geometry measure path only with human checks; M0 stays Experimental under O2-A |
| `project-synthetic` fixture | Yes, residual stub cells + geometry | `"stub"` only | `"Experimental"` only |
| `external-review` published review | Yes, with citation | `"medium"` max; never `"high"` | Not sufficient alone for `"Verified"` |
| `manufacturer-spec` datasheet | Rights class required | N/A | Ceiling exists; M0 does not upgrade past Experimental under O2-A |
| `third-party-mesh` / manufacturer-derived GLB | **Out of scope for M0** | — | Separate rights decision (ADR-004 residual) |

### 4.3 Rights and license bar

- Code, data, and project-authored synthetic fixtures remain Apache-2.0
  (ADR-004).
- No third-party or manufacturer-derived mesh is imported, redistributed, or
  labeled project-owned without a recorded source-specific rights decision.
- Manufacturer dimension numbers used as evidence must record source identity
  and rights class. Unknown rights block grade-up (irrelevant under O2-A).

### 4.4 Human verification and capture conditions

Automation can validate schema, ID consistency, exact-key match, freshness
windows, and GLB node presence. It cannot certify that a run was real or that
a dimension matches a physical object.

**First-party measured rows** must satisfy charter §5 metrics (contract §6.2):

- required numeric `fpsAverage` and `fpsOnePercentLow`;
- available frametime evidence (percentile summary and/or raw frametime
  artifact) — never omitted;
- stub / external-review rows must use explicit `MetricUnavailable` where a
  charter metric was not measured or not stated.

**Performance `"high"`** requires all of:

1. `measurement.metricKind: "first-party-measured"` with the charter metrics
   above;
2. complete `PerformanceCaptureConditions` (protocol/version, run count ≥ 2,
   range derivation, game patch, GPU driver, tool/version, exact graphics
   settings, power/thermal conditions);
3. structured `RawArtifactReference` (`kind`, `locator`, `sha256`,
   `mediaType`, `byteLength`) that passes integrity (repo-file must exist and
   match digest/size — free-form strings are rejected);
4. a pass `performance-capture-attestation` whose `attestedArtifactDigests`
   include the capture `sha256` and whose checklist attests conditions +
   charter metrics.

fpsMin/fpsMax + a short checklist alone is **not** evidence-grade.

**Geometry grade > Experimental** requires human verification (blocked under
O2-A for M0 shipping grade).

---

## 5. Contract lineage

### 5.1 New independent contract

Phase 4 introduces **`prov4`** — an independent provenance and evidence-binding
contract. It does **not** replace `vs0`, `perf1`, `vs2`, `compat2`, or `phys3`.

### 5.2 Sidecar binding only (no public-type widening)

| Existing surface | Phase 4 rule |
|------------------|--------------|
| `perf1` | **Public types and fixture row shapes unchanged.** Pilot display uses `prov4` sidecar overlay for the three exact pilot keys only |
| `phys3` | Public types unchanged. Disclosure joins via `phys3EvidenceSourceId` to `physicalSpec.evidence.sourceId` |
| `compat2` / price | Unchanged; prices remain non-live |
| `vs2` URL / BuildState | **Unchanged** — no new URL keys for provenance |

Do **not** add optional provenance fields onto `perf1` rows. The earlier draft
wording that allowed that is **withdrawn**.

### 5.3 RAM SKU ↔ `perf1` RAM tier

Phase 2 deferred automatic RAM SKU → RAM tier mapping. For the **pilot only**,
Phase 4 hard-documents a single mapping used by evidence keys:

```text
ram.ddr5-32gb-6000  →  ram.32gb-ddr5
```

This is a pilot constant, not a general catalog rule.

---

## 6. Runtime behavior

### 6.1 Pilot match

A query is **pilot-eligible** only when every field of the pilot key matches
exactly. Near matches do not reuse pilot evidence.

### 6.2 Non-pilot paths

Non-pilot selections continue to use existing stub / Experimental /
unavailable behavior with no pilot overlay.

### 6.3 Pilot performance path

For each of the three pilot resolutions:

1. load the registry-bound `prov4` row (required by fixture integrity);
2. bind sources / capture conditions / verification / freshness;
3. display the sidecar range + confidence + disclosure;
4. leave the underlying `perf1` table row untouched for non-pilot queries.

Residual stub pilot cells show `confidence: "stub"` and synthetic provenance
in the disclosure UI — not an unlabeled fall-through.

### 6.4 Stale and withheld

When freshness classifies `stale`, default presentation is **bound + stale
disclosure** (number still shown; not claimed current). Missing/invalid
`asOf` classifies as `unknown` (see contract §4; `asOf` is optional on the
classifier input).

### 6.5 Uncertainty policy (unchanged project law)

- Prefer `unavailable` / withheld / stub over invented FPS or fit.
- Never present synthetic geometry as `Verified`.
- Never present external review as first-party high confidence.
- Visual accuracy never proves collision or mount accuracy.
- Never present incomplete capture conditions as `"high"`.

---

## 7. UI evidence disclosure (in scope)

Phase 4 adds a bounded disclosure surface that, for the current selection,
shows at least:

1. whether the current build is the pilot build;
2. all three pilot resolution bindings (measured and residual stub);
3. per domain: confidence or model grade;
4. source class and source id(s);
5. data / geometry version;
6. captured/reviewed timestamps and freshness state;
7. human verification status when required;
8. capture-condition summary when confidence is not stub;
9. explicit limitation text for residual stub cells, Experimental geometry,
   empty cooling, non-live prices, and non-pilot catalog.

No design-system rewrite.

---

## 8. Verification tooling (in scope)

Deterministic checks:

- `prov4` schema parse of registry and pilot evidence files;
- exactly three performance rows, all registry-bound;
- high-confidence gate fields complete;
- geometry `phys3EvidenceSourceId` join integrity for seven pilot parts;
- confidence / grade ceilings;
- freshness classification including omitted `asOf` → unknown;
- Phase 0–3 regressions green.

Human checks (closeout):

- verification records for every upgraded claim;
- owner walkthrough of pilot disclosure including residual stub cells;
- optional keepsake screenshot.

---

## 9. Draft completion scenario

1. Load the default build (pilot).
2. Show performance ranges for **1080p / 1440p / 4k**, each with provenance
   disclosure (source class, confidence, version, freshness). Residual stub
   cells are still disclosed as stub — not omitted.
3. Show at least one first-party measured cell (O1-A) with capture-condition
   summary when present.
4. Show physical panel model grade + geometry provenance for pilot parts via
   `phys3EvidenceSourceId` join; grade remains Experimental under O2-A.
5. Show cooling structured unavailable (empty production rows).
6. Switch to a non-pilot part and confirm pilot evidence does not carry over.
7. Show a stale or incomplete-capture path that degrades rather than
   over-claiming `"high"`.
8. Keep Phase 0–3 unit/E2E green; add Phase 4 E2E for the pilot disclosure path.

---

## 10. Explicit non-goals (Phase 4 M0)

- Catalog, game, preset, or workload breadth expansion.
- Full 96-cell `perf1` remeasurement.
- Cinebench pilot cells.
- Production cooling evidence / bucket map / FPS derate.
- CFD, thermal simulation, acoustics, cable routing, assembly animation, RGB,
  photoreal polish.
- Recommendation engine, auto-overclock advice, commerce, live pricing feeds.
- Backend, auth, community contribution workflow, deployment pipeline.
- Import or redistribution of third-party/manufacturer GLBs.
- Triangle-mesh physics or new collision dependencies.
- Adding provenance fields to `perf1` / `phys3` public types.
- Breaking renames of existing contracts solely to rebrand stubs.
- Treating green software tests alone as evidence-quality closeout.
- Implementation before owner acceptance of this M0 package **and** a separate
  explicit start instruction.

---

## 11. Accepted M0 decisions (2026-08-09)

| # | Decision | Owner-accepted resolution |
|---|----------|---------------------------|
| D1 | Phase title / direction | Evidence-grade data and validation; single-build pilot |
| D2 | Pilot build | `DEFAULT_BUILD_STATE_V2` part set in §2 |
| D3 | Performance pilot matrix | Exactly 3 baseline cells; all registry-bound rows |
| D4 | Contract lineage | Independent `prov4` sidecar only; no `perf1` public field adds |
| D5 | Source / license bar | §4.2–§4.3; third-party meshes out of scope |
| D6 | Human verification + capture gate | Required for `"high"`; complete captureConditions + charter metrics + digest-attested `RawArtifactReference`; first-party `runCount >= 2` at every confidence |
| D7 | RAM mapping | Pilot-only `ram.ddr5-32gb-6000` → `ram.32gb-ddr5` |
| D8 | Cooling | **Empty production rows; unavailable** |
| D9 | Cinebench stretch | **Out** |
| D10 | E2E | Required Phase 4 pilot disclosure scenario |
| D11 | First-party at closeout | **O1-A** (see §12) |
| D12 | Geometry grade | **O2-A — Experimental only** |
| D13 | Freshness window | **O3-A — 365 days** |
| D14 | Fixture paths | **O4-A — `benchmarks/prov4/`** |
| D15 | Geometry join | `phys3EvidenceSourceId` exact match to `physicalSpec.evidence.sourceId` |
| D16 | Residual pilot stubs | Allowed only as explicit `prov4` stub rows, never missing rows |

---

## 12. Resolved open decisions (2026-08-09)

| ID | Question | Owner-accepted resolution |
|----|----------|---------------------------|
| O1 | First-party measured performance at closeout? | **A** — ≥1 first-party cell with complete capture conditions and `runCount >= 2` (prefer `"high"` when verification exists). **All three cells still have registry-bound rows**; non-measured cells are explicit stub records |
| O2 | Geometry grade above Experimental in M0? | **A** — No; remain Experimental |
| O3 | Freshness default window | **A** — 365 days |
| O4 | Fixture path layout | **A** — `benchmarks/prov4/` |

M0 planning gate is clear. Implementation remains blocked until the owner
gives a **separate** explicit start instruction.

---

## 13. Exit criteria (phase, after implementation)

Phase 4 exits only when **both** gates pass:

### 13.1 Software gate

- `prov4` types, Zod schemas, loaders, and pure classifiers implemented per plan.
- Sidecar overlay for three pilot performance keys; `perf1` public types unchanged.
- Geometry join via `phys3EvidenceSourceId`.
- UI disclosure covers §7.
- `pnpm test`, `pnpm test:e2e`, `pnpm test:all`, `pnpm build` green.
- Phase 0–3 regressions remain green.
- New Phase 4 E2E covers the completion scenario.

### 13.2 Evidence-quality gate

- All three pilot performance cells have registry-bound `prov4` rows.
- At least one first-party measured cell (O1-A) with complete capture
  conditions (**including `runCount >= 2`**), charter metrics (average / 1%
  low / frametime), and integrity-checked raw artifact; residual cells are
  explicit `synthetic-stub` rows. A first-party `"medium"` cell with fewer
  than two timed runs is not a valid closeout measurement.
- No stub/synthetic row labeled measured/Verified/`"high"`.
- `"high"` only when contract §6.5 gate passes (including digest attestation).
- Seven pilot geometry rows join cleanly; grade remains Experimental (O2-A).
- Cooling remains unavailable with empty production rows.
- Human verification records exist for every upgraded claim (if any).
- Owner explicitly accepts closeout after pilot + non-pilot contrast review.

Green tests alone are **not** sufficient.

---

## 14. Related documents

| Document | Role |
|----------|------|
| [`../BRIEF.md`](../BRIEF.md) | Direction brief; pilot path selected for M0 |
| [`provenance-data-contract.md`](./provenance-data-contract.md) | `prov4` types and rules |
| [`../implementation_plan.md`](../implementation_plan.md) | Ordered file-level plan |
| [`../TODO.md`](../TODO.md) | Gate checklist |
| [`../../phase-1/specs/performance-data-contract.md`](../../phase-1/specs/performance-data-contract.md) | Inherited `perf1` (unchanged) |
| [`../../phase-3/specs/physical-validation-data-contract.md`](../../phase-3/specs/physical-validation-data-contract.md) | Inherited `phys3` evidence refs |
| [`../../../decisions/ADR-004-license-code-apache-2.0.md`](../../../decisions/ADR-004-license-code-apache-2.0.md) | License; third-party GLB residual |
| [`../../../../STATUS.md`](../../../../STATUS.md) | Project-wide live status |

# Phase 4 brief — Evidence-grade data and validation

## 1. Why this phase exists

Phases 0–3 proved the application architecture: selection, explainable
performance ranges, logical compatibility, pricing, 3D assembly, and physical
validation work end to end. The remaining credibility gap is the evidence.
Runtime performance values are stub fixtures, physical geometry is synthetic
`Experimental` data, cooling evidence is unavailable, and price data is static.

Phase 4 is a narrow transition from architecture proof to evidence-backed
results for a deliberately small hardware and workload set. It is not a catalog-
expansion or production-launch phase.

## 2. Outcome

For an owner-accepted pilot subset, the app can distinguish and explain:

- measured or source-backed data from stub data;
- verified physical dimensions from synthetic geometry;
- the provenance, conditions, version, and freshness of each result; and
- why a result is available, degraded in confidence, stale, or unavailable.

The phase proves one complete evidence path before adding breadth.

## 3. Workstreams (M0 selection)

| Workstream | M0 status |
|------------|-----------|
| Provenance contract | **Accepted** — independent `prov4` |
| Performance pilot | **Accepted** — 3 baseline cells for one build |
| Geometry pilot | **Accepted** — provenance on the same seven pilot parts |
| Verification tooling | **Accepted** — schema/integrity + human verification records |
| UI evidence disclosure | **Accepted** — pilot disclosure panel / extensions |
| Broad multi-build matrix | **Out** |

## 4. Owner-selected pilot path

**Single-build evidence pilot** (selected for M0; package owner-accepted
2026-08-09).

Fixed build = existing `DEFAULT_BUILD_STATE_V2`:

```text
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

Accepted detail:

- [`specs/phase-4.md`](./specs/phase-4.md)
- [`specs/provenance-data-contract.md`](./specs/provenance-data-contract.md)
- [`implementation_plan.md`](./implementation_plan.md)

## 5. Hard boundaries

- No implementation, dependencies, production fixtures, or generated/derived
  hardware assets before a separate implementation start instruction.
- No broad catalog, game, preset, or workload expansion.
- No claim that manufacturer dimensions, third-party meshes, or benchmark data
  are licensed until source-specific rights are recorded.
- No CFD, thermal simulation, acoustics, cable routing, assembly animation, RGB,
  photoreal polish, recommendation engine, or automatic overclocking advice.
- No live pricing, commerce, backend, auth, community contribution workflow, or
  deployment unless the owner explicitly changes the phase direction.
- No breaking changes to existing contracts merely to rename stub evidence.
- No inference that visual accuracy proves collision or mounting accuracy.

## 6. Decisions (owner-accepted 2026-08-09)

| Decision | State |
|----------|--------|
| Phase direction and title | Evidence-grade data and validation |
| Pilot path | **Single-build evidence pilot** |
| Fixed inventory / workload | Accepted in `specs/phase-4.md` §2 |
| Source classes and license bar | Accepted in `specs/phase-4.md` §4 |
| Contract lineage | Independent `prov4` **sidecar only** |
| Human verification + high gate | CaptureConditions + charter metrics + digest-attested RawArtifactReference; first-party `runCount >= 2` |
| Geometry join | `phys3EvidenceSourceId` === `physicalSpec.evidence.sourceId` |
| Three pilot perf cells | All registry-bound; residual stub rows allowed |
| Exit criteria | Dual software + evidence-quality gates |
| O1–O4 | **A / A / A / A** |
| Cinebench / cooling | Out / empty unavailable |

M0 is accepted. Implementation still requires a separate start instruction.

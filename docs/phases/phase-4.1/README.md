# Phase 4.1 — Combination performance estimator (sub-path)

**Status: M0 implemented (2026-08-09) · algorithm O1–O9 locked · software gate green**

Work id: `phase-4.1-combo-estimator`

This is a **sub-path of Phase 4**, not Phase 5 and not a charter renumber.

## Temporary draft function

`est1` is a **temporary draft** combination estimator. Results assume controlled
baseline conditions. **Motherboard, cooling, case airflow, and non-default power
limits are not modeled** and may change real-world outcomes when those functions
are added in a later revision. Every estimate carries an explicit `draftCaveat`.

## Why this sub-path exists

Phase 4 exact-only external aggregation is evidence-correct but product-empty for
mid-range combos (review benches use flagship CPUs). Phase 4.1 adds a pure
**estimation** function (`est1`) that may scale manufacturer / strong anchors with
**evidenced** transforms, while keeping `prov4` as evidence and `perf1` untouched.

**Owner corpus strategy:** manufacturer-centric = **AMD / NVIDIA (etc.) product
catalogs and official performance materials**, not third-party review sites.
M0 only ships the **7600 pilot**, but the design must support **most catalog
CPUs** later via catalog harvest + a reusable scale graph. Reviews are O4-only.

## Owner locks (O1–O9)

See [`ALGORITHM_DISCUSSION.md`](./ALGORITHM_DISCUSSION.md) §0.

Summary: comparability-first harvest; no CPU transform without ratio edge;
mandatory comparable review validation; scaled ≤ low; `est1` sidecar; pilot × 3
with exact/scaled/unavailable proof; estimator unavailable ≠ synthetic.

## Layout

```text
docs/phases/phase-4.1/
  README.md
  TODO.md
  ALGORITHM_DISCUSSION.md
  DATA_CURATION_CHECKLIST.md   ← Path A (active product work)
  implementation_plan.md
  specs/
    phase-4.1.md
    estimator-data-contract.md    ← est1
```

## Gates

| Gate | State |
|------|--------|
| Algorithm O1–O9 | **Locked** 2026-08-09 |
| M0 scope + est1 contract + plan | **Accepted** 2026-08-09 (via start prompt) |
| Owner M0 package accept | **PASS** (implementation-start) |
| Implementation start | **Authorized** 2026-08-09 |
| Implementation Steps 1–6 | **Done** 2026-08-09 |
| Path A data curation | **Active** — empty shipped corpus; fill per checklist |

## Path A — data curation (active)

Primary harvest = **AMD manufacturer catalogs** (auto bulk specs), not review
sites. See [`AMD_CATALOG_AUTOMATION.md`](./AMD_CATALOG_AUTOMATION.md) and
[`DATA_CURATION_CHECKLIST.md`](./DATA_CURATION_CHECKLIST.md).

- Specs spine: `benchmarks/est1/vendor-catalog/` (curator script)
- FPS / scale edges: still need official **performance** materials (not in specs table)
- Reviews: O4 only

## Implementation note

Shipped under `est1` sidecar (`src/contract/est1*`, `src/estimate/*`,
`benchmarks/est1/`). Do **not** start Phase 5 from this path.

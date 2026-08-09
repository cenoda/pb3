# Phase 4.1 — Combination performance estimator (sub-path)

**Status: M0 planning package complete (2026-08-09) · algorithm O1–O9 locked · implementation not started**

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
  implementation_plan.md
  specs/
    phase-4.1.md
    estimator-data-contract.md    ← est1
```

## Gates

| Gate | State |
|------|--------|
| Algorithm O1–O9 | **Locked** 2026-08-09 |
| M0 scope + est1 contract + plan | **Drafted** 2026-08-09 |
| Owner M0 package accept | Pending (may be granted with start prompt) |
| Implementation start | **Separate instruction required** |
| Implementation | Not started |

## Implementation start

Do **not** write `src/` or `benchmarks/est1/` until the owner issues an explicit
implementation-start instruction (handoff prompt in the session that ships this
package, or a later message).

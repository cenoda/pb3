# Phase 4.1 — Combination performance estimator (sub-path)

**Status: algorithm direction owner-locked (O1–O9, 2026-08-09) · M0 package not accepted · implementation not authorized**

Work id: `phase-4.1-combo-estimator`

This is a **sub-path of Phase 4**, not Phase 5 and not a charter renumber.
It exists because the Phase 4 exact-match external-evidence path alone cannot
power a product that must **predict performance for arbitrary part
combinations**.

## Why this sub-path exists

Phase 4 shipped:

- provenance scaffolding (`prov4`);
- fail-closed external observation aggregation (exact key only);
- honest empty product FPS when no exact public row exists.

Public GPU reviews almost always use **flagship CPUs**, while the product pilot
(and real users) pick mid-range CPUs. Exact-only aggregation therefore stays
empty for the combinations the product cares about. That is evidence-correct
and **product no-go**.

Phase 4.1 asks a different primary question:

> Given published performance fragments (manufacturer + trusted third parties),
> **what pure function** predicts a range for a user-selected combination, with
> explicit method, confidence, and provenance?

## Owner direction (locked O1–O9 — 2026-08-09)

Full table: [`ALGORITHM_DISCUSSION.md` §0](./ALGORITHM_DISCUSSION.md).

| Priority | Role |
|----------|------|
| **Harvest order** | Manufacturer materials first, but **comparability-first** selection (weaker vendor blob loses to stronger comparable review) |
| **Transforms** | CPU (and other) scales only with **evidenced ratio edges** — no GPU-bound waiver without ratio (including 1440p/4K) |
| **Reviews** | Auxiliary corpus; **mandatory validation** when comparable |
| **Scaled M0 ceiling** | `confidence ≤ low` |
| **Contracts** | **`est1`** = estimation; **`prov4`** = evidence; **`perf1`** untouched |
| **M0 surface** | Pilot × 3 resolutions; prove **exact / scaled / unavailable** |
| **Failure** | Estimator returns **unavailable** only (synthetic stays outside est1) |

Modeled estimates are first-class **labeled** outputs, never dressed as measurement.

## Layout

```text
docs/phases/phase-4.1/
  README.md                 ← this file
  TODO.md                   ← planning checklist
  ALGORITHM_DISCUSSION.md   ← core function / algorithm options (active)
```

Later (only after discussion converges and owner accepts):

- `specs/phase-4.1.md` — scope lock
- `specs/estimator-data-contract.md` — types / dataVersion
- `implementation_plan.md` — ordered file-level plan

## Relationship to other work

| Work | Relation |
|------|----------|
| Phase 1 `perf1` | Lookup + correction **API shape** remains; 4.1 may feed or replace stub baselines |
| Phase 4 `prov4` | Provenance, rights, disclosure, exact aggregation stay; become **inputs** to 4.1 |
| `phase4-external-evidence-1` | Exact aggregator is a **special case** of the estimator when evidence is exact |
| Product UX | Surface must show method class (modeled vs aggregated vs synthetic) |
| Phase 5 | **Not opened** by this folder; still blocked until owner gates say otherwise |

## Current gate

1. [x] Algorithm options discussed
2. [x] Owner locked O1–O9 (2026-08-09)
3. [ ] Write scope + `est1` contract + implementation plan
4. [ ] Peer review + owner M0 package accept
5. [ ] Separate implementation-start authorization

**No src/ or fixture changes under this folder’s authorization yet.**

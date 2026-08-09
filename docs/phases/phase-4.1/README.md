# Phase 4.1 — Combination performance estimator (sub-path)

**Status: discussion / not owner-accepted / implementation not authorized**

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

## Owner direction (seed — 2026-08-09)

| Priority | Role |
|----------|------|
| **Primary** | Predict the result of the **actual combination** from **manufacturer-published** (and similarly official) performance materials |
| **Auxiliary** | Ingest trusted review-site observations when they exist — they calibrate, bound, or cross-check; they are **not** the only product path |
| **Forbidden** | Silent fake first-party captures; chart eyeballing; unlabeled ±N% padding |

This direction **tensions** with charter line “do not invent numbers.” Phase 4.1
must resolve that tension by treating **modeled estimates** as first-class,
labeled outputs (`modeled` / `scaled` / `aggregated` / `unavailable`), never as
measured truth.

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

1. Discuss and thin the algorithm options in [`ALGORITHM_DISCUSSION.md`](./ALGORITHM_DISCUSSION.md).
2. Owner picks preferred family (or hybrid) + open decisions.
3. Only then write scope + contract + implementation plan.
4. Only then separate implementation-start authorization.

**No src/ or fixture changes under this folder’s authorization yet.**

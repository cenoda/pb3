# Phase 4 external evidence correction (`phase4-external-evidence-1`)

This is a bounded corrective package for the invalid Phase 4 pilot performance
claim. It is not Phase 5. The owner accepted the package and assigned the
subsequent implementation to Cursor on 2026-08-09.

| Field | Value |
|-------|-------|
| Work id | `phase4-external-evidence-1` |
| Baseline | `a500c28` |
| Trigger | The checked-in 1080p record claimed first-party measurement without an independently inspectable raw capture |
| Immediate safety correction | Complete in the candidate diff: false measured record, source, artifact reference, and raw summary removed; all three pilot cells are explicit synthetic stubs |
| Planning status | **Owner-accepted (2026-08-09)** after independent review GO |
| Implementation | **Authorized for Cursor (2026-08-09)**; not implemented in this package commit |
| Phase 5 | **Not started** |

## Intended outcome

Replace invented performance claims with curated, traceable public benchmark
observations. Produce an explained FPS range only when comparable evidence is
sufficient. Otherwise return or disclose `unavailable`.

## Documents

| Document | Role |
|----------|------|
| [`AUDIT.md`](./AUDIT.md) | Root cause and safety correction evidence |
| [`TODO.md`](./TODO.md) | Acceptance and implementation gates |
| [`corrective_plan.md`](./corrective_plan.md) | Source policy, aggregation rules, ordered implementation plan |
| [`REVIEW.md`](./REVIEW.md) | Independent read-only review and GO verdict |

## Hard boundaries

- No runtime scraping from the static SPA.
- No uncited benchmark number.
- No interpolation across GPUs or CPUs in this correction.
- No arbitrary percentage bands.
- External reviews are capped at `medium`; one incomplete source cannot create
  a product FPS range.
- Existing `perf1` public types remain unchanged unless an accepted amendment
  proves a breaking change is necessary.
- No Phase 5 planning or implementation under this package.

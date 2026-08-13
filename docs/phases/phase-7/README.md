# Phase 7 — Catalog browser + part images

**Status: M0 accepted 2026-08-13. Owner decisions O1–O7 locked as proposed.
Implementation authorized 2026-08-13.**

Closes the two remaining known gaps from Phase 5's owner walkthrough: a
dropdown instead of a browse-and-pick picker, and no part photos. Real
3D meshes (the third gap) stay explicitly out of scope — separate ADR-004
follow-up.

| Artifact | Purpose |
|----------|---------|
| [`specs/phase-7.md`](./specs/phase-7.md) | Scope, exit conditions, image source strategy, locked decisions O1–O7, risks |
| [`implementation_plan.md`](./implementation_plan.md) | Ordered Steps 1–6, untouchable boundary, verification, honest failure modes |
| `TODO.md` | Checklist |

## Sequence

| Step | State |
|------|-------|
| M0 scope drafted | **Done — 2026-08-13** |
| Owner decisions O1–O7 | **Locked — 2026-08-13** (accepted as proposed) |
| Implementation plan | **Done — 2026-08-13** |
| Owner acceptance + implementation start | **Done — 2026-08-13** |
| Implementation | Not started |

## Relationship to other work

- **Depends on Phase 6.** Reads the `cat6` catalog (22 real parts) and its
  already-defined but unpopulated `image` field.
- **Reuses Phase 4's rights pattern.** `EvidenceRightsClass` and the
  `source-rights-record.json` shape, applied to image sources instead of
  performance evidence sources.
- **Does not touch** `compat2`, `perf1`, `prov4`, or `phys3`.

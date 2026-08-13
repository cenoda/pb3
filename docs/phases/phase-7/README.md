# Phase 7 — Catalog browser + part images

**Status: Steps 1–6 implemented and owner-approved 2026-08-13.**
O1–O7 remain locked as proposed. O2 floor missed for six categories
(see `implementation_plan.md` honest failure modes).

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
| Implementation | **Steps 1–6 done — 2026-08-13** (O2 miss: CPU 2 images; 6 categories 0) |
| Owner closeout | **Approved — 2026-08-13** |

## Relationship to other work

- **Depends on Phase 6.** Reads the `cat6` catalog (22 real parts) and its
  already-defined but unpopulated `image` field.
- **Reuses Phase 4's rights pattern.** `EvidenceRightsClass` and the
  `source-rights-record.json` shape, applied to image sources instead of
  performance evidence sources.
- **Does not touch** `compat2`, `perf1`, `prov4` engine/pilot data, or `phys3`.
  One additive `EvidenceRightsClass` literal (`cc-attribution`) only.

The next UI slice is intentionally separate: one catalog selection page per
part category. Additional images remain an incremental curation track and ship
only when exact-SKU identity and storage rights are evidenced.

Follow-up implementation status: category tabs and previous/next navigation are
now implemented in the main product surface. The legacy native selects remain
available in the compact build summary for URL/E2E compatibility.

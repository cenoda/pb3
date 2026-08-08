# Phase 3 — 3D assembly and physical validation

Anchor/socket-based assembly, collision/clearance validation, bounded mount
adjustment, and evidence-backed cooling inputs for the existing `perf1`
correction hook.

**M0 status: owner-accepted (2026-08-08).**
**Implementation + owner closeout: complete (2026-08-08).**
Step 10 owner closeout is **accepted**. Implementation commit:
`acd038b`. Keepsake screenshots: [`keepsake/`](./keepsake/).

## Layout

```text
docs/phases/phase-3/
  README.md
  TODO.md
  implementation_plan.md
  keepsake/              ← owner-closeout commemorative screenshots
  specs/
    phase-3.md
    physical-validation-data-contract.md
```

## Planning package

| Document | Role | State |
|----------|------|-------|
| [`specs/phase-3.md`](./specs/phase-3.md) | Scope, inventory boundary, assembly/validation/cooling behavior, non-goals | Owner-accepted (2026-08-08); closed out |
| [`specs/physical-validation-data-contract.md`](./specs/physical-validation-data-contract.md) | Independent `phys3` types and GLB metadata contract | Owner-accepted (2026-08-08); closed out |
| [`implementation_plan.md`](./implementation_plan.md) | Ordered file-level plan with step exit conditions | Owner-accepted and executed (2026-08-08); Steps 1–10 complete |
| [`TODO.md`](./TODO.md) | M0 review and implementation checklist | Complete; owner closeout accepted |
| [`keepsake/`](./keepsake/) | Commemorative closeout screenshots | Captured 2026-08-08 |

## Inherited boundaries

- Phase 0, Phase 1 (`perf1`), and Phase 2 (`vs2`/`compat2`) remain regression baselines.
- `BuildStateV2`, URL behavior, logical compatibility, price, baseline
  performance, and existing correction behavior are unchanged.
- Physical validation is a separate result surface from `compat2` logical
  compatibility.
- GLB node prefixes, millimetres, and Y-up are inherited: `visual:*`,
  `collision:*`, `anchor:*`, `socket:*`, `clearance:*`.
- Repository-root `parts/` and `benchmarks/` remain fixture SSOT.

## Implemented M0 boundary

Nine synthetic `Experimental` physical-core GLBs, four visual-only fallbacks,
box-authored OBB collision/clearance with a 0.1 mm numeric epsilon, no new
collision dependency, cooler `normal` / `rotated-180` orientations, and a
cooling hook that stays runtime `unavailable` (production evidence rows empty).
Geometry data version: `phys3-exp-20260808`. Model grade remains
**Experimental** synthetic fixture geometry — not Verified real-hardware
geometry.

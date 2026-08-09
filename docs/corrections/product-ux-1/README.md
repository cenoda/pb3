# Product UX M0 — corrective gate (`product-ux-1`)

Bounded **docs-only corrective planning package** for the current Phase 0–4
application surface. This is **not Phase 5**, not a product pivot, and not an
architecture rewrite.

| Field | Value |
|-------|--------|
| Work id | `product-ux-1` |
| Kind | Corrective product-UX gate (presentation / information architecture) |
| Baseline commit | **`e73602a`** (`feat(provenance): implement Phase 4 evidence pilot`) |
| Scope | Existing SPA UI only — engines, contracts, fixtures, inventory frozen |
| Package status | **Drafted for owner review (2026-08-09)** — not accepted |
| Implementation | **Blocked** until (1) owner accepts this package and (2) owner gives a separate explicit start instruction |
| Phase 4 Step 9 | **Unchanged / still pending** owner evidence-quality PASS |
| Phase 5 | **Not started**, not planned by this package |

## Why this correction exists

Phase 0–4 delivered a **functionally correct** pipeline: part selection, `vs2`
URL sync, logical compatibility, price aggregation, assembled 3D viewport,
physical validation, performance ranges, and pilot `prov4` evidence binding.

A live desktop audit on baseline `e73602a` shows the **product surface is not
ready**:

- Page chrome relies on a **transparent** document background with default
  **black** text — unreadable against a dark host context.
- At **1280×720**, the document is ~**6.3k px** tall; almost all results live in
  one sequential left column.
- The 3D viewport is a fixed **538×360** block near the top and is not sticky;
  primary results (compatibility, fit, FPS, price) are not co-visible without
  scrolling.
- Internal contract language (`prov4`, `perf1`, source IDs, check IDs) and fully
  expanded evidence/physical panels dominate the default UI.
- Domain information (performance, geometry, cooling) appears more than once on
  the default surface.

**Engine correct ≠ product usable.** This gate corrects the surface without
reopening Phase 0–4 architecture.

## What this is / is not

| This is | This is not |
|---------|-------------|
| A corrective gate over the shipped Phase 0–4 app | Phase 5 or any new charter phase |
| Presentation / layout / progressive disclosure | Contract version bumps (`vs0`…`prov4`) |
| Desktop-first product UX plan | Design-system adoption or new UI library |
| Plan-before-code package | Implementation authorization |
| Preservation of functional behavior | Inventory, game, preset, or workload expansion |
| Independent of Phase 4 Step 9 evidence PASS | A claim that Phase 4 is fully closed |

## Documents in this package

| Doc | Role |
|-----|------|
| [`AUDIT.md`](./AUDIT.md) | Verified product UX audit (severity-ranked findings + evidence) |
| [`TODO.md`](./TODO.md) | Gate checklist (docs acceptance → implementation → closeout) |
| [`corrective_plan.md`](./corrective_plan.md) | Ordered, file-level implementation plan (blocked until accepted + start) |

## Current gate state

```text
[x] Live inspection of checkout at e73602a
[x] Docs package drafted (README, AUDIT, TODO, corrective_plan)
[ ] Owner accepts this planning package
[ ] Separate explicit implementation-start instruction
[ ] Implementation steps (see corrective_plan.md)
[ ] Regression + desktop walkthrough + owner UX closeout
```

## Hard boundaries (package + future implementation)

- Documentation-only until authorized; **no** production code or tests in this
  package delivery.
- Do not edit contracts: `vs0`, `perf1`, `vs2`, `compat2`, `phys3`, `prov4`.
- Do not expand parts / games / presets / workloads.
- Do not add dependencies or choose a design system unless a later amendment
  explicitly approves them.
- Do not claim Phase 4 Step 9 closeout or start Phase 5.
- Preserve GPU swap, assembly viewport, pilot-only evidence binding, and
  canonical `vs2` URL encode/decode behavior.

## Related project status

- Living status: [`../../../STATUS.md`](../../../STATUS.md)
- Roadmap phases: [`../../roadmap/PHASES.md`](../../roadmap/PHASES.md)
- Phase 4 (evidence pilot; Step 9 still open): [`../../phases/phase-4/`](../../phases/phase-4/)
- Corrections index: [`../README.md`](../README.md)

## Implementation authorization (explicit)

**Implementation remains blocked.**

Acceptance of this documentation package alone does **not** authorize code
changes. After package acceptance, the owner must still issue a separate
explicit instruction to start implementation of `corrective_plan.md`.

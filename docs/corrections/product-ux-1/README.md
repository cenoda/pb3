# Product UX M0 — corrective gate (`product-ux-1`)

Bounded corrective **product-surface** gate for the Phase 0–4 application.
This is **not Phase 5**, not a product pivot, and not an architecture rewrite.

| Field | Value |
|-------|--------|
| Work id | `product-ux-1` |
| Kind | Corrective product-UX gate (presentation / information architecture) |
| Baseline commit | **`e73602a`** (`feat(provenance): implement Phase 4 evidence pilot`) |
| Scope | Existing SPA UI only — engines, contracts, fixtures, inventory frozen |
| Package status | **Owner-accepted (2026-08-09)** |
| Implementation | **Software path complete (2026-08-09)** — owner UX walkthrough PASS pending |
| Phase 4 Step 9 | **Unchanged / still pending** owner evidence-quality PASS |
| Phase 5 | **Not started**, not planned by this package |

## Why this correction exists

Phase 0–4 delivered a **functionally correct** pipeline: part selection, `vs2`
URL sync, logical compatibility, price aggregation, assembled 3D viewport,
physical validation, performance ranges, and pilot `prov4` evidence binding.

A live desktop audit on baseline `e73602a` showed the **product surface was not
ready** (transparent page background, ~6.3k px vertical dump, non-sticky 3D,
contract-language dumps, duplicated domain blocks).

**Engine correct ≠ product usable.** This gate corrects the surface without
reopening Phase 0–4 architecture.

## What this is / is not

| This is | This is not |
|---------|-------------|
| A corrective gate over the shipped Phase 0–4 app | Phase 5 or any new charter phase |
| Presentation / layout / progressive disclosure | Contract version bumps (`vs0`…`prov4`) |
| Desktop-first product UX | Design-system adoption or new UI library |
| Preservation of functional behavior | Inventory, game, preset, or workload expansion |
| Independent of Phase 4 Step 9 evidence PASS | A claim that Phase 4 is fully closed |

## Documents in this package

| Doc | Role |
|-----|------|
| [`AUDIT.md`](./AUDIT.md) | Verified product UX audit (severity-ranked findings + evidence) |
| [`TODO.md`](./TODO.md) | Gate checklist (docs acceptance → implementation → closeout) |
| [`corrective_plan.md`](./corrective_plan.md) | Ordered, file-level implementation plan |

## Current gate state

```text
[x] Live inspection of checkout at e73602a
[x] Docs package drafted (README, AUDIT, TODO, corrective_plan)
[x] Owner accepts this planning package (2026-08-09)
[x] Separate explicit implementation-start instruction (2026-08-09)
[x] Implementation steps (corrective_plan.md) — software path
[ ] Owner UX walkthrough PASS + formal closeout
```

## Hard boundaries

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

## Implementation authorization

Package accepted and implementation-start authorized (2026-08-09).
Software path for `corrective_plan.md` Steps 1–9 is complete; **owner UX
walkthrough PASS** remains before formal corrective closeout.

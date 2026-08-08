# Phase 2 — Basic estimate service

General part selection, filtering, logical compatibility, price aggregation,
and save/share (not a product MVP; matches an ordinary parts-picker baseline).
Canonical home for phase-2 **specs**, **TODO**, and fix records.

**M0 planning gate: owner-accepted (2026-08-08).** Scope, data contract, and
implementation plan are accepted, and the five open M0 decisions are resolved
(see Status table below). No phase-2 implementation exists yet — it starts
only when the owner explicitly says "start implementation."

## Layout

```text
docs/phases/phase-2/
  README.md              ← this file
  TODO.md                ← open / done work for this phase
  implementation_plan.md ← ordered, file-level build plan (draft; not yet executable)
  specs/                 ← scope draft + data contract draft
  fixes/                 ← short fix / incident notes (when needed)
```

## Specs

| Doc | Role |
|-----|------|
| [`specs/phase-2.md`](./specs/phase-2.md) | Scope, inventory boundaries, compatibility/price/save-share model, forbidden work — **owner-accepted (2026-08-08)** |
| [`specs/compatibility-data-contract.md`](./specs/compatibility-data-contract.md) | `vs2` BuildState/URL extension + `compat2` compatibility/price types — **owner-accepted (2026-08-08)** |
| [`implementation_plan.md`](./implementation_plan.md) | Build order, file layout, step-by-step plan — **owner-accepted (2026-08-08)**; execution begins only on explicit "start implementation" |

## Related (outside this folder)

| Path | Role |
|------|------|
| [`parts/`](../../../parts/) | Existing Phase 0/1 part fixtures — phase 2 adds RAM/PSU categories and a second case/motherboard here (not yet added) |
| [`benchmarks/vs0/`](../../../benchmarks/vs0/) | Phase 0 stub table — untouched by phase 2 |
| [`benchmarks/perf1/`](../../../benchmarks/perf1/) | Phase 1 SSOT — untouched by phase 2 |
| `benchmarks/compat2/` | Phase 2 compatibility example fixtures — **planned, not yet created** |
| `benchmarks/price2/` | Phase 2 price fixtures (separate path, decided 2026-08-08) — **planned, not yet created** |
| [`docs/phases/phase-1/`](../phase-1/) | Predecessor — `perf1` engine, complete and closed out |
| [`docs/phases/phase-0/specs/vertical-slice-data-contract.md`](../phase-0/specs/vertical-slice-data-contract.md) | `vs0` — the contract `vs2` extends |
| [`STATUS.md`](../../../STATUS.md) | Project-wide status |
| [`PROJECT_CHARTER.md`](../../../PROJECT_CHARTER.md) | Multi-phase philosophy; §4 phase 2 |

## Status (summary)

| Area | State |
|------|--------|
| Scope | **Owner-accepted (2026-08-08)** — [`specs/phase-2.md`](./specs/phase-2.md) |
| Data contract | **Owner-accepted (2026-08-08)** — `vs2`/`compat2` in `compatibility-data-contract.md` |
| Implementation plan | **Owner-accepted (2026-08-08)** — [`implementation_plan.md`](./implementation_plan.md); execution not yet authorized |
| M0 open decisions | **Resolved (2026-08-08):** currency `USD` · RAM-tier↔RAM-SKU mapping deferred · fixtures split `benchmarks/compat2/` (compatibility) + `benchmarks/price2/` (price) · `PartDefinition` uses nested `compatSpec` · `PSU_HEADROOM_MULTIPLIER = 1.3` (stub) · Phase 2 E2E required |
| Fixtures | **Not started** |
| Implementation | **Not started** — begins on explicit "start implementation" |
| Runtime / stack / tooling | Unchanged — still ADR-001–004 (static SPA, TS+React+R3F+Vite, pnpm+Zod+Zustand+Vitest+Playwright, Apache-2.0) |

See [`TODO.md`](./TODO.md) for the working checklist.

# Phase 2 — Basic estimate service

General part selection, filtering, logical compatibility, price aggregation,
and save/share (not a product MVP; matches an ordinary parts-picker baseline).
Canonical home for phase-2 **specs**, **TODO**, and fix records.

**M0 planning gate: owner-accepted (2026-08-08).** Scope, data contract, and
implementation plan are accepted, and the five open M0 decisions are resolved
(see Status table below). Phase 2 implementation and closeout are complete;
this folder now records the accepted plan and shipped `vs2`/`compat2` baseline.

## Layout

```text
docs/phases/phase-2/
  README.md              ← this file
  TODO.md                ← open / done work for this phase
  implementation_plan.md ← accepted and executed file-level build plan
  specs/                 ← accepted scope + data contract
  fixes/                 ← short fix / incident notes (when needed)
```

## Specs

| Doc | Role |
|-----|------|
| [`specs/phase-2.md`](./specs/phase-2.md) | Scope, inventory boundaries, compatibility/price/save-share model, forbidden work — **owner-accepted (2026-08-08)** |
| [`specs/compatibility-data-contract.md`](./specs/compatibility-data-contract.md) | `vs2` BuildState/URL extension + `compat2` compatibility/price types — **owner-accepted (2026-08-08)** |
| [`implementation_plan.md`](./implementation_plan.md) | Build order, file layout, step-by-step plan — **owner-accepted and executed (2026-08-08)** |

## Related (outside this folder)

| Path | Role |
|------|------|
| [`parts/`](../../../parts/) | Complete 13-part Phase 2 catalog, including RAM/PSU and second case/motherboard fixtures |
| [`benchmarks/vs0/`](../../../benchmarks/vs0/) | Phase 0 stub table — untouched by phase 2 |
| [`benchmarks/perf1/`](../../../benchmarks/perf1/) | Phase 1 SSOT — untouched by phase 2 |
| [`benchmarks/compat2/`](../../../benchmarks/compat2/) | Phase 2 compatibility example fixtures — complete |
| [`benchmarks/price2/`](../../../benchmarks/price2/) | Phase 2 price fixtures — complete |
| [`docs/phases/phase-1/`](../phase-1/) | Predecessor — `perf1` engine, complete and closed out |
| [`docs/phases/phase-0/specs/vertical-slice-data-contract.md`](../phase-0/specs/vertical-slice-data-contract.md) | `vs0` — the contract `vs2` extends |
| [`STATUS.md`](../../../STATUS.md) | Project-wide status |
| [`PROJECT_CHARTER.md`](../../../PROJECT_CHARTER.md) | Multi-phase philosophy; §4 phase 2 |

## Status (summary)

| Area | State |
|------|--------|
| Scope | **Owner-accepted (2026-08-08)** — [`specs/phase-2.md`](./specs/phase-2.md) |
| Data contract | **Owner-accepted (2026-08-08)** — `vs2`/`compat2` in `compatibility-data-contract.md` |
| Implementation plan | **Owner-accepted (2026-08-08)** — [`implementation_plan.md`](./implementation_plan.md) |
| M0 open decisions | **Resolved (2026-08-08)** — see [`STATUS.md`](../../../STATUS.md) |
| Fixtures | **Complete** — 13 parts + `benchmarks/compat2/` + `benchmarks/price2/` |
| Implementation | **Complete (2026-08-08)** — Steps 1–9; `pnpm test:all` + `pnpm build` green |
| Runtime / stack / tooling | Unchanged — still ADR-001–004 (static SPA, TS+React+R3F+Vite, pnpm+Zod+Zustand+Vitest+Playwright, Apache-2.0) |

See [`TODO.md`](./TODO.md) for the working checklist.

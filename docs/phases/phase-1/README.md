# Phase 1 — Performance prediction engine

Explainable baseline performance + limited environment correction (not a product MVP).  
Canonical home for phase-1 **specs**, **TODO**, and future fix records.

## Layout

```text
docs/phases/phase-1/
  README.md              ← this file
  TODO.md                ← open / done work for this phase
  specs/                 ← scope lock + (later) data contract
  implementation_plan.md ← ordered, file-level build plan (written before any code; not started)
  fixes/                 ← short fix / incident notes (when needed)
```

## Specs

| Doc | Role |
|-----|------|
| [`specs/phase-1.md`](./specs/phase-1.md) | Scope, inventory, forbidden work, exit criteria |
| [`specs/performance-data-contract.md`](./specs/performance-data-contract.md) | Baseline + correction types, raw benchmark schema *(not written yet — deliverable 2)* |
| [`implementation_plan.md`](./implementation_plan.md) | Build order, file layout, step-by-step plan *(not written yet — deliverable 4)* |

## Related (outside this folder)

| Path | Role |
|------|------|
| [`parts/`](../../../parts/) | Part fixtures reused from Phase 0 (`part.json` + `model.glb`) |
| [`benchmarks/vs0/`](../../../benchmarks/vs0/) | Phase 0 stub table (superseded for engine work by Phase 1 fixtures when added) |
| [`docs/phases/phase-0/specs/phase-0.md`](../phase-0/specs/phase-0.md) | Predecessor slice; 3D freeze authority |
| [`STATUS.md`](../../../STATUS.md) | Project-wide status |
| [`PROJECT_CHARTER.md`](../../../PROJECT_CHARTER.md) | Multi-phase philosophy; §4–§5 authority for Phase 1 |

## Status (summary)

| Area | State |
|------|--------|
| Scope lock | **Owner-accepted (2026-08-08)** — [`specs/phase-1.md`](./specs/phase-1.md) |
| Data contract | **Owner-accepted (2026-08-08)** — performance-data-contract.md |
| Fixtures | **Owner-accepted (2026-08-08)** — `benchmarks/perf1/` (96-row baseline + 8-row Cinebench + correction/unavailable examples) |
| Runtime | **Static SPA** ([ADR-001](../../decisions/ADR-001-runtime-static-spa.md), scoped 0–3) |
| Stack core | **TS + React + R3F + Vite** ([ADR-002](../../decisions/ADR-002-stack-core-ts-react-r3f-vite.md)) |
| Stage 3 tools | **pnpm + Zod + Zustand + Vitest + fixture paths** ([ADR-003](../../decisions/ADR-003-stage3-tooling-and-fixtures.md)) |
| E2E | Phase 0 regression gate remains — `pnpm test:e2e` / `e2e/exit-scenario.spec.ts` |
| License | Code + data: **Apache-2.0** ([ADR-004](../../decisions/ADR-004-license-code-apache-2.0.md)); 3D assets still open |
| Deploy | Deferred (local only; later GCP/Azure) |
| Implementation plan | Not written |
| Implementation | **Not started** |
| Phase 0 3D freeze | **Active** until Phase 1 exit criteria pass |

### Verification commands

No Phase 1–specific verification commands exist yet. Until implementation lands:

- Phase 0 regression (must stay green): `pnpm test:all`
- Phase 1 engine tests and fixtures will be defined in the data contract and implementation plan.

See [`TODO.md`](./TODO.md) for the working checklist.

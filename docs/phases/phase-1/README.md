# Phase 1 — Performance prediction engine

Explainable baseline performance + limited environment correction (not a product MVP).  
Canonical home for phase-1 **specs**, **TODO**, and fix records.

## Layout

```text
docs/phases/phase-1/
  README.md              ← this file
  TODO.md                ← open / done work for this phase
  specs/                 ← scope lock + data contract
  implementation_plan.md ← ordered, file-level build plan (completed)
  fixes/                 ← short fix / incident notes (when needed)
```

## Specs

| Doc | Role |
|-----|------|
| [`specs/phase-1.md`](./specs/phase-1.md) | Scope, inventory, forbidden work, exit criteria |
| [`specs/performance-data-contract.md`](./specs/performance-data-contract.md) | Baseline + correction types, raw benchmark record shape — **owner-accepted** |
| [`implementation_plan.md`](./implementation_plan.md) | Build order, file layout, step-by-step plan — **implemented (2026-08-08)** |

## Related (outside this folder)

| Path | Role |
|------|------|
| [`parts/`](../../../parts/) | Part fixtures reused from Phase 0 (`part.json` + `model.glb`) |
| [`benchmarks/vs0/`](../../../benchmarks/vs0/) | Phase 0 stub table (regression reference; panel uses perf1) |
| [`benchmarks/perf1/`](../../../benchmarks/perf1/) | Phase 1 SSOT — 96-row baseline, 8-row Cinebench, correction/unavailable examples |
| [`docs/phases/phase-0/specs/phase-0.md`](../phase-0/specs/phase-0.md) | Predecessor slice; 3D freeze authority (lifted on Phase 1 exit) |
| [`STATUS.md`](../../../STATUS.md) | Project-wide status |
| [`PROJECT_CHARTER.md`](../../../PROJECT_CHARTER.md) | Multi-phase philosophy; §4–§5 authority for Phase 1 |

## Status (summary)

| Area | State |
|------|--------|
| Scope lock | **Owner-accepted (2026-08-08)** — [`specs/phase-1.md`](./specs/phase-1.md) |
| Data contract | **Owner-accepted (2026-08-08)** — `perf1` in performance-data-contract.md |
| Fixtures | **Owner-accepted (2026-08-08)** — `benchmarks/perf1/` (all happy-path rows `confidence: "stub"`) |
| Runtime | **Static SPA** ([ADR-001](../../decisions/ADR-001-runtime-static-spa.md), scoped 0–3) |
| Stack core | **TS + React + R3F + Vite** ([ADR-002](../../decisions/ADR-002-stack-core-ts-react-r3f-vite.md)) |
| Stage 3 tools | **pnpm + Zod + Zustand + Vitest + fixture paths** ([ADR-003](../../decisions/ADR-003-stage3-tooling-and-fixtures.md)) |
| E2E | Phase 0 regression gate — `pnpm test:e2e` / `e2e/exit-scenario.spec.ts` (green) |
| License | Code + data: **Apache-2.0** ([ADR-004](../../decisions/ADR-004-license-code-apache-2.0.md)); 3D assets still open |
| Deploy | Deferred (local only; later GCP/Azure) |
| Implementation | **Complete (2026-08-08)** — `38b76d1` + closeout docs |
| Fixture epistemics | All values are **stub wiring fixtures**, not real benchmark measurements |
| Thermal simulation / ingestion | **Not implemented** (by design) |
| Phase 0 3D freeze | **Lifted** — Phase 3 3D work may resume on a later phase plan |

### Implemented source (high level)

| Area | Path |
|------|------|
| Contract | `src/contract/perf1.ts`, `src/contract/perf1.schema.ts` |
| Loaders | `src/catalog/loadPerf1Fixtures.ts` |
| Baseline | `src/perf/baselineQuery.ts`, `src/perf/estimateBaseline.ts` |
| Correction | `src/perf/applyCorrection.ts` |
| Workload | `src/perf/estimateWorkload.ts` |
| Panel state | `src/state/perfPanelState.ts` |
| UI | `src/ui/PerformancePanel.tsx` |

### Verification commands

```bash
pnpm test          # 9 files, 39 tests (includes perf1 suites)
pnpm test:e2e      # Phase 0 exit scenario (4 tests)
pnpm test:all      # unit + e2e — green at closeout
pnpm build         # production bundle + fixture copy
pnpm dev           # manual walkthrough against local dev server
```

See [`TODO.md`](./TODO.md) for the working checklist.

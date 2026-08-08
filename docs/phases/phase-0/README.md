# Phase 0 — Vertical slice

Technical connection check (not a product MVP).  
Canonical home for phase-0 **specs**, **TODO**, and **fix records**.

## Layout

```text
docs/phases/phase-0/
  README.md              ← this file
  TODO.md                ← open / done work for this phase
  implementation_plan.md ← ordered, file-level build plan (written before any code)
  specs/                 ← accepted scope + data contract
  fixes/                 ← short fix / incident notes
```

## Specs

| Doc | Role |
|-----|------|
| [`specs/phase-0.md`](./specs/phase-0.md) | Scope, inventory, forbidden work, exit criteria |
| [`specs/vertical-slice-data-contract.md`](./specs/vertical-slice-data-contract.md) | `vs0` types, JSON examples, URL rules |
| [`implementation_plan.md`](./implementation_plan.md) | Build order, file layout, step-by-step plan (plan-before-code convention) |

## Related (outside this folder)

| Path | Role |
|------|------|
| [`parts/`](../../../parts/) | Part fixtures (`part.json` + `model.glb`) |
| [`benchmarks/vs0/`](../../../benchmarks/vs0/) | Performance stub table + unavailable examples |
| [`STATUS.md`](../../../STATUS.md) | Project-wide status |
| [`PROJECT_CHARTER.md`](../../../PROJECT_CHARTER.md) | Multi-phase philosophy |

## Status (summary)

| Area | State |
|------|--------|
| Scope + contract | Accepted |
| Fixtures | Checked in; integrity pass (data-only) |
| Runtime | **Static SPA** ([ADR-001](../../decisions/ADR-001-runtime-static-spa.md), scoped 0–3) |
| Stack core | **TS + React + R3F + Vite** ([ADR-002](../../decisions/ADR-002-stack-core-ts-react-r3f-vite.md)) |
| Stage 3 tools | **pnpm + Zod + Zustand + Vitest + fixture paths** ([ADR-003](../../decisions/ADR-003-stage3-tooling-and-fixtures.md)) |
| E2E | **Playwright** headless — `pnpm test:e2e` / `e2e/exit-scenario.spec.ts` (ADR-003 amendment) |
| License | Code + data: **Apache-2.0** ([ADR-004](../../decisions/ADR-004-license-code-apache-2.0.md)); 3D assets still open |
| Deploy | Deferred (local only; later GCP/Azure) |
| Implementation plan | Written — [`implementation_plan.md`](./implementation_plan.md) |
| Implementation | **Steps 1–8 complete**; tag still open |
| Tag `vertical-slice-v0` | Not created (owner; after `pnpm test:all`) |

### Verification commands

```bash
pnpm test          # Vitest
pnpm test:e2e      # Playwright (build + preview)
pnpm test:all      # both
```

See [`TODO.md`](./TODO.md) for the working checklist.

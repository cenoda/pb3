# 의사결정 기록

프로젝트의 중요한 결정을 기록하는 공간이다.

## Decision process

| Doc | Role |
|-----|------|
| [`TECH-DECISION-ORDER.md`](./TECH-DECISION-ORDER.md) | Accepted dependency order for stack choices (Stage 1→4 + license parallel) |

## Formal ADRs

| ADR | Decision | Status |
|-----|----------|--------|
| [`ADR-001-runtime-static-spa.md`](./ADR-001-runtime-static-spa.md) | App runtime = **static SPA**, valid for charter phases **0–3** scope (no backend / auth / server-side measured perf model); **revisit** if server compute is required | Accepted |
| [`ADR-002-stack-core-ts-react-r3f-vite.md`](./ADR-002-stack-core-ts-react-r3f-vite.md) | Stage 2 core = **TypeScript + React + R3F + Vite** (not implementation start) | Accepted |
| [`ADR-003-stage3-tooling-and-fixtures.md`](./ADR-003-stage3-tooling-and-fixtures.md) | Stage 3 = **pnpm** + **Zod** + **Zustand** + **Vitest**; fixtures SSOT at repo root, HTTP `/parts` + `/benchmarks` via Vite serve/copy | Accepted |
| [`ADR-004-license-code-apache-2.0.md`](./ADR-004-license-code-apache-2.0.md) | License = **Apache-2.0** for code + data fixtures (repo-root `LICENSE`); 3D assets still open | Accepted |

## Decided in docs (not yet formal ADRs)

| Topic | Where |
|-------|--------|
| Phase-0 scope lock | [`../phases/phase-0/specs/phase-0.md`](../phases/phase-0/specs/phase-0.md) |
| Phase-0 data contract `vs0` | [`../phases/phase-0/specs/vertical-slice-data-contract.md`](../phases/phase-0/specs/vertical-slice-data-contract.md) |
| Tech decision **order** (process) | [`TECH-DECISION-ORDER.md`](./TECH-DECISION-ORDER.md) |
| IDE plan | WebStorm + Cursor (DX only; not a stack lock) |

## Accepted constraints (not full ADRs yet)

| Topic | State |
|-------|--------|
| Live public site (now) | **Impossible / out of scope** — Phase 0 uses local verification only |
| Future deploy direction | **GCP or Azure** (static assets); portable `dist/`, no PaaS lock-in |
| Deploy host lock | **Deferred** — not a Phase 0 blocker |

## Still open (follow tech decision order)

- **Stage 1–3:** Runtime, stack core, and tooling **locked** (ADR-001–003). Deploy remains deferred as above.
- **License:** Code + data **locked** (ADR-004, Apache-2.0). **3D asset** license still open — resolve before real hardware models ship.
- Implementation scaffold (needs explicit owner start)
- Full benchmark raw schema (product phase 1)
- Exact GCP vs Azure product (Static Web Apps, Blob+CDN, GCS+Cloud CDN, etc.) — later

When further items lock, add `ADR-NNN-title.md` with: context, options, decision, consequences, revisit when.

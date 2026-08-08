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

- **Stage 1:** Runtime shape **locked** (ADR-001). Deploy remains deferred as above.
- **Stage 2:** Language (undecided), UI + 3D as a pair, bundler
- **Stage 3:** Package manager, schema/state/test tools, fixture HTTP paths
- **Parallel:** Open-source license for **code**, **data**, and **3D assets** (finish code license before third-party deps)
- Full benchmark raw schema (product phase 1)
- Exact GCP vs Azure product (Static Web Apps, Blob+CDN, GCS+Cloud CDN, etc.) — later

When further items lock, add `ADR-NNN-title.md` with: context, options, decision, consequences, revisit when.

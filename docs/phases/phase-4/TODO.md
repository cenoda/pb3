# Phase 4 TODO

## Brief gate

- [x] Create the Phase 4 working folder.
- [x] Draft a bounded Phase 4 brief.
- [x] Owner selects the pilot path: **single-build evidence pilot**.
- [x] Owner accepts residual brief details through M0 package acceptance.

## M0 planning gate

- [x] Draft the bounded scope spec (`specs/phase-4.md`).
- [x] Draft the versioned provenance data contract
      (`specs/provenance-data-contract.md`, `prov4`).
- [x] Draft the ordered, file-level `implementation_plan.md`.
- [x] Define automated and human evidence-quality exit criteria.
- [x] Apply review FAIL remediations (three audit rounds, 2026-08-09).
- [x] Owner formally accepts O1–O4 / D1–D16 (2026-08-09).
- [x] Owner accepts the complete M0 planning package (2026-08-09).
- [ ] Receive a separate explicit instruction to start implementation.

## Implementation

Blocked until the owner gives a separate start instruction. Planned steps
(preview only; not authorized):

1. `prov4` types + Zod (high gate + join key + runCount≥2)
2. Pilot constants + pure freshness/binding
3. Fixture authoring + integrity (exactly 3 perf rows)
4. Loaders
5. Performance panel pilot **sidecar** overlay
6. Physical / cooling disclosure extensions
7. Evidence disclosure panel
8. Unit / E2E / build regression gate
9. Evidence-quality closeout

## Explicitly not started

- Source or fixture changes under `src/`, `parts/`, or `benchmarks/`.
- New dependencies or external services.
- Contract version implementation in code.
- Real-hardware asset acquisition or redistribution.
- First-party benchmark capture execution.
- Phase 4 implementation, verification, or closeout.

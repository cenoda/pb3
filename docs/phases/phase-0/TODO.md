# Phase 0 TODO

## Done

- [x] Scope lock (`specs/phase-0.md`)
- [x] Data contract `vs0` (`specs/vertical-slice-data-contract.md`)
- [x] URL rules (full encode / lenient decode)
- [x] Game + preset as phase-0 constants
- [x] Part fixtures × 7 + placeholder GLBs
- [x] Performance stub table × 12 + separate unavailable examples
- [x] Data-only fixture integrity check (PASS)
- [x] Phase working folder under `docs/phases/phase-0/`

## Open

### Stage 1 — foundation (see `docs/decisions/TECH-DECISION-ORDER.md`)

- [x] Lock app runtime shape → **static SPA** ([`ADR-001`](../../decisions/ADR-001-runtime-static-spa.md)); scoped to phases 0–3; revisit if server compute is required
- [x] Deploy host for Phase 0: **deferred** — no live site now; local verification only. Future direction: **GCP or Azure** (portable static output; not a Phase 0 blocker)

### Stage 2 — stack core ([`ADR-002`](../../decisions/ADR-002-stack-core-ts-react-r3f-vite.md))

- [x] Language → **TypeScript**
- [x] UI + 3D pair → **React + R3F**
- [x] Bundler → **Vite**
- Note: lock ≠ implementation start; do not install deps until owner says so

### Stage 3 — satellites ([`ADR-003`](../../decisions/ADR-003-stage3-tooling-and-fixtures.md))

- [x] Package manager → **pnpm**
- [x] Schema / state / test → **Zod** / **Zustand** / **Vitest**
- [x] Fixture HTTP → repo-root SSOT; `/parts` + `/benchmarks`; Vite serve + dist copy
- Note: still not implementation start

### License ([`ADR-004`](../../decisions/ADR-004-license-code-apache-2.0.md))

- [x] Code + data (`parts/`, `benchmarks/`) → **Apache License 2.0** (root `LICENSE`)
- [ ] 3D assets (`model.glb`) — still open; resolve before real hardware models ship

### Implementation plan

- [x] `implementation_plan.md` written (ordered, file-level build plan) — [`implementation_plan.md`](./implementation_plan.md)

### Implementation (only after explicit “start implementation”)

- [x] Scaffold app that loads fixtures from `/parts` and `/benchmarks` (or agreed paths)
- [x] CPU/GPU selection UI + `BuildState`
- [x] Full URL encode + partial URL decode
- [x] GPU GLB viewport swap
- [x] Stub performance panel (3 resolutions)
- [x] Reload restore verification (URL sync unit tests + Playwright E2E)
- [x] Exit checklist automated (Step 8 via Playwright headless) — tag still owner-only
- [x] Playwright E2E harness (`pnpm test:e2e`) for exit scenario + fixture HTTP
- [x] Agent browser explore path (Playwright CLI + MCP docs; `pnpm explore:phase0`) — optional, not a merge gate
- [ ] Exit checklist all green → tag `vertical-slice-v0` (owner)

### Parallel

- [x] Open-source license — code + data: **Apache-2.0** (see License section above); 3D assets still open

## Explicit non-goals (do not add here)

- Extra parts/games, collision, RGB, assembly animation
- Real performance model, backend, auth, prices
- Design system, model authoring tools

## Notes

- Do not treat discarded experimental scaffolds as project baseline.
- Implementation work starts only when the owner says so.
- IDE plan (WebStorm + Cursor) does not lock the stack.
- Owner handles `git push`.

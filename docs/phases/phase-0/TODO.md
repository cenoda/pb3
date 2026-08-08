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

### Stage 3 — satellites (after Stage 2)

- [ ] Package manager
- [ ] Schema / state / test tools
- [ ] Fixture HTTP path strategy under the chosen build tool

### Implementation (only after explicit “start implementation”)

- [ ] Scaffold app that loads fixtures from `/parts` and `/benchmarks` (or agreed paths)
- [ ] CPU/GPU selection UI + `BuildState`
- [ ] Full URL encode + partial URL decode
- [ ] GPU GLB viewport swap
- [ ] Stub performance panel (3 resolutions)
- [ ] Reload restore verification
- [ ] Exit checklist all green → tag `vertical-slice-v0`

### Parallel

- [ ] Open-source license discussion (code / data / assets) — can stay parallel; finish **code** license before third-party deps

## Explicit non-goals (do not add here)

- Extra parts/games, collision, RGB, assembly animation
- Real performance model, backend, auth, prices
- Design system, model authoring tools

## Notes

- Do not treat discarded experimental scaffolds as project baseline.
- Implementation work starts only when the owner says so.
- IDE plan (WebStorm + Cursor) does not lock the stack.
- Owner handles `git push`.

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

- [ ] Decide app runtime shape (static SPA vs alternatives) — product decision
- [ ] Decide language / UI / 3D / build / package manager — **after explicit “start implementation”**
- [ ] Scaffold app that loads fixtures from `/parts` and `/benchmarks` (or agreed paths)
- [ ] CPU/GPU selection UI + `BuildState`
- [ ] Full URL encode + partial URL decode
- [ ] GPU GLB viewport swap
- [ ] Stub performance panel (3 resolutions)
- [ ] Reload restore verification
- [ ] Exit checklist all green → tag `vertical-slice-v0`
- [ ] Open-source license discussion (code / data / assets) — can stay parallel

## Explicit non-goals (do not add here)

- Extra parts/games, collision, RGB, assembly animation
- Real performance model, backend, auth, prices
- Design system, model authoring tools

## Notes

- Do not treat discarded experimental scaffolds as project baseline.
- Implementation work starts only when the owner says so.

# Phase 1 TODO

## Done

- [x] Scope lock (`specs/phase-1.md`)

## Open

### Deliverable 2 — data contract

- [x] Baseline + correction model types and normative rules (`specs/performance-data-contract.md`)
- [x] `WorkloadEstimate` type for Cinebench CPU-only scores (distinct from `PerformanceEstimate`)
- [x] Raw benchmark ingestion schema (deferred from scope doc; defined in contract doc)
- [x] Contract version string chosen and documented (successor to `vs0` for performance engine)

### Deliverable 3 — fixture stub data

- [ ] Baseline performance fixture table (96 rows; all rows `confidence: "stub"` until real benches exist)
- [ ] Cinebench workload fixture table (8 rows; §2.5 — separate from FPS baseline matrix)
- [ ] Environment-correction fixture examples (allowed correction inputs only)
- [ ] Unavailable / withheld-correction examples (tests only, separate from happy-path table)
- [ ] Data-only fixture integrity check

### Deliverable 4 — implementation plan

- [ ] `implementation_plan.md` written (ordered, file-level build plan) — only after owner accepts scope + contract

### Implementation (only after explicit “start implementation”)

- [ ] Baseline performance model (controlled conditions → range + basis + confidence + dataVersion)
- [ ] Environment correction layer (limited inputs; explicit withhold when evidence missing)
- [ ] Correction interface stable for future Phase 3 cooling outputs (headroom, intake restriction, etc.)
- [ ] Bottleneck / limiting-factor explanation on supported estimates
- [ ] Wire engine into existing Phase 0 UI path (no new 3D scope)
- [ ] Unit tests for baseline lookup, unavailable paths, and correction apply / withhold
- [ ] Extend or add E2E coverage for correction UX (if UI exposes correction inputs)
- [ ] Exit checklist all green → Phase 1 complete; lifts Phase 0 3D freeze

### Parallel / inherited

- [ ] 3D asset license (`model.glb`) — still open from Phase 0; resolve before real hardware models ship

## Explicit non-goals (do not add here)

- Real thermal or fluid simulation
- Full logical compatibility engine (Phase 2)
- 3D collision, anchors, mounting, cooling mesh work (Phase 3; frozen from Phase 0)
- Expanding part or game inventory beyond `specs/phase-1.md` §2
- Live pricing, accounts, backend, auth, public deploy requirement
- Inventing FPS when data or correction evidence is missing

## Notes

- Phase 0 remains the regression baseline; do not break `vertical-slice-v0` exit scenario.
- Stack is locked (ADR-001–003); do not re-litigate tooling in this phase folder.
- Implementation work starts only when the owner says so, after scope + contract acceptance.
- Owner handles `git push`.

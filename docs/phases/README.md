# Phases

Per-phase working areas (specs, TODO, fix log). Cross-cutting project docs stay under `docs/` root folders (`data/`, `decisions/`, `roadmap/`, `verification/`).

| Phase | Path | Status |
|-------|------|--------|
| Phase 0 — Vertical slice | [`phase-0/`](./phase-0/) | Specs + fixtures ready; `implementation_plan.md` written; implementation not started |

Fixture data remains at repo root: `parts/`, `benchmarks/` (not moved into phase folders).

## Rule: plan before code

Every phase must have `docs/phases/phase-N/implementation_plan.md` — an ordered,
file-level build plan derived from that phase's specs — written and reviewed
**before** any scaffold or source file for that phase is written. A locked stack
(ADRs) and an accepted spec/contract are not a substitute for this plan; they are
its inputs. See [`phase-0/implementation_plan.md`](./phase-0/implementation_plan.md)
for the first instance of this convention.

# Phases

Per-phase working areas (specs, TODO, fix log). Cross-cutting project docs stay under `docs/` root folders (`data/`, `decisions/`, `roadmap/`, `verification/`).

| Phase | Path | Status |
|-------|------|--------|
| Phase 0 — Vertical slice | [`phase-0/`](./phase-0/) | Complete; `vertical-slice-v0` tagged and pushed |
| Phase 1 — Performance prediction engine | [`phase-1/`](./phase-1/) | Complete; `perf1` stub engine verified and closed out |
| Phase 2 — Basic estimate service | [`phase-2/`](./phase-2/) | Complete (2026-08-08); `vs2`/`compat2` engine implemented and verified |
| Phase 3 — 3D assembly and physical validation | [`phase-3/`](./phase-3/) | Complete (2026-08-08); `phys3` closed out (`acd038b`) |
| Phase 4 — Evidence-grade data and validation | [`phase-4/`](./phase-4/) | **Frozen** 2026-08-09 ([`FREEZE.md`](./phase-4/FREEZE.md)); prov4 + external evidence shipped; Step 9 not claimed |
| Phase 4.1 — Combination performance estimator (sub-path) | [`phase-4.1/`](./phase-4.1/) | **Frozen** with Phase 4; `est1` M0 + AMD specs catalog spine shipped; full sim paused; not Phase 5 |
| Phase 5 — Product surface | [`phase-5/`](./phase-5/) | **In implementation** — M0 accepted 2026-08-09. Presentation only; engines read-only |

Fixture data remains at repo root: `parts/`, `benchmarks/` (not moved into phase folders).

**Corrective track: closed.** Product-surface work is now Phase 5, not a
corrective gate. `product-ux-1` (shell) and `product-ux-2` (audit) are closed
under [`../corrections/`](../corrections/) and retained as evidence only.

## Rule: plan before code

Every phase must have `docs/phases/phase-N/implementation_plan.md` — an ordered,
file-level build plan derived from that phase's specs — written and reviewed
**before** any scaffold or source file for that phase is written. A locked stack
(ADRs) and an accepted spec/contract are not a substitute for this plan; they are
its inputs. See [`phase-0/implementation_plan.md`](./phase-0/implementation_plan.md)
for the first instance of this convention.

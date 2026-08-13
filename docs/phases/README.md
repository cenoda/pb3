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
| Phase 5 — Product surface | [`phase-5/`](./phase-5/) | **Complete** (2026-08-09); owner-approved closeout. Presentation only; no engine, contract or data change |
| Phase 6 — Real parts catalog | [`phase-6/`](./phase-6/) | **Complete; owner-approved closeout 2026-08-12.** Steps 1–12 done; Step 12 accepted; B4 resolved. Primarily catalog/data; Step 6 physical-authority carve-out + B4 compatibility aggregation/verdict carve-out only |
| Phase 7 — Catalog browser + part images | [`phase-7/`](./phase-7/) | **Complete; owner-approved 2026-08-13.** Steps 1–6 done; O2 floor missed (CPU 2 images; six categories 0) |
| Phase 7.1 — Catalog source-ingestion pipeline | [`phase-7.1/`](./phase-7.1/) | **M0 accepted; first slice software-closed 2026-08-13.** O1–O10 locked. Dry-run only; Steps 9–10 not started |

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

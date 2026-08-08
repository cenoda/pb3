# Phase 2 TODO

## Done

- [x] Scope draft (`specs/phase-2.md`) — inventory boundaries, compatibility
      model, price model, save/share model, open decisions
- [x] Data contract draft (`specs/compatibility-data-contract.md`) — `vs2`
      BuildState/URL extension, `compat2` compatibility + price types
- [x] `implementation_plan.md` drafted (ordered, file-level build plan)
- [x] Phase working folder under `docs/phases/phase-2/`
- [x] Owner acceptance of `specs/phase-2.md` (2026-08-08)
- [x] Owner acceptance of `specs/compatibility-data-contract.md` (2026-08-08)
- [x] Owner acceptance of `implementation_plan.md` (2026-08-08)
- [x] M0 open decisions resolved (2026-08-08):
  - [x] Fixture currency → **USD**
  - [x] RAM-tier (`perf1`) ↔ RAM-SKU (`compat2`) mapping → **deferred**
        (not wired in phase 2)
  - [x] Fixture paths → split: `benchmarks/compat2/compatibility-examples.json`
        (compatibility examples) + `benchmarks/price2/price-fixtures.json`
        (price) — differs from the single `benchmarks/compat2/` path
        implementation_plan.md §3 originally sketched; use this split at
        implementation time
  - [x] `PartDefinition` shape → **nested `compatSpec` block**
        (e.g. `{ "compatSpec": { "socket": "AM5", "tdpWatts": 65 } }`)
  - [x] Phase 2 E2E (`e2e/phase2-compat-price.spec.ts`) → **required**, not
        optional; part of the Step 8 gate
  - [x] `PSU_HEADROOM_MULTIPLIER` stub constant → **1.3** (30% headroom;
        `checkPsuWattage.ts` + contract §4.4)

## Open

### M0 gate

M0 gate is **clear**. Implementation still requires an explicit owner
"start implementation" instruction before Step 1 begins.

### Implementation (only after explicit "start implementation")

- [ ] `vs2` / `compat2` contract types + Zod schemas
- [ ] Phase-2 fixtures on disk: second case, second motherboard, 2 RAM, 2 PSU
      (+ compat spec fields added to all phase-2 parts including existing
      CPU/GPU fixtures)
- [ ] `benchmarks/compat2/compatibility-examples.json` +
      `price-fixtures.json`
- [ ] Compatibility engine — 5 checks + aggregate report
- [ ] Price aggregation — per-part price + partial-total handling
- [ ] General part selection UI (all 7 categories) + filtering
- [ ] Compatibility panel + price summary panel wired into the app
- [ ] `vs2` URL encode/decode + `vs0` legacy link backward-compat
- [ ] Unit tests: schema, compatibility checks, price summary, URL round-trip
- [ ] Phase 0 E2E exit scenario still green (`pnpm test:all`)
- [ ] Phase-2 completion scenario finalized and verified
- [ ] Exit checklist green → phase-2 complete (record in `STATUS.md`)

### Parallel / inherited

- [ ] 3D asset license (`model.glb`) — still open from Phase 0; resolve
      before real hardware models ship

## Explicit non-goals (do not add here)

- Physical collision, clearance, mounting, or cooling geometry (Phase 3)
- GLB anchor/socket runtime validation (Phase 3)
- Live price APIs, cart, affiliate, checkout
- Accounts, auth, server-mediated share/sync
- Expanding CPU/GPU/cooler/game/preset counts beyond Phase 0/1
- Storage or any category beyond `specs/phase-2.md` §2.1–§2.3
- Auto-mapping selected RAM SKU into the `perf1` RAM tier dimension (open
  decision, not resolved)
- Modifying `perf1` baseline/correction/workload behavior
- Inventing compatibility, price, or performance values when data is missing

## Notes

- Phase 0 and Phase 1 remain the regression baseline; do not break
  `vertical-slice-v0` exit scenario or `perf1` behavior.
- Stack is locked (ADR-001–004); do not re-litigate tooling in this phase
  folder.
- This is a **planning gate (M0)**, not implementation. Nothing here is
  owner-accepted until recorded in `STATUS.md`.
- Owner handles `git push`.

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
        + `benchmarks/price2/price-fixtures.json`
  - [x] `PartDefinition` shape → **nested `compatSpec` block**
  - [x] Phase 2 E2E (`e2e/phase2-compat-price.spec.ts`) → **required**
  - [x] `PSU_HEADROOM_MULTIPLIER` stub constant → **1.3** (30% headroom)
- [x] `vs2` / `compat2` contract types + Zod schemas (`src/contract/vs2.ts`,
      `compat2.ts`, `*.schema.ts`)
- [x] Phase-2 fixtures on disk (13 parts: 2 case, 2 motherboard, 2 CPU, 2 GPU,
      1 cooler, 2 RAM, 2 PSU) + nested `compatSpec` on all compat-bearing parts
- [x] `benchmarks/compat2/compatibility-examples.json` +
      `benchmarks/price2/price-fixtures.json`
- [x] Loaders: `loadPartCatalog` (13 parts), `loadCompat2Examples`,
      `loadPriceFixtures`
- [x] Compatibility engine — 5 checks + aggregate report (`src/compat/*`)
- [x] Price aggregation — per-part price + partial-total handling
- [x] General part selection UI (all 7 categories) + `PartFilterControls`
- [x] Compatibility panel + price summary panel wired into the app
- [x] `vs2` URL encode/decode + `vs0` legacy link backward-compat
- [x] Unit tests: schema, compatibility checks, price summary, URL round-trip
- [x] Phase 0 E2E exit scenario still green (`e2e/exit-scenario.spec.ts`)
- [x] Phase-2 completion scenario E2E (`e2e/phase2-compat-price.spec.ts`)
- [x] `pnpm test:all` + `pnpm build` green (2026-08-08 closeout run)
- [x] Exit checklist → recorded in `STATUS.md` (2026-08-08)

## Open

### Deferred from M0 (explicitly still open after phase-2 exit)

- [ ] `perf1` RAM tier ↔ `compat2` RAM SKU auto-mapping — **deferred**; not
      wired in phase 2; `PerformancePanel` RAM tier control remains independent
- [ ] `PSU_HEADROOM_MULTIPLIER` stub (1.3) → replace with real system draw model
      when a later phase accepts that work

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
- Auto-mapping selected RAM SKU into the `perf1` RAM tier dimension (deferred)
- Modifying `perf1` baseline/correction/workload behavior
- Inventing compatibility, price, or performance values when data is missing

## Notes

- Phase 0 and Phase 1 remain the regression baseline; do not break
  `vertical-slice-v0` exit scenario or `perf1` behavior.
- Stack is locked (ADR-001–004).
- Owner handles `git push`.

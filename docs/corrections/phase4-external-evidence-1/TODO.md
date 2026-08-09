# TODO — Phase 4 external evidence correction

## Safety correction

- [x] Remove false first-party source registry entry
- [x] Remove false first-party measurement and capture-condition claims
- [x] Delete the derived PresentMon-labeled summary artifact
- [x] Keep three pilot rows as clearly labeled synthetic stubs
- [x] Update regression tests to reject any shipped first-party claim

## Planning gate

- [x] Draft source, normalization, aggregation, confidence, and unavailable rules
- [x] Draft ordered file-level implementation plan
- [x] Independent peer review PASS — Lira, 2026-08-09
- [x] Owner accepts the corrective package — 2026-08-09
- [x] Owner separately authorizes implementation for Cursor — 2026-08-09

## Implementation gate — authorized for Cursor

- [ ] Record source-specific access, citation, and rights decisions
- [ ] Add curated raw observation fixtures
- [ ] Add exact-comparability normalization
- [ ] Add deterministic aggregation and confidence classification
- [ ] Bind the external evidence sidecar without widening `perf1`
- [ ] Update disclosure UI and regression tests
- [ ] Run full verification and independent re-audit
- [ ] Owner Phase 4 Step 9 closeout PASS

## Explicitly out

- Runtime scraping
- Background network services
- Automatic CPU/GPU interpolation
- Arbitrary `±N%` uncertainty
- External-review confidence `high`
- Phase 5 planning or implementation

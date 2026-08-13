# Phase 7 TODO

## M0 planning gate

- [x] Draft the bounded scope spec (`specs/phase-7.md`).
- [x] Owner locks O1–O7 (as proposed, no amendments) — **2026-08-13**.
- [x] Draft the ordered, file-level `implementation_plan.md`.
- [x] Owner accepts the complete M0 planning package — **2026-08-13**.
- [x] Receive a separate explicit instruction to start implementation — **2026-08-13**.

## Implementation (not started — after M0 acceptance)

- [ ] Image source registry + rights decisions (manufacturer press/media kits)
- [ ] Image source registry + rights decisions (CC-BY/CC0 community sources)
- [ ] `EvidenceRightsClass` extension: add `"cc-attribution"` literal (O3, if locked)
- [ ] Curate and add image files for at least 1 part per category (O2 floor)
- [ ] Integrity tests: image ↔ rights-record binding, fail-closed on unapproved
- [ ] Catalog browser screen (grid/filter, replaces dropdown) — O1
- [ ] Attribution UI for CC-BY-family images
- [ ] Placeholder state for uncovered parts
- [ ] `pnpm test:all` + `pnpm build` green

## Explicitly out

- New catalog parts/categories beyond the existing 22
- Real-hardware 3D meshes (ADR-004 3D-asset follow-up — separate)
- Live/scraped image fetching at runtime
- Comparison/diff UI across multiple parts
- `compat2` / `perf1` / `prov4` / `phys3` contract or engine changes

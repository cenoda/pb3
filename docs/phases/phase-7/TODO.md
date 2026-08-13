# Phase 7 TODO

## M0 planning gate

- [x] Draft the bounded scope spec (`specs/phase-7.md`).
- [x] Owner locks O1–O7 (as proposed, no amendments) — **2026-08-13**.
- [x] Draft the ordered, file-level `implementation_plan.md`.
- [x] Owner accepts the complete M0 planning package — **2026-08-13**.
- [x] Receive a separate explicit instruction to start implementation — **2026-08-13**.

## Implementation (complete — 2026-08-13)

O2 floor was **not** met for six of seven categories. Exact-SKU
community photographs with a store-in-repo grant were found only for
**CPU** (2 images). Manufacturer press/product photos for GPU, motherboard,
case, cooler, RAM, and PSU were recorded and **rejected**: terms do not
allow storing a cropped copy in this Apache-2.0 repository, and no
Wikimedia CC-BY/CC0 still of the catalog SKU was found. Substituting a
related SKU (NH-D15 for G2, Focus G for North, Gigabyte 4070 Aero for
ASUS Dual, etc.) is forbidden by O6. See `implementation_plan.md`
honest failure modes and `benchmarks/cat6/image-source-registry.json`.

- [x] Image source registry + rights decisions (manufacturer press/media kits)
- [x] Image source registry + rights decisions (CC-BY/CC0 community sources)
- [x] `EvidenceRightsClass` extension: add `"cc-attribution"` literal (O3, if locked)
- [x] Curate and add image files for at least 1 part per category (O2 floor) — **attempted; CPU only (honest miss recorded)**
- [x] Integrity tests: image ↔ rights-record binding, fail-closed on unapproved
- [x] Catalog browser screen (grid/filter, replaces dropdown) — O1
- [x] Attribution UI for CC-BY-family images
- [x] Placeholder state for uncovered parts
- [x] `pnpm test:all` + `pnpm build` green
- [x] Owner closeout — **2026-08-13**

## Explicitly out

- New catalog parts/categories beyond the existing 22
- Real-hardware 3D meshes (ADR-004 3D-asset follow-up — separate)
- Live/scraped image fetching at runtime
- Comparison/diff UI across multiple parts
- `compat2` / `perf1` / `prov4` / `phys3` contract or engine changes

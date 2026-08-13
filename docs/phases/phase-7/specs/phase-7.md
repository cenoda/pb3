# Phase 7 — Catalog browser + part images (M0 scope, draft)

Status: **M0 drafted 2026-08-13. Decisions O1–O7 proposed below; pending
owner lock.** Not accepted. Implementation not authorized.

Charter authority: [`../../../../PROJECT_CHARTER.md`](../../../../PROJECT_CHARTER.md)
§2 (깊이 우선), §6 (부품 데이터 모델 원칙).
Direction: [`../../phase-5/CLOSEOUT.md`](../../phase-5/CLOSEOUT.md) §"three
things to know" #1–2 — "real catalog first, catalog browser second"; the
target shape is "a picker with photos, filters and comparison."
Prerequisite: [`../../phase-6/CLOSEOUT.md`](../../phase-6/CLOSEOUT.md) — `cat6`
real catalog, `image` field already defined and populated by no part
(`catalog-data-contract.md` C7).
Reused pattern: [`../../phase-4/specs/provenance-data-contract.md`](../../phase-4/specs/provenance-data-contract.md)
`EvidenceRightsClass` + `source-rights-record.json` shape.

---

## 0. Purpose

Phase 5 built a product surface over an invented catalog and named three
known gaps, all blocked on the same prerequisite: no part photos, a dropdown
instead of a browse-and-pick picker, and box-shaped 3D models. Phase 6
resolved the prerequisite for data (real SKUs, sourced fields) but explicitly
shipped **zero image files** — the `image` field exists only so this phase has
somewhere to read from (C7).

Phase 7 closes gap #1 and #2 together: a real catalog browser (grid/filter/pick
over the 22 real `cat6` parts) **and** real per-source-licensed images for as
many of those parts as can be rightfully sourced. Gap #3 (real-hardware 3D
meshes) stays **out of scope** — ADR-004 leaves manufacturer-derived 3D asset
rights open, and resolving that is a separate, larger question than 2D images.

---

## 1. Exit conditions (normative, draft)

1. **A browse-and-pick catalog screen replaces the current dropdown**, per
   category, showing whatever image exists (or a placeholder) plus the
   sourced identity/spec fields already in `cat6`. No `compat2`/`prov4`
   contract change; no new engine logic.
2. **Every shipped image traces in one hop to a source-rights-record entry**
   with publisher, canonical URL, license/rights class, and retrieval date —
   same audit standard Phase 4's `source-rights-record.json` and Phase 6's
   source registry already use. The owner can pick any three images and
   verify the citation.
3. **No image ships without an approved rights decision.** Fail-closed: a
   part with no approved source shows the existing placeholder state, not an
   image. This mirrors `prov4`'s source-rights fail-closed pattern (verified
   in the Phase 4 external-evidence re-audit).
4. **CC-BY / CC-BY-SA sourced images display required attribution** in the UI
   next to the image (publisher/author + license). Manufacturer press-kit and
   public-spec images do not require this per their license terms, but the
   source is still cited in the registry.
5. **Partial coverage is honest, not blocking.** Like Phase 6's catalog
   growth (Step 9: 14→22, not all fully specced), not every part needs an
   image to ship. Coverage gaps show a placeholder, never an invented or
   stock-substitute image.
6. **`pnpm test:all` and `pnpm build` stay green**; new integrity tests assert
   (a) no `image` entry lacks a matching source-rights-record decision, and
   (b) no image file ships for a part whose registry decision is not
   `approved`.

**Owner gate:** the owner picks three shipped images at random and follows
each to its source-rights-record entry and citation, in one hop — same shape
as the Phase 6 gate, applied to images instead of catalog facts.

---

## 2. Scope

| In | Out |
|----|-----|
| Catalog browser screen (grid/filter, replaces dropdown) for existing 7 categories / 22 `cat6` parts | New parts, categories, or catalog growth |
| Population of the existing `cat6.image` field for parts with an approved source | Real-hardware 3D meshes / `modelGlbPath` changes (ADR-004 still open) |
| Image source registry + rights decisions (manufacturer press/media kit, CC-BY/CC0 community) | Live/scraped image fetching at runtime |
| Attribution UI for CC-licensed images | Price, compatibility, or performance engine changes |
| Integrity tests: image ↔ rights-record binding, fail-closed on unapproved | Video, 360°, or interactive media |
| Placeholder state for uncovered parts | Comparison-table / multi-part-diff UI (may be a later phase) |

---

## 3. Image source strategy (owner-selected: manufacturer + CC mix)

Two source classes, ranked:

1. **Manufacturer official press/media kit** (preferred). Most GPU/mobo/case
   vendors (NVIDIA, AMD, ASUS, MSI, Gigabyte, Lian Li, etc.) publish reviewer
   media kits with product renders under stated reuse terms. Record the terms
   verbatim per source, same as Phase 4's `citationRights` capture.
2. **CC-BY / CC0 community sources** (Wikimedia Commons, Sketchfab, etc.) for
   parts with no usable press kit. Requires visible attribution for CC-BY;
   CC0 requires none but is still cited.

A part with neither available stays imageless (placeholder) rather than using
a lower-confidence or unclear-rights image. No screenshot, no unlicensed
retailer photo, no AI-generated stand-in.

---

## 4. Decisions needed (proposed defaults — owner to lock)

| # | Question | Proposed | Rationale |
|---|----------|----------|-----------|
| **O1** | Browser UI shape | Grid of cards per category (image + name + key specs), click to select — replaces dropdown, keeps existing part-detail panel | Matches Phase 5 direction quote directly; smallest UI change that fixes the named gap |
| **O2** | Coverage target this phase | Best-effort; no fixed minimum count, but at least 1 image per category (7 total) as a floor so the browser doesn't ship empty | Mirrors Phase 6's "curated, not exhaustive" posture; avoids inventing a number then missing it |
| **O3** | Rights-class modeling | Reuse `EvidenceRightsClass` as-is (`public-spec`, `fair-use-citation`, `licensed`) for manufacturer sources; add one new literal `"cc-attribution"` for CC-BY-family sources so the UI knows to render an attribution line | Minimal, additive contract change (same discipline as Phase 6 avoiding `perf1` widening) — a plain `"licensed"` can't tell the UI whether attribution is legally required |
| **O4** | File storage | `parts/<category>/<id>/image.<ext>` beside `model.glb`; `image.path` in `cat6` points there | Matches existing per-part folder convention |
| **O5** | Redistribution boundary | Store only the specific cropped/resized image actually displayed, not the full press-kit archive; note per-source whether resizing/cropping is permitted | Some press kits restrict modification; must be checked per source, not assumed |
| **O6** | Placeholder behavior | Keep current placeholder (or a generic neutral silhouette per category) for uncovered parts; never fall back to a different part's image | Consistent with "no invented data" charter principle applied to images |
| **O7** | Real-hardware 3D meshes | Explicitly **not** in this phase; ADR-004 follow-up stays open and separate | User already agreed this is lower priority than 2D images; keeps this M0 bounded |

---

## 5. Risks

- **RK1 — License misread.** A press kit's terms are ambiguous or change
  after retrieval. Mitigation: capture `retrievedAt`, store terms verbatim in
  the registry (not paraphrased), re-check before any redistribution beyond
  this repo.
- **RK2 — Partial coverage looks broken.** A grid with many placeholders may
  read as unfinished. Mitigation: placeholder state is intentional and
  labeled ("image not yet available"), not a blank/broken image.
- **RK3 — Attribution UI scope creep.** CC-BY attribution could balloon into
  a full credits page. Mitigation: inline, per-image, one line — no separate
  page in this phase.

---

## 6. Out of scope (explicit)

- New catalog parts/categories beyond the existing 22.
- Real-hardware 3D geometry (ADR-004 3D-asset follow-up — separate, later).
- Live image fetching, scraping, or any new network dependency at runtime
  (static SPA, ADR-001 — images are build-time repo assets like `model.glb`).
- Comparison/diff UI across multiple parts.
- Any `compat2`/`perf1`/`prov4`/`phys3` engine or contract change.

---

## 7. Next step

Owner reviews and locks O1–O7 (or amends them). Once locked, draft
`implementation_plan.md` (ordered, file-level steps) before any code changes,
per project process (`docs/decisions/TECH-DECISION-ORDER.md` discipline
applied per-phase).

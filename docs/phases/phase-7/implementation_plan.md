# Phase 7 — Implementation plan

Derived from [`specs/phase-7.md`](./specs/phase-7.md). Required by the "plan
before code" rule in [`../README.md`](../README.md).

Status: **Accepted 2026-08-13. Owner decisions O1–O7 locked as proposed
(no amendments).** Implementation authorized — see hand-off prompt in
`README.md` §"Implementation hand-off".

---

## Method: rights first, pixels second

For every image, in this order:

1. Find a source (manufacturer press/media kit or CC-BY/CC0 community) and
   read its actual reuse terms.
2. Record the source in `benchmarks/cat6/image-source-registry.json` with
   publisher, canonical URL, rights class, and retrieval date —
   `decision: "approved"` only if terms allow storing a resized/cropped copy
   in this repo under this project's Apache-2.0 code/data license umbrella
   (the image *file* itself keeps the original rights class; only the
   registry entry lives under repo tracking).
3. Only then add the image file under `parts/<category>/<id>/` and point
   `cat6`'s `image.sourceId` at the registry entry.

The reverse order — dropping an image in and back-filling a citation — is
prohibited (same discipline as Phase 6 §"source first, data second").

Every step ends with `pnpm test` at an unchanged-or-higher pass count and,
from Step 4 on, the browser screen rendering in `pnpm dev`.

---

## What is untouchable

| Area | Action |
|------|--------|
| `src/contract/prov4.ts` `EvidenceRightsClass` | **One additive change**: append `"cc-attribution"` to the union (O3). No other literal removed or renamed |
| `src/contract/cat6.ts`, `cat6.schema.ts` | `CatalogImageRef` already exists (Step 1 in Phase 6) — no shape change needed unless O3's new rights class requires a schema enum update |
| `src/contract/partV2.ts` | **Add** `image?: CatalogImageRef` (currently absent — verified missing from the runtime part shape) |
| `src/contract/vs2.schema.ts` (`partDefinitionV2Schema`) | **Add** optional `image` parse matching `cat6.schema.ts`'s existing image schema, so the loader actually surfaces it |
| `src/catalog/loadPartCatalog.ts` | No structural change expected — `image` flows through once the V2 schema accepts it. Verify, do not restructure |
| `parts/**` | **Add-only**: image files under existing per-part folders; `part.json` gains `image` where sourced. No `id`, `category`, compat/physical/performance field changes |
| `benchmarks/cat6/**` | **Add**: `image-source-registry.json` (new file, mirrors `catalog-source-registry.json` / `prov4`'s registry shape) |
| `src/ui/PartPicker.tsx` | **Rewritten**: dropdown → grid of cards (image + name + key spec line), same `onChange(partId)` contract so `App.tsx` wiring is unchanged |
| `src/App.tsx` | Only the minimal prop/import changes `PartPicker`'s new shape requires. No state-shape, URL, or engine wiring change |
| `src/ui/EvidenceDetails.tsx` or a new small component | Attribution line for `cc-attribution` images only |
| `compat2`, `perf1`, `prov4` pilot data, `phys3` | **Untouched.** No engine, no contract-shape change beyond the one additive `EvidenceRightsClass` literal |
| `docs/decisions/ADR-004` | Unchanged. Real-hardware 3D mesh rights remain a separate, later decision (O7) |

---

## Steps

### Step 1 — Rights-class contract + image registry shape, no images
Add `"cc-attribution"` to `EvidenceRightsClass` (`src/contract/prov4.ts`).
Add `image?: CatalogImageRef` to `PartDefinitionV2` and to
`partDefinitionV2Schema`. Define `image-source-registry.json`'s shape (reuse
`prov4`'s `EvidenceSource`-like fields: `sourceId`, `publisher`,
`canonicalUrl`, `rightsClass`, `retrievedAt`, `decision`, `notes`) and its
Zod schema + integrity test. **No part.json changes yet.** `pnpm test` stays
green because nothing populates `image`.

### Step 2 — First image, end to end
Pick one part (a GPU — highest visual value). Source one manufacturer
press-kit image, record the registry decision, add the cropped file under
`parts/gpu/<id>/image.<ext>`, set `part.json`'s `image` field. Add an
integrity test asserting: every populated `image.sourceId` resolves to a
registry entry with `decision: "approved"`, and the referenced file exists.
Confirms the whole chain (source → registry → file → schema → loader) before
scaling to more parts.

### Step 3 — Curate remaining images (best-effort, O2 floor)
Repeat Step 2's sourcing method across categories, aiming for at least one
approved image per category (7 categories, O2 floor). Mix manufacturer
press-kit and CC-BY/CC0 sources per §3 of the spec. Parts without a rightful
source stay without `image` — do not lower the bar to hit a count.

### Step 4 — Catalog browser UI
Rewrite `PartPicker.tsx`: grid of cards per category showing `image` (or a
neutral placeholder if absent), `displayName`, and one or two key spec
fields already on `PartDefinitionV2` (e.g. socket for CPU, VRAM/length for
GPU). Keep the existing `onChange(partId)` / `value` / `testId` contract so
`App.tsx` and existing E2E selectors keep working. Click selects, same as
today's `<select>` `onChange`.

### Step 5 — Attribution UI
For any part whose `image.rightsClass === "cc-attribution"`, render a small
attribution line (publisher/author + "CC BY" + link) next to the image in
the picker card or part detail area. No attribution UI for `public-spec`,
`fair-use-citation`, or `licensed` (per their terms already recorded in the
registry as not requiring it).

### Step 6 — Integrity + E2E regression
Integrity tests: (a) every `image` entry binds to an `approved`
registry decision, (b) no image file on disk is unreferenced by any
`image.path`, (c) `cc-attribution` images render the attribution line
(component test). Re-run/extend the existing part-selection E2E spec to
assert the grid renders and selection still drives `BuildState` correctly.
`pnpm test:all` + `pnpm build` green; `dist/parts/**` includes the new image
files.

---

## Verification (end of phase)

- `pnpm test:all` — unchanged-or-higher pass count, zero regressions in
  `compat2`/`perf1`/`prov4`/`phys3` suites.
- `pnpm build` — image files present under `dist/parts/**`.
- Manual: `pnpm dev`, open the app, confirm the grid picker renders images
  where sourced and a placeholder elsewhere, and that build assembly / URL
  sync / performance panel are unaffected.
- Owner gate: pick 3 shipped images at random, follow each to its
  `image-source-registry.json` entry and citation, one hop (spec §1
  condition 2).

## Honest failure modes

- If O2's floor (1 image/category) cannot be met for a category because no
  rightful source exists, that category ships with 0 images and the gap is
  recorded here, in `README.md`'s sequence table — not silently dropped.
- If a press kit's terms turn out to prohibit cropping/resizing on closer
  reading (RK1), that source's registry decision is corrected to
  `rejected`/`approved-metadata-only` and its image removed, mirroring how
  Phase 4 corrected the false first-party claim.

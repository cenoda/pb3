# Phase 5 — Closeout

**Owner approved the close on 2026-08-09.** Phase 5 is complete.

## What the approval rests on

- The owner reviewed the running surface in a browser and approved the close.
  A per-condition PASS/FAIL record for exit conditions 1–5 was **not**
  separately captured; the approval is a single owner judgement on the surface
  as a whole. This is recorded plainly so no stronger claim is read into it
  later.
- Screenshots of every step and of the final surface at 1280 / 1440 / 1920:
  [`screenshots/`](./screenshots/).
- Automated coverage of exit conditions 1–5 in
  `e2e/phase5-exit-conditions.spec.ts` (green). This supports the approval; it
  does not substitute for it.
- Implementation record and deviations: [`STEPS.md`](./STEPS.md).

## Verification at close

| Gate | Result |
|------|--------|
| `pnpm test` | 31 files, 215 tests, pass |
| `pnpm test:e2e` | 17 tests, pass |
| `pnpm build` | clean |

Commits: `e04a960` (phase opened, corrective track closed), `dfb395f`
(display layer replaced).

## What shipped

Header / parts rail / dominant 3D view / result bar, with one *Why this
result?* disclosure. Impossible builds present no FPS and no price; rejections
state the conflict and the part to change in product names; performance always
carries game, preset and confidence; the canonical URL is copyable and reopens
the identical build; provenance is retained in full behind the disclosure.

No engine, no contract and no data changed.

## Known gaps carried out of this phase

These are real and were judged out of scope here, not overlooked:

1. **No part photos.** `parts/*/*/` holds `part.json` and `model.glb` only —
   there is no image field in the contract. A production estimate site needs
   them. Blocked on a catalog contract extension **and** an image source with a
   recorded licence, at the same evidence standard `prov4` applies to numbers.
2. **Part selection is a dropdown, not a browse-and-pick dialog.** The right
   shape is a picker with photos, filters and comparison. Blocked on the same
   thing: with 1–2 options per category a dialog is worse than a dropdown.
3. **The 3D models are plain boxes.** Existing `parts/**` geometry; more
   visible now that the viewport is large.
4. **The build name is not shared.** It labels the session only, because the
   link is the frozen `vs2` contract.

Owner direction (2026-08-09): the real catalog is the shared prerequisite for
1–3, and it is **not** started in this session. Sequence agreed in principle:
real catalog first, catalog browser second — screen-first within whichever
phase takes them.

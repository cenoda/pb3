# Phase 6 — Closeout

**Owner approved the close on 2026-08-12. Phase 6 is complete.**

## What the approval rests on

- Steps 1–12 completed under the accepted Phase 6 scope and catalog contract.
- The Step 12 exhaustive audit and corrective review covered all 22 manifest
  parts and the current 13 price rows. The owner accepted that gate on
  2026-08-12 after independent review of corrective commit `260169e`.
- B4 was resolved in `83510fe`: raw `chipset-bios: unavailable` remains visible
  under O6, but is informational and non-blocking for aggregate compatibility
  and the surface verdict. Every other unavailable compatibility check retains
  the prior `unavailable` / `caution` behavior. No BIOS minimum was invented.
- The B4 packet was independently re-verified against the live checkout before
  this close. This owner decision closes Phase 6 as a whole; it does not claim
  that every deliberately omitted or inaccessible external source became green.

## Verification at close

| Gate | Result |
|------|--------|
| `pnpm test` | 40 files, 344 tests, pass |
| `pnpm test:e2e` | 19 Playwright tests, pass |
| `pnpm build` | clean |
| `git diff --check` | clean |

Implementation record: [`STEPS.md`](./STEPS.md). Factual audit:
[`STEP12_AUDIT.md`](./STEP12_AUDIT.md). Final implementation commit before this
docs-only close: `83510fe`.

## What shipped

- A manifest-driven `cat6` catalog containing 22 real SKU-level parts with
  strict schema validation and group-level provenance.
- Published dimensions and clearance-limit rules as physical authority;
  approximate placeholder GLBs remain visual-only.
- A dated price catalog with 13 current rows: 11 KRW street snapshots and two
  MSRP-only rows. Missing or MSRP-only street totals remain explicitly partial.
- Integrity gates for manifest membership, strict part parsing, source
  resolution, GLB structure, images, dimensions provenance, prices, and
  currency handling.
- User-facing unavailable-performance reasons for combinations outside the
  frozen performance evidence.
- The Step 6 physical-authority boundary, O7 running-app witness, and B4
  compatibility-verdict correction required to keep the real catalog truthful.

## Known gaps carried out of this phase

These are accepted gaps, not completed work:

1. **Catalog size is 22, not approximately 30.** Candidates without complete
   manufacturer evidence were omitted instead of guessed.
2. **External evidence remains partial.** Step 12 records 17 PASS / 1 FIXED /
   4 BLOCKED parts and 12 PASS / 1 BLOCKED price audits over the 13 current
   rows. The blocked items remain explicit source-access gaps.
3. **Price coverage is partial.** Nine parts have no price row; two current rows
   are MSRP-only and never contribute to the street-price subtotal.
4. **Performance coverage is narrow.** Phase 4 / 4.1 remain frozen, so most
   valid catalog combinations correctly report that the estimator is still in
   preparation.
5. **BIOS revision compatibility is not modeled.** The raw BIOS check remains
   `unavailable` and informational under O6. Socket compatibility is still
   enforced.
6. **No part images or production hardware meshes ship.** Images require a
   source-rights decision; current GLBs are project-authored visual placeholders.
7. **Platform breadth remains AM5 / DDR5.** Other platforms require a deliberate
   versioned widening of `compat2`.
8. **Catalog authoring is manual.** No permanent part-addition automation
   pipeline was introduced by the discarded Step 12 audit helper.
9. **GPU preload membership remains hardcoded** in
   `src/viewport/GpuModel.tsx`; manifest-driven preload is deferred.

Phase 7 has not started. It requires a separate accepted M0 plan and any image
rights decision its scope depends on.

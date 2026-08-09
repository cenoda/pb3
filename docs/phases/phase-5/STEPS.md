# Phase 5 — Implementation record (Steps 1–8)

Built 2026-08-09 against [`implementation_plan.md`](./implementation_plan.md).
Every step ended with a browser screenshot; they are in
[`screenshots/`](./screenshots/).

| Step | Result | Screenshot |
|------|--------|------------|
| 1 — Empty shell | Layout at 1280/1440/1920, 1280 px cap removed | `step1-empty-shell-*.png` |
| 2 — Parts rail | Seven selectors bound to the build store; selection survives reload via the canonical URL | `step2-parts-rail-1440x900.png` |
| 3 — 3D dominant | Viewport fills the stage; user-language empty and failure states | `step3-3d-dominant-*.png`, `step3-3d-failure-1440x900.png` |
| 4 — Result bar | Verdict, FPS with game + preset + confidence, price with the demo-price caveat | `step4-result-pass-*.png`, `step4-result-fail-*.png` |
| 5 — Rejection state | Impossible builds present no FPS and no price; covered by `src/test/buildVerdict.test.ts` | `step4-result-fail-1440x900.png` |
| 6 — Header actions | Build name, `Copy link`, `Reset`; the copied link reopens the identical build | `step6-copy-link-*.png`, `step6-reopened-link-*.png` |
| 7 — Why this result? | One disclosure holding every diagnostic; provenance retained in full | `step7-why-closed-*.png`, `step7-why-open-*.png` |
| 8 — Test re-anchoring | 5 specs re-anchored, 1 deleted, 1 added; suites green | `final-surface-*.png` |

## Measurements

The audit measured the 3D view at 14.8 % of a 1920×1080 screen. It is now
**67.5 %** at 1920×1080 and 59.8 % at 1440×900, and it grows with the window.

## Verification

| Gate | Command | Result |
|------|---------|--------|
| Unit | `pnpm test` | 31 files, 215 tests, pass |
| E2E | `pnpm test:e2e` | 17 tests, pass |
| Build | `pnpm build` | clean |
| Product | Browser walkthrough | **Step 9 — owner, not yet performed** |

Baseline before the phase was 32 files / 211 tests. The difference is display
layer only: `buildResultSummaryModel.test.ts` (2 tests) was deleted with the
module it covered, and `buildVerdict.test.ts` (6 tests) was added. **No engine
test was modified**, and no file under `catalog/ compat/ contract/ estimate/
perf/ physical/ price/ provenance/ state/` was changed.

## Deviations from the plan, and why

1. **A workloads section was added to the disclosure.** Spec §4 judged every
   surface but missed the Cinebench workload panel. Dropping it silently would
   have removed a shipped Phase 1 capability, so it moved into *Why this
   result?* with the other diagnostics.
2. **The build name is local, not shared.** The shared link is the frozen `vs2`
   contract; carrying a name in it would be a contract change, which §5
   forbids. The name labels the current session only. If the name must survive
   sharing, that is a contract change for a later phase.
3. **Two E2E assertions could not be expressed unchanged** (reported here
   rather than dropped, per the plan's risk section):
   - `phase3`: *"performance panel still present when physical validation is
     unavailable"*. Under R1 a build that cannot be assembled shows no
     performance at all, so the assertion is now: restoring the supported RAM
     brings the **identical** numbers back — proving the withholding was a
     presentation rule, not an engine failure.
   - `phase4` / `phase4.1`: the labels *"not an est1 estimate"* and *"not
     modeled"* were engine wording on a panel that no longer exists. The est1
     unavailability and its reason are still asserted inside the disclosure,
     and the surface is asserted to say *"Demo estimate, not measured"* (R3).
4. **`e2e/product-ux-shell.spec.ts` was deleted**, not re-anchored — it encoded
   the shell-property exit conditions this phase replaces.
5. **Nested disclosures exist inside *Why this result?*** (the excluded
   near-miss observation lists). §2 requires one disclosure on the *product
   surface*; these are inside it, and the exit-condition spec asserts exactly
   one top-level `<details>`.

## Still open

Step 9: the owner performs exit conditions 1–5 in a browser and passes or fails
the phase on that alone.

# Phase 5 — Product surface

The phase that turns the Phase 0–4 engines into something a stranger can use.

**Status: Complete — owner approved the close 2026-08-09
([`CLOSEOUT.md`](./CLOSEOUT.md)).**

This phase changes **no engine, no contract, and no data** — the display layer
only.

| Artifact | Purpose |
|----------|---------|
| [`specs/phase-5.md`](./specs/phase-5.md) | Scope, exit conditions, screen composition, behaviour rules, out-of-scope list, owner decisions D1–D4 |
| [`implementation_plan.md`](./implementation_plan.md) | Ordered build plan, deletion boundary, principal risk, verification |
| [`STEPS.md`](./STEPS.md) | What was actually built, measurements, verification, deviations |
| [`CLOSEOUT.md`](./CLOSEOUT.md) | Owner approval, what it rests on, gaps carried forward |
| [`screenshots/`](./screenshots/) | One per step, plus the final surface at 1280 / 1440 / 1920 |
| [`../../corrections/product-ux-2/AUDIT.md`](../../corrections/product-ux-2/AUDIT.md) | The evidence this phase answers (audit at `095f551`, verdict FAIL) |

There is no separate contract document. This phase changes no contract.

## The gate

The phase ends when a person who has never seen this app can, unaided:
choose parts → understand a rejection → read performance in context and see the
build in 3D → read the price → share a link that reopens the same build.

The owner performs these five steps in a browser, and passes or fails the phase
on that alone. Green tests and accepted documents are inputs, not the gate.

## Sequence

| Step | State |
|------|-------|
| M0 scope + plan drafted | **Done — 2026-08-09** |
| Owner decisions D1–D4 | **Locked — 2026-08-09** |
| Owner acceptance + explicit start instruction | **Done — 2026-08-09** |
| Implementation Steps 1–8 | **Done — 2026-08-09** ([`STEPS.md`](./STEPS.md)) |
| Owner walkthrough (Step 9) | **Approved — 2026-08-09** |

## Relationship to other work

- **Absorbs the corrective track.** `product-ux-1` is closed; `product-ux-2`
  contributed the audit and is closed into this phase. There is one track.
- **Phase 4 / 4.1 stay frozen.** No evidence work resumes here.
- **Engines are read-only.** Presentation only; see the deletion boundary in the
  implementation plan.

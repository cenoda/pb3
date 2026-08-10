# Phase 6 — Real parts catalog

The phase that replaces the invented data the Phase 0–5 work runs on.

**Status: M0 package drafted and accepted 2026-08-10. Owner decisions O1–O8
locked. Implementation started — Step 1 (the `cat6` contract) is complete;
Steps 2–12 are open.**

This phase changes **no display layer and no engine logic** — the data only. It
is the exact inverse of Phase 5, which changed the display layer and no data.

| Artifact | Purpose |
|----------|---------|
| [`specs/phase-6.md`](./specs/phase-6.md) | Scope, exit conditions, the no-FPS consequence, the SKU id migration, out-of-scope list, locked decisions O1–O8, risks RK1–RK9 |
| [`specs/catalog-data-contract.md`](./specs/catalog-data-contract.md) | `cat6` — identity, dimensions, SKU performance spec, provenance, image fields, id convention, manifest, dual-price model, validation split |
| [`implementation_plan.md`](./implementation_plan.md) | Ordered Steps 1–12, untouchable boundary, verification, honest failure modes |
| [`TODO.md`](./TODO.md) | Checklist |
| [`../phase-5/CLOSEOUT.md`](../phase-5/CLOSEOUT.md) | The direction this phase answers: real catalog first, catalog browser second |

## The gate

The owner picks three parts at random and follows every engine-consumed field —
socket, chipset, memory, wattage, TDP, form factor, dimensions, boost clock,
power limit — to a citation with a retrieval date, in one hop. The phase passes
or fails on that.

Green tests and accepted documents are inputs, not the gate. Phase 5 established
this shape: the gate measures the thing itself, not a proxy for it.

## The three things to know before agreeing

1. **Most valid builds will show no FPS.** `perf1` covers 2 CPUs and 2 GPUs, and
   Phase 4.1 — the attempt to close exactly that gap — is frozen. Instead of a
   number, the product says the combination estimator is still in preparation.
   Disclosure, not regression: the fixture catalog was shaped to fit the
   evidence.
2. **Every share link produced so far breaks, once.** Part ids become real SKU
   ids, and the URL carries part ids. Old links open on the default build rather
   than erroring. Accepted deliberately — they pointed at parts that were never
   real.
3. **SKU granularity is the point.** An ASUS and an MSI RTX 4070 differ in
   dimensions *and* in clocks and power limits, so `cat6` records both. Calling
   them one product would erase two claims this project makes.

## Sequence

| Step | State |
|------|-------|
| M0 scope + contract + plan drafted | **Done — 2026-08-10** |
| Owner decisions O1–O8 | **Locked — 2026-08-10** |
| Owner acceptance + implementation start | **Done — 2026-08-10** (accepted by starting Step 1; no separate written acceptance) |
| Step 1 — `cat6` contract, no data | **Done — 2026-08-10** (`pnpm test` 32 files / 236 tests, `pnpm build` clean) |
| Steps 2–11 | Not started |
| Owner spot-check (Step 12) | Not started |

## Relationship to other work

- **Phase 4 / 4.1 stay frozen.** No new evidence claim. Three mechanical
  carve-outs, all id-, version-, or wording-level: `prov4` pilot ids and geometry
  version, `perf1` fixture ids, and the `src/perf/**` unavailable reason strings.
- **Phase 5 is closed and its surface is read-only.** If real data makes a screen
  wrong, that is recorded for the next phase.
- **Phase 7 (catalog browser) depends on this.** The `cat6` image fields exist so
  that phase has somewhere to read from; no image file ships here.
- **Later platform breadth** — LGA1851, LGA1700, AM4 — is intended and deferred.
  It will require a deliberate, versioned widening of `compat2`'s DDR5 and form
  factor literals (**O2**).

# Phase 5 — Product surface (M0 scope)

Status: **Accepted by the owner 2026-08-09. Owner decisions D1–D4 locked.
Implementation started.**

Charter authority: [`../../../../PROJECT_CHARTER.md`](../../../../PROJECT_CHARTER.md) §7 (success criteria).
Evidence for this scope: [`../../../corrections/product-ux-2/AUDIT.md`](../../../corrections/product-ux-2/AUDIT.md) (audit at `095f551`, verdict FAIL).
Build plan: [`../implementation_plan.md`](../implementation_plan.md).

---

## 0. Purpose

Phases 0–4 built engines. This phase builds the **product** on top of them.

Nothing below `src/ui/` is the problem. The compatibility engine, the geometry
and collision engine, the performance estimator, the price engine, the
provenance layer, and canonical URL state all work. What does not exist is a
surface that lets a person who has never seen this app use them.

Phase 5 is therefore a **presentation phase**, deliberately narrow: replace the
display layer, change no engine.

### Why this is a phase and not another corrective gate

`product-ux-1` ran the full corrective ritual — audit, plan, implementation,
owner acceptance, closeout — on 2026-08-09, and the app still fails a
first-time-user walkthrough the same day. That gate passed because its exit
conditions measured shell properties (page background, collapsed height, panel
count), not whether a person could finish a build.

The corrective track is therefore **absorbed into this phase and closed**. There
is one track, and its exit conditions are user actions.

---

## 1. Exit conditions (normative)

Written in the grammar of Charter §4 Phase 0, which is the last exit condition
in this repository that produced what it promised.

The phase ends when a person who has never seen this app, given no explanation,
can do all five of the following in a browser:

1. **Open the app and choose parts.** They select a case, motherboard, CPU, GPU,
   cooler, RAM, and PSU without being told what the controls are.
2. **Understand a rejection.** When the chosen parts cannot work together, they
   read one plain sentence saying what conflicts and which part to change — on
   the main screen, without opening anything.
3. **Read the performance result in context.** They see the estimated FPS range
   per resolution together with the game, the graphics preset, and how much the
   estimate can be trusted — and they see the assembled build in 3D.
4. **Read the price.** They see the total and understand that these are fixed
   demo prices, not live market quotes.
5. **Share the build.** They copy a link from the app, send it, and the receiver
   opens the identical build.

**Owner gate:** the owner performs these five steps in a browser and passes or
fails the phase on that basis alone. No contract review, no code review, and no
green test suite substitutes for it. Screenshots of all five steps are attached
to the closeout.

### Mapping to the five user questions

| User question | Exit condition |
|---------------|----------------|
| Is this part right? | 1, 2 |
| Does it physically fit? | 2, 3 |
| How will it perform in games? | 3 |
| What does it cost? | 4 |
| How much can I trust this? | 3, 4 |

---

## 2. Screen composition

```
┌──────────────────────────────────────────────────────────┐
│ Build name                            Copy link · Reset  │
├───────────────┬──────────────────────────────────────────┤
│ Parts         │                                          │
│               │              3D build view               │
│  Case         │                (dominant)                │
│  Motherboard  │                                          │
│  CPU          │                                          │
│  GPU          ├──────────────────────────────────────────┤
│  Cooler       │ Verdict · FPS (game, preset) · Price      │
│  RAM          │ Why this result?                    ▸     │
│  PSU          │                                          │
└───────────────┴──────────────────────────────────────────┘
```

Rules for the composition:

- The 3D view is the largest element on screen and grows with the window. The
  audit measured it at 14.8 % of a 1920×1080 screen with the page capped at
  1280 px; that cap is removed.
- Verdict, performance, and price sit under the 3D view as one result bar, not
  as a stack of separate panels.
- Exactly **one** disclosure exists on the product surface: *Why this result?*
  Everything technical lives inside it. The audit found nine sibling
  disclosures of equal rank mixing user content with engine diagnostics.
- Desktop only. Target widths 1280, 1440, 1920.

---

## 3. Behaviour rules (normative)

These fix the S1 findings and are the correctness core of the phase.

| # | Rule |
|---|------|
| **R1** | When the build is not compatible or cannot be assembled, **no performance number and no price is presented as a result.** They are replaced by the rejection state. Today an impossible build reports `1080p 125–145` — a *higher* number than the valid build it replaced. |
| **R2** | Every failing verdict carries one plain sentence naming the conflict and the part to change, on the main screen, using product names rather than internal part IDs. |
| **R3** | A performance number is never shown without its game, its graphics preset, and its confidence. All current fixture rows are `confidence: "stub"`; the surface says so in user language ("demo estimate, not measured"). |
| **R4** | Every failure and empty state is written for a user. `Physical assembly unavailable — no mounted poses.`, `Loading fixtures…`, and `Failed to load fixtures:` are engine sentences and are replaced. |
| **R5** | Provenance is **retained in full** — source ids, digests, freshness, limitations, geometry version, coverage ids. It moves behind *Why this result?*. Nothing is deleted. |
| **R6** | The canonical URL remains the share format. `Copy link` copies it; no new sharing mechanism, no server. |

---

## 4. Keep / move / drop

Every surface that exists today, judged once.

| Today | Phase 5 | Note |
|-------|---------|------|
| Part selectors (7) | **Product surface** | Left rail, primary |
| Build results summary | **Product surface** | Rebuilt as the result bar, under R1–R3 |
| 3D assembly canvas | **Product surface** | Promoted to dominant |
| Game + graphics preset | **Product surface** | Currently buried inside `Build parts list`; promoted next to the FPS numbers |
| Upscaling / frame generation | **Product surface** | User-understood settings that change the numbers |
| Price total | **Product surface** | With the fixed-demo-price caveat visible |
| `Copy link`, `Reset`, build name | **New** | None exist today |
| Compatibility details | *Why this result?* | Reason sentence promoted to surface (R2) |
| Fit details | *Why this result?* | |
| Cooling details | *Why this result?* | |
| Price line items | *Why this result?* | |
| Evidence details (`prov4`, digests, freshness, limitations) | *Why this result?* | Retained in full (R5) |
| Performance correction console (CPU/GPU power, cooling bucket, load profile, evidence source id) | *Why this result?* | Engine diagnostics, not product controls |
| Mount controls (cooler orientation) | *Why this result?* | Engine control |
| Build parts list | **Dropped** | The left rail already shows the selection |
| Filters | **Dropped** | 1–2 options per category; restore when the catalog grows |

---

## 5. Out of scope (binding)

This list is as normative as the scope. It exists because the failure mode of
this project has been drift into engine-interesting work.

- No engine or algorithm change: `compat`, `perf`, `physical`, `price`,
  `estimate`, `provenance` computations are used as-is.
- No contract change: `vs0`, `perf1`, `vs2`, `compat2`, `phys3`, `prov4`, `est1`.
- No data change of any kind: `parts/**` and `benchmarks/**` are read-only
  (per **D2**), and no parts, games, presets, or benchmarks are added.
- No new evidence work. Phase 4 / 4.1 stay frozen
  ([`../../phase-4/FREEZE.md`](../../phase-4/FREEZE.md)).
- No mobile or responsive work below 1280 px.
- No login, server, database, or live pricing.
- No new runtime dependencies.
- No 3D feature work: no animation, no RGB, no new geometry. Framing and sizing
  of the existing viewport only.

---

## 6. Owner decisions (locked 2026-08-09)

| # | Question | Decision |
|---|----------|----------|
| **D1** | When a build is impossible, hide the FPS and price entirely, or grey them out as "not achievable"? | **Hide.** A number on screen is read as a result no matter how it is styled — the audit showed the failing build's `125–145` reading as an upgrade over the valid build's `80–95`. |
| **D2** | Keep the `… (fixture)` suffix on every part name, or drop it and state the demo status once? | **Keep it.** The catalog *is* provisional, and Charter §2 says unfinished data is labelled, not dressed up. The suffix is removed in a later phase when the real catalog lands — not here. |
| **D3** | One game and one preset exist. Fixed labelled context, or selectors with a single option? | **Fixed labelled context.** A selector with one option promises a choice that does not exist. |
| **D4** | Open on a complete pre-selected build, or an empty build? | **Pre-selected, with `Reset`.** An empty build over a 7-slot catalog gives a stranger nothing to react to; `Reset` provides the empty path. |

**Consequence of D2: this phase changes no data at all.** `parts/**` and
`benchmarks/**` are untouched, and Phase 5 is purely a display-layer
replacement. No separate "demo catalog" notice is added — the suffix already
carries that meaning on every option.

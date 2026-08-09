# Phase 5 — Implementation plan

Derived from [`specs/phase-5.md`](./specs/phase-5.md). Required by the
"plan before code" rule in [`../README.md`](../README.md).

Status: **Accepted 2026-08-09; implementation started.** Owner decisions
**D1–D4 locked** (spec §6).

---

## Method (this is the change, not just the plan)

Build **screen first, engine second**. For each step:

1. Decide what the user must see and do.
2. Build that screen.
3. Only then reach into an existing engine module for the data it needs.

The reverse direction — rendering what the engines happen to produce — is what
built the current surface, and is prohibited for this phase. No new engine
capability is added; if a screen wants something the engines cannot answer, the
screen states the limit honestly (Charter §2, "모르는 것은 추정하지 않는다").

**Every step ends with a browser screenshot.** A step with no screenshot is not
complete. This replaces the closeout ritual for intermediate steps.

---

## What is deleted, what is untouchable

| Area | Action |
|------|--------|
| `src/App.tsx`, `src/ui/**`, `src/styles/**` | **Replaced wholesale.** No panel is carried over by reuse; anything kept is re-derived. ~2,200 lines. |
| `src/viewport/**` | Kept; framing and sizing adjusted only |
| `src/catalog/`, `src/compat/`, `src/contract/`, `src/estimate/`, `src/perf/`, `src/physical/`, `src/price/`, `src/provenance/`, `src/state/` | **Untouchable.** Read-only consumption. A diff touching these files fails review unless it is a caller-signature change forced by the new UI. |
| `parts/**`, `benchmarks/**` | **Untouchable.** Per **D2** this phase changes no data at all |
| `docs/decisions/ADR-00*` | Unchanged |

---

## Steps

### Step 1 — Empty shell
Delete the display layer. New `App.tsx` renders header / parts rail / 3D area /
result bar as empty regions with the final layout and the 1280 px cap removed.
Nothing is wired. Verify at 1280, 1440, 1920.
*Screenshot: three widths, empty shell.*

### Step 2 — Parts rail
Seven selectors in the rail, bound to the existing build store, with canonical
URL encode/decode preserved. Reload restores the build (Charter §4 Phase 0 exit
condition 5 — it must not regress).
*Screenshot: selection changed and restored after reload.*

### Step 3 — 3D dominant
Viewport fills the main area and grows with the window. Existing assembly and
pose logic unchanged. User-language empty and failure states (**R4**).
*Screenshot: 1920 with the viewport dominant; a failure state.*

### Step 4 — Result bar
Verdict, FPS with game + preset + confidence (**R3**), price with the
fixed-demo-price caveat. One reason sentence for a failing verdict, in product
names (**R2**).
*Screenshot: a passing build and a failing build.*

### Step 5 — Rejection state (**R1**)
When the build is not compatible or cannot be assembled, the performance and
price figures are **removed from the screen** (per **D1**) and replaced by the
rejection state. This is the defect that most misleads a first-time user and is
verified explicitly.

`src/ui/computeFpsSummaryChips.ts` — the module carrying the defect — has **no
unit test today**. Its replacement gets one: an incompatible build must not
produce a presentable performance result.
*Screenshot: the Micro-ATX case + ATX board combination from the audit.*

### Step 6 — Header actions
Build name, `Copy link` (copies the canonical URL, **R6**), `Reset`.
*Screenshot: link copied and reopened in a second window showing the same build.*

### Step 7 — *Why this result?*
One disclosure holding every diagnostic surface listed in spec §4, provenance
retained in full (**R5**).
*Screenshot: closed and open.*

### Step 8 — Test re-anchoring
See the risk below. Re-anchor the E2E suite to the new surface and add exit
condition coverage.

### Step 9 — Owner walkthrough
The owner performs exit conditions 1–5 in a browser. Pass or fail on that alone.

---

## Principal risk: the E2E suite is anchored to the deleted UI

The six specs in `e2e/` make **158 test-id references across 51 unique test
ids**, nearly all pointing at panels this phase removes. Replacing the display
layer breaks all of them at once.

This matters beyond inconvenience: those specs are currently the only automated
proof that the Phase 2, 3, 4 and 4.1 engines still behave. If they are rewritten
carelessly to make the new UI pass, an engine regression can hide inside a green
suite — the same failure shape as `product-ux-1`, where a gate passed while the
product did not work.

Handling:

- The **unit suite is unaffected** and is the safety net. 31 of 32 test files
  cover engines and contracts; only `buildResultSummaryModel.test.ts` touches
  the display layer. Run it before and after each step and require an identical
  pass count.
- E2E specs are re-anchored **one at a time**, preserving each assertion's
  *meaning*. An assertion that cannot be expressed on the new surface is
  reported to the owner as a scope question, not silently dropped.
- `e2e/product-ux-shell.spec.ts` is deleted, not re-anchored; it encodes the
  shell-shaped exit conditions this phase replaces.
- A new `e2e/phase5-exit-conditions.spec.ts` covers exit conditions 1–5,
  including the R1 rejection case.

---

## Verification

| Gate | Command | Requirement |
|------|---------|-------------|
| Unit | `pnpm test` | Pass count unchanged or higher; no engine test modified |
| E2E | `pnpm test:e2e` | Green after re-anchoring, with every preserved assertion accounted for |
| Build | `pnpm build` | Clean |
| Product | Browser, 1280 / 1440 / 1920 | Exit conditions 1–5 by the owner |

The first three are necessary and not sufficient. The phase passes on the
fourth.

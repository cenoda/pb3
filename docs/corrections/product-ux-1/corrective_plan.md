# Product UX M0 — corrective implementation plan

| Field | Value |
|-------|--------|
| Work id | `product-ux-1` |
| Status | **Draft — not owner-accepted; implementation not authorized** |
| Baseline | **`e73602a`** |
| Authority | [`AUDIT.md`](./AUDIT.md), [`README.md`](./README.md) |
| Stack | ADR-001–004 unchanged (static SPA, TS/React/R3F/Vite, pnpm/Zod/Zustand/Vitest, Apache-2.0) |

This is the ordered, file-level plan required before any corrective UI code.
It is **not** Phase 5. It does **not** reopen Phase 0–4 architecture or
contracts.

**Implementation remains blocked** until:

1. Owner accepts this package, and  
2. Owner gives a **separate** explicit implementation-start instruction.

---

## 1. Preconditions

| Gate | State |
|------|-------|
| Phase 0–3 closed out | Yes |
| Phase 4 Steps 1–8 software path | Complete at `e73602a` |
| Phase 4 Step 9 evidence-quality | **Still pending** — not closed by this plan |
| Contracts `vs0`…`prov4` | **Frozen** (no public shape changes) |
| Inventory | **Frozen** (13 parts; phase constants for game/preset) |
| New dependencies / design system | **Forbidden** unless a later written amendment |
| This plan owner-accepted | **No** (draft) |
| Explicit start instruction | **No** |

---

## 2. Principles

1. **Smallest correct UI restructuring** — presentation and layout first.
2. **Preserve engines** — only re-home how results are shown.
3. **Progressive disclosure** — advanced evidence and collision detail remain
   accessible, collapsed by default.
4. **Desktop first** — required verification viewport **1280×720**; wider
   desktops should not regress.
5. **No design-system rewrite** — system font + inline or a single small CSS
   file is enough; prefer existing inline-style patterns unless a tiny global
   CSS file is cleaner for theme tokens.
6. **Test hooks** — keep `data-testid` stability where E2E already depends on
   them; add new hooks for summary/disclosure rather than breaking old ones
   without updating tests in the same change set.
7. **Honesty preserved** — ranges, confidence, unavailable, Experimental, and
   stub labeling stay truthful (summarized, not deleted).

---

## 3. Panel disposition map

What happens to each existing surface (no blind deletion):

| Current surface | Disposition |
|-----------------|-------------|
| `PartFilterControls` | **Keep** in selector region; may move under a compact “Filters” disclosure if first-screen density requires it |
| `PartSelector` ×7 | **Keep** as primary builder controls; group visually; order may be tuned for workflow |
| `MountControls` | **Keep**; secondary control near viewport or under “Mount” disclosure — not removed |
| `BuildSummary` | **Fold into** compact build identity strip or keep short list near selectors; avoid duplicating the new result summary |
| `CompatibilityPanel` | **Split**: overall status → **BuildResultSummary**; full check list → disclosed details (existing panel or `<details>`) |
| `EvidenceDisclosurePanel` | **Collapse by default** (`<details>` closed or equivalent); pilot active/inactive one-liner may stay in summary |
| `PhysicalValidationPanel` | **Split**: overall fit/interference/unavailable → summary; per-check list + geometry join IDs → disclosed details |
| `CoolingEvidencePanel` | **Default**: one-line status in summary or under physical/cooling disclosure; full panel collapsed; no second full copy under evidence |
| `PriceSummaryPanel` | **Split**: total (+ partial flag) → summary; line items → disclosed or compact secondary |
| `PerformancePanel` | **Split**: primary resolution FPS ranges → summary; upscale/framegen/RAM controls stay accessible; correction + sidecar digests/source lists → disclosed; Cinebench secondary |
| `BuildViewport` | **Promote**: larger and/or sticky in desktop shell; same assembly props pipeline |

New UI (proposed names — implementer may adjust to local style):

| Proposed | Role |
|----------|------|
| `BuildResultSummary` (new) | Compact compat / fit / FPS / price status strip |
| App shell layout styles | Theme + grid + sticky viewport region |
| Optional `src/styles/theme.css` or root tokens in `index.html` | Only if cleaner than pure inline for global bg/text |

---

## 4. Measurable acceptance targets

| # | Target |
|---|--------|
| T1 | No transparent page background dependency — app owns `html`/`body` (or shell) background |
| T2 | Text remains readable in both light and dark **host** contexts (owned surface colors) |
| T3 | At **1280×720**, part selectors (at least CPU/GPU), **3D viewport**, and **primary result summary** are visible **without scrolling** |
| T4 | User can change GPU and immediately see updated compatibility, fit, FPS, and price status (summary) plus 3D |
| T5 | 3D viewport remains visible while inspecting the primary builder workflow (sticky region or non-scrolling main stage) |
| T6 | `prov4`, source IDs, collision pair/check IDs, and raw diagnostic details are **not** expanded by default |
| T7 | Evidence details remain accessible through **explicit** disclosure |
| T8 | No duplicated performance, geometry, or cooling **summary blocks** on the default surface |
| T9 | Canonical `vs2` URL encode/decode behavior unchanged |
| T10 | Pilot evidence never carries into non-pilot builds |
| T11 | Existing Phase 0–4 tests remain green (`pnpm test` + `pnpm test:e2e`) after planned test updates |
| T12 | No new runtime dependencies; no design-system package |

---

## 5. Regression gates (every implementation step)

- `pnpm test` — unit/schema/integrity
- `pnpm test:e2e` — Phase 0/2/3/4 Playwright specs (update as structure requires)
- `pnpm build` — when touching Vite/index/global CSS or fixture paths (fixtures should be untouched)
- Manual or Playwright explore at **1280×720** for T3–T5
- Explicit pilot / non-pilot GPU checks for T9–T10

---

## 6. Implementation steps

### Step 0 — Preconditions re-check (no product code)

**Files:** docs only if status drift; otherwise none.

| | |
|--|--|
| Behavior preserved | Entire app |
| Behavior changed | None |
| Tests | Optional: `pnpm test:all` snapshot of green baseline |
| Exit | Confirm HEAD still based on `e73602a` lineage; package accepted; start authorized |

---

### Step 1 — Global theme / readability foundation

**Likely files**

- `index.html` — optional `theme-color` / class on `html`
- `src/main.tsx` — import global CSS if introduced
- `src/styles/app-shell.css` (new, optional) **or** root styles in `App.tsx`
- `src/App.tsx` — shell background/color on `main`

**Behavior preserved**

- All engine outputs, layout structure may still be old until Step 2.

**Behavior changed**

- App owns background + default text color (readable light surface recommended).
- Optional: subtle borders already used on panels remain compatible.

**Tests**

- Unit: none required.
- E2E: smoke still loads; optional assert `document.body` background not
  transparent via `getComputedStyle` in a small explore script or e2e helper.
- Manual: dark + light host media at 1280×720.

**Exit**

- T1, T2 satisfied; no dependency added.

---

### Step 2 — Builder shell and primary layout

**Likely files**

- `src/App.tsx` — restructure grid: e.g. left controls, center/right sticky
  viewport, summary region in first screen
- Possibly extract `src/ui/BuilderShell.tsx` if `App.tsx` becomes unreadable
  (only if needed)

**Behavior preserved**

- Same panels mounted (may still be fully expanded until later steps).
- Boot/loading/error paths.
- Store wiring, URL sync subscription, assembly/report memos.

**Behavior changed**

- Layout no longer a single endless left stack + non-sticky 360 canvas as the
  only visual hierarchy.
- Phase scaffolding title may become product-facing (“Build” / project name)
  without claiming marketing polish.

**Tests**

- Existing e2e visibility of key `data-testid`s still pass (order-independent
  queries preferred — already mostly testid-based).
- Add layout smoke if needed: viewport + gpu-select + summary testid in first
  screen (may land fully in Step 3–4).

**Exit**

- Desktop shell exists; no contract changes; T5 partially enabled (structure
  ready for sticky viewport).

---

### Step 3 — Consolidated build-result summary

**Likely files**

- `src/ui/BuildResultSummary.tsx` (**new**)
- `src/App.tsx` — pass `compatibilityReport`, `physicalReport`, price summary,
  and a compact FPS snapshot (from existing estimate helpers or thin props from
  `PerformancePanel` refactor)
- Possibly small pure helper `src/ui/buildResultSummaryModel.ts` for testability

**Summary content (minimum)**

| Field | Source |
|-------|--------|
| Compatibility overall | `CompatibilityReport.overallStatus` |
| Fit / physical overall | `PhysicalValidationReport.overallStatus` |
| FPS | Primary game resolutions min–max (or per-res chips) from existing estimate path; unavailable stays unavailable |
| Price | Total + partial flag from `BuildPriceSummary` |
| Pilot badge (optional one line) | `disclosureReport.isPilotBuild` — product wording, not contract dump |

**Behavior preserved**

- Underlying reports unchanged; full panels still available (detail steps).

**Behavior changed**

- User sees four primary statuses without scrolling the entire page (with Step 2 layout).

**Tests**

- Unit: pure summary model mapping (overall statuses, partial price, unavailable FPS).
- E2E: summary testids update on GPU change; pilot badge toggles with non-pilot GPU.

**Exit**

- T4 (summary portion); contributes to T3.

---

### Step 4 — 3D viewport prominence and sticky behavior

**Likely files**

- `src/viewport/BuildViewport.tsx` — min-height / flex growth (keep WebGL props)
- `src/App.tsx` — sticky container (`position: sticky; top: …; align-self:
  start`) and height strategy within 1280×720
- Avoid changing `AssemblyModel` / mount resolver

**Behavior preserved**

- `data-gpu-id`, poses, assembly status hooks, OrbitControls, error boundary.

**Behavior changed**

- Larger and/or sticky viewport; remains visible during primary workflow.

**Tests**

- E2E: existing viewport attributes still asserted.
- Desktop check: T3/T5 — viewport intersects first screen and remains visible
  while summary/selectors used (Playwright bounding box helpers acceptable).

**Exit**

- T3 (viewport part), T5.

**Risk note**

- Sticky + R3F canvas can be finicky; prefer CSS sticky on a wrapper with fixed
  min-height over rewriting the Canvas tree. If sticky proves unstable, fall
  back to a non-scrolling main stage (controls scroll internally) — document
  the choice in the PR/commit body.

---

### Step 5 — Progressive disclosure for evidence and physical diagnostics

**Likely files**

- `src/ui/EvidenceDisclosurePanel.tsx` — default collapsed; summary line for
  pilot active/inactive
- `src/ui/PhysicalValidationPanel.tsx` — overall visible; checks list in
  `<details>` closed by default
- `src/ui/CoolingEvidencePanel.tsx` — collapse detail; one-line status
- `e2e/phase3-physical-validation.spec.ts`, `e2e/phase4-pilot-evidence.spec.ts`
  — open disclosure before asserting inner nodes **or** assert attributes on
  roots that remain always mounted

**Behavior preserved**

- All data still rendered in DOM when expanded (or always mounted but hidden
  via `details` — prefer always-mounted for simpler tests).
- Pilot binding rules, non-pilot copy, geometry join data, cooling unavailable.

**Behavior changed**

- Default surface no longer shows multi-kilopixel evidence/physical dumps (T6, T7).

**Tests**

- Update e2e to `locator('details').click()` / `getByRole` as needed.
- Keep `data-pilot-active`, overall status attributes on always-visible roots.

**Exit**

- T6, T7; evidence height on default surface dramatically reduced.

---

### Step 6 — Deduplicate repeated domain information

**Likely files**

- `src/ui/PerformancePanel.tsx` — when sidecar bound, do not re-list full
  source digests if evidence panel already owns detail; show FPS + confidence
  on primary, move digests to disclosure
- `src/ui/PhysicalValidationPanel.tsx` — remove always-on full `prov4 geometry
  join` list if evidence disclosure owns it (keep overall + optional one-line
  grade)
- `src/ui/EvidenceDisclosurePanel.tsx` — single place for geometry/perf/cooling
  provenance detail
- `src/ui/CoolingEvidencePanel.tsx` — avoid triple unavailable essays

**Behavior preserved**

- Data availability; user can still reach every prior field via disclosure.

**Behavior changed**

- Default surface shows each domain **once** at summary fidelity (T8).

**Tests**

- E2E: still find FPS ranges and cooling unavailable reason (location may move).
- Optional unit snapshot of “default visible text” not required.

**Exit**

- T8.

---

### Step 7 — Product-facing labels on the primary surface

**Likely files**

- Panel headings/strings in `src/ui/*.tsx`, `src/App.tsx`
- `index.html` title → product-oriented (e.g. `pb3` / `PC Builder`) without
  fake marketing

**Examples (illustrative, not copy-locked)**

| Before (dev) | After (product default) |
|--------------|-------------------------|
| Performance (perf1 engine) | Performance |
| Evidence disclosure (prov4) | Evidence details |
| Pilot prov4 sidecar overlay active… | Pilot evidence active (short) |
| `[clearance] checkId: status` | Humanized check title + status (keep id in detail) |

**Behavior preserved**

- Technical identifiers remain in disclosed diagnostics and `data-testid`s.

**Behavior changed**

- Primary labels readable to a non-agent user.

**Tests**

- Prefer testids over visible string locks (existing style). Update any string-
  locked asserts if present.

**Exit**

- Audit P2 language finding addressed on default surface.

---

### Step 8 — Deterministic UI and E2E coverage

**Likely files**

- `e2e/exit-scenario.spec.ts`
- `e2e/phase2-compat-price.spec.ts`
- `e2e/phase3-physical-validation.spec.ts`
- `e2e/phase4-pilot-evidence.spec.ts`
- New: `e2e/product-ux-shell.spec.ts` (optional but recommended) for T3/T4/T9/T10
- `src/test/*` for pure summary helpers

**Behavior preserved**

- Phase 0–4 functional assertions in spirit.

**Behavior changed**

- Tests know about summary + collapsed details.

**Tests**

- `pnpm test:all` green (T11).

**Exit**

- Regression gate green; new shell coverage present for acceptance targets.

---

### Step 9 — Desktop walkthrough and owner closeout

**Likely files**

- `docs/corrections/product-ux-1/TODO.md` — checkboxes
- `STATUS.md` — corrective gate closed (only after owner PASS)
- Optional keepsake screenshots under `docs/corrections/product-ux-1/keepsake/`
  (if owner wants; not required for software green)

**Walkthrough script (minimum)**

1. Open app at 1280×720.
2. Confirm readable theme (T1–T2).
3. Confirm selectors + viewport + summary without scroll (T3).
4. Change GPU 4070 → 4080: URL, 3D, summary, pilot off (T4, T9, T10).
5. Expand evidence details; collapse again (T6–T7).
6. Scroll/primary workflow with viewport still visible (T5).
7. Confirm no duplicate default domain blocks (T8).
8. `pnpm test:all` + `pnpm build`.

**Exit**

- Owner UX PASS recorded; implementation items in TODO closed; **still** no
  Phase 4 Step 9 claim and no Phase 5 start.

---

## 7. Suggested file touch map (summary)

| Area | Paths |
|------|--------|
| Shell / theme | `index.html`, `src/main.tsx`, `src/App.tsx`, optional `src/styles/*.css` |
| Summary | `src/ui/BuildResultSummary.tsx` (+ optional pure helper) |
| Panels | `src/ui/EvidenceDisclosurePanel.tsx`, `PhysicalValidationPanel.tsx`, `PerformancePanel.tsx`, `CoolingEvidencePanel.tsx`, `PriceSummaryPanel.tsx`, `CompatibilityPanel.tsx`, `BuildSummary.tsx`, `MountControls.tsx` |
| Viewport | `src/viewport/BuildViewport.tsx` |
| Tests | `src/test/*`, `e2e/*` |
| Docs closeout | this folder + `STATUS.md` |
| **Do not touch** | `src/contract/*`, `benchmarks/**`, `parts/**` (unless a test-only path requires nothing — default **no fixture edits**), provenance pure engines except UI call sites |

---

## 8. Open decisions (owner)

These do not block **package review**, but should be resolved before or at
implementation start:

| ID | Decision | Options | Recommendation |
|----|----------|---------|----------------|
| O1 | Theme strategy | **A.** Fixed light app surface (readable under dark OS) · **B.** Explicit light/dark toggle · **C.** `prefers-color-scheme` auto | **A** for M0 (smallest) |
| O2 | Viewport persistence | **A.** CSS `position: sticky` on right column · **B.** Non-scrolling stage with internal scroll on controls only | **A**, fall back to **B** if Canvas issues |
| O3 | Filters on first screen | **A.** Always visible · **B.** Collapsed `<details>` to free vertical space for T3 | **B** if T3 fails with A |
| O4 | FPS in summary | **A.** Three resolution chips · **B.** Single “primary” resolution (e.g. 1440p) + link to detail | **A** (matches current product data) |
| O5 | Global CSS file | **A.** Inline only · **B.** One small `app-shell.css` | **B** if theme tokens need one place; still no design system |

---

## 9. Explicit non-goals

- Phase 5 planning or implementation
- Phase 4 Step 9 evidence-quality PASS
- Contract version changes or inventory expansion
- Design system / component library adoption
- Backend, auth, live pricing, real benchmark collection
- Visual mesh authoring quality upgrade
- Mobile-first layout (may not break narrow widths, but not a gate)

---

## 10. GO / NO-GO for this plan package

| Check | Status |
|-------|--------|
| Audit evidence-based at `e73602a` | Yes |
| Scope bounded to product surface | Yes |
| Engines/contracts preserved by design | Yes |
| Implementation authorized | **No** |
| Owner package acceptance | **Pending** |

**Recommendation to owner:** **GO for review and acceptance of this planning
package.** **NO-GO for implementation** until acceptance + explicit start.

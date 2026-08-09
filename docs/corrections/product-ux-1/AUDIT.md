# Product UX audit — verified against live checkout

| Field | Value |
|-------|--------|
| Audit date | 2026-08-09 |
| Baseline commit | **`e73602a`** (HEAD `main` / `origin/main` at audit time) |
| Method | Source inspection + Playwright headless Chromium at **1280×720** against `pnpm dev` (`http://localhost:5173/`) |
| Color schemes probed | `prefers-color-scheme: dark` and `light` |
| Peer prior signal | Shared-memory note from Nox (2026-08-09) — directionally confirmed; absolute heights re-measured below |
| Scope of audit | Product surface / information architecture only |

## Functional correctness vs product usability

| Layer | Verdict |
|-------|---------|
| Engines / contracts / fixtures | **Working as designed** — not the defect under this gate |
| GPU selection → 3D swap | **PASS** (`data-gpu-id` updates; assembly canvas present) |
| Canonical `vs2` URL sync | **PASS** — full encode on load and on GPU change |
| Pilot evidence isolation | **PASS** — non-pilot GPU (`gpu.rtx4080`) sets pilot overlay inactive; non-pilot copy shown; sidecar badge absent |
| Automated regression baseline (pre-task) | Reported green at Phase 4 Steps 1–8 software gate (unit 171 / e2e 9); this audit did not re-run the full suite |
| Product UX / primary journey | **FAIL** — surface not ready for a builder-centered product walkthrough |

This audit does **not** reopen Phase 0–4 architecture. It documents surface
defects that block treating the SPA as a product UI.

---

## Measurement summary (1280×720, dark host media)

| Surface | Measured |
|---------|----------|
| Viewport size | 1280 × 720 (client) |
| Document `scrollHeight` | **6312 px** |
| `body` scroll height | **6296 px** |
| Left control/result column (`section` of selectors + panels) | **538 × 6183 px** |
| 3D canvas (`[data-testid="build-viewport"]`) | **538 × 360 px**, top ≈ 132 px, `position: static` |
| Right viewport section height (grid row stretch) | **6183 px** (column tall; canvas itself remains 360 px) |
| `EvidenceDisclosurePanel` | **≈ 1733 px** tall |
| `PhysicalValidationPanel` | **≈ 1106 px** tall |
| `PerformancePanel` | **≈ 1135 px** tall |
| `CoolingEvidencePanel` | **≈ 359 px** tall |
| `PriceSummaryPanel` | **≈ 286 px** tall |
| `CompatibilityPanel` | **≈ 212 px** tall |
| Layout | CSS grid `538px 538px` inside `max-width: 1100px` main |
| First screen without scroll | Case/GPU selectors + 3D viewport **visible**; build summary, compatibility, price, performance, evidence, physical **not** in first 720 px |
| Page background | `html` / `body` / `#root` / `main` → `background-color: rgba(0,0,0,0)` (**transparent**) |
| Default text color | `color: rgb(0, 0, 0)` on `html`/`body`/`main`/`h1` (light and dark media) |
| Global CSS | **None** — no app stylesheet; `index.html` sets no `body` background; styles are inline only |
| Document title vs H1 | title still `pb3 — Phase 0`; H1 `pb3 — Phase 4 build` |

### Functional checks re-verified live

| Check | Result |
|-------|--------|
| Default GPU | `gpu.rtx4070` (pilot build) |
| Switch to `gpu.rtx4080` | Viewport `data-gpu-id` → `gpu.rtx4080`; URL `gpu=` updates under `v=vs2` |
| Pilot after non-pilot GPU | `data-pilot-active="false"`; `[data-testid="evidence-non-pilot"]` present; no `perf-sidecar-active` |
| Restore `gpu.rtx4070` | `data-pilot-active="true"`; sidecar badge returns |

### Source layout (authoritative order)

From `src/App.tsx` left column (sequential):

1. `PartFilterControls`
2. Part selectors (case → motherboard → cpu → gpu → cooler → ram → psu)
3. `MountControls`
4. `BuildSummary`
5. `CompatibilityPanel`
6. `EvidenceDisclosurePanel` (fully expanded)
7. `PhysicalValidationPanel` (all checks expanded)
8. `CoolingEvidencePanel`
9. `PriceSummaryPanel`
10. `PerformancePanel` (last)

Right column: heading + `BuildViewport` (fixed height 360 px).

---

## Findings by severity

### P0 — Readability / theme failure

**Observed behavior**

- No global theme or page surface color. The SPA depends on the host (browser
  chrome / system / embedder) to supply background contrast.
- Text defaults to black (`rgb(0,0,0)`). In a dark host context this yields
  black-on-dark or black-on-near-black content for all non-canvas UI.
- The 3D canvas sets its own dark background (`#111` / `#1a1a1a`) and remains
  readable; surrounding panels do not.

**Evidence**

- Live computed styles (dark and light media): transparent backgrounds on
  `html`, `body`, `#root`, `main`; text `rgb(0,0,0)`.
- Source: `index.html` has no CSS; `src/main.tsx` mounts React only; `App.tsx`
  `styles.main` sets font/margin/maxWidth/padding only — no background/color.

**Affected surfaces**

- Entire product chrome outside the R3F canvas.

**User impact**

- Primary builder UI can be unreadable without relying on accidental host
  defaults (often a white browser content area). Dark OS / forced dark mode /
  some preview shells break legibility.

**Corrective direction**

- Own page background + text colors for the app shell (light product theme is
  enough for M0; optional explicit dark theme later).
- Do not depend on transparent document background.
- Keep canvas colors as-is unless they conflict with the shell.

**Explicit non-goals**

- Design-system package, token platform, or multi-brand theming.
- Pixel-perfect marketing polish.

---

### P1 — Excessive vertical structure and poor information hierarchy

**Observed behavior**

- At 1280×720 the document is ~**8.8×** the viewport height (~6312 / 720).
- Left column alone is ~**6183 px** tall — a single vertical stack of every
  selector and every result panel.
- Primary outcomes (compatibility overall, fit overall, FPS ranges, price) are
  scattered: compatibility mid-stack, performance at the **bottom**, price just
  above performance, physical/evidence occupying ~2.8k px between them.

**Evidence**

- Live heights table above; `controlChildren` sequence and per-panel heights.
- `App.tsx` mounts all panels expanded in one `styles.controls` section.

**Affected surfaces**

- `App.tsx` layout; all `src/ui/*Panel.tsx` default expansion behavior.

**User impact**

- Cannot see “does this build work, fit, and perform, and what does it cost?”
  without long scrolling.
- Builder loop (change part → read outcome) is high friction.

**Corrective direction**

- Builder-centered shell: selectors + compact result summary + 3D in the first
  screen.
- Collapse diagnostics by default; keep full data behind disclosure.

**Explicit non-goals**

- Removing engines or panels from the product entirely.
- Mobile-first redesign (desktop first; 1280×720 required).

---

### P1 — 3D viewport not functioning as the product center

**Observed behavior**

- Canvas is a fixed **360 px** tall box in the right grid cell.
- Neither the canvas nor the viewport section is sticky (`position: static`).
- As the user scrolls the left column’s ~6k px of content, the 3D view scrolls
  away with the page; the right column is tall only because of grid stretch,
  not because the assembly stays in view.
- Title hierarchy presents a phase label (`pb3 — Phase 4 build`) rather than a
  product builder frame centered on the assembly.

**Evidence**

- Live: viewport **538×360**, sticky positions `static`.
- Source: `BuildViewport.tsx` hardcodes `height: "360px"`; `App.tsx` two-column
  grid without sticky/overflow strategy.

**Affected surfaces**

- `src/viewport/BuildViewport.tsx`, `src/App.tsx` layout.

**User impact**

- Physical assembly — a charter differentiator — is a small side panel rather
  than the visual center of the builder workflow.

**Corrective direction**

- Make the viewport prominent (larger min size and/or sticky within the desktop
  shell) so it remains visible while the user adjusts parts and scans primary
  results.
- Keep OrbitControls and existing assembly pose pipeline unchanged.

**Explicit non-goals**

- New 3D engines, animations, RGB, or mount-graph redesign.
- Changing GLB assets or phys3 collision math.

---

### P1 — Internal evidence / contract details dominating the primary UI

**Observed behavior**

- Default UI surfaces contract and implementation language: `prov4`, `perf1
  engine`, `phys3EvidenceSourceId`, `metricKind`, `dataVersion`, raw check IDs
  (`[clearance] checkId: status`), `evidenceSourceId`, source class lists, etc.
- `EvidenceDisclosurePanel` alone is ~**1733 px** and is fully expanded for
  pilot builds (performance + geometry + cooling + limitations).
- `PhysicalValidationPanel` lists every check with kind/checkId (~**1106 px**).
- Page chrome still mixes phase scaffolding titles (`Phase 0` document title,
  `Phase 4 build` H1).

**Evidence**

- Live panel heights; body text scan: `prov4` ×8, `perf1` ×3, geometry/Experimental-related hits ×27, checkId-style tokens ×28.
- Source: `EvidenceDisclosurePanel.tsx`, `PhysicalValidationPanel.tsx`,
  `PerformancePanel.tsx` (sidecar detail always shown when bound),
  `CoolingEvidencePanel.tsx`.

**Affected surfaces**

- Evidence, physical, performance, cooling panels; App title/chrome.

**User impact**

- Primary journey reads as an internal debug console for Phase 4, not a PC
  builder product.
- Trustworthy evidence still matters — but as progressive disclosure, not the
  default wall of text.

**Corrective direction**

- Product-facing labels on the default surface (Compatibility, Fit, FPS range,
  Price, Evidence details…).
- Keep raw IDs, digests, join keys, and full check lists under explicit
  `<details>` / secondary sections.
- Preserve all pilot binding behavior and `data-testid` hooks required by E2E
  (tests may need updates when structure changes — plan step, not this audit).

**Explicit non-goals**

- Deleting provenance data or weakening pilot non-carry rules.
- Hiding that estimates are stub/experimental when that disclosure is required
  for honesty — summarize, don’t invent certainty.

---

### P2 — Duplicated performance, geometry, and cooling information

**Observed behavior**

On the default (fully expanded) surface, the same domains appear in multiple
panels:

| Domain | Appears in |
|--------|------------|
| Performance FPS / confidence / basis | `PerformancePanel` rows **and** `EvidenceDisclosurePanel` performance bindings (pilot) |
| Geometry grade / join / Experimental | `PhysicalValidationPanel` provenance block **and** `EvidenceDisclosurePanel` geometry list |
| Cooling unavailable | `CoolingEvidencePanel` **and** evidence cooling section **and** performance correction copy |

**Evidence**

- Live duplicate-scan counts (order-of-magnitude signal, not a product KPI).
- Source panel composition in `App.tsx` + each panel’s full default render.

**User impact**

- Extra vertical cost and cognitive noise; user must reconcile three “sources of
  truth” that are actually one engine result re-presented.

**Corrective direction**

- One compact summary per domain on the default surface.
- Full provenance/diagnostics once, under disclosure.
- Cross-links (“See evidence details”) rather than re-printing full rows.

**Explicit non-goals**

- Merging `perf1` / `phys3` / `prov4` contracts.
- Removing cooling unavailable honesty.

---

### P2 — Development-facing product language and missing primary user journey

**Observed behavior**

- Headings: “Performance (perf1 engine)”, “Evidence disclosure (prov4)”,
  “prov4 geometry join”, “Pilot prov4 sidecar overlay active…”.
- Physical checks shown as `[kind] checkId: status` rather than short human
  outcomes.
- No single “build health” summary that answers: compatible? fits? FPS? price?
- First-screen content prioritizes filters + seven selectors; outcomes are far
  below.

**Evidence**

- Source strings in UI components; first-screen visibility map (selectors +
  viewport only).

**User impact**

- The app still communicates like a phase demo harness. The charter’s end-state
  builder loop is not the default path.

**Corrective direction**

- Define a primary journey: select parts → see summary (compat / fit / FPS /
  price) → inspect 3D → open details only when needed.
- Rename default labels; keep technical strings in disclosed diagnostics.

**Explicit non-goals**

- Marketing copywriting pass, localization, or design-system typography scale.
- Changing estimate honesty rules (ranges + confidence + unavailable).

---

## What is working (do not “fix” away)

| Behavior | Status | Preserve |
|----------|--------|----------|
| Part catalog load + filters | OK | Yes |
| Seven-category selection | OK | Yes |
| `vs2` full encode / lenient decode URL | OK | Yes |
| Compatibility engine + panel data | OK | Yes (presentation only) |
| Price aggregation + partial labeling | OK | Yes |
| Assembled 3D poses + GPU mesh swap | OK | Yes |
| Mount controls (cooler orientation) | OK | Yes |
| Physical validation report generation | OK | Yes (collapse detail) |
| Performance ranges + correction withhold | OK | Yes |
| Pilot-only `prov4` sidecar / disclosure | OK | Yes (collapse detail) |
| Non-pilot: evidence does not carry over | OK | Yes |
| Fixture SSOT `/parts` + `/benchmarks` | OK | Yes |

---

## Measurement notes / variance

- A prior peer audit reported ~5829 px document height, ~5704 px left column,
  ~1552 px evidence, ~1013 px physical. This re-audit measured **higher**
  absolute heights (6312 / 6183 / 1733 / 1106) at the same viewport width with
  the same structural layout. Variance is consistent with font metrics, content
  wrapping, and pilot disclosure fullness; **severity ranking is unchanged**.
- Screenshots captured during audit (local only, not committed):  
  `/tmp/pb3-ux-audit-1280x720-full.png`, `/tmp/pb3-ux-audit-first-screen.png`.

---

## Audit conclusion

| Question | Answer |
|----------|--------|
| Are Phase 0–4 engines shippable as internal tech? | Largely yes (software path). |
| Is the default UI a coherent product builder? | **No.** |
| Required next step | Owner review of this corrective package — **not** Phase 5 planning, **not** evidence expansion, **not** inventory growth. |
| Implementation from this audit alone? | **No** — docs package acceptance + separate start instruction required. |

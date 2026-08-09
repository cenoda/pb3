# Product UX M0 — gate checklist

Work id: `product-ux-1`  
Baseline: **`e73602a`**  
Kind: corrective product surface (not Phase 5)

Legend: `[ ]` open · `[x]` done  
**Do not mark implementation items complete until implementation is authorized
and verified.**

---

## M0 — documentation acceptance

- [x] Live inspection of application UI at baseline `e73602a`
- [x] Verified audit written (`AUDIT.md`)
- [x] Corrective plan drafted (`corrective_plan.md`)
- [x] This gate checklist created
- [x] Minimal status/index pointers updated (`STATUS.md`, roadmap, corrections index)
- [x] **Owner accepts** this planning package (README + AUDIT + TODO + plan)
      (2026-08-09)
- [x] Open decisions O1–O5: owner-preferred defaults recorded for start
      (A / A-with-B-fallback / conditional B / A / B) — see plan §8

## Authorization (separate from package acceptance)

- [x] Owner issues a **separate explicit implementation-start** instruction
      (2026-08-09)
- [x] Implementation branch/work starts only after the above
- [x] No Phase 5 scope opened under this gate
- [x] Phase 4 Step 9 evidence-quality closeout **not** claimed by this work

---

## Implementation gates (blocked until authorization)

### Theme / readability

- [x] Global readable theme (owned page background + text colors)
- [x] No transparent page background dependency
- [x] Text readable in light host context
- [x] Text readable in dark host context (or explicit app light surface that remains readable under dark OS chrome)

### Information architecture

- [x] Builder-centered shell (selectors + summary + 3D as primary)
- [x] Compact result summary for **compatibility**, **fit**, **FPS**, **price**
- [x] Progressive disclosure for provenance / evidence details
- [x] Progressive disclosure for physical collision/clearance diagnostics
- [x] Removal of duplicate performance / geometry / cooling blocks on the **default** surface
- [x] Product-facing labels on the primary surface (contract IDs not default chrome)

### 3D viewport

- [x] Prominent 3D viewport (product center, not a small afterthought)
- [x] Sticky or otherwise persistently visible viewport during primary builder workflow (desktop)
- [x] Existing assembly / GPU swap behavior preserved

### Verification

- [x] Desktop viewport verification at **1280×720** (required)
- [x] Selectors + 3D + primary result summary co-visible without scrolling at 1280×720
- [x] GPU change immediately reflects in summary (compat / fit / FPS / price) and 3D
- [x] Canonical `vs2` URL behavior unchanged
- [x] Pilot evidence never carries into non-pilot builds
- [x] Existing Phase 0–4 unit + E2E regression green (`pnpm test:all`)
- [x] Deterministic UI/E2E coverage updated for new shell/summary/disclosure as needed
- [ ] Owner UX walkthrough PASS
- [ ] Final corrective closeout + status truth-sync

---

## Explicit non-goals (checklist reminders)

- [x] ~~Expand part / game / preset / workload inventory~~ — **out**
- [x] ~~Bump or widen `vs0` / `perf1` / `vs2` / `compat2` / `phys3` / `prov4`~~ — **out**
- [x] ~~Add design-system dependency~~ — **out** unless later amendment
- [x] ~~Start Phase 5~~ — **out**
- [x] ~~Close Phase 4 Step 9 via UX work~~ — **out** (separate owner PASS)

---

## Closeout record (fill only at end)

| Item | Value |
|------|--------|
| Package accepted (date) | **2026-08-09** (owner) |
| Implementation start authorized (date) | **2026-08-09** (owner) |
| Initial implementation commit | `c7d300e` |
| Corrective review fixes commit | _pending owner commit_ |
| `pnpm test:all` | **PASS** — unit 173 + e2e 14 (2026-08-09) |
| 1280×720 walkthrough | **Software PASS** via `e2e/product-ux-shell.spec.ts` (T1–T7/T9/T10) |
| Owner UX PASS | _pending_ |

### Locked O1–O5 (as implemented)

| ID | Choice | Notes |
|----|--------|-------|
| O1 | **A** fixed light app surface | `src/styles/app-shell.css` |
| O2 | **A** sticky viewport | `position: sticky` on viewport column |
| O3 | **B** filters collapsed | T3 failed with A; filters under `<details>` |
| O4 | **A** three FPS chips | `BuildResultSummary` |
| O5 | **B** small `app-shell.css` | no design system |

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
- [ ] **Owner accepts** this planning package (README + AUDIT + TODO + plan)
- [ ] Open decisions in `corrective_plan.md` § Open decisions resolved or deferred in writing by owner

## Authorization (separate from package acceptance)

- [ ] Owner issues a **separate explicit implementation-start** instruction
- [ ] Implementation branch/work starts only after the above
- [ ] No Phase 5 scope opened under this gate
- [ ] Phase 4 Step 9 evidence-quality closeout **not** claimed by this work

---

## Implementation gates (blocked until authorization)

### Theme / readability

- [ ] Global readable theme (owned page background + text colors)
- [ ] No transparent page background dependency
- [ ] Text readable in light host context
- [ ] Text readable in dark host context (or explicit app light surface that remains readable under dark OS chrome)

### Information architecture

- [ ] Builder-centered shell (selectors + summary + 3D as primary)
- [ ] Compact result summary for **compatibility**, **fit**, **FPS**, **price**
- [ ] Progressive disclosure for provenance / evidence details
- [ ] Progressive disclosure for physical collision/clearance diagnostics
- [ ] Removal of duplicate performance / geometry / cooling blocks on the **default** surface
- [ ] Product-facing labels on the primary surface (contract IDs not default chrome)

### 3D viewport

- [ ] Prominent 3D viewport (product center, not a small afterthought)
- [ ] Sticky or otherwise persistently visible viewport during primary builder workflow (desktop)
- [ ] Existing assembly / GPU swap behavior preserved

### Verification

- [ ] Desktop viewport verification at **1280×720** (required)
- [ ] Selectors + 3D + primary result summary co-visible without scrolling at 1280×720
- [ ] GPU change immediately reflects in summary (compat / fit / FPS / price) and 3D
- [ ] Canonical `vs2` URL behavior unchanged
- [ ] Pilot evidence never carries into non-pilot builds
- [ ] Existing Phase 0–4 unit + E2E regression green (`pnpm test:all`)
- [ ] Deterministic UI/E2E coverage updated for new shell/summary/disclosure as needed
- [ ] Owner UX walkthrough PASS
- [ ] Final corrective closeout + status truth-sync

---

## Explicit non-goals (checklist reminders)

- [ ] ~~Expand part / game / preset / workload inventory~~ — **out**
- [ ] ~~Bump or widen `vs0` / `perf1` / `vs2` / `compat2` / `phys3` / `prov4`~~ — **out**
- [ ] ~~Add design-system dependency~~ — **out** unless later amendment
- [ ] ~~Start Phase 5~~ — **out**
- [ ] ~~Close Phase 4 Step 9 via UX work~~ — **out** (separate owner PASS)

---

## Closeout record (fill only at end)

| Item | Value |
|------|--------|
| Package accepted (date) | _pending_ |
| Implementation start authorized (date) | _pending_ |
| Implementation complete commit | _pending_ |
| `pnpm test:all` | _pending_ |
| 1280×720 walkthrough | _pending_ |
| Owner UX PASS | _pending_ |

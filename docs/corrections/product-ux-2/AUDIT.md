# Product UX audit 2 (`product-ux-2`) — first-time-user walkthrough

| Field | Value |
|-------|-------|
| Audit date | 2026-08-09 |
| Baseline commit | **`095f551`** (`main`, clean tree) |
| Build under test | `pnpm build` → `vite preview` at `http://127.0.0.1:4173` (production bundle, `dist/parts`, `dist/benchmarks`) |
| Driver | Playwright headless Chromium, viewports 1280×720 / 1440×900 / 1920×1080 |
| Scope | Product surface, information architecture, primary journey. **No code changed.** |
| Relationship to `product-ux-1` | That gate delivered the app shell (light surface, one-screen collapsed layout, domain panels collapsed). Its gains hold. This audit judges the surface against the **product question**, not the shell question. |
| Screenshots | [`screenshots/`](./screenshots/) |

## The question being judged

> Can a person who has never seen this app select parts, understand whether they
> fit, understand the performance and price result, know how much to trust it,
> and share the build — without an explanation?

**Verdict: FAIL.** The shell is clean and the engines are wired, but the surface
still answers *engine* questions, not *user* questions. Two defects are
disqualifying on their own: an impossible build is presented with a confident
FPS number (S1-1), and the app has no share affordance at all (S1-3).

## What was actually exercised

| Step | Observation |
|------|-------------|
| Open `/` with no query string | Boots to a complete, valid, pre-selected build; URL is rewritten to the canonical `?v=vs2&…` link. Collapsed page height 916 px vs 900 px viewport — effectively one screen. |
| Read the first screen | `Filters` · `Parts` (7 selects) · `Build results` (Compatibility / Fit / FPS / Price / "Pilot evidence active") · 9 collapsed disclosures · `Assembly` canvas. |
| Change GPU 4070 → 4080 | Summary, URL, and 3D all update. Pilot badge disappears with no explanation. |
| Change Case to Micro-ATX (breaks the build) | Compatibility → `incompatible`, Fit → `unavailable`, canvas → black with a red engineer sentence, **FPS → 125–145 / 90–108 / 50–62 (higher than before)**, Price → USD 1733. No warning, no reason, no fix suggestion. |
| Open every disclosure | Page grows to 4188 px. Raw part IDs, `coverage:` ids, `phys3-exp-20260808`, `confidence: stub`, contract name `prov4`, an 8-bullet limitations list, and a free-text `Evidence source id` field are all in the same flat stack as user-facing content. |
| Look for share / reset / build name | None. Only `Reset filters`, `Reset to auto` (mount), `Clear correction` — all internal. |

### Measurements

| Viewport | 3D canvas | Canvas share of screen | `main` width | Doc height (collapsed) |
|----------|-----------|------------------------|--------------|------------------------|
| 1280×720 | 641×380 @ top 77 | 26.4 % | 1280 (capped) | 916 |
| 1440×900 | 641×468 @ top 77 | 23.1 % | 1280 (capped) | 916 |
| 1920×1080 | 641×480 @ top 77 | **14.8 %** | 1280 (capped) | 1080 |

Tab order (1280×720): `Filters` → 7 part selects → `Mount controls` → `Build parts list` → domain disclosures. The 3D canvas is **not** in the tab order.

---

## Findings by severity

### S1 — blocks a first-time user, or misleads them

**S1-1 · An impossible build still reports confident FPS.**
`src/ui/computeFpsSummaryChips.ts` never consults the compatibility or fit
report; `src/ui/BuildResultSummary.tsx:39-56` renders the chips unconditionally.
With `case.micro-atx-mini-01` + `mb.atx-b650-01` the build cannot be assembled,
yet the summary reads `1080p 125–145`. Worse, the number *rose* from the valid
build (80–95), so the failing state looks like an upgrade. A newcomer reads this
as "broken but faster". Performance and price must be suppressed, or explicitly
labelled as not achievable, when the build cannot be built.

**S1-2 · A failure verdict carries no reason and no next action.**
The summary prints the bare tokens `incompatible` and `unavailable`. The actual
cause — "Motherboard `mb.atx-b650-01` is ATX; case `case.micro-atx-mini-01`
supports Micro-ATX only" — sits inside `Compatibility details` → `Show
compatibility checks`, two clicks away, written with raw part IDs. Nothing tells
the user which of the two parts to change.

**S1-3 · The build cannot be shared from the UI.**
`replaceUrlWithBuildState` keeps a canonical, complete link in the address bar,
so the capability exists — but there is no Share button, no copy-link, no build
name, and nothing in the header that hints the URL *is* the build. The charter
success criterion "can the build be shared" is currently met only by a user who
already knows to copy the address bar.

**S1-4 · The FPS numbers have no game or settings context.**
Three chips labelled `1080p` / `1440p` / `4K`. The game (`Cyberpunk 2077`) and
preset (`Ultra (raster, no upscaling)`) appear only inside the `Build parts
list` disclosure, and are not selectable anywhere. A first-time user cannot tell
what the numbers are FPS *of*, and cannot ask about the game they care about.

**S1-5 · No trust signal at the product level; the one trust-ish string is jargon.**
Every fixture row is `confidence: "stub"`, and the summary communicates none of
that. The only line resembling a trust cue is `Pilot evidence active`
(`BuildResultSummary.tsx:71-79`), which is internal vocabulary, appears and
disappears when the GPU changes, and is never explained. The user's fifth
question — "how much can I trust this?" — is unanswered on the primary surface
while raw provenance sits collapsed below.

**S1-6 · The 3D failure state is a developer message.**
`src/viewport/BuildViewport.tsx:109` renders a black panel with red text
"Physical assembly unavailable — no mounted poses." This is the *first* thing a
newcomer sees after their first mistake. It states an internal condition, gives
no cause, and offers no way back.

### S2 — major friction; the flow works but is not a product flow

**S2-1 · Two different vocabularies for one failure.** Compatibility says
`incompatible` (a verdict); Fit says `unavailable` (an absence of verdict), for
the same root cause. `unavailable` also reads to a layperson as "out of stock".

**S2-2 · Every part is named "(fixture)".** Seven selects, every option suffixed
`(fixture)`. The product surface reads as a test harness.

**S2-3 · The 3D view is not prominent.** Fixed 641 px column, 15–26 % of the
screen, and `main` is capped at 1280 px so a 1920-wide screen is roughly half
empty (`screenshots/05-1920x1080.png`). The differentiating feature is the
smaller half of a two-column document.

**S2-4 · User disclosure and internal debug are not separated.** Nine sibling
`<details>` of equal visual weight: `Filters`, `Mount controls`, `Build parts
list`, `Compatibility`, `Evidence`, `Fit`, `Cooling`, `Price`, `Performance`.
Collapsing them (product-ux-1) was the right first move, but they are still the
same rank and the same list. Mount orientation, geometry data version,
`coverage:` ids, digests, freshness and contract names belong behind one
user-framed "Why this result?" affordance, not as peers of the price breakdown.

**S2-5 · No build identity and no global reset.** No build name, no "start over".
The three Reset buttons present are all engine controls.

**S2-6 · `Filters` is the first element and the first tab stop**, ahead of the
parts it filters, and with 1–2 options per category it currently has no purpose.

**S2-7 · There is no selection *flow*.** The app opens on a complete valid build,
so the user never selects anything — they only mutate a preset. There is no
notion of in-progress, no ordering, no completion. A walkthrough has no start and
no end.

### S3 — polish, correctness of tone

- **S3-1** The canvas is not focusable and not in the tab order; nothing says it can be orbited/dragged.
- **S3-2** Boot copy is internal: `Loading fixtures…`, `Failed to load fixtures: {message}`, `Initializing build state…` (`src/App.tsx:290,297,314`).
- **S3-3** No favicon — `/favicon.ico` returns 404 on every load (the only console error observed).
- **S3-4** "Static fixture prices — not live market quotes" is inside `Price details`; the primary surface shows `USD 1353` as if it were a quote.
- **S3-5** `Performance details` embeds a debug console (Upscaling, Frame generation, RAM profile, CPU/GPU power, Cooling bucket, Load profile, free-text `Evidence source id`) with no product framing.
- **S3-6** Compatibility/Fit status is conveyed by text colour alone — no icon or shape; a colour-blind user loses the distinction.

---

## What is working and must not regress

- Canonical URL encode/decode on load and on every change.
- GPU change propagates to summary, URL, pilot state, and the 3D assembly.
- Collapsed default fits one screen at 1280×720 and 1440×900.
- Owned light surface, no transparent-background bug (product-ux-1 gain).
- No invented numbers: unavailable paths stay unavailable in the engines. The
  defect in S1-1 is a *presentation* defect — the summary shows an available
  performance row for a build the compatibility engine rejects; it is not the
  perf engine inventing data.

## Recommended next gate (not started)

`Product Pass 1 M0` — plan only, no code:

1. Information architecture: user questions → surfaces; explicit "product" vs "diagnostics" split.
2. One primary scenario, written as a script a stranger can follow end to end.
3. Screen composition: header (build name / Share / Reset), left parts rail, dominant 3D viewport, result bar underneath.
4. Explicit keep/hide table for every existing panel, with the disclosure that each hidden panel moves into.
5. Bounded implementation plan. Desktop only; mobile explicitly out of scope.

Constraint carried from `docs/corrections/README.md`: presentation only. No
contract, fixture, engine, or inventory change without an explicit narrow
amendment. Phase 4 Step 9 stays closed to new evidence development.

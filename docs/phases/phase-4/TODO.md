# Phase 4 TODO

## Brief gate

- [x] Create the Phase 4 working folder.
- [x] Draft a bounded Phase 4 brief.
- [x] Owner selects the pilot path: **single-build evidence pilot**.
- [x] Owner accepts residual brief details through M0 package acceptance.

## M0 planning gate

- [x] Draft the bounded scope spec (`specs/phase-4.md`).
- [x] Draft the versioned provenance data contract
      (`specs/provenance-data-contract.md`, `prov4`).
- [x] Draft the ordered, file-level `implementation_plan.md`.
- [x] Define automated and human evidence-quality exit criteria.
- [x] Apply review FAIL remediations (three audit rounds, 2026-08-09).
- [x] Owner formally accepts O1–O4 / D1–D16 (2026-08-09).
- [x] Owner accepts the complete M0 planning package (2026-08-09).
- [x] Receive a separate explicit instruction to start implementation.

## Implementation

Owner authorized implementation start (2026-08-09). Follow
`implementation_plan.md` Steps 1–9 only.

- [x] Step 1 — `prov4` types + Zod (high gate + join key + runCount≥2)
- [x] Step 2 — Pilot constants + pure freshness/binding
- [x] Step 3 — Fixture authoring + integrity (exactly 3 perf rows)
- [x] Step 4 — Loaders
- [x] Step 5 — Performance panel pilot **sidecar** overlay
- [x] Step 6 — Physical / cooling disclosure extensions
- [x] Step 7 — Evidence disclosure panel
- [x] Step 8 — Unit / E2E / build regression gate
- [ ] Step 9 — Evidence-quality closeout (owner review on 2026-08-09: **FAIL / blocked**)

## Software gate notes (2026-08-09)

- `pnpm test` — **25 files, 171 tests PASS**
- `pnpm test:e2e` — **9 tests PASS** (Phase 0+2+3+4)
- `pnpm test:all` + `pnpm build` — PASS; `dist/benchmarks/prov4` present
- Pilot performance: 1080p `first-party-measured` medium (`runCount: 2`);
  1440p/4k `synthetic-stub`; no `"high"` claim yet (verification empty)
- Geometry: 7 Experimental joins via `phys3EvidenceSourceId`
- Cooling: empty production rows → structured unavailable
- Evidence review: the recorded SHA-256 and byte length match, but
  `raw/pilot-1080p-capture.json` is a 1,362-byte derived summary introduced in
  the implementation commit, not independently inspectable PresentMon raw
  output. File integrity alone does not establish capture authenticity.
- Closeout remediation: retain the honest `medium` claim, but provide an
  authentic raw capture export (or equivalent independently inspectable run
  artifact) tied to the two runs and documented capture conditions, then
  repeat owner evidence-quality review.

## Explicitly not started / out of M0

- New dependencies or external services.
- Real-hardware asset acquisition or redistribution.
- Catalog / game / preset expansion.
- Full 96-cell remeasurement; Cinebench pilot cells.
- Phase 4 closeout claim without owner evidence-quality PASS.

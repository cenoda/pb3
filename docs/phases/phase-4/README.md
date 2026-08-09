# Phase 4 — Evidence-grade data and validation

Working area for the first phase after the Phase 0–3 technical baseline.

**Status: external-evidence pipeline shipped; Step 9 still open (2026-08-09).**
Original Steps 1–8 ran; invalid first-party claim was removed; corrective
[`../../corrections/phase4-external-evidence-1/`](../../corrections/phase4-external-evidence-1/)
Steps 1–5 are on `main` (`6f0a306`). Independent source investigation
([`SOURCE_INGESTION_INVESTIGATION.md`](./SOURCE_INGESTION_INVESTIGATION.md))
found **no defensible exact-match public FPS** for pilot `cpu.zen4-7600` from
Tier A/B review benches (flagship CPUs only). Product external FPS remains
empty by design until owner Step 9 path is chosen.

Owner-selected pilot path: **single-build evidence pilot** (see
[`BRIEF.md`](./BRIEF.md) and [`specs/phase-4.md`](./specs/phase-4.md)).

**Sub-path (not a closeout substitute):** combination prediction beyond exact
match is discussed under [`../phase-4.1/`](../phase-4.1/) (manufacturer-primary
estimator; discussion only).

## Layout

```text
docs/phases/phase-4/
  README.md                 ← phase entry point and gate status
  BRIEF.md                  ← direction brief (pilot path selected)
  TODO.md                   ← planning / acceptance checklist
  implementation_plan.md    ← ordered file-level plan (accepted)
  SOURCE_INGESTION_INVESTIGATION.md  ← external source exact-key research (2026-08-09)
  specs/
    phase-4.md              ← scope lock (accepted)
    provenance-data-contract.md  ← prov4 types (accepted)
```

## Gates

### Brief / pilot path

- [x] Phase 4 working folder created
- [x] Brief drafted
- [x] Owner selected pilot path: **single-build evidence pilot**
- [x] Owner accepted residual brief details via M0 package acceptance

### M0 planning gate

- [x] Bounded scope spec
- [x] Versioned provenance data contract (`prov4`)
- [x] Ordered `implementation_plan.md`
- [x] Automated + human evidence-quality exit criteria
- [x] Review FAIL remediations (high gate, join, 3-cell, sidecar, asOf,
      charter metrics, raw artifact digest, first-party `runCount >= 2`)
- [x] Owner accepted O1–O4 / D1–D16 (2026-08-09)
- [x] Owner accepted the complete M0 planning package (2026-08-09)
- [x] Explicit implementation-start instruction (2026-08-09)

### Implementation

- [x] Steps 1–8 (software gate) — unit 171 / e2e 9 / build green
- [ ] Step 9 evidence-quality closeout — **blocked; no measured/external evidence currently ships**

## Accepted decisions (2026-08-09)

| ID | Resolution |
|----|------------|
| O1 | A — ≥1 first-party measured cell with `runCount >= 2`; all 3 cells registry-bound |
| O2 | A — Experimental only |
| O3 | A — 365 days |
| O4 | A — `benchmarks/prov4/` |
| Cinebench | Out |
| Cooling | Empty / unavailable |
| D1–D16 | Accepted in `specs/phase-4.md` §11 |

## Pilot summary

| Item | Accepted value |
|------|----------------|
| Build | `DEFAULT_BUILD_STATE_V2` (7600 + 4070 ATX mid-tower set) |
| Performance cells | Exactly 3 registry-bound rows (residual stub allowed) |
| First-party metrics | `fpsAverage` + 1% low + frametime; `runCount >= 2` |
| High confidence | CaptureConditions + RawArtifactReference digest + verification digests |
| Geometry join | `phys3EvidenceSourceId` === `physicalSpec.evidence.sourceId` |
| Contract attach | `prov4` sidecar only — no `perf1` public field adds |

## Inherited baseline

- Phase 0–3 remain closed regression baselines.
- `vs0`, `perf1`, `vs2`, `compat2`, and `phys3` are not silently widened.
- ADR-001–004 remain in force.

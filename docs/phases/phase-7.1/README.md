# Phase 7.1 — Catalog source-ingestion pipeline

**Status: M0 accepted 2026-08-13. O1–O10 locked as proposed (no
amendments). First slice Steps 1–8 software closeout accepted
2026-08-13.** Collection increment (candidate data file + live Commons
API / AMD HTML parsers) is a follow-up, still dry-run only. Steps 9–10
and full phase closeout are **not** started.

A bounded follow-up to Phase 7. It does **not** start Phase 8, does **not**
redesign the catalog UI, and does **not** ship images, prices, or specs by
itself.

Phase 7 proved the product can show exact-SKU images when rights allow, and
honestly shipped **two CPU photos** while six categories stayed uncovered.
The remaining work is not another hand-curation pass. It is a repeatable,
agent-minimizing pipeline that turns public sources into **review packets**,
then stops.

| Artifact | Purpose |
|----------|---------|
| [`specs/phase-7.1.md`](./specs/phase-7.1.md) | Scope, pipeline, `ing7` sidecar contract, SKU/rights/provenance rules, O1–O10, exit conditions |
| [`implementation_plan.md`](./implementation_plan.md) | Ordered file-level Steps 1–8 (first slice) plus later Steps 9–10 |
| [`TODO.md`](./TODO.md) | Checklist |

No new ADR is required. Runtime (ADR-001), stack (ADR-002 / ADR-003), code
license (ADR-004), and external-observation policy (ADR-005) stay as they are.
Phase 7.1 adds a **build-time curator sidecar** (`ing7`), not a runtime or
license lock.

## Sequence

| Step | State |
|------|-------|
| M0 scope drafted | **Done — 2026-08-13** |
| Owner decisions O1–O10 | **Locked — 2026-08-13** (accepted as proposed) |
| Implementation plan | **Done — 2026-08-13** |
| Owner acceptance of this package | **Done — 2026-08-13** |
| Explicit implementation-start instruction | **Given — first slice Steps 1–8** |
| Implementation | **First slice Steps 1–8 done — 2026-08-13** |
| First-slice software closeout | **Accepted — 2026-08-13** |
| Collection increment | **Follow-up** (still dry-run; no apply) |
| Full phase closeout | **Not started** (Steps 9–10 remain) |

## Current baseline (accepted, do not reopen)

- Phase 6 closed: 22-part `cat6` catalog, sourced specs, MSRP/street snapshots, manifest membership.
- Phase 7 closed: grid picker + `benchmarks/cat6/image-source-registry.json`. Shipped images = 2 CPUs. Manufacturer press photos for GPU / motherboard / case / cooler / RAM / PSU were **rejected** (no storage/redistribution grant). Related-SKU Commons photos were **not** substituted (Phase 7 O6).
- Phase 4 + 4.1 **frozen**. Do not mutate `prov4` / `est1` public shapes, pilot fixtures, or `scripts/curate-amd-product-catalog.py` outputs under `benchmarks/est1/`.
- ADR-004 real-hardware 3D mesh rights remain open and out of scope.
- Inventory is the existing 22 `cat6` SKUs. No expansion.

## What this milestone is

A curator pipeline with these stages:

```text
candidate → fetched → normalized → exact-SKU matched
  → rights-reviewed → owner-approved → shipped
```

Default execution ends at a **dry-run report**. `shipped` is an owner-apply
path, not an agent default, and is **out of the first implementation slice**.

Candidate and fetched bytes live under a gitignored workspace
(`.ingest/`, O1). Only an owner-approved, validated apply may touch:

- `parts/**/part.json`
- `parts/**/image.*`
- `benchmarks/cat6/**`
- source registries
- generated catalog manifests

## Relationship to other work

- **Depends on Phase 6 + 7.** Reads the 22-part catalog, `cat6` provenance
  fields, image registry, and price file. Does not replace them.
- **Reuses** `EvidenceRightsClass`, `ImageSourceDecision`,
  `CatalogProvenance`, `CatalogMsrp` / `CatalogStreetPrice`, and the Phase 4
  source-rights fail-closed pattern.
- **Not** the leftover Phase 7 UI note (per-category selection pages). That
  remains a separate product-surface slice.
- **Not** Phase 8. **Not** ADR-004 3D work.

## First-slice software closeout (2026-08-13)

Owner accepted the Steps 1–8 software gate. `pnpm test` 379, `pnpm test:e2e`
19, `pnpm build` green (`dist/.ingest` absent), `pnpm ingest:dry-run`
`shippedTreeDirty: false`, `--apply` refused. Shipped catalog trees
untouched. This is **not** a full Phase 7.1 closeout.

## Implementation start gate

The first slice is implemented and software-closed. Do not start Step 9,
Step 10, catalog mutation, or Phase 8 without a new explicit instruction.

## Implementation hand-off (historical — first slice, already executed)

Paste the following as a new-session start instruction. It authorizes
**Steps 1–8 only** (dry-run first slice). It does **not** authorize
Step 9, Step 10, catalog mutation, commit, or push.

```text
Implement pb3 Phase 7.1 first slice (Steps 1–8 only).

Repository: /home/cenoda/pb3

M0 is owner-accepted (2026-08-13). O1–O10 are locked as proposed, no
amendments. This message is the explicit implementation-start instruction.

Read first:
- docs/phases/phase-7.1/README.md
- docs/phases/phase-7.1/specs/phase-7.1.md
- docs/phases/phase-7.1/implementation_plan.md
- docs/phases/phase-7.1/TODO.md
- src/contract/cat6.ts
- src/contract/cat6.schema.ts
- src/contract/prov4.ts (EvidenceRightsClass only — do not edit)
- benchmarks/cat6/image-source-registry.json
- parts/catalog-manifest.json
- existing cat6 integrity tests

Do:
- Follow implementation_plan.md Steps 1–8 in order.
- Add sidecar contract `ing7` (src/contract/ing7.ts + ing7.schema.ts).
- Add gitignored workspace `.ingest/` (never Vite-served).
- Implement Wikimedia CPU image, manufacturer GPU image, and AMD
  structured-spec adapters.
- Implement candidate → fetched → normalized → exact-SKU match →
  rights review → owner review packet → dry-run report.
- CI must be fixture-only (O8). No live network in `pnpm test`.
- Rights engine must not emit decision: "approved" (O7).
- Default CLI is dry-run. shippedTreeDirty must stay false.

Do not:
- Mutate parts/**, benchmarks/cat6/**, or the catalog manifest.
- Implement Step 9 (street-price adapter) or Step 10 (apply/ship).
- Change cat6 / prov4 / est1 public shapes or frozen Phase 4 / 4.1 files.
- Touch UI, start Phase 8, or do ADR-004 3D work.
- Expand the 22-part inventory.
- Auto-approve rights or owner decisions.
- Commit or push unless the owner separately asks.

Verify:
- pnpm test
- pnpm test:all
- pnpm build
- pnpm ingest:dry-run
- git status shows no parts/ or benchmarks/cat6/ diffs

Update phase-7.1 TODO checkboxes as steps complete. Do not claim
owner closeout.
```

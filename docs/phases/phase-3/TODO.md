# Phase 3 TODO

## M0 planning package

- [x] Create Phase 3 working folder.
- [x] Draft scope and inventory boundary (`specs/phase-3.md`).
- [x] Draft independent physical-validation contract
      (`specs/physical-validation-data-contract.md`).
- [x] Draft ordered file-level implementation plan.
- [x] Owner accepted the bounded physical inventory (2026-08-08).
- [x] Owner resolved the M0 decisions in `specs/phase-3.md` §10
      (2026-08-08).
- [x] Owner accepted the scope spec, data contract, and implementation plan
      (2026-08-08).
- [x] Record accepted Phase 3 M0 state in project status docs.
- [x] Receive a separate explicit instruction to start implementation
      (2026-08-08).

## Implementation (Steps 1–9)

- [x] Add `phys3` contract types and Zod schemas without changing
      `vs0`/`vs2`/`compat2`/`perf1` contracts.
- [x] Migrate only the accepted physical-core GLBs and add evidence metadata.
- [x] Validate GLB node prefixes, unique names, transforms, and coverage.
- [x] Implement anchor/socket mount resolution and `AssemblyState`.
- [x] Implement collision/clearance engine behind the accepted geometry policy.
- [x] Add declared mount-position/orientation controls only.
- [x] Replace the GPU-only viewport path with the bounded assembled scene.
- [x] Wire evidence-backed cooling inputs through the existing `perf1`
      `CorrectionInput` surface (runtime unavailable; stub-only unit path).
- [x] Add physical-validation and cooling-status UI.
- [x] Add unit, fixture-integrity, and required Playwright E2E coverage.
- [x] Run `pnpm test:all` and `pnpm build`.
- [x] Complete owner review and Phase 3 closeout truth-sync
      (**owner-accepted 2026-08-08** — re-audit PASS; Playwright 6/6;
      keepsake screenshots under `keepsake/`).

## Resolved M0 decisions (2026-08-08)

- [x] Project-authored synthetic fixture geometry; `Experimental`; Apache-2.0.
- [x] Box-authored OBB collision/clearance using existing `three`; no new
      dependency.
- [x] `0.1 mm` numeric/export epsilon; real clearance is represented by
      `clearance:*` volumes, not a guessed global distance.
- [x] Cooling hook wired, but production evidence and automatic perf1 bucket
      mapping deferred; runtime returns structured `unavailable`.
- [x] Cooler `normal` / `rotated-180` declared-orientation demonstration.

## Explicit non-goals

- Inventory expansion beyond the existing 13 Phase 2 parts.
- Real-time thermal, CFD/airflow, structural, cable-routing, or fan simulation.
- Assembly animation, RGB, visual-model authoring tools, or photoreal polish.
- A new logical compatibility engine or any replacement of `compat2`.
- `vs2` URL changes or persistence of Phase 3 mount choices in this phase.
- Changes to the `perf1` public contract, baseline model, or unsupported
  correction values.
- Backend, auth, live pricing, cart, or deployment work.

# Phase 3 — Implementation Plan

Status: **owner-accepted and executed (2026-08-08)** — Steps 1–10 complete;
owner closeout accepted

Scope authority: [`specs/phase-3.md`](./specs/phase-3.md)

Data authority: [`specs/physical-validation-data-contract.md`](./specs/physical-validation-data-contract.md)

Stack authority: [`ADR-001`](../../decisions/ADR-001-runtime-static-spa.md),
[`ADR-002`](../../decisions/ADR-002-stack-core-ts-react-r3f-vite.md),
[`ADR-003`](../../decisions/ADR-003-stage3-tooling-and-fixtures.md),
[`ADR-004`](../../decisions/ADR-004-license-code-apache-2.0.md)

This is the accepted file-level plan required by the plan-before-code rule.
Steps 1–10 are complete; owner closeout was accepted on 2026-08-08
(implementation commit `acd038b`). No new dependency, inventory expansion, or
existing-contract change was introduced.

## 1. Preconditions

| Gate | State |
|------|-------|
| Phase 0 vertical slice | Complete; regression baseline |
| Phase 1 `perf1` | Complete; contract/API inherited unchanged |
| Phase 2 `vs2`/`compat2` | Complete; selection/logical compatibility inherited unchanged |
| Runtime/stack/tooling | Locked by ADR-001–003 |
| Code/data/synthetic fixture GLB license | Apache-2.0; real third-party/manufacturer assets remain out of scope per ADR-004 |
| Phase 3 scope/contract/plan | **Owner-accepted (2026-08-08)** |
| M0 decisions | **Resolved (2026-08-08); see §12** |
| Explicit owner start | **Given (2026-08-08)** |

Implementation Step 1 remains blocked only until the owner separately instructs
implementation to start. Acceptance of this plan alone is not that instruction.

## 2. Inherited contracts (do not modify)

- `vs0` part identity/model path and legacy URL behavior.
- `vs2` `BuildStateV2`, full URL encoding, legacy `vs0` decode, and 13-part
  inventory.
- `compat2` logical checks, price, statuses, and report behavior.
- `perf1` baseline/workload contracts and correction API. Phase 3 uses the
  reserved `CorrectionInput` fields and existing cooling bucket vocabulary.
- Repo-root `parts/` and `benchmarks/` SSOT with `/parts` and `/benchmarks`
  browser paths.
- Required GLB prefixes, mm, and Y-up conventions.

Phase 3 introduces an independent `phys3` contract and separate
`AssemblyState`; it does not require `vs3` or `compat3`.

## 3. Proposed target layout

```text
src/
  contract/
    phys3.ts                         NEW
    phys3.schema.ts                  NEW
  physical/
    loadPhysicalSpec.ts              NEW
    indexGlbPhysicalNodes.ts         NEW
    resolveMount.ts                  NEW
    buildAssemblyState.ts            NEW
    collision/
      types.ts                       NEW engine boundary
      collectCollisionInputs.ts      NEW
      validatePhysicalFit.ts         NEW
    cooling/
      loadCoolingEvidence.ts         NEW
      buildCoolingCorrectionInput.ts NEW perf1 adapter
  viewport/
    BuildViewport.tsx                EXTEND from GPU-only to bounded assembly
    AssemblyModel.tsx                NEW
  ui/
    MountControls.tsx                NEW declared alternatives only
    PhysicalValidationPanel.tsx      NEW
    CoolingEvidencePanel.tsx         NEW
    PerformancePanel.tsx             EXTEND integration display only
  test/
    phys3.schema.test.ts              NEW
    resolveMount.test.ts              NEW
    physicalValidation.test.ts        NEW
    coolingCorrectionHook.test.ts     NEW
benchmarks/phys3/
  physical-validation-examples.json  NEW, if accepted
  cooling-evidence.json               NEW, if accepted
parts/{existing-supported-id}/
  part.json                           EXTEND with phys3 physicalSpec
  model.glb                           MIGRATE supported core only
e2e/
  phase3-physical-validation.spec.ts  NEW, required
```

Small implementation-time file splits are allowed. Contract lineage,
inventory, engine boundary, or dependency changes require a plan revision.

## 4. Data, fixture, and GLB migration strategy

1. **No inventory migration.** Keep all 13 IDs and paths. Add no category or
   SKU.
2. **Supported core only.** Migrate only the IDs in `phase-3.md` §2.1. The
   four fallback GLBs remain visual-only and must return physical
   `unavailable`.
3. **One GLB remains one part artifact.** Preserve `modelGlbPath`; add/revise
   physical nodes inside the same file. Do not create a parallel collision
   asset tree unless an owner-approved plan amendment changes the charter
   model.
4. **Preserve visual behavior.** Each migrated GLB retains a valid
   `visual:*` node. Existing copied placeholder GLBs with incorrect visual node
   identities are corrected only when that ID enters the supported core.
5. **Independent metadata.** Add nested `physicalSpec` governed by `phys3`;
   preserve base fields and `compatSpec` semantics.
6. **Evidence first.** Physical-core geometry is project-authored synthetic
   fixture data, recorded as `Experimental`, Apache-2.0, with geometry data
   version and basis. No third-party/manufacturer-derived asset is imported.
7. **Controlled examples.** `benchmarks/phys3/` contains explicit fit,
   interference, unavailable, and cooling-evidence examples. It is not runtime
   guess data.
8. **Atomic migration order.** Contract/schema → authoring validation → one
   complete case/board/component chain → remaining physical-core alternatives.
   Never temporarily label a partial GLB as fit-capable.

## 5. Ordered build steps

### Step 0 — Owner M0 gate (planning only) — CLEARED

- [x] Owner accepted both specs and this plan (2026-08-08).
- [x] Owner resolved §12 decisions (2026-08-08).
- [x] Accepted decisions recorded in `STATUS.md`, phase README, TODO, and
      ADR-004.
- [x] Receive a separate explicit implementation-start instruction.
- **Exit:** planning gates are complete; implementation begins only when the
  separate start instruction is supplied.

### Step 1 — `phys3` types and Zod schemas

- Add `src/contract/phys3.ts` and `phys3.schema.ts` from the accepted contract.
- Enforce discriminated statuses, explanations, node prefixes, unique defaults,
  finite transforms, and cooling evidence shape.
- Add `src/test/phys3.schema.test.ts` with valid and malformed examples.
- Do not edit existing contract types/schemas.
- **Exit:** new schema tests and all existing unit tests pass.

### Step 2 — Physical fixture authoring and integrity validation

- Author accepted `physicalSpec` metadata and physical nodes for the bounded
  core in migration order (§4).
- Add a deterministic integrity validator/test that indexes GLB JSON/node
  metadata without rendering and checks every §contract validation rule.
- Author controlled `benchmarks/phys3/` examples only after geometry evidence
  is accepted.
- **Exit:** every supported core part has complete evidence and nodes; all four
  fallback parts are explicitly visual-only; no incomplete model can parse as
  supported.

### Step 3 — GLB indexing and anchor/socket resolver

- `loadPhysicalSpec.ts`: load the existing part/GLB path and parse the nested
  `phys3` block without changing `vs2`/`compat2` semantics.
- `indexGlbPhysicalNodes.ts`: produce named physical-node references and fail
  closed on missing/duplicate/invalid nodes.
- `resolveMount.ts`: apply interface matching and anchor × inverse(socket)
  transform math; return `mounted` or structured `unavailable`.
- `buildAssemblyState.ts`: derive defaults and apply only declared user choices.
- Add mount tests for success, missing, mismatch, ambiguity, orientation, and
  invalid transform.
- **Exit:** the supported default chain resolves deterministically; every bad
  case returns the specified unavailable reason.

### Step 4 — Collision/clearance engine

- Implement box-authored OBB evaluation behind
  `physical/collision/types.ts` using existing `three`; UI and
  mount code depend on this interface, not engine internals.
- Collect only declared collision/clearance nodes at resolved world transforms.
- Apply exact allowed-contact pairs. Evaluate collision and clearance checks,
  preserving all individual results and aggregate precedence.
- Apply `0.1 mm` only as numeric/export overlap epsilon. Use authored
  `clearance:*` OBB volumes for real clearance requirements.
- Do not add a dependency or implement triangle-mesh/physics collision.
- Add pure tests for fit, interference, unavailable, allowed contact, missing
  geometry, and aggregate precedence.
- **Exit:** controlled examples produce their declared statuses; no incomplete
  input can produce `fit`.

### Step 5 — Assembly state and mount controls

- Add non-URL `AssemblyState` keyed by the current `BuildStateV2` selection.
- Reset/re-resolve affected mounts when selected parts change.
- `MountControls.tsx` exposes only accepted anchors/orientation variants and
  provides reset-to-auto.
- Keep free transforms, scaling, and `vs2` URL persistence out.
- **Exit:** accepted orientation/anchor changes deterministically rebuild the
  report without mutating `BuildStateV2`.

### Step 6 — Viewport integration

- Replace the GPU-only centered-model scene with `AssemblyModel.tsx` loading
  the bounded selected assembly at resolved transforms.
- Do not center each child independently; mount math owns placement.
- Render visual nodes only; physical nodes are hidden by default, with an
  optional bounded debug overlay if required for verification.
- Preserve visible GLB load errors, camera controls, and existing viewport test
  hooks where possible.
- **Exit:** default assembly and accepted mount change render at resolver
  transforms; missing GLB/physical data is visibly unavailable, never stale.

### Step 7 — Cooling evidence and perf1 correction-hook wiring

- `loadCoolingEvidence.ts`: parse the accepted Phase 3 file shape; production
  rows remain empty.
- `buildCoolingCorrectionInput.ts`: implement exact-match hook construction for
  future evidence and stub-only unit examples. Phase 3 runtime has no accepted
  evidence row or `coolingBucketId` mapping and therefore returns unavailable.
- Preserve user power/load inputs. Make manual vs physical cooling mode
  explicit. Do not silently fall back or invent a bucket/derate.
- Preserve the existing perf1 baseline/withheld outcome. Do not create a
  production correction row, normalization threshold, bucket mapping, or FPS
  derate.
- **Exit:** runtime returns traceable unavailable; stub-only tests prove exact
  hook population and stale/missing rejection without changing perf1 behavior.

### Step 8 — Physical/cooling UI integration

- `PhysicalValidationPanel.tsx`: show aggregate and every check, involved parts,
  explanation, geometry version, evidence, and model grade.
- `CoolingEvidencePanel.tsx`: show physical/manual mode, normalized inputs,
  evidence ID, mapped bucket, or unavailable reason.
- Keep `CompatibilityPanel` logically separate and unchanged.
- **Exit:** the user can distinguish logical incompatible, physical
  interference, physical unavailable, and perf correction withheld states.

### Step 9 — Unit, E2E, build, and regression gate

| Layer | Required coverage |
|-------|-------------------|
| Schema/fixtures | phys3 metadata, node declarations, example/evidence files |
| Mounting | mounted + every unavailable family + declared orientation change |
| Collision | fit/interference/unavailable, allowed contacts, precedence |
| Cooling hook | runtime unavailable, empty production evidence, stub exact match, stale version, incomplete physical report |
| Existing unit | all `vs0`/`vs2`/`compat2`/`perf1` tests remain green |
| Existing E2E | Phase 0 and Phase 2 scenarios remain green |
| Phase 3 E2E | `e2e/phase3-physical-validation.spec.ts` covers §spec completion scenario |
| Build | all migrated GLBs and `benchmarks/phys3/` copied under stable paths |

- Run `pnpm test`, `pnpm test:e2e`, `pnpm test:all`, and `pnpm build`.
- **Exit:** all commands pass on a clean checkout; physical fixture integrity
  output is recorded for closeout.

### Step 10 — Exit and closeout

- Walk the accepted completion scenario on a clean checkout.
- Record exact test counts, geometry data version, supported/fallback inventory,
  and unresolved limitations in `STATUS.md`, README, and TODO.
- Do not promote model grades or claim thermal validation beyond evidence.
- **Exit:** owner reviews the evidence and explicitly accepts Phase 3 closeout.
- **Done (2026-08-08):** re-audit PASS (inclusive 0.1 mm epsilon, schema
  invariants, fixture schema parse, mount unavailable/DAG coverage);
  `pnpm test` 96/96; `pnpm test:e2e` 6/6; `pnpm build` green; keepsake
  screenshots under `keepsake/`; owner-authorized closeout recorded.

## 6. Collision engine boundaries

- Pure deterministic input/output; no React, Zustand, network, URL, compat2,
  or perf1 access.
- Inputs are already-resolved physical nodes/world transforms and accepted
  engine policy. Visual meshes are excluded.
- Broad/narrow-phase implementation and dependency remain hidden behind the
  interface and must follow the owner-accepted M0 decision.
- No implicit tolerances, auto-repair, best-effort mount shifts, or undeclared
  collision exemptions.
- Missing/unsupported data returns unavailable, not an empty collision set.

## 7. UI and viewport boundaries

- `BuildStateV2` remains selection truth; `AssemblyState` is derived Phase 3
  state and is not URL-persisted.
- Viewport rendering consumes resolver transforms; it does not recompute mount
  logic.
- Mount controls expose declared choices only.
- Logical compatibility, physical validation, price, and performance remain
  separate panels/results.
- No visual redesign, animation system, model editor, or unrestricted gizmo.

## 8. Perf1 correction-hook boundaries

- Keep `CorrectionInput` and perf1 public types unchanged.
- Phase 3 owns evidence lookup and normalized-input construction.
- Existing user power/load inputs are preserved.
- No correction magnitude is derived from collision distance or an unlabeled
  heuristic.
- Missing/unaccepted evidence omits Phase 3 cooling inputs and surfaces
  unavailable. Existing perf1 withheld behavior is valid output.
- `compat2` never gates or mutates the correction hook.

## 9. Exit criteria

This M0 plan is ready for execution only when:

- [x] inherited contracts, layout, migration, steps, boundaries, tests,
      non-goals, and risks are documented;
- [x] owner accepted the Phase 3 scope spec (2026-08-08);
- [x] owner accepted the physical contract (2026-08-08);
- [x] owner resolved all M0 decisions (2026-08-08);
- [x] owner accepted this plan (2026-08-08);
- [x] owner separately authorizes implementation.

Phase 3 itself exits only after Steps 1–10 and explicit owner closeout.
**All steps complete; owner closeout accepted (2026-08-08).**

## 10. Explicit non-goals

- Any inventory expansion or new category.
- `vs2`/`compat2` contract or behavior changes.
- `perf1` public contract, baseline, workload, or invented correction changes.
- Visual meshes as collision truth; unsupported fallback fit claims.
- CFD/thermal simulation, fan curves, cable routing, structural simulation.
- Free-form transforms, scale, assembly animation, RGB, photoreal polish,
  authoring automation.
- Backend/auth/live price/deploy work.

## 11. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Placeholder geometry is mistaken for verified physical truth | False fit/interference claims | Evidence + model grade required; visual-only defaults to unavailable |
| GLB transforms/export scale differ | Wrong assembly/collision | Integrity validation; fail closed; accepted mm tolerance policy |
| Intended mount contact appears as collision | False interference | Exact reviewed allowed-contact pairs only |
| Collision engine choice leaks into UI/state | Rewrite pressure | Stable pure boundary in §6 |
| Cooling values imply simulation or measured FPS | Misleading performance claim | Exact evidence, visible basis, no invented derate; withhold when absent |
| Real-hardware asset rights remain unresolved | Could cause accidental third-party asset import | Phase 3 permits project-authored synthetic Apache-2.0 fixtures only |
| GPU-only viewport centers models | Breaks mount transforms | Remove per-model centering in Step 6; resolver owns placement |

## 12. Resolved M0 decisions (2026-08-08)

| Decision | Owner-accepted resolution |
|----------|---------------------------|
| Geometry and rights | Project-authored synthetic fixture geometry; `Experimental`; Apache-2.0; no third-party/manufacturer-derived assets |
| Collision representation/engine | Box-authored OBBs using existing `three`; no new dependency, triangle-mesh collision, or physics engine |
| Contact/clearance | `0.1 mm` numeric/export epsilon; authored `clearance:*` volumes carry real clearance requirements; exact allowed contacts only |
| Cooling integration | Hook and runtime unavailable path only; production evidence rows empty; no automatic bucket mapping or FPS derate |
| Adjustable mount | Cooler `normal` and `rotated-180` orientations at the declared cooler anchor |

## 13. Related documents

| Document | Role |
|----------|------|
| [`specs/phase-3.md`](./specs/phase-3.md) | Accepted scope and M0 decisions |
| [`specs/physical-validation-data-contract.md`](./specs/physical-validation-data-contract.md) | Proposed `phys3` types |
| [`TODO.md`](./TODO.md) | Gate and execution checklist |
| [`../phase-2/implementation_plan.md`](../phase-2/implementation_plan.md) | Structural precedent |
| [`../phase-1/specs/performance-data-contract.md`](../phase-1/specs/performance-data-contract.md) | Existing perf1 correction hook |
| [`../phase-0/specs/vertical-slice-data-contract.md`](../phase-0/specs/vertical-slice-data-contract.md) | Inherited part/GLB conventions |
| [`../../../STATUS.md`](../../../STATUS.md) | Project-wide live status |

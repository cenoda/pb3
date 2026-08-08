# Phase 3 — 3D Assembly and Physical Validation

Status: **owner-accepted (2026-08-08); implementation complete; awaiting owner closeout**

Scope authority: [`PROJECT_CHARTER.md`](../../../../PROJECT_CHARTER.md) §2, §4
"3단계 — 3D 조립 및 물리 검증", and §6. Detailed accepted types live in
[`physical-validation-data-contract.md`](./physical-validation-data-contract.md).

This document remains the accepted Phase 3 scope lock. Implementation Steps 1–9
are complete. Step 10 owner closeout is **not** claimed.

## 1. Goal

Prove one bounded, explainable physical-assembly path over the existing Phase 2
catalog:

1. resolve declared `socket:*` nodes to declared `anchor:*` nodes;
2. produce deterministic position/orientation transforms;
3. evaluate declared `collision:*` solids and `clearance:*` keep-out volumes;
4. let the user select only author-declared mount alternatives;
5. expose evidence-backed cooling-condition inputs through the already-reserved
   `perf1` correction hook.

Logical compatibility remains `compat2`. A build may have separate logical and
physical reports; neither report overwrites the other.

## 2. Inventory boundary (M0 proposal — do not expand silently)

Phase 3 adds **zero part IDs**. It partitions the existing 13-part catalog into
a supported physical core and visual-only fallback parts.

### 2.1 Proposed physical core (9 parts)

These GLBs receive the Phase 3 nodes needed for their listed role. "Validated"
here means validated against an owner-accepted fixture source and evidence
record; it does **not** mean manufacturer-certified or `Verified` model grade.

| Part | Required Phase 3 geometry/role |
|------|--------------------------------|
| `case.mid-tower-atx-01` | case collision shell; motherboard and PSU anchors; GPU/cooler/side-panel and intake clearance volumes |
| `mb.atx-b650-01` | board collision solid; case socket; CPU, cooler, RAM, and GPU anchors |
| `cpu.zen4-7600` | CPU collision solid and motherboard socket |
| `cpu.zen4-7800x3d` | CPU collision solid and motherboard socket |
| `gpu.rtx4070` | GPU collision solid, motherboard socket, and declared cable/intake clearance if evidence exists |
| `gpu.rtx4080` | GPU collision solid, motherboard socket, and declared cable/intake clearance if evidence exists |
| `cooler.air-twin-tower-01` | cooler collision solid, motherboard socket, and fan/RAM/side-panel clearance volumes |
| `ram.ddr5-32gb-6000` | RAM-kit collision solids and motherboard socket(s) |
| `psu.750w-atx` | PSU collision solid, case socket, and intake/exhaust clearance if evidence exists |

The bounded assembly has seven selected part slots (case, motherboard, CPU,
GPU, cooler, RAM, PSU), with two CPU and two GPU alternatives inside the nine
supported IDs. No new SKU is introduced.

### 2.2 Visual-only fallback (4 parts)

| Part | Phase 3 behavior |
|------|------------------|
| `case.micro-atx-mini-01` | Existing placeholder visual remains; physical report is `unavailable` |
| `mb.micro-b450-01` | Existing placeholder visual remains; physical report is `unavailable` |
| `ram.ddr5-16gb-7200` | Existing placeholder visual remains; physical report is `unavailable` |
| `psu.550w-sfx` | Existing placeholder visual remains; physical report is `unavailable` |

These remain valid selectable `vs2` parts and keep their `compat2` behavior.
Their boxes must never be treated as trustworthy collision geometry.

### 2.3 Inventory and asset non-goals

- No additional case, motherboard, CPU, GPU, cooler, RAM, PSU, storage, fan,
  AIO, riser, cable, or peripheral IDs.
- Visual meshes may remain simple. Phase 3 accuracy claims apply only to
  declared physical nodes backed by evidence.
- Phase 3 physical-core geometry is project-authored synthetic fixture data,
  graded `Experimental`, and covered by Apache-2.0 under ADR-004. Third-party
  or manufacturer-derived real-hardware assets remain out of scope and require
  a separate source-specific decision.

## 3. Anchor/socket auto-mounting model

### 3.1 Inherited GLB convention

Phase 3 reuses, without renaming, the fixed node prefixes:

- `visual:*`
- `collision:*`
- `anchor:*`
- `socket:*`
- `clearance:*`

Units remain mm and the coordinate system remains Y-up. `phys3` metadata
references exact GLB node names; runtime code does not infer part identity or
mount compatibility by parsing opaque part IDs or arbitrary node suffix text.

### 3.2 Resolution

Each physical part declares anchors and sockets in a nested `physicalSpec`
governed by the independent `phys3` contract. Each declaration includes an
opaque mount-interface ID and exact node name.

For one selected moving part:

1. resolve its declared target part from the current `BuildStateV2` category;
2. find socket/anchor candidates with equal mount-interface IDs;
3. use the sole candidate, or the declared default candidate;
4. if candidates remain ambiguous, a node is missing, or transforms are
   invalid, return structured `unavailable`;
5. compute `target anchor world transform × inverse(socket local transform)`.

Success returns position in mm plus an orientation quaternion. Runtime scale
is fixed at identity; user scaling is forbidden.

### 3.3 Assembly state

Mount choices live in a separate Phase 3 `AssemblyState`, derived from
`BuildStateV2`. They do not widen `BuildStateV2`, change `v=vs2`, or alter the
canonical URL in this phase.

## 4. Mount position/orientation changes

The user may choose only:

- a declared alternative anchor compatible with the same mount interface; or
- a declared orientation variant for that socket/anchor pair.

No free drag, arbitrary Euler rotation, arbitrary translation, or scale is
allowed. Case origin stays fixed. Motherboard, CPU, RAM, GPU, cooler, and PSU
derive their transforms from mount declarations.

The accepted bounded demonstration gives
`cooler.air-twin-tower-01` two author-declared orientations at the same cooler
anchor (`normal` and `rotated-180`). Changing the orientation triggers a
fresh mount resolution, collision/clearance report, cooling evidence lookup,
and viewport update.

## 5. Collision and clearance model

### 5.1 Inputs

- current `BuildStateV2` IDs;
- resolved `AssemblyState` transforms;
- declared `collision:*` solids and `clearance:*` keep-out volumes;
- physical geometry/evidence data version;
- explicit allowed-contact/exclusion declarations for intended mounted contact.

Visual meshes are not collision inputs.

### 5.2 Results

Each check and the aggregate report use:

- `fit` — all required inputs for the check exist and no forbidden overlap is
  found;
- `interference` — complete inputs show a forbidden collision or clearance
  violation;
- `unavailable` — a required node, transform, evidence record, or supported
  geometry representation is missing/invalid.

This is never a bare boolean. Every `interference` and `unavailable` result
identifies involved parts/nodes and provides an explanation. Aggregate
precedence is `interference` over `unavailable` over `fit`, while preserving
all individual checks.

An intended mount-face contact is not an interference only when an explicit
allowed-contact declaration covers that exact pair. Missing declarations do
not become implicit exemptions.

Phase 3 accepts box-authored `collision:*` and `clearance:*` nodes evaluated as
oriented bounding boxes (OBBs) using the existing `three` dependency. No new
collision/physics dependency is allowed. A `0.1 mm` epsilon handles numeric and
export noise only; it is not a manufacturing tolerance. Required real
clearance is encoded by the authored `clearance:*` volume itself.

## 6. Cooling condition → `perf1` correction hook

Phase 3 does not change the `perf1` public API or baseline model. A Phase 3
adapter produces the existing `CorrectionInput` fields:

| Field | Phase 3 source |
|-------|----------------|
| `coolingHeadroom` | Normalized scalar from an accepted `phys3` cooling-evidence record for the exact selected assembly and mount configuration |
| `intakeRestrictionSeverity` | Accepted Phase 3 vocabulary derived from the same evidence record |
| `evidenceSourceId` | Opaque ID of that record, including traceability to geometry/data version |
| `coolingBucketId` | Not populated in Phase 3 runtime; automatic mapping is deferred until accepted real evidence exists |

The adapter may merge these cooling fields with existing user-selected power
and load-profile fields, but it must not overwrite them. Cooling input mode is
explicit: `physical evidence` or `manual`. Physical mode never silently falls
back to a manual/default bucket.

Phase 3 ships no production cooling evidence row and no automatic perf1 bucket
mapping. Runtime cooling integration therefore returns structured
`unavailable` and leaves performance baseline/withheld as applicable. Contract
and unit tests may use explicitly labeled stub examples to verify exact-match
hook wiring, but those examples are not runtime correction data. Phase 3 does
not invent a correction magnitude or claim CFD/thermal simulation.

`compat2` is not an input to this adapter. Logical compatibility, physical fit,
and performance correction are displayed as sibling results over the same
selection.

## 7. Error and uncertainty policy

- Missing/duplicate anchor or socket → mount `unavailable`.
- Missing/invalid collision or clearance node → affected physical check
  `unavailable`, never `fit`.
- Visual-only part in the selected assembly → coverage and aggregate physical
  result `unavailable`.
- Unsupported node transform/scale or geometry representation →
  `unavailable`, with the exact node named.
- Missing cooling evidence → cooling hook `unavailable`; no inferred bucket.
- `interference` requires complete relevant inputs and an observed forbidden
  overlap under the accepted engine policy.
- Confidence/model grade and evidence source are shown; placeholder or
  Experimental geometry is never labeled Verified.

## 8. Draft completion scenario

1. Load the default `vs2` build and assemble the supported physical core.
2. Show every mounted part at a deterministic anchor/socket-derived transform.
3. Show a structured physical report with individual collision and clearance
   checks plus aggregate status.
4. Switch between the two accepted cooler orientations; viewport and report
   update from the new `AssemblyState`.
5. Select controlled fixture cases that demonstrate one `fit`, one real
   `interference`, and one `unavailable` outcome with explanations.
6. Select a visual-only fallback part and receive `unavailable`, not a box-based
   fit claim.
7. Show runtime cooling `unavailable` with the missing-evidence reason and
   leave performance unmodified/withheld; unit tests prove that explicitly
   labeled stub evidence can populate the three reserved hook fields without
   becoming production correction data.
8. Keep Phase 0, Phase 1, and Phase 2 unit/E2E regressions green.

## 9. Accepted M0 decisions (2026-08-08)

| Decision | Proposal |
|----------|----------|
| Inventory | No new IDs; physical core in §2.1; four visual-only fallbacks in §2.2 |
| Contract lineage | New independent `phys3`; no `vs2`, `compat2`, or `perf1` version change |
| Mount state | Separate non-URL `AssemblyState` |
| Transform output | `positionMm` vector + orientation quaternion; identity scale |
| User adjustment | Declared alternatives only; cooler normal/180° demonstration accepted |
| Physical statuses | `fit` / `interference` / `unavailable`, with aggregate precedence |
| Logical separation | `compat2` and physical report remain sibling results |
| Cooling hook | Adapter/hook implemented; no production evidence or bucket mapping in Phase 3; runtime returns unavailable |
| E2E | Required for the Phase 3 completion scenario |

## 10. Resolved decisions record

| Decision | Owner-accepted resolution (2026-08-08) |
|----------|----------------------------------------|
| Geometry and rights | Project-authored synthetic fixture geometry; `Experimental`; Apache-2.0. No third-party/manufacturer-derived real-hardware assets |
| Collision engine | Box-authored OBBs using existing `three`; no new dependency or triangle-mesh physics |
| Measurement policy | `0.1 mm` numeric/export epsilon only; real clearance represented by `clearance:*` volumes; exact allowed-contact pairs required |
| Cooling integration | Hook and unavailable path only; no production evidence, normalization thresholds, bucket mapping, or FPS derate in Phase 3 |
| Adjustable fixture | Cooler `normal` and `rotated-180` declared orientations accepted |

## 11. Explicitly forbidden in Phase 3

- Adding part IDs or silently promoting visual-only fallbacks to supported.
- Treating visual meshes/placeholder boxes as collision truth.
- Replacing or duplicating `compat2` logical checks.
- Changing `vs2` selection/URL semantics or persisting mount state there.
- Changing `perf1` contract types, baseline queries, workload behavior, or
  inventing correction rows/magnitudes.
- Thermal/CFD simulation, fan curves, cable routing, structural analysis,
  assembly animation, RGB, or model-authoring automation.
- Backend/auth/live price/deploy work.
- Implementation before owner acceptance of this M0 package and a separate
  explicit start instruction.

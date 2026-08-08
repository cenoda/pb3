# Phase 3 Physical Validation Data Contract

Status: **owner-accepted (2026-08-08); implementation complete; awaiting owner closeout**

Proposed contract version: **`phys3`**

Scope authority: [`phase-3.md`](./phase-3.md). This contract is independent
from and does not alter `vs0`, `vs2`, `compat2`, or `perf1`.

## 1. Inherited conventions

1. IDs are opaque strings.
2. Units are mm; GLB coordinates are Y-up.
3. Existing node prefixes are reused exactly: `visual:*`, `collision:*`,
   `anchor:*`, `socket:*`, `clearance:*`.
4. `physicalSpec` references exact node names. Prefix validation is allowed;
   inferring semantics from arbitrary suffix text is not.
5. Visual meshes never substitute for missing collision/clearance geometry.
6. Missing or uncertain data returns structured `unavailable`.

## 2. Contract and geometry metadata

```typescript
export const PHYS3_CONTRACT_VERSION = "phys3" as const;
export type Phys3ContractVersion = typeof PHYS3_CONTRACT_VERSION;

export type PhysicalModelGrade =
  | "Verified"
  | "Community"
  | "Experimental";

export interface PhysicalEvidenceRef {
  sourceId: string;
  geometryDataVersion: string;
  modelGrade: PhysicalModelGrade;
  basis: string;
}

export interface AnchorDefinition {
  anchorId: string;
  nodeName: `anchor:${string}`;
  mountInterfaceId: string;
  acceptsPartCategory: string;
  isDefault?: boolean;
}

export interface OrientationVariant {
  orientationId: string;
  /** Relative to the resolved socket-to-anchor orientation. */
  offsetQuaternion: readonly [number, number, number, number];
  isDefault?: boolean;
}

export interface SocketDefinition {
  socketId: string;
  nodeName: `socket:${string}`;
  mountInterfaceId: string;
  targetPartCategory: string;
  orientationVariants: OrientationVariant[];
}

export interface AllowedContact {
  collisionNodeA: `collision:${string}`;
  collisionNodeB: `collision:${string}`;
  reason: string;
}

export interface PhysicalSpec {
  physicalContractVersion: Phys3ContractVersion;
  evidence: PhysicalEvidenceRef;
  anchors: AnchorDefinition[];
  sockets: SocketDefinition[];
  collisionNodes: Array<`collision:${string}`>;
  clearanceNodes: Array<`clearance:${string}`>;
  allowedContacts?: AllowedContact[];
}
```

`PhysicalSpec` is a nested Phase 3 block read by a Phase 3 schema. The base
part identity, `compatSpec`, and `modelGlbPath` keep their inherited meanings.
An omitted `physicalSpec` means visual-only coverage, not an empty/valid
physical model.

Phase 3 accepts box-authored `collision:*` and `clearance:*` GLB nodes only.
Runtime evaluates their world-space oriented bounding boxes using the existing
`three` dependency. Triangle-mesh, convex-hull, and physics-engine shapes are
outside this contract.

## 3. GLB validation rules

- Every declared node exists exactly once in its GLB.
- Every physical node has the required inherited prefix.
- Node transforms are finite and convertible to the mm/Y-up assembly space.
- Runtime scale is identity. Unsupported authored/non-uniform scale produces
  `unavailable`.
- Duplicate declared IDs, duplicate node names, missing evidence, or a default
  ambiguity fail schema/fixture validation.
- Unreferenced physical-prefix nodes are authoring errors; they are not
  silently included.

## 4. Mount query and result

```typescript
export interface MountSelection {
  movingPartId: string;
  socketId: string;
  targetPartId: string;
  anchorId: string;
  orientationId: string;
}

export interface MountTransform {
  positionMm: readonly [number, number, number];
  orientationQuaternion: readonly [number, number, number, number];
}

export type MountUnavailableReason =
  | "missing_physical_spec"
  | "missing_socket_node"
  | "missing_anchor_node"
  | "interface_mismatch"
  | "no_candidate"
  | "ambiguous_candidate"
  | "invalid_transform"
  | "unsupported_geometry";

export type MountResolution =
  | {
      status: "mounted";
      selection: MountSelection;
      transform: MountTransform;
      evidence: PhysicalEvidenceRef[];
    }
  | {
      status: "unavailable";
      movingPartId: string;
      reason: MountUnavailableReason;
      explanation: string;
      involvedNodeNames: string[];
    };

export interface AssemblyState {
  physicalContractVersion: Phys3ContractVersion;
  buildStateVersion: "vs2";
  mountSelections: MountSelection[];
}
```

The successful transform is computed as:

```text
targetAnchorWorldTransform × inverse(movingSocketLocalTransform)
```

The selected orientation offset is composed at the declared mount frame. The
exact matrix/quaternion library implementation is not fixed by this contract.

## 5. Collision and clearance results

```typescript
export type PhysicalValidationStatus =
  | "fit"
  | "interference"
  | "unavailable";

export type PhysicalCheckKind = "collision" | "clearance";

export interface PhysicalCheckResult {
  checkId: string;
  kind: PhysicalCheckKind;
  status: PhysicalValidationStatus;
  involvedPartIds: string[];
  involvedNodeNames: string[];
  /** Required for interference and unavailable. */
  explanation?: string;
  evidenceSourceIds: string[];
}

export interface PhysicalValidationReport {
  physicalContractVersion: Phys3ContractVersion;
  buildStateVersion: "vs2";
  assemblyState: AssemblyState;
  checks: PhysicalCheckResult[];
  overallStatus: PhysicalValidationStatus;
  geometryDataVersion: string;
}
```

Schema rules:

- `interference` and `unavailable` require a non-empty explanation.
- `interference` requires complete inputs for that check.
- `fit` requires complete relevant collision/clearance coverage.
- Aggregate precedence: any `interference` → `interference`; otherwise any
  `unavailable` → `unavailable`; otherwise `fit`.
- Allowed contacts apply only to exact declared node pairs.
- Overlap up to and including `0.1 mm` is treated as numeric/export noise.
  Greater overlap is an interference. This epsilon is not a manufacturing
  tolerance or a substitute for authored clearance geometry.
- Required clearance is represented by `clearance:*` box volumes. Intersection
  with a non-exempt collision OBB is a clearance interference.

## 6. Cooling evidence and perf1 adapter

```typescript
export type IntakeRestrictionSeverity =
  | "intake.none"
  | "intake.moderate"
  | "intake.severe";

export interface CoolingEvidenceRecord {
  physicalContractVersion: Phys3ContractVersion;
  evidenceSourceId: string;
  buildPartIds: string[];
  mountSelections: MountSelection[];
  geometryDataVersion: string;
  coolingHeadroom: number;
  intakeRestrictionSeverity: IntakeRestrictionSeverity;
  basis: string;
}

export type CoolingHookResult =
  | {
      status: "available";
      correctionInput: {
        coolingHeadroom: number;
        intakeRestrictionSeverity: IntakeRestrictionSeverity;
        evidenceSourceId: string;
        coolingBucketId?:
          | "cooling.sufficient"
          | "cooling.marginal"
          | "cooling.insufficient";
      };
    }
  | {
      status: "unavailable";
      reason:
        | "physical_validation_incomplete"
        | "missing_exact_evidence"
        | "unaccepted_normalization"
        | "unaccepted_bucket_mapping";
      explanation: string;
    };
```

`coolingHeadroom` is a normalized scalar with higher meaning more headroom.
Phase 3 accepts no production normalization thresholds, production evidence
rows, or automatic `coolingBucketId` mapping. Runtime therefore returns
`unavailable` for the cooling hook. Explicitly labeled stub objects may exercise
the `available` branch in unit/schema tests, but are not loaded as runtime
correction data.

The adapter matches the exact selected part set, mount selections, and geometry
data version. It never reuses a nearby row or infers a value from collision
distance alone. It populates the already-existing `CorrectionInput` surface;
it does not change the perf1 public contract. If perf1 has no applicable
evidence-backed correction, its existing withheld behavior remains truthful.

## 7. Fixture file shapes

```typescript
export interface PhysicalValidationExampleFile {
  physicalContractVersion: Phys3ContractVersion;
  geometryDataVersion: string;
  examples: PhysicalValidationReport[];
}

export interface CoolingEvidenceFile {
  physicalContractVersion: Phys3ContractVersion;
  dataVersion: string;
  rows: CoolingEvidenceRecord[];
}
```

Accepted paths:

```text
benchmarks/phys3/
  physical-validation-examples.json
  cooling-evidence.json               # runtime rows empty in Phase 3
```

Examples are test/evidence inputs, not a license to fabricate geometry or
performance values.

## 8. Validation checklist

- [x] Every supported physical-core part has `physicalSpec` and evidence.
- [x] Every declared GLB node exists exactly once with the correct prefix.
- [x] Every visual-only fallback lacks physical coverage and yields
      `unavailable`.
- [x] Mount resolver covers mounted, missing, ambiguous, and invalid-transform
      outcomes.
- [x] Test examples include `fit`, `interference`, and `unavailable`.
- [x] Missing geometry can never aggregate to `fit`.
- [x] Cooling lookup requires an exact assembly/mount/data-version match.
- [x] Runtime cooling evidence rows are empty and the UI reports unavailable.
- [x] Stub-only tests prove hook population without becoming runtime data.
- [x] Existing `vs2`, `compat2`, and `perf1` schemas and behavior remain green.

## 9. Explicitly outside this contract

- Logical compatibility rules, price, URL state, or part selection semantics.
- Geometry beyond box-authored OBBs or collision dependencies beyond existing
  `three`.
- CFD, temperatures, fan curves, or numeric FPS derate tables.
- Free-form transform editing, scale, animation, and mount-state persistence.
- Any additional part ID or category.

/**
 * Phase-3 physical-validation contract types.
 * Authority: docs/phases/phase-3/specs/physical-validation-data-contract.md
 */

export const PHYS3_CONTRACT_VERSION = "phys3" as const;
export type Phys3ContractVersion = typeof PHYS3_CONTRACT_VERSION;

/** Geometry/evidence dataset version for Phase 3 synthetic fixtures. */
export const PHYS3_GEOMETRY_DATA_VERSION = "phys3-exp-20260808" as const;

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
  /** Relative to the resolved socket-to-anchor orientation. xyzw */
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

export type PhysicalValidationStatus =
  | "fit"
  | "interference"
  | "unavailable"
  | "conditional";

export type PhysicalCheckKind = "collision" | "clearance" | "clearance-limit";

export interface PhysicalCheckResult {
  checkId: string;
  kind: PhysicalCheckKind;
  status: PhysicalValidationStatus;
  involvedPartIds: string[];
  involvedNodeNames: string[];
  /** Required for interference, unavailable, and conditional. */
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

/**
 * Ten physical-core part IDs (existing catalog; no inventory expansion).
 * Membership requires authored `physicalSpec` for mount/socket semantics; not
 * every member must expose collision geometry (see B8 CPU package decision).
 */
export const PHYS3_PHYSICAL_CORE_IDS = [
  "case.fractal-design-north-tg-dark",
  "motherboard.gigabyte-b650-aorus-elite-ax-v2",
  "motherboard.gigabyte-b650m-aorus-elite-ax-rev-1-3",
  "cpu.amd-ryzen-5-7600",
  "cpu.amd-ryzen-7-7800x3d",
  "gpu.asus-dual-rtx4070-o12g",
  "gpu.asus-proart-rtx4080-o16g",
  "cooler.noctua-nh-d15-g2",
  "ram.teamgroup-t-create-expert-ddr5-6000-32gb",
  "psu.corsair-rm750e",
] as const;

/** Four visual-only fallback IDs — physical report must be unavailable. */
export const PHYS3_VISUAL_ONLY_IDS = [
  "case.lian-li-a3-matx-black",
  "motherboard.asus-tuf-gaming-b860m-plus-wifi",
  "ram.gskill-trident-z5-rgb-ddr5-8400",
  "psu.cooler-master-v550-sfx-gold",
] as const;

export const PHYS3_COOLER_ORIENTATION_IDS = ["normal", "rotated-180"] as const;

/** Numeric/export overlap epsilon in mm — not a manufacturing tolerance. */
export const PHYS3_OVERLAP_EPSILON_MM = 0.1;

export const PHYSICAL_NODE_PREFIXES = [
  "visual:",
  "collision:",
  "anchor:",
  "socket:",
  "clearance:",
] as const;

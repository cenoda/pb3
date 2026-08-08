import type { Matrix4 } from "three";
import type {
  AllowedContact,
  PhysicalCheckResult,
  PhysicalValidationReport,
  PhysicalValidationStatus,
} from "../../contract/phys3";
import type { GlbPhysicalIndex } from "../indexGlbPhysicalNodes";

/** Pure collision/clearance engine boundary — no React/Zustand/URL/compat/perf. */

export interface WorldBoxNode {
  partId: string;
  nodeName: `collision:${string}` | `clearance:${string}`;
  kind: "collision" | "clearance";
  /** World transform of the part × local node transform. */
  worldMatrix: Matrix4;
  halfExtentsMm: readonly [number, number, number];
  evidenceSourceId: string;
}

export interface CollisionEngineInput {
  collisionNodes: WorldBoxNode[];
  clearanceNodes: WorldBoxNode[];
  allowedContacts: AllowedContact[];
  /** Overlap ≤ epsilonMm is numeric/export noise (inclusive), not interference. */
  overlapEpsilonMm: number;
}

export interface CollisionEngine {
  evaluate(input: CollisionEngineInput): PhysicalCheckResult[];
}

export function aggregatePhysicalStatus(
  checks: PhysicalCheckResult[],
): PhysicalValidationStatus {
  if (checks.some((c) => c.status === "interference")) return "interference";
  if (checks.some((c) => c.status === "unavailable")) return "unavailable";
  return "fit";
}

export type { PhysicalValidationReport, GlbPhysicalIndex };

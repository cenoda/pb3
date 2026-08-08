import { Matrix4 } from "three";
import type { AllowedContact, PhysicalSpec } from "../../contract/phys3";
import type { GlbPhysicalIndex } from "../indexGlbPhysicalNodes";
import type { WorldBoxNode } from "./types";

export interface PartPhysicalPose {
  partId: string;
  worldMatrix: Matrix4;
  spec: PhysicalSpec;
  index: GlbPhysicalIndex;
}

/**
 * Collect declared collision/clearance box nodes at resolved world transforms.
 * Missing/unsupported geometry returns null for that node (caller → unavailable).
 */
export function collectCollisionInputs(posed: PartPhysicalPose[]): {
  collisionNodes: WorldBoxNode[];
  clearanceNodes: WorldBoxNode[];
  allowedContacts: AllowedContact[];
  missing: Array<{ partId: string; nodeName: string; reason: string }>;
} {
  const collisionNodes: WorldBoxNode[] = [];
  const clearanceNodes: WorldBoxNode[] = [];
  const allowedContacts: AllowedContact[] = [];
  const missing: Array<{ partId: string; nodeName: string; reason: string }> =
    [];

  for (const part of posed) {
    if (part.spec.allowedContacts) {
      allowedContacts.push(...part.spec.allowedContacts);
    }

    for (const nodeName of part.spec.collisionNodes) {
      const node = part.index.nodesByName.get(nodeName);
      if (!node || !node.halfExtentsMm) {
        missing.push({
          partId: part.partId,
          nodeName,
          reason: "missing or non-box collision node",
        });
        continue;
      }
      const worldMatrix = new Matrix4()
        .copy(part.worldMatrix)
        .multiply(node.localMatrix);
      collisionNodes.push({
        partId: part.partId,
        nodeName,
        kind: "collision",
        worldMatrix,
        halfExtentsMm: node.halfExtentsMm,
        evidenceSourceId: part.spec.evidence.sourceId,
      });
    }

    for (const nodeName of part.spec.clearanceNodes) {
      const node = part.index.nodesByName.get(nodeName);
      if (!node || !node.halfExtentsMm) {
        missing.push({
          partId: part.partId,
          nodeName,
          reason: "missing or non-box clearance node",
        });
        continue;
      }
      const worldMatrix = new Matrix4()
        .copy(part.worldMatrix)
        .multiply(node.localMatrix);
      clearanceNodes.push({
        partId: part.partId,
        nodeName,
        kind: "clearance",
        worldMatrix,
        halfExtentsMm: node.halfExtentsMm,
        evidenceSourceId: part.spec.evidence.sourceId,
      });
    }
  }

  return { collisionNodes, clearanceNodes, allowedContacts, missing };
}

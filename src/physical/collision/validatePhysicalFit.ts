import { Matrix3, Matrix4, Vector3 } from "three";
import { OBB } from "three/examples/jsm/math/OBB.js";
import type { PhysicalCheckResult } from "../../contract/phys3";
import type { CollisionEngine, CollisionEngineInput, WorldBoxNode } from "./types";

function contactKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function isAllowed(
  allowed: Set<string>,
  nodeA: string,
  nodeB: string,
): boolean {
  return allowed.has(contactKey(nodeA, nodeB));
}

function worldObb(node: WorldBoxNode): OBB {
  const local = new OBB(
    new Vector3(0, 0, 0),
    new Vector3(
      node.halfExtentsMm[0],
      node.halfExtentsMm[1],
      node.halfExtentsMm[2],
    ),
    new Matrix3(),
  );
  return local.clone().applyMatrix4(node.worldMatrix);
}

/**
 * Implementation-only floating-point guard so that an exact `epsilonMm`
 * overlap (surface contact after half-size shrink) is not reported as a hit
 * by Three.js `OBB.intersectsOBB`, which treats contact as intersecting.
 * This is not a manufacturing/physical tolerance and must stay << epsilon.
 */
const OVERLAP_BOUNDARY_FP_GUARD_MM = 1e-9;

/**
 * Strict inclusive epsilon policy:
 *   overlap < epsilonMm  → fit
 *   overlap === epsilonMm → fit
 *   overlap > epsilonMm  → interference
 *
 * Half-sizes are reduced by epsilon/2 each so overlap ≤ epsilon becomes
 * contact-or-gap; the FP guard pushes exact-epsilon contact into a tiny gap.
 */
export function boxesInterfere(
  a: WorldBoxNode,
  b: WorldBoxNode,
  epsilonMm: number,
): boolean {
  const obbA = worldObb(a);
  const obbB = worldObb(b);
  const shrink = epsilonMm / 2 + OVERLAP_BOUNDARY_FP_GUARD_MM;
  obbA.halfSize.x = Math.max(0, obbA.halfSize.x - shrink);
  obbA.halfSize.y = Math.max(0, obbA.halfSize.y - shrink);
  obbA.halfSize.z = Math.max(0, obbA.halfSize.z - shrink);
  obbB.halfSize.x = Math.max(0, obbB.halfSize.x - shrink);
  obbB.halfSize.y = Math.max(0, obbB.halfSize.y - shrink);
  obbB.halfSize.z = Math.max(0, obbB.halfSize.z - shrink);
  return obbA.intersectsOBB(obbB, Number.EPSILON);
}

function checkIdFor(kind: string, a: string, b: string): string {
  const [x, y] = a < b ? [a, b] : [b, a];
  return `${kind}:${x}|${y}`;
}

export function createObbCollisionEngine(): CollisionEngine {
  return {
    evaluate(input: CollisionEngineInput): PhysicalCheckResult[] {
      const checks: PhysicalCheckResult[] = [];
      const allowed = new Set(
        input.allowedContacts.map((c) =>
          contactKey(c.collisionNodeA, c.collisionNodeB),
        ),
      );

      const collisions = input.collisionNodes;
      for (let i = 0; i < collisions.length; i++) {
        for (let j = i + 1; j < collisions.length; j++) {
          const a = collisions[i]!;
          const b = collisions[j]!;
          if (a.partId === b.partId) continue;

          const nodeNames = [a.nodeName, b.nodeName];
          const partIds = [a.partId, b.partId];
          const evidenceSourceIds = [
            ...new Set([a.evidenceSourceId, b.evidenceSourceId]),
          ];

          if (isAllowed(allowed, a.nodeName, b.nodeName)) {
            checks.push({
              checkId: checkIdFor("collision", a.nodeName, b.nodeName),
              kind: "collision",
              status: "fit",
              involvedPartIds: partIds,
              involvedNodeNames: nodeNames,
              evidenceSourceIds,
            });
            continue;
          }

          if (boxesInterfere(a, b, input.overlapEpsilonMm)) {
            checks.push({
              checkId: checkIdFor("collision", a.nodeName, b.nodeName),
              kind: "collision",
              status: "interference",
              involvedPartIds: partIds,
              involvedNodeNames: nodeNames,
              explanation: `Collision solids ${a.nodeName} (${a.partId}) and ${b.nodeName} (${b.partId}) overlap by more than ${input.overlapEpsilonMm} mm.`,
              evidenceSourceIds,
            });
          } else {
            checks.push({
              checkId: checkIdFor("collision", a.nodeName, b.nodeName),
              kind: "collision",
              status: "fit",
              involvedPartIds: partIds,
              involvedNodeNames: nodeNames,
              evidenceSourceIds,
            });
          }
        }
      }

      for (const clearance of input.clearanceNodes) {
        for (const collision of collisions) {
          if (clearance.partId === collision.partId) continue;

          const nodeNames = [clearance.nodeName, collision.nodeName];
          const partIds = [clearance.partId, collision.partId];
          const evidenceSourceIds = [
            ...new Set([
              clearance.evidenceSourceId,
              collision.evidenceSourceId,
            ]),
          ];

          if (boxesInterfere(clearance, collision, input.overlapEpsilonMm)) {
            checks.push({
              checkId: checkIdFor(
                "clearance",
                clearance.nodeName,
                collision.nodeName,
              ),
              kind: "clearance",
              status: "interference",
              involvedPartIds: partIds,
              involvedNodeNames: nodeNames,
              explanation: `Clearance volume ${clearance.nodeName} (${clearance.partId}) is violated by ${collision.nodeName} (${collision.partId}) beyond ${input.overlapEpsilonMm} mm.`,
              evidenceSourceIds,
            });
          } else {
            checks.push({
              checkId: checkIdFor(
                "clearance",
                clearance.nodeName,
                collision.nodeName,
              ),
              kind: "clearance",
              status: "fit",
              involvedPartIds: partIds,
              involvedNodeNames: nodeNames,
              evidenceSourceIds,
            });
          }
        }
      }

      return checks;
    },
  };
}

/** Test helper: axis-aligned world box from center + half extents. */
export function makeWorldBoxNode(
  partId: string,
  nodeName: WorldBoxNode["nodeName"],
  kind: WorldBoxNode["kind"],
  center: readonly [number, number, number],
  halfExtentsMm: readonly [number, number, number],
  evidenceSourceId = "test",
): WorldBoxNode {
  const worldMatrix = new Matrix4().setPosition(
    center[0],
    center[1],
    center[2],
  );
  return {
    partId,
    nodeName,
    kind,
    worldMatrix,
    halfExtentsMm,
    evidenceSourceId,
  };
}

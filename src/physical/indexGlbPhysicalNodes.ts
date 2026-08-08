import { Matrix4, Quaternion, Vector3 } from "three";
import type { PhysicalSpec } from "../contract/phys3";

export interface IndexedPhysicalNode {
  name: string;
  /** Local transform relative to the GLB root / part origin. */
  localMatrix: Matrix4;
  translation: readonly [number, number, number];
  rotation: readonly [number, number, number, number];
  /** Half-extents in local mm for box collision/clearance nodes; null for empty nodes. */
  halfExtentsMm: readonly [number, number, number] | null;
  hasMesh: boolean;
}

export interface GlbPhysicalIndex {
  partId: string;
  nodesByName: Map<string, IndexedPhysicalNode>;
  allNodeNames: string[];
}

function readU32LE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset]! |
      (bytes[offset + 1]! << 8) |
      (bytes[offset + 2]! << 16) |
      (bytes[offset + 3]! << 24)) >>>
    0
  );
}

function parseGlbJson(glbBytes: Uint8Array): {
  nodes: Array<{
    name?: string;
    mesh?: number;
    translation?: number[];
    rotation?: number[];
    scale?: number[];
    children?: number[];
  }>;
  meshes?: Array<{
    primitives: Array<{
      attributes: { POSITION: number };
    }>;
  }>;
  accessors?: Array<{
    min?: number[];
    max?: number[];
    type: string;
  }>;
} {
  if (glbBytes.length < 20) {
    throw new Error("GLB too short");
  }
  const magic = String.fromCharCode(
    glbBytes[0]!,
    glbBytes[1]!,
    glbBytes[2]!,
    glbBytes[3]!,
  );
  if (magic !== "glTF") {
    throw new Error("Not a glTF binary");
  }
  const jsonLength = readU32LE(glbBytes, 12);
  const jsonType = String.fromCharCode(
    glbBytes[16]!,
    glbBytes[17]!,
    glbBytes[18]!,
    glbBytes[19]!,
  );
  if (!jsonType.startsWith("JSON")) {
    throw new Error("GLB missing JSON chunk");
  }
  const jsonBytes = glbBytes.subarray(20, 20 + jsonLength);
  const jsonText = new TextDecoder("utf-8").decode(jsonBytes);
  return JSON.parse(jsonText) as ReturnType<typeof parseGlbJson>;
}

function nodeLocalMatrix(node: {
  translation?: number[];
  rotation?: number[];
  scale?: number[];
}): {
  matrix: Matrix4;
  translation: [number, number, number];
  rotation: [number, number, number, number];
} {
  const t = node.translation ?? [0, 0, 0];
  const r = node.rotation ?? [0, 0, 0, 1];
  const s = node.scale ?? [1, 1, 1];

  if (
    !t.every(Number.isFinite) ||
    !r.every(Number.isFinite) ||
    !s.every(Number.isFinite)
  ) {
    throw new Error("non-finite node transform");
  }

  const eps = 1e-6;
  if (
    Math.abs(s[0]! - 1) > eps ||
    Math.abs(s[1]! - 1) > eps ||
    Math.abs(s[2]! - 1) > eps
  ) {
    throw new Error("unsupported non-identity node scale");
  }

  const matrix = new Matrix4().compose(
    new Vector3(t[0], t[1], t[2]),
    new Quaternion(r[0], r[1], r[2], r[3]),
    new Vector3(1, 1, 1),
  );

  return {
    matrix,
    translation: [t[0]!, t[1]!, t[2]!],
    rotation: [r[0]!, r[1]!, r[2]!, r[3]!],
  };
}

function halfExtentsFromAccessor(
  gltf: ReturnType<typeof parseGlbJson>,
  meshIndex: number,
): [number, number, number] | null {
  const mesh = gltf.meshes?.[meshIndex];
  const accessorIndex = mesh?.primitives[0]?.attributes.POSITION;
  if (accessorIndex === undefined) return null;
  const accessor = gltf.accessors?.[accessorIndex];
  if (!accessor?.min || !accessor?.max || accessor.type !== "VEC3") return null;
  const hx = (accessor.max[0]! - accessor.min[0]!) / 2;
  const hy = (accessor.max[1]! - accessor.min[1]!) / 2;
  const hz = (accessor.max[2]! - accessor.min[2]!) / 2;
  if (![hx, hy, hz].every(Number.isFinite) || hx <= 0 || hy <= 0 || hz <= 0) {
    return null;
  }
  return [hx, hy, hz];
}

/**
 * Index physical/visual nodes from a GLB without rendering.
 * Fails closed on missing/duplicate names or unsupported scale.
 */
export function indexGlbPhysicalNodesFromBytes(
  partId: string,
  glbBytes: Uint8Array,
): GlbPhysicalIndex {
  const gltf = parseGlbJson(glbBytes);
  const nodesByName = new Map<string, IndexedPhysicalNode>();
  const allNodeNames: string[] = [];

  for (const node of gltf.nodes ?? []) {
    if (!node.name) {
      throw new Error(`${partId}: unnamed GLB node`);
    }
    if (nodesByName.has(node.name)) {
      throw new Error(`${partId}: duplicate GLB node name ${node.name}`);
    }
    const { matrix, translation, rotation } = nodeLocalMatrix(node);
    const hasMesh = node.mesh !== undefined;
    const halfExtentsMm =
      hasMesh && node.mesh !== undefined
        ? halfExtentsFromAccessor(gltf, node.mesh)
        : null;

    const indexed: IndexedPhysicalNode = {
      name: node.name,
      localMatrix: matrix,
      translation,
      rotation,
      halfExtentsMm,
      hasMesh,
    };
    nodesByName.set(node.name, indexed);
    allNodeNames.push(node.name);
  }

  return { partId, nodesByName, allNodeNames };
}

export function validatePhysicalSpecAgainstGlb(
  partId: string,
  spec: PhysicalSpec,
  index: GlbPhysicalIndex,
): string[] {
  const errors: string[] = [];
  const declared = [
    ...spec.anchors.map((a) => a.nodeName),
    ...spec.sockets.map((s) => s.nodeName),
    ...spec.collisionNodes,
    ...spec.clearanceNodes,
  ];

  for (const name of declared) {
    const node = index.nodesByName.get(name);
    if (!node) {
      errors.push(`${partId}: declared node missing in GLB: ${name}`);
      continue;
    }
    if (name.startsWith("collision:") || name.startsWith("clearance:")) {
      if (!node.hasMesh || !node.halfExtentsMm) {
        errors.push(
          `${partId}: ${name} must be a box mesh with finite half-extents`,
        );
      }
    }
  }

  const physicalPrefixNodes = index.allNodeNames.filter((n) =>
    /^(collision|anchor|socket|clearance):/.test(n),
  );
  for (const name of physicalPrefixNodes) {
    if (!declared.includes(name as never)) {
      errors.push(
        `${partId}: unreferenced physical-prefix node in GLB: ${name}`,
      );
    }
  }

  const visualNodes = index.allNodeNames.filter((n) => n.startsWith("visual:"));
  if (visualNodes.length < 1) {
    errors.push(`${partId}: missing visual:* node`);
  }

  return errors;
}

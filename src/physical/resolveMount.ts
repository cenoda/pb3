import { Matrix4, Quaternion, Vector3 } from "three";
import type { PartDefinitionV2 } from "../contract/partV2";
import type {
  MountResolution,
  MountSelection,
  MountTransform,
  PhysicalEvidenceRef,
} from "../contract/phys3";
import type { GlbPhysicalIndex } from "./indexGlbPhysicalNodes";
import { loadPhysicalSpec } from "./loadPhysicalSpec";

export interface MountResolveContext {
  movingPart: PartDefinitionV2;
  targetPart: PartDefinitionV2;
  movingIndex: GlbPhysicalIndex | null;
  targetIndex: GlbPhysicalIndex | null;
  preferredAnchorId?: string;
  preferredSocketId?: string;
  preferredOrientationId?: string;
  /** World transform of the target (parent) part. Identity if root. */
  targetWorldMatrix: Matrix4;
}

function unavailable(
  movingPartId: string,
  reason: Extract<MountResolution, { status: "unavailable" }>["reason"],
  explanation: string,
  involvedNodeNames: string[] = [],
): MountResolution {
  return {
    status: "unavailable",
    movingPartId,
    reason,
    explanation,
    involvedNodeNames,
  };
}

function matrixToMountTransform(matrix: Matrix4): MountTransform | null {
  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  matrix.decompose(position, quaternion, scale);

  if (
    ![position.x, position.y, position.z].every(Number.isFinite) ||
    ![quaternion.x, quaternion.y, quaternion.z, quaternion.w].every(
      Number.isFinite,
    )
  ) {
    return null;
  }

  const eps = 1e-5;
  if (
    Math.abs(scale.x - 1) > eps ||
    Math.abs(scale.y - 1) > eps ||
    Math.abs(scale.z - 1) > eps
  ) {
    return null;
  }

  return {
    positionMm: [position.x, position.y, position.z],
    orientationQuaternion: [
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w,
    ],
  };
}

/**
 * Resolve one moving part onto a target using declared interface IDs and
 * exact node references. Transform:
 *   targetAnchorWorld × inverse(socketLocal) × orientationOffset
 */
export function resolveMount(ctx: MountResolveContext): MountResolution {
  const movingId = ctx.movingPart.id;
  const movingSpec = loadPhysicalSpec(ctx.movingPart);
  const targetSpec = loadPhysicalSpec(ctx.targetPart);

  if (!movingSpec) {
    return unavailable(
      movingId,
      "missing_physical_spec",
      `Moving part ${movingId} has no physicalSpec (visual-only or unsupported).`,
    );
  }
  if (!targetSpec) {
    return unavailable(
      movingId,
      "missing_physical_spec",
      `Target part ${ctx.targetPart.id} has no physicalSpec.`,
    );
  }
  if (!ctx.movingIndex || !ctx.targetIndex) {
    return unavailable(
      movingId,
      "unsupported_geometry",
      `GLB physical index missing for ${movingId} or ${ctx.targetPart.id}.`,
    );
  }

  if (movingSpec.sockets.length === 0) {
    return unavailable(
      movingId,
      "no_candidate",
      `Moving part ${movingId} declares no sockets.`,
    );
  }

  let socketDef = movingSpec.sockets.find(
    (s) => s.socketId === ctx.preferredSocketId,
  );
  if (!socketDef) {
    if (ctx.preferredSocketId) {
      return unavailable(
        movingId,
        "no_candidate",
        `Preferred socket ${ctx.preferredSocketId} not found on ${movingId}.`,
      );
    }
    if (movingSpec.sockets.length === 1) {
      socketDef = movingSpec.sockets[0];
    } else {
      return unavailable(
        movingId,
        "ambiguous_candidate",
        `Multiple sockets on ${movingId}; provide an explicit socket selection.`,
        movingSpec.sockets.map((s) => s.nodeName),
      );
    }
  }

  if (socketDef.targetPartCategory !== ctx.targetPart.category) {
    return unavailable(
      movingId,
      "interface_mismatch",
      `Socket ${socketDef.socketId} targets category ${socketDef.targetPartCategory}, got ${ctx.targetPart.category}.`,
      [socketDef.nodeName],
    );
  }

  const matchingAnchors = targetSpec.anchors.filter(
    (a) =>
      a.mountInterfaceId === socketDef!.mountInterfaceId &&
      a.acceptsPartCategory === ctx.movingPart.category,
  );

  if (matchingAnchors.length === 0) {
    return unavailable(
      movingId,
      "no_candidate",
      `No anchor on ${ctx.targetPart.id} matches interface ${socketDef.mountInterfaceId} for category ${ctx.movingPart.category}.`,
      [socketDef.nodeName],
    );
  }

  let anchorDef = matchingAnchors.find(
    (a) => a.anchorId === ctx.preferredAnchorId,
  );
  if (!anchorDef) {
    if (ctx.preferredAnchorId) {
      return unavailable(
        movingId,
        "no_candidate",
        `Preferred anchor ${ctx.preferredAnchorId} not found among matching anchors.`,
        matchingAnchors.map((a) => a.nodeName),
      );
    }
    const defaults = matchingAnchors.filter((a) => a.isDefault);
    if (defaults.length === 1) {
      anchorDef = defaults[0];
    } else if (matchingAnchors.length === 1) {
      anchorDef = matchingAnchors[0];
    } else {
      return unavailable(
        movingId,
        "ambiguous_candidate",
        `Ambiguous anchors on ${ctx.targetPart.id} for interface ${socketDef.mountInterfaceId}.`,
        matchingAnchors.map((a) => a.nodeName),
      );
    }
  }

  if (anchorDef.mountInterfaceId !== socketDef.mountInterfaceId) {
    return unavailable(
      movingId,
      "interface_mismatch",
      `Anchor ${anchorDef.anchorId} interface ${anchorDef.mountInterfaceId} ≠ socket ${socketDef.mountInterfaceId}.`,
      [anchorDef.nodeName, socketDef.nodeName],
    );
  }

  let orientation = socketDef.orientationVariants.find(
    (o) => o.orientationId === ctx.preferredOrientationId,
  );
  if (!orientation) {
    if (ctx.preferredOrientationId) {
      return unavailable(
        movingId,
        "no_candidate",
        `Orientation ${ctx.preferredOrientationId} is not declared on socket ${socketDef.socketId}.`,
        [socketDef.nodeName],
      );
    }
    orientation = socketDef.orientationVariants.find((o) => o.isDefault);
    if (!orientation) {
      return unavailable(
        movingId,
        "no_candidate",
        `Socket ${socketDef.socketId} has no default orientation.`,
        [socketDef.nodeName],
      );
    }
  }

  const socketNode = ctx.movingIndex.nodesByName.get(socketDef.nodeName);
  if (!socketNode) {
    return unavailable(
      movingId,
      "missing_socket_node",
      `Socket node ${socketDef.nodeName} missing in ${movingId} GLB.`,
      [socketDef.nodeName],
    );
  }

  const anchorNode = ctx.targetIndex.nodesByName.get(anchorDef.nodeName);
  if (!anchorNode) {
    return unavailable(
      movingId,
      "missing_anchor_node",
      `Anchor node ${anchorDef.nodeName} missing in ${ctx.targetPart.id} GLB.`,
      [anchorDef.nodeName],
    );
  }

  try {
    const anchorWorld = new Matrix4()
      .copy(ctx.targetWorldMatrix)
      .multiply(anchorNode.localMatrix);

    const invSocket = new Matrix4().copy(socketNode.localMatrix).invert();
    const offset = new Matrix4().makeRotationFromQuaternion(
      new Quaternion(
        orientation.offsetQuaternion[0],
        orientation.offsetQuaternion[1],
        orientation.offsetQuaternion[2],
        orientation.offsetQuaternion[3],
      ),
    );

    const partWorld = new Matrix4()
      .copy(anchorWorld)
      .multiply(invSocket)
      .multiply(offset);

    const transform = matrixToMountTransform(partWorld);
    if (!transform) {
      return unavailable(
        movingId,
        "invalid_transform",
        `Resolved mount transform for ${movingId} is non-finite or non-identity scale.`,
        [anchorDef.nodeName, socketDef.nodeName],
      );
    }

    const selection: MountSelection = {
      movingPartId: movingId,
      socketId: socketDef.socketId,
      targetPartId: ctx.targetPart.id,
      anchorId: anchorDef.anchorId,
      orientationId: orientation.orientationId,
    };

    const evidence: PhysicalEvidenceRef[] = [
      movingSpec.evidence,
      targetSpec.evidence,
    ];

    return {
      status: "mounted",
      selection,
      transform,
      evidence,
    };
  } catch (error) {
    return unavailable(
      movingId,
      "invalid_transform",
      `Failed to compose mount transform for ${movingId}: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
      [anchorDef.nodeName, socketDef.nodeName],
    );
  }
}

export function mountTransformToMatrix(transform: MountTransform): Matrix4 {
  return new Matrix4().compose(
    new Vector3(...transform.positionMm),
    new Quaternion(...transform.orientationQuaternion),
    new Vector3(1, 1, 1),
  );
}

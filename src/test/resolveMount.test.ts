import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Matrix4 } from "three";
import { describe, expect, it } from "vitest";
import type { PartDefinitionV2 } from "../contract/partV2";
import { catalogManifestFileSchema } from "../contract/cat6.schema";
import { DEFAULT_BUILD_STATE_V2 } from "../contract/vs2";
import { partDefinitionV2Schema } from "../contract/vs2.schema";
import { buildAssemblyState } from "../physical/buildAssemblyState";
import {
  indexGlbPhysicalNodesFromPath,
  type GlbPhysicalIndex,
} from "../physical/indexGlbPhysicalNodes.node";
import {
  assertAcyclicMountGraph,
  hasMountGraphCycle,
} from "../physical/mountGraph";
import { resolveMount } from "../physical/resolveMount";
import { createPartCatalog } from "../state/validateBuildState";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function loadCatalogAndIndexes() {
  const manifest = catalogManifestFileSchema.parse(
    JSON.parse(
      fs.readFileSync(
        path.join(repoRoot, "parts/catalog-manifest.json"),
        "utf8",
      ),
    ),
  );
  const parts = manifest.parts.map((entry) => {
    const raw = JSON.parse(
      fs.readFileSync(path.join(repoRoot, entry.path), "utf8"),
    );
    return partDefinitionV2Schema.parse(raw);
  });
  const catalog = createPartCatalog(parts);
  const indexes = new Map<string, GlbPhysicalIndex>();
  for (const part of parts) {
    if (!part.physicalSpec) continue;
    indexes.set(
      part.id,
      indexGlbPhysicalNodesFromPath(
        part.id,
        path.join(repoRoot, part.modelGlbPath),
      ),
    );
  }
  return { catalog, indexes };
}

describe("resolveMount / buildAssemblyState", () => {
  it("mounts the default supported assembly deterministically", () => {
    const { catalog, indexes } = loadCatalogAndIndexes();
    const assembly = buildAssemblyState(
      DEFAULT_BUILD_STATE_V2,
      catalog,
      indexes,
    );
    expect(assembly.allMounted).toBe(true);
    expect(assembly.assemblyState.mountSelections.length).toBe(6);

    const mb = assembly.parts.find((p) => p.partId === "motherboard.gigabyte-b650-aorus-elite-ax-v2");
    expect(mb?.transform?.positionMm).toEqual([0, 20, -40]);
    expect(mb?.transform?.orientationQuaternion).toEqual([0, 0, 0, 1]);

    const cooler = assembly.parts.find(
      (p) => p.partId === "cooler.noctua-nh-d15-g2",
    );
    expect(cooler?.resolution?.status).toBe("mounted");
    if (cooler?.resolution?.status === "mounted") {
      expect(cooler.resolution.selection.orientationId).toBe("normal");
    }
  });

  it("applies cooler rotated-180 orientation offset", () => {
    const { catalog, indexes } = loadCatalogAndIndexes();
    const normal = buildAssemblyState(
      DEFAULT_BUILD_STATE_V2,
      catalog,
      indexes,
      { coolerOrientationId: "normal" },
    );
    const rotated = buildAssemblyState(
      DEFAULT_BUILD_STATE_V2,
      catalog,
      indexes,
      { coolerOrientationId: "rotated-180" },
    );

    const n = normal.parts.find((p) => p.partId === "cooler.noctua-nh-d15-g2");
    const r = rotated.parts.find(
      (p) => p.partId === "cooler.noctua-nh-d15-g2",
    );
    expect(n?.transform).toBeTruthy();
    expect(r?.transform).toBeTruthy();
    expect(n!.transform!.orientationQuaternion).not.toEqual(
      r!.transform!.orientationQuaternion,
    );
    expect(r!.transform!.orientationQuaternion[1]).toBeCloseTo(1, 5);
  });

  it("returns missing_physical_spec for visual-only parts", () => {
    const { catalog, indexes } = loadCatalogAndIndexes();
    const assembly = buildAssemblyState(
      {
        ...DEFAULT_BUILD_STATE_V2,
        motherboardId: "motherboard.asus-tuf-gaming-b860m-plus-wifi",
      },
      catalog,
      indexes,
    );
    expect(assembly.allMounted).toBe(false);
    const mb = assembly.parts.find((p) => p.partId === "motherboard.asus-tuf-gaming-b860m-plus-wifi");
    expect(mb?.resolution?.status).toBe("unavailable");
    if (mb?.resolution?.status === "unavailable") {
      expect(mb.resolution.reason).toBe("missing_physical_spec");
    }
  });

  it("covers mount unavailable families via resolveMount", () => {
    const { catalog, indexes } = loadCatalogAndIndexes();
    const cooler = catalog.get("cooler.noctua-nh-d15-g2")!;
    const mb = catalog.get("motherboard.gigabyte-b650-aorus-elite-ax-v2")!;
    const visualMb = catalog.get("motherboard.asus-tuf-gaming-b860m-plus-wifi")!;
    const casePart = catalog.get("case.fractal-design-north-tg-dark")!;

    // missing_physical_spec
    const missingSpec = resolveMount({
      movingPart: visualMb,
      targetPart: casePart,
      movingIndex: null,
      targetIndex: indexes.get(casePart.id)!,
      targetWorldMatrix: new Matrix4(),
    });
    expect(missingSpec.status).toBe("unavailable");
    if (missingSpec.status === "unavailable") {
      expect(missingSpec.reason).toBe("missing_physical_spec");
    }

    // unsupported_geometry (null GLB index)
    const unsupported = resolveMount({
      movingPart: cooler,
      targetPart: mb,
      movingIndex: null,
      targetIndex: indexes.get(mb.id)!,
      targetWorldMatrix: new Matrix4(),
    });
    expect(unsupported.status).toBe("unavailable");
    if (unsupported.status === "unavailable") {
      expect(unsupported.reason).toBe("unsupported_geometry");
    }

    // no_candidate (unknown orientation)
    const badOrientation = resolveMount({
      movingPart: cooler,
      targetPart: mb,
      movingIndex: indexes.get(cooler.id)!,
      targetIndex: indexes.get(mb.id)!,
      preferredOrientationId: "not-a-real-orientation",
      targetWorldMatrix: new Matrix4(),
    });
    expect(badOrientation.status).toBe("unavailable");
    if (badOrientation.status === "unavailable") {
      expect(badOrientation.reason).toBe("no_candidate");
    }

    // interface_mismatch / no_candidate when mounting cooler onto case
    const mismatch = resolveMount({
      movingPart: cooler,
      targetPart: casePart,
      movingIndex: indexes.get(cooler.id)!,
      targetIndex: indexes.get(casePart.id)!,
      targetWorldMatrix: new Matrix4(),
    });
    expect(mismatch.status).toBe("unavailable");
    if (mismatch.status === "unavailable") {
      expect(["interface_mismatch", "no_candidate"]).toContain(mismatch.reason);
    }

    // missing_socket_node
    const coolerIndex = indexes.get(cooler.id)!;
    const missingSocketIndex: GlbPhysicalIndex = {
      partId: cooler.id,
      nodesByName: new Map(coolerIndex.nodesByName),
      allNodeNames: coolerIndex.allNodeNames.filter(
        (n: string) => n !== "socket:motherboard",
      ),
    };
    missingSocketIndex.nodesByName.delete("socket:motherboard");
    const missingSocket = resolveMount({
      movingPart: cooler,
      targetPart: mb,
      movingIndex: missingSocketIndex,
      targetIndex: indexes.get(mb.id)!,
      targetWorldMatrix: new Matrix4(),
    });
    expect(missingSocket.status).toBe("unavailable");
    if (missingSocket.status === "unavailable") {
      expect(missingSocket.reason).toBe("missing_socket_node");
    }

    // missing_anchor_node
    const mbIndex = indexes.get(mb.id)!;
    const missingAnchorIndex: GlbPhysicalIndex = {
      partId: mb.id,
      nodesByName: new Map(mbIndex.nodesByName),
      allNodeNames: mbIndex.allNodeNames.filter(
        (n: string) => n !== "anchor:cooler",
      ),
    };
    missingAnchorIndex.nodesByName.delete("anchor:cooler");
    const missingAnchor = resolveMount({
      movingPart: cooler,
      targetPart: mb,
      movingIndex: indexes.get(cooler.id)!,
      targetIndex: missingAnchorIndex,
      targetWorldMatrix: new Matrix4(),
    });
    expect(missingAnchor.status).toBe("unavailable");
    if (missingAnchor.status === "unavailable") {
      expect(missingAnchor.reason).toBe("missing_anchor_node");
    }

    // ambiguous_candidate — two default cooler-capable anchors on distinct nodes
    const ambiguousMb: PartDefinitionV2 = {
      ...mb,
      physicalSpec: {
        ...mb.physicalSpec!,
        anchors: [
          {
            anchorId: "anchor.cooler-a",
            nodeName: "anchor:cooler",
            mountInterfaceId: "iface.mb-cooler.am5",
            acceptsPartCategory: "cooler",
            isDefault: true,
          },
          {
            anchorId: "anchor.cooler-b",
            nodeName: "anchor:cpu",
            mountInterfaceId: "iface.mb-cooler.am5",
            acceptsPartCategory: "cooler",
            isDefault: true,
          },
        ],
      },
    };
    const ambiguous = resolveMount({
      movingPart: cooler,
      targetPart: ambiguousMb,
      movingIndex: indexes.get(cooler.id)!,
      targetIndex: indexes.get(mb.id)!,
      targetWorldMatrix: new Matrix4(),
    });
    expect(ambiguous.status).toBe("unavailable");
    if (ambiguous.status === "unavailable") {
      expect(ambiguous.reason).toBe("ambiguous_candidate");
    }

    // invalid_transform — non-identity authored socket scale in the GLB index
    const coolerIndexFull = indexes.get(cooler.id)!;
    const socketNode = coolerIndexFull.nodesByName.get("socket:motherboard")!;
    const scaledSocketIndex: GlbPhysicalIndex = {
      partId: cooler.id,
      nodesByName: new Map(coolerIndexFull.nodesByName),
      allNodeNames: coolerIndexFull.allNodeNames,
    };
    scaledSocketIndex.nodesByName.set("socket:motherboard", {
      ...socketNode,
      localMatrix: new Matrix4().makeScale(2, 1, 1),
    });
    const invalid = resolveMount({
      movingPart: cooler,
      targetPart: mb,
      movingIndex: scaledSocketIndex,
      targetIndex: indexes.get(mb.id)!,
      targetWorldMatrix: new Matrix4(),
    });
    expect(invalid.status).toBe("unavailable");
    if (invalid.status === "unavailable") {
      expect(invalid.reason).toBe("invalid_transform");
    }
  });

  it("validates production mount graph is a DAG and detects synthetic cycles", () => {
    expect(
      hasMountGraphCycle([
        { nodeId: "case", parentId: null },
        { nodeId: "motherboard", parentId: "case" },
        { nodeId: "cpu", parentId: "motherboard" },
        { nodeId: "gpu", parentId: "motherboard" },
        { nodeId: "cooler", parentId: "motherboard" },
        { nodeId: "ram", parentId: "motherboard" },
        { nodeId: "psu", parentId: "case" },
      ]),
    ).toBe(false);

    expect(
      hasMountGraphCycle([
        { nodeId: "a", parentId: "b" },
        { nodeId: "b", parentId: "a" },
      ]),
    ).toBe(true);

    expect(() =>
      assertAcyclicMountGraph([
        { nodeId: "a", parentId: "b" },
        { nodeId: "b", parentId: "a" },
      ]),
    ).toThrow(/cycle/i);
  });
});

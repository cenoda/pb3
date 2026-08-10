import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Matrix4, Quaternion, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { PHYS3_OVERLAP_EPSILON_MM } from "../contract/phys3";
import { catalogManifestFileSchema } from "../contract/cat6.schema";
import { DEFAULT_BUILD_STATE_V2 } from "../contract/vs2";
import { partDefinitionV2Schema } from "../contract/vs2.schema";
import { buildAssemblyState } from "../physical/buildAssemblyState";
import { buildPhysicalValidationReport } from "../physical/buildPhysicalValidationReport";
import {
  indexGlbPhysicalNodesFromPath,
  type GlbPhysicalIndex,
} from "../physical/indexGlbPhysicalNodes.node";
import { aggregatePhysicalStatus } from "../physical/collision/types";
import type { WorldBoxNode } from "../physical/collision/types";
import {
  boxesInterfere,
  createObbCollisionEngine,
  makeWorldBoxNode,
} from "../physical/collision/validatePhysicalFit";
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

function aabbPairForOverlap(overlapMm: number): [WorldBoxNode, WorldBoxNode] {
  const half = 10;
  const a = makeWorldBoxNode(
    "a",
    "collision:a",
    "collision",
    [0, 0, 0],
    [half, half, half],
  );
  const b = makeWorldBoxNode(
    "b",
    "collision:b",
    "collision",
    [2 * half - overlapMm, 0, 0],
    [half, half, half],
  );
  return [a, b];
}

function engineStatusForOverlap(overlapMm: number): "fit" | "interference" {
  const [a, b] = aabbPairForOverlap(overlapMm);
  const checks = createObbCollisionEngine().evaluate({
    collisionNodes: [a, b],
    clearanceNodes: [],
    allowedContacts: [],
    overlapEpsilonMm: PHYS3_OVERLAP_EPSILON_MM,
  });
  return checks[0]!.status === "interference" ? "interference" : "fit";
}

describe("physicalValidation", () => {
  it("default assembly overall status is fit", () => {
    const { catalog, indexes } = loadCatalogAndIndexes();
    const assembly = buildAssemblyState(
      DEFAULT_BUILD_STATE_V2,
      catalog,
      indexes,
    );
    const report = buildPhysicalValidationReport({
      assembly,
      partsById: catalog.byId,
      glbIndexes: indexes,
    });
    expect(report.overallStatus).toBe("fit");
    expect(report.checks.every((c) => c.status === "fit")).toBe(true);
  });

  it("cooler rotated-180 produces clearance interference", () => {
    const { catalog, indexes } = loadCatalogAndIndexes();
    const assembly = buildAssemblyState(
      DEFAULT_BUILD_STATE_V2,
      catalog,
      indexes,
      { coolerOrientationId: "rotated-180" },
    );
    const report = buildPhysicalValidationReport({
      assembly,
      partsById: catalog.byId,
      glbIndexes: indexes,
    });
    expect(report.overallStatus).toBe("interference");
    expect(
      report.checks.some(
        (c) =>
          c.status === "interference" &&
          c.kind === "clearance" &&
          c.involvedNodeNames.includes("clearance:cooler-sidekeepout"),
      ),
    ).toBe(true);
  });

  it("visual-only selection yields unavailable aggregate", () => {
    const { catalog, indexes } = loadCatalogAndIndexes();
    const assembly = buildAssemblyState(
      {
        ...DEFAULT_BUILD_STATE_V2,
        ramId: "ram.gskill-trident-z5-rgb-ddr5-8400",
      },
      catalog,
      indexes,
    );
    const report = buildPhysicalValidationReport({
      assembly,
      partsById: catalog.byId,
      glbIndexes: indexes,
    });
    expect(report.overallStatus).toBe("unavailable");
  });

  it("inclusive 0.1 mm overlap boundary: 0.099/0.100 fit, 0.101 interference", () => {
    expect(engineStatusForOverlap(0.099)).toBe("fit");
    expect(engineStatusForOverlap(0.1)).toBe("fit");
    expect(engineStatusForOverlap(0.101)).toBe("interference");

    const [a099, b099] = aabbPairForOverlap(0.099);
    const [a100, b100] = aabbPairForOverlap(0.1);
    const [a101, b101] = aabbPairForOverlap(0.101);
    expect(boxesInterfere(a099, b099, PHYS3_OVERLAP_EPSILON_MM)).toBe(false);
    expect(boxesInterfere(a100, b100, PHYS3_OVERLAP_EPSILON_MM)).toBe(false);
    expect(boxesInterfere(a101, b101, PHYS3_OVERLAP_EPSILON_MM)).toBe(true);
  });

  it("rotated OBB interference and exact allowed contacts remain green", () => {
    const engine = createObbCollisionEngine();

    const a: WorldBoxNode = {
      partId: "a",
      nodeName: "collision:a",
      kind: "collision",
      worldMatrix: new Matrix4().identity(),
      halfExtentsMm: [10, 10, 10],
      evidenceSourceId: "test",
    };
    const b: WorldBoxNode = {
      partId: "b",
      nodeName: "collision:b",
      kind: "collision",
      worldMatrix: new Matrix4().compose(
        new Vector3(8, 0, 0),
        new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 4),
        new Vector3(1, 1, 1),
      ),
      halfExtentsMm: [10, 10, 10],
      evidenceSourceId: "test",
    };

    expect(boxesInterfere(a, b, PHYS3_OVERLAP_EPSILON_MM)).toBe(true);

    const hit = engine.evaluate({
      collisionNodes: [a, b],
      clearanceNodes: [],
      allowedContacts: [],
      overlapEpsilonMm: PHYS3_OVERLAP_EPSILON_MM,
    });
    expect(hit[0]?.status).toBe("interference");

    const allowed = engine.evaluate({
      collisionNodes: [a, b],
      clearanceNodes: [],
      allowedContacts: [
        {
          collisionNodeA: "collision:a",
          collisionNodeB: "collision:b",
          reason: "test exemption",
        },
      ],
      overlapEpsilonMm: PHYS3_OVERLAP_EPSILON_MM,
    });
    expect(allowed[0]?.status).toBe("fit");
  });

  it("clearance volume interference and aggregate precedence", () => {
    const engine = createObbCollisionEngine();
    const collision = makeWorldBoxNode(
      "cooler",
      "collision:cooler-body",
      "collision",
      [0, 0, 0],
      [10, 10, 10],
    );
    const clearance = makeWorldBoxNode(
      "case",
      "clearance:keepout",
      "clearance",
      [5, 0, 0],
      [10, 10, 10],
    );
    const checks = engine.evaluate({
      collisionNodes: [collision],
      clearanceNodes: [clearance],
      allowedContacts: [],
      overlapEpsilonMm: PHYS3_OVERLAP_EPSILON_MM,
    });
    expect(
      checks.some((c) => c.kind === "clearance" && c.status === "interference"),
    ).toBe(true);

    expect(
      aggregatePhysicalStatus([
        {
          checkId: "1",
          kind: "collision",
          status: "fit",
          involvedPartIds: ["a"],
          involvedNodeNames: ["collision:a"],
          evidenceSourceIds: [],
        },
        {
          checkId: "2",
          kind: "collision",
          status: "unavailable",
          involvedPartIds: ["b"],
          involvedNodeNames: ["collision:b"],
          explanation: "missing",
          evidenceSourceIds: [],
        },
        {
          checkId: "3",
          kind: "clearance",
          status: "interference",
          involvedPartIds: ["c"],
          involvedNodeNames: ["clearance:c"],
          explanation: "hit",
          evidenceSourceIds: [],
        },
      ]),
    ).toBe("interference");

    expect(
      aggregatePhysicalStatus([
        {
          checkId: "1",
          kind: "collision",
          status: "fit",
          involvedPartIds: ["a"],
          involvedNodeNames: ["collision:a"],
          evidenceSourceIds: [],
        },
        {
          checkId: "2",
          kind: "collision",
          status: "unavailable",
          involvedPartIds: ["b"],
          involvedNodeNames: ["collision:b"],
          explanation: "missing",
          evidenceSourceIds: [],
        },
      ]),
    ).toBe("unavailable");
  });
});

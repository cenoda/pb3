import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  PHYS3_GEOMETRY_DATA_VERSION,
  PHYS3_PHYSICAL_CORE_IDS,
  PHYS3_VISUAL_ONLY_IDS,
} from "../contract/phys3";
import { physicalSpecSchema } from "../contract/phys3.schema";
import { partDefinitionV2Schema } from "../contract/vs2.schema";
import { indexGlbPhysicalNodesFromPath } from "../physical/indexGlbPhysicalNodes.node";
import { validatePhysicalSpecAgainstGlb } from "../physical/indexGlbPhysicalNodes";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function partJsonPath(partId: string): string {
  const categoryDir =
    partId.startsWith("mb.")
      ? "motherboard"
      : partId.startsWith("case.")
        ? "case"
        : partId.startsWith("cpu.")
          ? "cpu"
          : partId.startsWith("gpu.")
            ? "gpu"
            : partId.startsWith("cooler.")
              ? "cooler"
              : partId.startsWith("ram.")
                ? "ram"
                : "psu";
  return path.join(repoRoot, "parts", categoryDir, partId, "part.json");
}

describe("phys3 fixture integrity", () => {
  it("indexes every physical-core GLB and validates declared nodes", () => {
    const allErrors: string[] = [];

    for (const partId of PHYS3_PHYSICAL_CORE_IDS) {
      const jsonPath = partJsonPath(partId);
      const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      const part = partDefinitionV2Schema.parse(raw);
      expect(part.physicalSpec).toBeDefined();
      const spec = physicalSpecSchema.parse(part.physicalSpec);
      expect(spec.evidence.geometryDataVersion).toBe(
        PHYS3_GEOMETRY_DATA_VERSION,
      );
      expect(spec.evidence.modelGrade).toBe("Experimental");

      const glbPath = path.join(repoRoot, part.modelGlbPath);
      expect(fs.existsSync(glbPath)).toBe(true);
      const index = indexGlbPhysicalNodesFromPath(partId, glbPath);
      allErrors.push(...validatePhysicalSpecAgainstGlb(partId, spec, index));
    }

    expect(allErrors).toEqual([]);
  });

  it("keeps visual-only fallbacks without physicalSpec", () => {
    for (const partId of PHYS3_VISUAL_ONLY_IDS) {
      const raw = JSON.parse(fs.readFileSync(partJsonPath(partId), "utf8"));
      const part = partDefinitionV2Schema.parse(raw);
      expect(part.physicalSpec).toBeUndefined();
    }
  });

  it("rejects unreferenced physical-prefix nodes", () => {
    const partId = "cpu.zen4-7600";
    const raw = JSON.parse(fs.readFileSync(partJsonPath(partId), "utf8"));
    const part = partDefinitionV2Schema.parse(raw);
    const spec = physicalSpecSchema.parse(part.physicalSpec);
    const index = indexGlbPhysicalNodesFromPath(
      partId,
      path.join(repoRoot, part.modelGlbPath),
    );
    // Simulate an unreferenced collision node in the index
    index.nodesByName.set("collision:orphan", {
      name: "collision:orphan",
      localMatrix: index.nodesByName.get("collision:cpu-die")!.localMatrix,
      translation: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      halfExtentsMm: [1, 1, 1],
      hasMesh: true,
    });
    index.allNodeNames.push("collision:orphan");
    const errors = validatePhysicalSpecAgainstGlb(partId, spec, index);
    expect(errors.some((e) => e.includes("unreferenced"))).toBe(true);
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { CatalogProvenance } from "../contract/cat6";
import {
  catalogSourceRegistryFileSchema,
  partDefinitionV3Schema,
} from "../contract/cat6.schema";

const ROOT = resolve(__dirname, "../..");

const PART_PATH = "parts/gpu/gpu.asus-dual-rtx4070-o12g/part.json";
const REGISTRY_PATH = "benchmarks/cat6/catalog-source-registry.json";

function readJson(rel: string): unknown {
  return JSON.parse(readFileSync(resolve(ROOT, rel), "utf8"));
}

function provenanceSourceIds(provenance: CatalogProvenance): string[] {
  return Object.values(provenance)
    .filter((ref): ref is NonNullable<typeof ref> => ref !== undefined)
    .map((ref) => ref.sourceId);
}

describe("cat6 step 2 — ASUS Dual RTX 4070 OC part", () => {
  it("parses the on-disk part and registry, and resolves every provenance sourceId", () => {
    const part = partDefinitionV3Schema.parse(readJson(PART_PATH));
    const registry = catalogSourceRegistryFileSchema.parse(
      readJson(REGISTRY_PATH),
    );

    const registryIds = new Set(registry.sources.map((source) => source.sourceId));
    for (const sourceId of provenanceSourceIds(part.provenance)) {
      expect(registryIds.has(sourceId)).toBe(true);
    }

    expect(part.provenance.compatSpec?.sourceId).toBe(
      "source.cat6.nvidia.rtx4070-family.reference-tgp",
    );
    expect(part.performanceSpec?.defaultPowerLimitW).toBeUndefined();
  });
});

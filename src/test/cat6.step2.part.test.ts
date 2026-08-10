import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { CatalogProvenance } from "../contract/cat6";
import {
  catalogSourceRegistryFileSchema,
  partDefinitionV3Schema,
} from "../contract/cat6.schema";

const ROOT = resolve(__dirname, "../..");

const GPU_PART_PATH = "parts/gpu/gpu.asus-dual-rtx4070-o12g/part.json";
const CASE_PART_PATH = "parts/case/case.fractal-design-north-tg-dark/part.json";
const REGISTRY_PATH = "benchmarks/cat6/catalog-source-registry.json";

function readJson(rel: string): unknown {
  return JSON.parse(readFileSync(resolve(ROOT, rel), "utf8"));
}

function provenanceSourceIds(provenance: CatalogProvenance): string[] {
  return Object.values(provenance)
    .filter((ref): ref is NonNullable<typeof ref> => ref !== undefined)
    .map((ref) => ref.sourceId);
}

function assertPartResolvesAgainstRegistry(partPath: string): void {
  const part = partDefinitionV3Schema.parse(readJson(partPath));
  const registry = catalogSourceRegistryFileSchema.parse(
    readJson(REGISTRY_PATH),
  );
  const registryIds = new Set(registry.sources.map((source) => source.sourceId));
  const sourceIds = provenanceSourceIds(part.provenance);
  expect(sourceIds.length).toBeGreaterThan(0);
  for (const sourceId of sourceIds) {
    expect(registryIds.has(sourceId)).toBe(true);
  }
}

describe("cat6 step 2 — authored parts", () => {
  it("parses the ASUS GPU part and resolves provenance against the registry", () => {
    const part = partDefinitionV3Schema.parse(readJson(GPU_PART_PATH));
    assertPartResolvesAgainstRegistry(GPU_PART_PATH);

    expect(part.provenance.compatSpec?.sourceId).toBe(
      "source.cat6.nvidia.rtx4070-family.reference-tgp",
    );
    expect(part.performanceSpec?.defaultPowerLimitW).toBeUndefined();
  });

  it("parses the Fractal Design North case and resolves provenance against the registry", () => {
    const part = partDefinitionV3Schema.parse(readJson(CASE_PART_PATH));
    assertPartResolvesAgainstRegistry(CASE_PART_PATH);

    // C12: the page's 145 mm figure is scoped to the Mesh SKU, so this
    // tempered-glass SKU records only the 170 mm figure.
    const coolerLimits = part.clearanceLimits?.maxCpuCoolerHeight ?? [];
    expect(coolerLimits).toHaveLength(1);
    expect(coolerLimits[0]?.limitMm).toBe(170);
    for (const limit of coolerLimits) {
      expect(limit.condition?.includes("Mesh") ?? false).toBe(false);
    }

    const psuLimits = part.clearanceLimits?.maxPsuLength ?? [];
    expect(psuLimits).toHaveLength(2);
    expect(new Set(psuLimits.map((limit) => limit.condition)).size).toBe(2);
  });
});

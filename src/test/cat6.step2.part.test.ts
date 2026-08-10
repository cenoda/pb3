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
const A3_PART_PATH = "parts/case/case.lian-li-a3-matx-black/part.json";
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

  // The figures the O7 demonstration build rests on (ID_MIGRATION.md I2, I9).
  const NH_D15_G2_HEIGHT_MM = 168;
  const RM750E_LENGTH_MM = 140;
  const DUAL_RTX4070_LENGTH_MM = 267.01;

  it("parses the LIAN LI A3-mATX case and resolves provenance against the registry", () => {
    const part = partDefinitionV3Schema.parse(readJson(A3_PART_PATH));
    assertPartResolvesAgainstRegistry(A3_PART_PATH);

    // The page states "M-ATX/ITX"; compat2 models only ATX and Micro-ATX, so
    // Mini-ITX is dropped. ATX must stay absent or the case-form-factor
    // negative stops being a fact about the product.
    const compat = part.compatSpec;
    const formFactors =
      compat && "supportedFormFactors" in compat
        ? compat.supportedFormFactors
        : undefined;
    expect(formFactors).toEqual(["Micro-ATX"]);
  });

  it("A3-mATX clearance limits produce exactly one interference for the O7 build", () => {
    const part = partDefinitionV3Schema.parse(readJson(A3_PART_PATH));
    const limits = part.clearanceLimits;

    // I2: the cooler exceeds the limit in every published branch -> interference.
    const coolerLimits = limits?.maxCpuCoolerHeight ?? [];
    expect(coolerLimits).toHaveLength(1);
    expect(
      coolerLimits.every((limit) => NH_D15_G2_HEIGHT_MM > limit.limitMm),
    ).toBe(true);

    // I9: the PSU clears every published branch -> fit, so the demonstration
    // build can use the 140 mm ATX unit rather than the SFX substitute.
    const psuLimits = limits?.maxPsuLength ?? [];
    expect(psuLimits.length).toBeGreaterThan(0);
    expect(
      psuLimits.every((limit) => RM750E_LENGTH_MM <= limit.limitMm),
    ).toBe(true);

    // I9: the GPU fits under some published branches and not others, so the
    // C13/D4 outcome is `conditional` -- not a second `interference`. The
    // cooler stays the only interference in the demonstration build.
    const gpuLimits = limits?.maxGpuLength ?? [];
    const gpuFits = gpuLimits.filter(
      (limit) => DUAL_RTX4070_LENGTH_MM <= limit.limitMm,
    );
    const gpuFails = gpuLimits.filter(
      (limit) => DUAL_RTX4070_LENGTH_MM > limit.limitMm,
    );
    expect(gpuFits.length).toBeGreaterThan(0);
    expect(gpuFails.length).toBeGreaterThan(0);

    // Every failing branch is a 258 mm side-mount branch; if a front branch
    // ever falls below the card's length the demonstration build changes.
    for (const limit of gpuFails) {
      expect(limit.condition?.startsWith("ATX PSU SIDE") ?? false).toBe(true);
    }
  });

  it("A3-mATX records all three published GPU-length charts", () => {
    const part = partDefinitionV3Schema.parse(readJson(A3_PART_PATH));
    const gpuLimits = part.clearanceLimits?.maxGpuLength ?? [];

    const countStartingWith = (prefix: string): number =>
      gpuLimits.filter((limit) => limit.condition?.startsWith(prefix)).length;

    expect(gpuLimits).toHaveLength(14);
    // ATX PSU FRONT (5) is counted by excluding the offset-bracket rows, which
    // share its prefix.
    expect(
      countStartingWith("ATX PSU FRONT, position"),
    ).toBe(5);
    expect(countStartingWith("ATX PSU FRONT with offset bracket")).toBe(3);
    expect(countStartingWith("ATX PSU SIDE")).toBe(6);

    // Every branch carries the condition it holds under (C13); a bare limit
    // here would mean a chart row lost its configuration.
    for (const limit of gpuLimits) {
      expect(limit.condition).toBeTruthy();
    }
  });
});

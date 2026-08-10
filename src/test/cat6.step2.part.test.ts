import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PSU_HEADROOM_MULTIPLIER } from "../contract/compat2";
import type { CatalogProvenance } from "../contract/cat6";
import {
  catalogSourceRegistryFileSchema,
  partDefinitionV3Schema,
} from "../contract/cat6.schema";

const ROOT = resolve(__dirname, "../..");

const GPU_PART_PATH = "parts/gpu/gpu.asus-dual-rtx4070-o12g/part.json";
const CASE_PART_PATH = "parts/case/case.fractal-design-north-tg-dark/part.json";
const A3_PART_PATH = "parts/case/case.lian-li-a3-matx-black/part.json";
const COOLER_PART_PATH = "parts/cooler/cooler.noctua-nh-d15-g2/part.json";
const CPU_PART_PATH = "parts/cpu/cpu.amd-ryzen-5-7600/part.json";
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

  it("parses the Noctua NH-D15 G2 and resolves provenance against the registry", () => {
    const part = partDefinitionV3Schema.parse(readJson(COOLER_PART_PATH));
    assertPartResolvesAgainstRegistry(COOLER_PART_PATH);

    // Noctua publishes no manufacturer part number for this cooler; EAN and UPC
    // are not part numbers and must not be substituted for one.
    expect(part.identity.partNumber).toBeUndefined();
  });

  it("parses the Ryzen 5 7600 and resolves provenance against the registry", () => {
    const part = partDefinitionV3Schema.parse(readJson(CPU_PART_PATH));
    assertPartResolvesAgainstRegistry(CPU_PART_PATH);

    const compat = part.compatSpec;
    expect(compat && "socket" in compat ? compat.socket : undefined).toBe("AM5");
    expect(
      compat && "tdpWatts" in compat ? compat.tdpWatts : undefined,
    ).toBe(65);

    // The boxed SKU, not the tray SKU 100-000001015.
    expect(part.identity.partNumber).toBe("100-100001015BOX");

    // AMD publishes no CPU package dimensions on this page, and the CCD/IOD
    // die areas it does publish are not dimensions. The field stays absent
    // rather than being filled from a widely repeated figure -- see the CPU
    // package-dimension blocker in ID_MIGRATION.md.
    expect(part.dimensionsMm).toBeUndefined();
  });

  it("I8 — the demonstration build's psu-wattage need is derived from authored parts", () => {
    const cpu = partDefinitionV3Schema.parse(readJson(CPU_PART_PATH));
    const gpu = partDefinitionV3Schema.parse(readJson(GPU_PART_PATH));

    const cpuTdp =
      cpu.compatSpec && "tdpWatts" in cpu.compatSpec
        ? cpu.compatSpec.tdpWatts
        : undefined;
    const gpuTdp =
      gpu.compatSpec && "tdpWatts" in gpu.compatSpec
        ? gpu.compatSpec.tdpWatts
        : undefined;
    expect(cpuTdp).toBeDefined();
    expect(gpuTdp).toBeDefined();

    // Same arithmetic as checkPsuWattage, against the same stub constant, so a
    // change to the multiplier surfaces here as well as in the engine tests.
    const required =
      ((cpuTdp as number) + (gpuTdp as number)) * PSU_HEADROOM_MULTIPLIER;
    expect(required).toBeCloseTo(344.5, 5);
    // Slot 10's 750 W unit clears it; slot 11's 550 W SFX would too, which is
    // why I9's PSU substitution stays available.
    expect(required).toBeLessThanOrEqual(550);
  });

  // The figures the O7 demonstration build rests on (ID_MIGRATION.md I2, I9).
  // The cooler height is read from the authored part rather than restated, so
  // I2 is derived from catalog data on both sides.
  const coolerHeightMm = (): number => {
    const cooler = partDefinitionV3Schema.parse(readJson(COOLER_PART_PATH));
    const height = cooler.dimensionsMm?.heightMm;
    expect(height).toBeDefined();
    return height as number;
  };
  const RM750E_LENGTH_MM = 140;
  const DUAL_RTX4070_LENGTH_MM = 267.01;

  it("I2 — the NH-D15 G2 interferes with the A3-mATX and clears the Fractal North", () => {
    const height = coolerHeightMm();
    const limitsOf = (path: string): number[] =>
      (
        partDefinitionV3Schema.parse(readJson(path)).clearanceLimits
          ?.maxCpuCoolerHeight ?? []
      ).map((limit) => limit.limitMm);

    const a3 = limitsOf(A3_PART_PATH);
    const north = limitsOf(CASE_PART_PATH);
    expect(a3.length).toBeGreaterThan(0);
    expect(north.length).toBeGreaterThan(0);

    // Fails in every A3 branch -> interference; the O7 demonstration.
    expect(a3.every((limit) => height > limit)).toBe(true);
    // Fits in every North branch -> the default build is unaffected.
    expect(north.every((limit) => height <= limit)).toBe(true);

    // Both margins are small enough that a transcription slip inverts a
    // verdict, so they are asserted rather than left implicit.
    expect(Math.min(...a3)).toBe(165);
    expect(Math.min(...north)).toBe(170);
    expect(height).toBe(168);
  });

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
    const height = coolerHeightMm();
    expect(coolerLimits.every((limit) => height > limit.limitMm)).toBe(true);

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

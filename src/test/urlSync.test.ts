import { describe, expect, it } from "vitest";
import { DEFAULT_BUILD_STATE_V2 } from "../contract/vs2";
import {
  buildStateFromSearchParams,
  buildStateToSearchParams,
} from "../state/urlSync";
import {
  createBuildStateValidator,
  createPartCatalog,
} from "../state/validateBuildState";
import type { PartDefinitionV2 } from "../contract/partV2";

const catalogParts: PartDefinitionV2[] = [
  {
    contractVersion: "vs0",
    id: "case.mid-tower-atx-01",
    category: "case",
    displayName: "Case",
    modelGlbPath: "parts/case/case.mid-tower-atx-01/model.glb",
    compatSpec: { supportedFormFactors: ["ATX", "Micro-ATX"] },
  },
  {
    contractVersion: "vs0",
    id: "case.micro-atx-mini-01",
    category: "case",
    displayName: "Mini Case",
    modelGlbPath: "parts/case/case.micro-atx-mini-01/model.glb",
    compatSpec: { supportedFormFactors: ["Micro-ATX"] },
  },
  {
    contractVersion: "vs0",
    id: "mb.atx-b650-01",
    category: "motherboard",
    displayName: "Board",
    modelGlbPath: "parts/motherboard/mb.atx-b650-01/model.glb",
    compatSpec: {
      socket: "AM5",
      chipset: "B650",
      formFactor: "ATX",
      supportedMemoryType: "DDR5",
      maxMemorySpeedMtS: 6400,
      biosMinVersionForCpu: { "cpu.zen4-7600": "1.20" },
    },
  },
  {
    contractVersion: "vs0",
    id: "mb.micro-b450-01",
    category: "motherboard",
    displayName: "B450",
    modelGlbPath: "parts/motherboard/mb.micro-b450-01/model.glb",
    compatSpec: {
      socket: "AM4",
      chipset: "B450",
      formFactor: "Micro-ATX",
      supportedMemoryType: "DDR5",
      maxMemorySpeedMtS: 5600,
      biosMinVersionForCpu: {},
    },
  },
  {
    contractVersion: "vs0",
    id: "cpu.zen4-7600",
    category: "cpu",
    displayName: "7600",
    modelGlbPath: "parts/cpu/cpu.zen4-7600/model.glb",
    compatSpec: { socket: "AM5", tdpWatts: 65 },
  },
  {
    contractVersion: "vs0",
    id: "cpu.zen4-7800x3d",
    category: "cpu",
    displayName: "7800X3D",
    modelGlbPath: "parts/cpu/cpu.zen4-7800x3d/model.glb",
    compatSpec: { socket: "AM5", tdpWatts: 120 },
  },
  {
    contractVersion: "vs0",
    id: "gpu.rtx4070",
    category: "gpu",
    displayName: "4070",
    modelGlbPath: "parts/gpu/gpu.rtx4070/model.glb",
    compatSpec: { tdpWatts: 200 },
  },
  {
    contractVersion: "vs0",
    id: "gpu.rtx4080",
    category: "gpu",
    displayName: "4080",
    modelGlbPath: "parts/gpu/gpu.rtx4080/model.glb",
    compatSpec: { tdpWatts: 320 },
  },
  {
    contractVersion: "vs0",
    id: "cooler.air-twin-tower-01",
    category: "cooler",
    displayName: "Cooler",
    modelGlbPath: "parts/cooler/cooler.air-twin-tower-01/model.glb",
  },
  {
    contractVersion: "vs0",
    id: "ram.ddr5-32gb-6000",
    category: "ram",
    displayName: "32GB",
    modelGlbPath: "parts/ram/ram.ddr5-32gb-6000/model.glb",
    compatSpec: { memoryType: "DDR5", speedMtS: 6000, capacityGb: 32 },
  },
  {
    contractVersion: "vs0",
    id: "ram.ddr5-16gb-7200",
    category: "ram",
    displayName: "16GB",
    modelGlbPath: "parts/ram/ram.ddr5-16gb-7200/model.glb",
    compatSpec: { memoryType: "DDR5", speedMtS: 7200, capacityGb: 16 },
  },
  {
    contractVersion: "vs0",
    id: "psu.750w-atx",
    category: "psu",
    displayName: "750W",
    modelGlbPath: "parts/psu/psu.750w-atx/model.glb",
    compatSpec: { wattage: 750 },
  },
  {
    contractVersion: "vs0",
    id: "psu.550w-sfx",
    category: "psu",
    displayName: "550W",
    modelGlbPath: "parts/psu/psu.550w-sfx/model.glb",
    compatSpec: { wattage: 550 },
  },
];

const catalog = createPartCatalog(catalogParts);
const isValid = createBuildStateValidator(catalog);

describe("urlSync", () => {
  it("encodes every BuildStateV2 field canonically", () => {
    const state = {
      ...DEFAULT_BUILD_STATE_V2,
      cpuId: "cpu.zen4-7800x3d",
      gpuId: "gpu.rtx4080",
    };
    const params = buildStateToSearchParams(state);

    expect(params.get("v")).toBe("vs2");
    expect(params.get("cpu")).toBe("cpu.zen4-7800x3d");
    expect(params.get("gpu")).toBe("gpu.rtx4080");
    expect(params.get("case")).toBe("case.mid-tower-atx-01");
    expect(params.get("mb")).toBe("mb.atx-b650-01");
    expect(params.get("cooler")).toBe("cooler.air-twin-tower-01");
    expect(params.get("ram")).toBe("ram.ddr5-32gb-6000");
    expect(params.get("psu")).toBe("psu.750w-atx");
    expect(params.get("game")).toBe("game.cyberpunk-2077");
    expect(params.get("preset")).toBe("preset.raster-ultra");
    expect([...params.keys()]).toHaveLength(10);
  });

  it("decodes partial query against defaults", () => {
    const params = new URLSearchParams("cpu=cpu.zen4-7800x3d&gpu=gpu.rtx4080");
    const decoded = buildStateFromSearchParams(
      params,
      DEFAULT_BUILD_STATE_V2,
      isValid,
    );

    expect(decoded.cpuId).toBe("cpu.zen4-7800x3d");
    expect(decoded.gpuId).toBe("gpu.rtx4080");
    expect(decoded.caseId).toBe(DEFAULT_BUILD_STATE_V2.caseId);
    expect(decoded.ramId).toBe(DEFAULT_BUILD_STATE_V2.ramId);
    expect(decoded.psuId).toBe(DEFAULT_BUILD_STATE_V2.psuId);
    expect(decoded.contractVersion).toBe("vs2");
  });

  it("falls back to defaults for invalid ids", () => {
    const params = new URLSearchParams(
      "cpu=cpu.not-real&gpu=gpu.rtx4080&case=case.mid-tower-atx-01&mb=mb.atx-b650-01&cooler=cooler.air-twin-tower-01&ram=ram.ddr5-32gb-6000&psu=psu.750w-atx&game=game.cyberpunk-2077&preset=preset.raster-ultra&v=vs2",
    );
    const decoded = buildStateFromSearchParams(
      params,
      DEFAULT_BUILD_STATE_V2,
      isValid,
    );
    expect(decoded).toEqual(DEFAULT_BUILD_STATE_V2);
  });

  it("falls back to defaults for unsupported contract version", () => {
    const params = new URLSearchParams("v=vs9&cpu=cpu.zen4-7800x3d");
    const decoded = buildStateFromSearchParams(
      params,
      DEFAULT_BUILD_STATE_V2,
      isValid,
    );
    expect(decoded).toEqual(DEFAULT_BUILD_STATE_V2);
  });

  it("decodes legacy v=vs0 links with ram/psu defaults filled", () => {
    const params = new URLSearchParams({
      v: "vs0",
      cpu: "cpu.zen4-7800x3d",
      gpu: "gpu.rtx4080",
      case: "case.mid-tower-atx-01",
      mb: "mb.atx-b650-01",
      cooler: "cooler.air-twin-tower-01",
      game: "game.cyberpunk-2077",
      preset: "preset.raster-ultra",
    });
    const decoded = buildStateFromSearchParams(
      params,
      DEFAULT_BUILD_STATE_V2,
      isValid,
    );
    expect(decoded.contractVersion).toBe("vs2");
    expect(decoded.cpuId).toBe("cpu.zen4-7800x3d");
    expect(decoded.ramId).toBe(DEFAULT_BUILD_STATE_V2.ramId);
    expect(decoded.psuId).toBe(DEFAULT_BUILD_STATE_V2.psuId);
  });

  it("round-trips full vs2 encode/decode", () => {
    const state = {
      ...DEFAULT_BUILD_STATE_V2,
      ramId: "ram.ddr5-16gb-7200",
      psuId: "psu.550w-sfx",
    };
    const params = buildStateToSearchParams(state);
    const decoded = buildStateFromSearchParams(
      params,
      DEFAULT_BUILD_STATE_V2,
      isValid,
    );
    expect(decoded).toEqual(state);
  });
});

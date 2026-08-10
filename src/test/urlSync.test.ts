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
    id: "case.fractal-design-north-tg-dark",
    category: "case",
    displayName: "Case",
    modelGlbPath: "parts/case/case.fractal-design-north-tg-dark/model.glb",
    compatSpec: { supportedFormFactors: ["ATX", "Micro-ATX"] },
  },
  {
    contractVersion: "vs0",
    id: "case.lian-li-a3-matx-black",
    category: "case",
    displayName: "Mini Case",
    modelGlbPath: "parts/case/case.lian-li-a3-matx-black/model.glb",
    compatSpec: { supportedFormFactors: ["Micro-ATX"] },
  },
  {
    contractVersion: "vs0",
    id: "motherboard.gigabyte-b650-aorus-elite-ax-v2",
    category: "motherboard",
    displayName: "Board",
    modelGlbPath: "parts/motherboard/motherboard.gigabyte-b650-aorus-elite-ax-v2/model.glb",
    compatSpec: {
      socket: "AM5",
      chipset: "B650",
      formFactor: "ATX",
      supportedMemoryType: "DDR5",
      maxMemorySpeedMtS: 6400,
      biosMinVersionForCpu: { "cpu.amd-ryzen-5-7600": "1.20" },
    },
  },
  {
    contractVersion: "vs0",
    id: "motherboard.asus-tuf-gaming-b860m-plus-wifi",
    category: "motherboard",
    displayName: "B450",
    modelGlbPath: "parts/motherboard/motherboard.asus-tuf-gaming-b860m-plus-wifi/model.glb",
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
    id: "cpu.amd-ryzen-5-7600",
    category: "cpu",
    displayName: "7600",
    modelGlbPath: "parts/cpu/cpu.amd-ryzen-5-7600/model.glb",
    compatSpec: { socket: "AM5", tdpWatts: 65 },
  },
  {
    contractVersion: "vs0",
    id: "cpu.amd-ryzen-7-7800x3d",
    category: "cpu",
    displayName: "7800X3D",
    modelGlbPath: "parts/cpu/cpu.amd-ryzen-7-7800x3d/model.glb",
    compatSpec: { socket: "AM5", tdpWatts: 120 },
  },
  {
    contractVersion: "vs0",
    id: "gpu.asus-dual-rtx4070-o12g",
    category: "gpu",
    displayName: "4070",
    modelGlbPath: "parts/gpu/gpu.asus-dual-rtx4070-o12g/model.glb",
    compatSpec: { tdpWatts: 200 },
  },
  {
    contractVersion: "vs0",
    id: "gpu.asus-proart-rtx4080-o16g",
    category: "gpu",
    displayName: "4080",
    modelGlbPath: "parts/gpu/gpu.asus-proart-rtx4080-o16g/model.glb",
    compatSpec: { tdpWatts: 320 },
  },
  {
    contractVersion: "vs0",
    id: "cooler.noctua-nh-d15-g2",
    category: "cooler",
    displayName: "Cooler",
    modelGlbPath: "parts/cooler/cooler.noctua-nh-d15-g2/model.glb",
  },
  {
    contractVersion: "vs0",
    id: "ram.teamgroup-t-create-expert-ddr5-6000-32gb",
    category: "ram",
    displayName: "32GB",
    modelGlbPath: "parts/ram/ram.teamgroup-t-create-expert-ddr5-6000-32gb/model.glb",
    compatSpec: { memoryType: "DDR5", speedMtS: 6000, capacityGb: 32 },
  },
  {
    contractVersion: "vs0",
    id: "ram.gskill-trident-z5-rgb-ddr5-8400",
    category: "ram",
    displayName: "16GB",
    modelGlbPath: "parts/ram/ram.gskill-trident-z5-rgb-ddr5-8400/model.glb",
    compatSpec: { memoryType: "DDR5", speedMtS: 7200, capacityGb: 16 },
  },
  {
    contractVersion: "vs0",
    id: "psu.corsair-rm750e",
    category: "psu",
    displayName: "750W",
    modelGlbPath: "parts/psu/psu.corsair-rm750e/model.glb",
    compatSpec: { wattage: 750 },
  },
  {
    contractVersion: "vs0",
    id: "psu.cooler-master-v550-sfx-gold",
    category: "psu",
    displayName: "550W",
    modelGlbPath: "parts/psu/psu.cooler-master-v550-sfx-gold/model.glb",
    compatSpec: { wattage: 550 },
  },
];

const catalog = createPartCatalog(catalogParts);
const isValid = createBuildStateValidator(catalog);

describe("urlSync", () => {
  it("encodes every BuildStateV2 field canonically", () => {
    const state = {
      ...DEFAULT_BUILD_STATE_V2,
      cpuId: "cpu.amd-ryzen-7-7800x3d",
      gpuId: "gpu.asus-proart-rtx4080-o16g",
    };
    const params = buildStateToSearchParams(state);

    expect(params.get("v")).toBe("vs2");
    expect(params.get("cpu")).toBe("cpu.amd-ryzen-7-7800x3d");
    expect(params.get("gpu")).toBe("gpu.asus-proart-rtx4080-o16g");
    expect(params.get("case")).toBe("case.fractal-design-north-tg-dark");
    expect(params.get("mb")).toBe("motherboard.gigabyte-b650-aorus-elite-ax-v2");
    expect(params.get("cooler")).toBe("cooler.noctua-nh-d15-g2");
    expect(params.get("ram")).toBe("ram.teamgroup-t-create-expert-ddr5-6000-32gb");
    expect(params.get("psu")).toBe("psu.corsair-rm750e");
    expect(params.get("game")).toBe("game.cyberpunk-2077");
    expect(params.get("preset")).toBe("preset.raster-ultra");
    expect([...params.keys()]).toHaveLength(10);
  });

  it("decodes partial query against defaults", () => {
    const params = new URLSearchParams("cpu=cpu.amd-ryzen-7-7800x3d&gpu=gpu.asus-proart-rtx4080-o16g");
    const decoded = buildStateFromSearchParams(
      params,
      DEFAULT_BUILD_STATE_V2,
      isValid,
    );

    expect(decoded.cpuId).toBe("cpu.amd-ryzen-7-7800x3d");
    expect(decoded.gpuId).toBe("gpu.asus-proart-rtx4080-o16g");
    expect(decoded.caseId).toBe(DEFAULT_BUILD_STATE_V2.caseId);
    expect(decoded.ramId).toBe(DEFAULT_BUILD_STATE_V2.ramId);
    expect(decoded.psuId).toBe(DEFAULT_BUILD_STATE_V2.psuId);
    expect(decoded.contractVersion).toBe("vs2");
  });

  it("falls back to defaults for invalid ids", () => {
    const params = new URLSearchParams(
      "cpu=cpu.not-real&gpu=gpu.asus-proart-rtx4080-o16g&case=case.fractal-design-north-tg-dark&mb=motherboard.gigabyte-b650-aorus-elite-ax-v2&cooler=cooler.noctua-nh-d15-g2&ram=ram.teamgroup-t-create-expert-ddr5-6000-32gb&psu=psu.corsair-rm750e&game=game.cyberpunk-2077&preset=preset.raster-ultra&v=vs2",
    );
    const decoded = buildStateFromSearchParams(
      params,
      DEFAULT_BUILD_STATE_V2,
      isValid,
    );
    expect(decoded).toEqual(DEFAULT_BUILD_STATE_V2);
  });

  it("falls back to defaults for unsupported contract version", () => {
    const params = new URLSearchParams("v=vs9&cpu=cpu.amd-ryzen-7-7800x3d");
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
      cpu: "cpu.amd-ryzen-7-7800x3d",
      gpu: "gpu.asus-proart-rtx4080-o16g",
      case: "case.fractal-design-north-tg-dark",
      mb: "motherboard.gigabyte-b650-aorus-elite-ax-v2",
      cooler: "cooler.noctua-nh-d15-g2",
      game: "game.cyberpunk-2077",
      preset: "preset.raster-ultra",
    });
    const decoded = buildStateFromSearchParams(
      params,
      DEFAULT_BUILD_STATE_V2,
      isValid,
    );
    expect(decoded.contractVersion).toBe("vs2");
    expect(decoded.cpuId).toBe("cpu.amd-ryzen-7-7800x3d");
    expect(decoded.ramId).toBe(DEFAULT_BUILD_STATE_V2.ramId);
    expect(decoded.psuId).toBe(DEFAULT_BUILD_STATE_V2.psuId);
  });

  it("round-trips full vs2 encode/decode", () => {
    const state = {
      ...DEFAULT_BUILD_STATE_V2,
      ramId: "ram.gskill-trident-z5-rgb-ddr5-8400",
      psuId: "psu.cooler-master-v550-sfx-gold",
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

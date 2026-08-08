import { describe, expect, it } from "vitest";
import { DEFAULT_BUILD_STATE } from "../contract/vs0";
import {
  buildStateFromSearchParams,
  buildStateToSearchParams,
} from "../state/urlSync";
import {
  createBuildStateValidator,
  createPartCatalog,
} from "../state/validateBuildState";
import type { PartDefinition } from "../contract/vs0";

const catalogParts: PartDefinition[] = [
  {
    contractVersion: "vs0",
    id: "case.mid-tower-atx-01",
    category: "case",
    displayName: "Case",
    modelGlbPath: "parts/case/case.mid-tower-atx-01/model.glb",
  },
  {
    contractVersion: "vs0",
    id: "mb.atx-b650-01",
    category: "motherboard",
    displayName: "Board",
    modelGlbPath: "parts/motherboard/mb.atx-b650-01/model.glb",
  },
  {
    contractVersion: "vs0",
    id: "cpu.zen4-7600",
    category: "cpu",
    displayName: "7600",
    modelGlbPath: "parts/cpu/cpu.zen4-7600/model.glb",
  },
  {
    contractVersion: "vs0",
    id: "cpu.zen4-7800x3d",
    category: "cpu",
    displayName: "7800X3D",
    modelGlbPath: "parts/cpu/cpu.zen4-7800x3d/model.glb",
  },
  {
    contractVersion: "vs0",
    id: "gpu.rtx4070",
    category: "gpu",
    displayName: "4070",
    modelGlbPath: "parts/gpu/gpu.rtx4070/model.glb",
  },
  {
    contractVersion: "vs0",
    id: "gpu.rtx4080",
    category: "gpu",
    displayName: "4080",
    modelGlbPath: "parts/gpu/gpu.rtx4080/model.glb",
  },
  {
    contractVersion: "vs0",
    id: "cooler.air-twin-tower-01",
    category: "cooler",
    displayName: "Cooler",
    modelGlbPath: "parts/cooler/cooler.air-twin-tower-01/model.glb",
  },
];

const catalog = createPartCatalog(catalogParts);
const isValid = createBuildStateValidator(catalog);

describe("urlSync", () => {
  it("encodes every BuildState field canonically", () => {
    const state = {
      ...DEFAULT_BUILD_STATE,
      cpuId: "cpu.zen4-7800x3d",
      gpuId: "gpu.rtx4080",
    };
    const params = buildStateToSearchParams(state);

    expect(params.get("v")).toBe("vs0");
    expect(params.get("cpu")).toBe("cpu.zen4-7800x3d");
    expect(params.get("gpu")).toBe("gpu.rtx4080");
    expect(params.get("case")).toBe("case.mid-tower-atx-01");
    expect(params.get("mb")).toBe("mb.atx-b650-01");
    expect(params.get("cooler")).toBe("cooler.air-twin-tower-01");
    expect(params.get("game")).toBe("game.cyberpunk-2077");
    expect(params.get("preset")).toBe("preset.raster-ultra");
    expect([...params.keys()]).toHaveLength(8);
  });

  it("decodes partial query against defaults", () => {
    const params = new URLSearchParams("cpu=cpu.zen4-7800x3d&gpu=gpu.rtx4080");
    const decoded = buildStateFromSearchParams(
      params,
      DEFAULT_BUILD_STATE,
      isValid,
    );

    expect(decoded.cpuId).toBe("cpu.zen4-7800x3d");
    expect(decoded.gpuId).toBe("gpu.rtx4080");
    expect(decoded.caseId).toBe(DEFAULT_BUILD_STATE.caseId);
    expect(decoded.motherboardId).toBe(DEFAULT_BUILD_STATE.motherboardId);
  });

  it("falls back to defaults for invalid ids", () => {
    const params = new URLSearchParams(
      "cpu=cpu.not-real&gpu=gpu.rtx4080&case=case.mid-tower-atx-01&mb=mb.atx-b650-01&cooler=cooler.air-twin-tower-01&game=game.cyberpunk-2077&preset=preset.raster-ultra&v=vs0",
    );
    const decoded = buildStateFromSearchParams(
      params,
      DEFAULT_BUILD_STATE,
      isValid,
    );
    expect(decoded).toEqual(DEFAULT_BUILD_STATE);
  });

  it("falls back to defaults for unsupported contract version", () => {
    const params = new URLSearchParams("v=vs1&cpu=cpu.zen4-7800x3d");
    const decoded = buildStateFromSearchParams(
      params,
      DEFAULT_BUILD_STATE,
      isValid,
    );
    expect(decoded).toEqual(DEFAULT_BUILD_STATE);
  });
});

import { describe, expect, it } from "vitest";
import {
  EST1_CONTRACT_VERSION,
  EST1_DRAFT_CAVEAT,
  type CombinationEstimate,
  type CombinationEstimateUnavailable,
  type EstimatorQuery,
} from "../contract/est1";
import {
  combinationEstimateResultSchema,
  combinationEstimateSchema,
  combinationEstimateUnavailableSchema,
  cpuScaleEdgeFileSchema,
  vendorPerformanceAnchorFileSchema,
} from "../contract/est1.schema";

const query: EstimatorQuery = {
  cpuId: "cpu.amd-ryzen-5-7600",
  gpuId: "gpu.asus-dual-rtx4070-o12g",
  gameId: "game.cyberpunk-2077",
  presetId: "preset.raster-ultra",
  resolution: "1080p",
  upscaleId: "upscale.off",
  frameGenId: "framegen.off",
  rayTracingState: "off",
  ramTierId: "ram.32gb-ddr5",
  powerProfileId: "power.default",
};

function validEstimate(
  overrides: Partial<CombinationEstimate> = {},
): CombinationEstimate {
  return {
    status: "estimated",
    estimatorContractVersion: EST1_CONTRACT_VERSION,
    query,
    fpsMin: 80,
    fpsMax: 100,
    fpsAverage: 90,
    confidence: "low",
    method: "exact-aggregate",
    basis: "test aggregate",
    draftCaveat: EST1_DRAFT_CAVEAT,
    contributors: [
      {
        role: "exact-observation",
        refKind: "prov4-observation",
        refId: "obs.1",
      },
    ],
    exclusionReasons: [],
    dataVersion: "est1-test",
    ...overrides,
  };
}

function validUnavailable(
  overrides: Partial<CombinationEstimateUnavailable> = {},
): CombinationEstimateUnavailable {
  return {
    status: "unavailable",
    estimatorContractVersion: EST1_CONTRACT_VERSION,
    query,
    reason: "no_candidates",
    explanation: "No candidates",
    exclusionReasons: [],
    dataVersion: "est1-test",
    draftCaveat: EST1_DRAFT_CAVEAT,
    ...overrides,
  };
}

describe("est1 schema", () => {
  it("accepts a valid estimated result", () => {
    const parsed = combinationEstimateSchema.safeParse(validEstimate());
    expect(parsed.success).toBe(true);
  });

  it("accepts a valid unavailable result", () => {
    const parsed = combinationEstimateUnavailableSchema.safeParse(
      validUnavailable(),
    );
    expect(parsed.success).toBe(true);
  });

  it("rejects scaled-combination with medium confidence (O5)", () => {
    const parsed = combinationEstimateSchema.safeParse(
      validEstimate({ method: "scaled-combination", confidence: "medium" }),
    );
    expect(parsed.success).toBe(false);
  });

  it("rejects missing draftCaveat", () => {
    const parsed = combinationEstimateSchema.safeParse(
      validEstimate({ draftCaveat: "" }),
    );
    expect(parsed.success).toBe(false);
  });

  it("rejects fpsMin >= fpsMax", () => {
    const parsed = combinationEstimateSchema.safeParse(
      validEstimate({ fpsMin: 100, fpsMax: 100, fpsAverage: 100 }),
    );
    expect(parsed.success).toBe(false);
  });

  it("rejects average outside range", () => {
    const parsed = combinationEstimateSchema.safeParse(
      validEstimate({ fpsMin: 80, fpsMax: 90, fpsAverage: 95 }),
    );
    expect(parsed.success).toBe(false);
  });

  it("result union discriminates estimated vs unavailable", () => {
    expect(
      combinationEstimateResultSchema.safeParse(validEstimate()).success,
    ).toBe(true);
    expect(
      combinationEstimateResultSchema.safeParse(validUnavailable()).success,
    ).toBe(true);
  });

  it("parses empty on-disk fixture shapes", () => {
    expect(
      cpuScaleEdgeFileSchema.safeParse({
        estimatorContractVersion: "est1",
        dataVersion: "est1-20260809",
        edges: [],
      }).success,
    ).toBe(true);
    expect(
      vendorPerformanceAnchorFileSchema.safeParse({
        estimatorContractVersion: "est1",
        dataVersion: "est1-20260809",
        anchors: [],
      }).success,
    ).toBe(true);
  });

  it("rejects duplicate edgeIds", () => {
    const parsed = cpuScaleEdgeFileSchema.safeParse({
      estimatorContractVersion: "est1",
      dataVersion: "est1-test",
      edges: [
        {
          edgeId: "edge.dup",
          fromCpuId: "cpu.a",
          toCpuId: "cpu.b",
          factor: 0.9,
          uncertainty: 0.05,
          sourceIds: ["src.a"],
          basis: "test",
          dataVersion: "est1-test",
        },
        {
          edgeId: "edge.dup",
          fromCpuId: "cpu.a",
          toCpuId: "cpu.b",
          factor: 0.85,
          uncertainty: 0.05,
          sourceIds: ["src.a"],
          basis: "test",
          dataVersion: "est1-test",
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadBaselineFixtures } from "../catalog/loadPerf1Fixtures";
import type {
  BaselineQuery,
  CorrectionInput,
  PerformanceEstimate,
} from "../contract/perf1";
import { applyCorrection } from "../perf/applyCorrection";
import { estimateBaseline } from "../perf/estimateBaseline";

const repoRoot = join(import.meta.dirname, "../..");

function readCorrectionExamples(): {
  examples: Array<{
    query: BaselineQuery;
    correction: CorrectionInput;
    result: { status: string; reason?: string; fpsMin?: number; fpsMax?: number };
  }>;
} {
  return JSON.parse(
    readFileSync(
      join(repoRoot, "benchmarks/perf1/correction-examples.json"),
      "utf8",
    ),
  );
}

function assertBaseline(
  result: ReturnType<typeof estimateBaseline>,
): PerformanceEstimate {
  if ("status" in result) {
    throw new Error(`Expected baseline estimate, got ${result.status}`);
  }
  return result;
}

describe("applyCorrection", () => {
  it("drives all four correction-examples.json outcomes", async () => {
    const fixtures = await loadBaselineFixtures();
    const examples = readCorrectionExamples();

    for (const example of examples.examples) {
      const baseline = assertBaseline(
        estimateBaseline(example.query, fixtures),
      );
      const result = applyCorrection(
        example.query,
        baseline,
        example.correction,
      );
      expect(result).toEqual(example.result);
    }
  });

  it("returns null for empty CorrectionInput (identity path)", async () => {
    const fixtures = await loadBaselineFixtures();
    const query: BaselineQuery = {
      cpuId: "cpu.zen4-7600",
      gpuId: "gpu.rtx4070",
      gameId: "game.cyberpunk-2077",
      presetId: "preset.raster-ultra",
      resolution: "1440p",
      upscaleId: "upscale.off",
      frameGenId: "framegen.off",
      ramTierId: "ram.32gb-ddr5",
      powerProfileId: "power.default",
    };
    const baseline = assertBaseline(estimateBaseline(query, fixtures));

    expect(applyCorrection(query, baseline, {})).toBeNull();
  });

  it("returns not-supported outcome for unsupported correction id", async () => {
    const fixtures = await loadBaselineFixtures();
    const query: BaselineQuery = {
      cpuId: "cpu.zen4-7600",
      gpuId: "gpu.rtx4070",
      gameId: "game.cyberpunk-2077",
      presetId: "preset.raster-ultra",
      resolution: "1440p",
      upscaleId: "upscale.off",
      frameGenId: "framegen.off",
      ramTierId: "ram.32gb-ddr5",
      powerProfileId: "power.default",
    };
    const baseline = assertBaseline(estimateBaseline(query, fixtures));

    const result = applyCorrection(query, baseline, {
      cpuPowerId: "cpu-power.super-reduced" as CorrectionInput["cpuPowerId"],
    });

    expect(result?.status).toBe("withheld");
    expect(result?.reason).toMatch(/not supported in phase 1/);
  });

  it("withheld path never returns fabricated lower FPS range", async () => {
    const fixtures = await loadBaselineFixtures();
    const examples = readCorrectionExamples();
    const withheldExample = examples.examples.find(
      (e) => e.result.status === "withheld",
    )!;

    const baseline = assertBaseline(
      estimateBaseline(withheldExample.query, fixtures),
    );
    const result = applyCorrection(
      withheldExample.query,
      baseline,
      withheldExample.correction,
    );

    expect(result?.status).toBe("withheld");
    expect(result).not.toHaveProperty("fpsMin");
    expect(result).not.toHaveProperty("fpsMax");
  });
});

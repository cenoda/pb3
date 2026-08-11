import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadBaselineFixtures } from "../catalog/loadPerf1Fixtures";
import { DEFAULT_BUILD_STATE_V2 } from "../contract/vs2";
import {
  DEFAULT_PERF_PANEL_DIMENSIONS,
  type BaselineQuery,
} from "../contract/perf1";
import { baselineQueriesForBuild } from "../perf/baselineQuery";
import {
  buildBaselineLookupIndex,
  estimateBaseline,
} from "../perf/estimateBaseline";

const repoRoot = join(import.meta.dirname, "../..");

function readUnavailableExamples(): {
  examples: Array<{ query: BaselineQuery; result: { status: string; reason: string } }>;
} {
  return JSON.parse(
    readFileSync(
      join(repoRoot, "benchmarks/perf1/unavailable-examples.json"),
      "utf8",
    ),
  );
}

describe("estimateBaseline", () => {
  it("returns exact fixture ranges for default build at 1440p", async () => {
    const fixtures = await loadBaselineFixtures();
    const [query] = baselineQueriesForBuild(
      DEFAULT_BUILD_STATE_V2,
      DEFAULT_PERF_PANEL_DIMENSIONS,
    ).filter((q) => q.resolution === "1440p");

    const result = estimateBaseline(query!, fixtures);

    expect(result).toMatchObject({
      fpsMin: 52,
      fpsMax: 64,
      confidence: "stub",
      dataVersion: "perf1",
      limitingFactor: { category: "GPU-bound" },
    });
  });

  it("returns exact ranges for all three resolutions on default build", async () => {
    const fixtures = await loadBaselineFixtures();
    const queries = baselineQueriesForBuild(
      DEFAULT_BUILD_STATE_V2,
      DEFAULT_PERF_PANEL_DIMENSIONS,
    );

    for (const query of queries) {
      const result = estimateBaseline(query, fixtures);
      expect(result).not.toHaveProperty("status");
      if ("fpsMin" in result) {
        const row = fixtures.rows.find(
          (r) =>
            r.resolution === query.resolution &&
            r.cpuId === query.cpuId &&
            r.gpuId === query.gpuId &&
            r.upscaleId === query.upscaleId &&
            r.frameGenId === query.frameGenId &&
            r.ramTierId === query.ramTierId,
        );
        expect(result.fpsMin).toBe(row?.fpsMin);
        expect(result.fpsMax).toBe(row?.fpsMax);
      }
    }
  });

  it("every fixture row lookup returns PerformanceEstimate with confidence stub", async () => {
    const fixtures = await loadBaselineFixtures();
    expect(fixtures.rows).toHaveLength(96);

    const index = buildBaselineLookupIndex(fixtures);
    expect(index.size).toBe(96);

    for (const row of fixtures.rows) {
      const result = estimateBaseline(row, fixtures);
      expect(result).not.toHaveProperty("status");
      if ("fpsMin" in result) {
        expect(result.confidence).toBe("stub");
        expect(result.fpsMin).toBe(row.fpsMin);
        expect(result.fpsMax).toBe(row.fpsMax);
        expect(result.limitingFactor).toEqual(row.limitingFactor);
      }
    }
  });

  it("returns unavailable for baseline examples without invented FPS", () => {
    const fixtures = JSON.parse(
      readFileSync(
        join(repoRoot, "benchmarks/perf1/performance-fixtures.json"),
        "utf8",
      ),
    );
    const examples = readUnavailableExamples();

    for (const example of examples.examples) {
      if (!("resolution" in example.query)) continue;

      const result = estimateBaseline(
        example.query as BaselineQuery,
        fixtures,
      );
      expect(result).toEqual(example.result);
      expect(result).not.toHaveProperty("fpsMin");
      expect(result).not.toHaveProperty("fpsMax");
    }
  });

  it("returns unavailable with preparation message for uncovered baseline combination", async () => {
    const fixtures = await loadBaselineFixtures();
    const query = {
      cpuId: "cpu.amd-ryzen-5-7600",
      gpuId: "gpu.not-in-catalog",
      gameId: "game.cyberpunk-2077",
      presetId: "preset.raster-ultra",
      resolution: "1440p",
      upscaleId: "upscale.off",
      frameGenId: "framegen.off",
      ramTierId: "ram.32gb-ddr5",
      powerProfileId: "power.default",
    } as unknown as BaselineQuery;

    const result = estimateBaseline(query, fixtures);

    expect(result).toEqual({
      status: "unavailable",
      reason:
        "The combination performance estimator is still in preparation; performance data is not available yet.",
    });
    expect(result).not.toHaveProperty("fpsMin");
    expect(result).not.toHaveProperty("fpsMax");
    if ("status" in result) {
      expect(result.reason).toMatch(/preparation/i);
      expect(result.reason).not.toMatch(/perf1|fixture row|baseline table/i);
    }
  });

  it("switching upscaleId alone changes the looked-up range", async () => {
    const fixtures = await loadBaselineFixtures();
    const baseQuery: BaselineQuery = {
      cpuId: "cpu.amd-ryzen-5-7600",
      gpuId: "gpu.asus-dual-rtx4070-o12g",
      gameId: "game.cyberpunk-2077",
      presetId: "preset.raster-ultra",
      resolution: "1440p",
      upscaleId: "upscale.off",
      frameGenId: "framegen.off",
      ramTierId: "ram.32gb-ddr5",
      powerProfileId: "power.default",
    };

    const offResult = estimateBaseline(baseQuery, fixtures);
    const dlssResult = estimateBaseline(
      { ...baseQuery, upscaleId: "upscale.dlss-quality" },
      fixtures,
    );

    expect(offResult).toMatchObject({ fpsMin: 52, fpsMax: 64 });
    expect(dlssResult).toMatchObject({ fpsMin: 63, fpsMax: 78 });
    expect(dlssResult).not.toEqual(offResult);
  });

  it("switching frameGenId alone changes the looked-up range", async () => {
    const fixtures = await loadBaselineFixtures();
    const baseQuery: BaselineQuery = {
      cpuId: "cpu.amd-ryzen-5-7600",
      gpuId: "gpu.asus-dual-rtx4070-o12g",
      gameId: "game.cyberpunk-2077",
      presetId: "preset.raster-ultra",
      resolution: "1440p",
      upscaleId: "upscale.off",
      frameGenId: "framegen.off",
      ramTierId: "ram.32gb-ddr5",
      powerProfileId: "power.default",
    };

    const offResult = estimateBaseline(baseQuery, fixtures);
    const onResult = estimateBaseline(
      { ...baseQuery, frameGenId: "framegen.on" },
      fixtures,
    );

    expect(offResult).toMatchObject({ fpsMin: 52, fpsMax: 64 });
    expect(onResult).toMatchObject({ fpsMin: 96, fpsMax: 118 });
    expect(onResult).not.toEqual(offResult);
  });
});

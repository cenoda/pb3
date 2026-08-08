import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "../..");
import { loadPerformanceFixtures } from "../catalog/loadPerformanceFixtures";
import {
  PHASE0_CPU_IDS,
  PHASE0_GPU_IDS,
  PHASE0_GAME,
  PHASE0_PRESET,
  RESOLUTIONS,
} from "../contract/vs0";
import { estimatePerformance } from "../perf/estimatePerformance";

describe("estimatePerformance", () => {
  it("returns ok rows for all 12 fixture combinations", async () => {
    const fixtures = await loadPerformanceFixtures();
    expect(fixtures.rows).toHaveLength(12);

    for (const cpuId of PHASE0_CPU_IDS) {
      for (const gpuId of PHASE0_GPU_IDS) {
        for (const resolution of RESOLUTIONS) {
          const estimate = estimatePerformance(
            {
              contractVersion: "vs0",
              cpuId,
              gpuId,
              gameId: PHASE0_GAME.id,
              presetId: PHASE0_PRESET.id,
              resolutionId: resolution.id,
            },
            fixtures,
          );

          const row = fixtures.rows.find(
            (candidate) =>
              candidate.cpuId === cpuId &&
              candidate.gpuId === gpuId &&
              candidate.resolutionId === resolution.id,
          );

          expect(estimate.status).toBe("ok");
          expect(estimate.fpsMin).toBe(row?.fpsMin ?? null);
          expect(estimate.fpsMax).toBe(row?.fpsMax ?? null);
          expect(estimate.confidence).toBe("stub");
        }
      }
    }
  });

  it("returns unavailable for unknown gpu from examples file", () => {
    const fixtures = JSON.parse(
      readFileSync(
        join(repoRoot, "benchmarks/vs0/performance-fixtures.json"),
        "utf8",
      ),
    );
    const examples = JSON.parse(
      readFileSync(
        join(repoRoot, "benchmarks/vs0/performance-unavailable.examples.json"),
        "utf8",
      ),
    );

    const example = examples.examples[0];
    const estimate = estimatePerformance(example.query, fixtures);

    expect(estimate).toEqual(example.estimate);
    expect(estimate.fpsMin).toBeNull();
    expect(estimate.fpsMax).toBeNull();
    expect(estimate.status).toBe("unavailable");
  });
});

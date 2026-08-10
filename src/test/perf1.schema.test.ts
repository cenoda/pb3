import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PERF1_CONTRACT_VERSION } from "../contract/perf1";
import {
  baselineFixtureFileSchema,
  baselineFixtureRowSchema,
  cinebenchFixtureFileSchema,
  correctionExamplesFileSchema,
  unavailableExamplesFileSchema,
} from "../contract/perf1.schema";

const repoRoot = join(import.meta.dirname, "../..");
const perf1Dir = join(repoRoot, "benchmarks/perf1");

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

describe("perf1.schema", () => {
  it("parses performance-fixtures.json (96 rows)", () => {
    const parsed = baselineFixtureFileSchema.safeParse(
      readJson(join(perf1Dir, "performance-fixtures.json")),
    );
    expect(parsed.success).toBe(true);
    expect(parsed.data?.rows).toHaveLength(96);
    expect(parsed.data?.contractVersion).toBe(PERF1_CONTRACT_VERSION);
  });

  it("parses cinebench-fixtures.json (8 rows)", () => {
    const parsed = cinebenchFixtureFileSchema.safeParse(
      readJson(join(perf1Dir, "cinebench-fixtures.json")),
    );
    expect(parsed.success).toBe(true);
    expect(parsed.data?.rows).toHaveLength(8);
  });

  it("parses correction-examples.json", () => {
    const parsed = correctionExamplesFileSchema.safeParse(
      readJson(join(perf1Dir, "correction-examples.json")),
    );
    expect(parsed.success).toBe(true);
    expect(parsed.data?.examples).toHaveLength(4);
  });

  it("parses unavailable-examples.json", () => {
    const parsed = unavailableExamplesFileSchema.safeParse(
      readJson(join(perf1Dir, "unavailable-examples.json")),
    );
    expect(parsed.success).toBe(true);
    expect(parsed.data?.examples).toHaveLength(3);
  });

  it("rejects wrong contractVersion", () => {
    const raw = readJson(join(perf1Dir, "performance-fixtures.json"));
    const parsed = baselineFixtureFileSchema.safeParse({
      ...(raw as object),
      contractVersion: "perf2",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects baseline row missing required fields", () => {
    const parsed = baselineFixtureRowSchema.safeParse({
      cpuId: "cpu.amd-ryzen-5-7600",
      gpuId: "gpu.asus-dual-rtx4070-o12g",
      gameId: "game.cyberpunk-2077",
      presetId: "preset.raster-ultra",
      resolution: "1440p",
      upscaleId: "upscale.off",
      frameGenId: "framegen.off",
      ramTierId: "ram.32gb-ddr5",
      powerProfileId: "power.default",
      fpsMin: 52,
      confidence: "stub",
      dataVersion: "perf1",
      basis: "test",
      limitingFactor: {
        category: "GPU-bound",
        explanation: "test",
      },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects unknown limitingFactor.category", () => {
    const parsed = baselineFixtureRowSchema.safeParse({
      cpuId: "cpu.amd-ryzen-5-7600",
      gpuId: "gpu.asus-dual-rtx4070-o12g",
      gameId: "game.cyberpunk-2077",
      presetId: "preset.raster-ultra",
      resolution: "1440p",
      upscaleId: "upscale.off",
      frameGenId: "framegen.off",
      ramTierId: "ram.32gb-ddr5",
      powerProfileId: "power.default",
      fpsMin: 52,
      fpsMax: 64,
      confidence: "stub",
      dataVersion: "perf1",
      basis: "test",
      limitingFactor: {
        category: "network-bound",
        explanation: "invalid category",
      },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects inverted FPS range (fpsMin > fpsMax)", () => {
    const parsed = baselineFixtureRowSchema.safeParse({
      cpuId: "cpu.amd-ryzen-5-7600",
      gpuId: "gpu.asus-dual-rtx4070-o12g",
      gameId: "game.cyberpunk-2077",
      presetId: "preset.raster-ultra",
      resolution: "1440p",
      upscaleId: "upscale.off",
      frameGenId: "framegen.off",
      ramTierId: "ram.32gb-ddr5",
      powerProfileId: "power.default",
      fpsMin: 80,
      fpsMax: 50,
      confidence: "stub",
      dataVersion: "perf1",
      basis: "test",
      limitingFactor: {
        category: "GPU-bound",
        explanation: "test",
      },
    });
    expect(parsed.success).toBe(false);
  });
});

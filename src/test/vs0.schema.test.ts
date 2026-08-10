import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE0_PART_PATHS,
  VS0_CONTRACT_VERSION,
} from "../contract/vs0";
import {
  buildStateSchema,
  partDefinitionSchema,
  performanceFixtureFileSchema,
} from "../contract/vs0.schema";
import { partDefinitionV2Schema } from "../contract/vs2.schema";

const repoRoot = join(import.meta.dirname, "../..");

describe("vs0.schema", () => {
  it("parses all checked-in part.json fixtures via runtime loader schema", () => {
    for (const partPath of PHASE0_PART_PATHS) {
      const raw = readFileSync(join(repoRoot, partPath), "utf8");
      const json: unknown = JSON.parse(raw);
      const parsed = partDefinitionV2Schema.safeParse(json);
      expect(parsed.success, partPath).toBe(true);
    }
  });

  it("parses the performance fixture table", () => {
    const raw = readFileSync(
      join(repoRoot, "benchmarks/vs0/performance-fixtures.json"),
      "utf8",
    );
    const parsed = performanceFixtureFileSchema.safeParse(JSON.parse(raw));
    expect(parsed.success).toBe(true);
    expect(parsed.data?.rows).toHaveLength(12);
  });

  it("rejects part definitions with wrong contract version", () => {
    const parsed = partDefinitionSchema.safeParse({
      contractVersion: "vs1",
      id: "gpu.asus-dual-rtx4070-o12g",
      category: "gpu",
      displayName: "Bad",
      modelGlbPath: "parts/gpu/gpu.asus-dual-rtx4070-o12g/model.glb",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects build state missing required fields", () => {
    const parsed = buildStateSchema.safeParse({
      contractVersion: VS0_CONTRACT_VERSION,
      cpuId: "cpu.amd-ryzen-5-7600",
    });
    expect(parsed.success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { loadPartCatalog } from "../catalog/loadPartCatalog";
import {
  DEFAULT_BUILD_STATE,
  PHASE0_PART_PATHS,
} from "../contract/vs0";
import { partDefinitionSchema } from "../contract/vs0.schema";

describe("loadPartCatalog", () => {
  it("loads all fixed phase-0 part ids", async () => {
    const catalog = await loadPartCatalog();
    for (const partPath of PHASE0_PART_PATHS) {
      const id = partPath.split("/")[2];
      expect(catalog.get(id!), id).toBeDefined();
    }
    expect(catalog.byId.size).toBe(7);
  });

  it("resolves default build state ids", async () => {
    const catalog = await loadPartCatalog();
    expect(catalog.get(DEFAULT_BUILD_STATE.caseId)?.category).toBe("case");
    expect(catalog.get(DEFAULT_BUILD_STATE.motherboardId)?.category).toBe(
      "motherboard",
    );
    expect(catalog.get(DEFAULT_BUILD_STATE.cpuId)?.category).toBe("cpu");
    expect(catalog.get(DEFAULT_BUILD_STATE.gpuId)?.category).toBe("gpu");
    expect(catalog.get(DEFAULT_BUILD_STATE.coolerId)?.category).toBe("cooler");
  });

  it("fails loudly on malformed part json", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          contractVersion: "vs0",
          id: "bad.part",
          category: "gpu",
        }),
        { status: 200 },
      );

    await expect(loadPartCatalog()).rejects.toThrow(/Invalid part fixture/);

    globalThis.fetch = originalFetch;
  });

  it("fails loudly when schema parse rejects fixture", () => {
    const parsed = partDefinitionSchema.safeParse({
      contractVersion: "vs0",
      id: "gpu.rtx4070",
      category: "gpu",
    });
    expect(parsed.success).toBe(false);
  });
});

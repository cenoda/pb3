import { describe, expect, it } from "vitest";
import { loadPartCatalog } from "../catalog/loadPartCatalog";
import { loadCompat2Examples } from "../catalog/loadCompat2Fixtures";
import { loadPriceFixtures } from "../price/loadPriceFixtures";
import { PHASE2_PART_PATHS } from "../contract/vs2";
import {
  DEFAULT_BUILD_STATE,
  assertPartCompatFields,
  createBuildStateValidator,
} from "../state/validateBuildState";

describe("loadPartCatalog", () => {
  it("loads all fixed phase-2 part ids", async () => {
    const catalog = await loadPartCatalog();
    for (const partPath of PHASE2_PART_PATHS) {
      const id = partPath.split("/")[2];
      expect(catalog.get(id!), id).toBeDefined();
    }
    expect(catalog.byId.size).toBe(13);
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
    expect(catalog.get(DEFAULT_BUILD_STATE.ramId)?.category).toBe("ram");
    expect(catalog.get(DEFAULT_BUILD_STATE.psuId)?.category).toBe("psu");
  });

  it("every required part has compatSpec", async () => {
    const catalog = await loadPartCatalog();
    assertPartCompatFields(catalog);
    const isValid = createBuildStateValidator(catalog);
    expect(isValid(DEFAULT_BUILD_STATE)).toBe(true);
  });
});

describe("compat2 fixture loaders", () => {
  it("loads compatibility examples", async () => {
    const file = await loadCompat2Examples();
    expect(file.compatContractVersion).toBe("compat2");
    expect(file.examples.length).toBeGreaterThanOrEqual(3);
  });

  it("loads price fixtures for all catalog parts", async () => {
    const [catalog, prices] = await Promise.all([
      loadPartCatalog(),
      loadPriceFixtures(),
    ]);
    expect(prices.compatContractVersion).toBe("compat2");
    for (const partId of catalog.byId.keys()) {
      expect(prices.rows.some((row) => row.partId === partId)).toBe(true);
    }
  });
});

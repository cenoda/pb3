import { describe, expect, it } from "vitest";
import { loadPriceFixtures } from "../price/loadPriceFixtures";
import { buildPriceSummary } from "../price/buildPriceSummary";
import { DEFAULT_BUILD_STATE_V2 } from "../contract/vs2";
import type { PriceFixtureFile } from "../contract/compat2";

describe("buildPriceSummary", () => {
  it("sums all priced parts for default build", async () => {
    const fixtures = await loadPriceFixtures();
    const summary = buildPriceSummary(DEFAULT_BUILD_STATE_V2, fixtures);
    expect(summary.isPartial).toBe(false);
    expect(summary.currency).toBe("USD");
    expect(summary.lines).toHaveLength(7);
    expect(summary.subtotalAmount).toBeGreaterThan(0);
    expect(summary.lines.every((line) => line.status === "ok")).toBe(true);
  });

  it("marks partial total when a selected part has no price row", () => {
    const fixtures: PriceFixtureFile = {
      compatContractVersion: "compat2",
      dataVersion: "test",
      rows: [
        {
          partId: "gpu.rtx4070",
          category: "gpu",
          status: "ok",
          amount: 599,
          currency: "USD",
          basis: "phase-2 fixture price; not a live market quote",
          dataVersion: "test",
        },
      ],
    };

    const summary = buildPriceSummary(DEFAULT_BUILD_STATE_V2, fixtures);
    expect(summary.isPartial).toBe(true);
    expect(summary.subtotalAmount).toBe(599);
    const missing = summary.lines.filter((line) => line.status === "unavailable");
    expect(missing.length).toBeGreaterThan(0);
    expect(missing.some((line) => line.reason?.includes("no fixture price"))).toBe(
      true,
    );
  });
});

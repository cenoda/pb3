import { describe, expect, it } from "vitest";
import {
  loadBaselineFixtures,
  loadCinebenchFixtures,
  loadPerf1Fixtures,
} from "../catalog/loadPerf1Fixtures";

describe("loadPerf1Fixtures", () => {
  it("loads baseline fixtures (96 rows)", async () => {
    const fixtures = await loadBaselineFixtures();
    expect(fixtures.contractVersion).toBe("perf1");
    expect(fixtures.rows).toHaveLength(96);
  });

  it("loads Cinebench fixtures (8 rows)", async () => {
    const fixtures = await loadCinebenchFixtures();
    expect(fixtures.contractVersion).toBe("perf1");
    expect(fixtures.rows).toHaveLength(8);
  });

  it("loads both fixture files together", async () => {
    const fixtures = await loadPerf1Fixtures();
    expect(fixtures.baseline.rows).toHaveLength(96);
    expect(fixtures.cinebench.rows).toHaveLength(8);
  });

  it("fails loudly on HTTP error", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(null, { status: 404 });

    await expect(loadBaselineFixtures()).rejects.toThrow(
      /Failed to load baseline fixtures/,
    );

    globalThis.fetch = originalFetch;
  });

  it("fails loudly on schema parse failure", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ contractVersion: "perf1", rows: [] }), {
        status: 200,
      });

    await expect(loadBaselineFixtures()).rejects.toThrow(
      /Invalid baseline fixtures/,
    );

    globalThis.fetch = originalFetch;
  });
});

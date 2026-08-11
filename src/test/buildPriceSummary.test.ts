import { describe, expect, it } from "vitest";
import { buildPriceSummary } from "../price/buildPriceSummary";
import { loadCatalogPrices } from "../price/loadCatalogPrices";
import { DEFAULT_BUILD_STATE_V2 } from "../contract/vs2";
import type { CatalogPriceFile, CatalogPriceRow } from "../contract/cat6";

const DEFAULT_BUILD_PART_IDS = [
  DEFAULT_BUILD_STATE_V2.caseId,
  DEFAULT_BUILD_STATE_V2.motherboardId,
  DEFAULT_BUILD_STATE_V2.cpuId,
  DEFAULT_BUILD_STATE_V2.gpuId,
  DEFAULT_BUILD_STATE_V2.coolerId,
  DEFAULT_BUILD_STATE_V2.ramId,
  DEFAULT_BUILD_STATE_V2.psuId,
] as const;

const DEFAULT_BUILD_CATEGORIES = [
  "case",
  "motherboard",
  "cpu",
  "gpu",
  "cooler",
  "ram",
  "psu",
] as const;

function catalogPriceFile(rows: CatalogPriceRow[]): CatalogPriceFile {
  return {
    catalogContractVersion: "cat6",
    dataVersion: "test-cat6-prices",
    rows,
  };
}

function streetRow(
  partId: string,
  category: CatalogPriceRow["category"],
  amount: number,
  overrides: Partial<NonNullable<CatalogPriceRow["street"]>> = {},
): CatalogPriceRow {
  return {
    partId,
    category,
    street: {
      amount,
      currency: "KRW",
      retailer: "Test Retailer",
      region: "KR",
      sourceId: `source.test.${partId}.street`,
      retrievedAt: "2026-08-11",
      ...overrides,
    },
  };
}

function fullStreetRows(): CatalogPriceRow[] {
  return DEFAULT_BUILD_PART_IDS.map((partId, i) =>
    streetRow(partId, DEFAULT_BUILD_CATEGORIES[i]!, 100_000 + i * 1_000),
  );
}

describe("buildPriceSummary", () => {
  it("sums a full set of street-priced parts with no unavailable lines", () => {
    const rows = fullStreetRows();
    const summary = buildPriceSummary(
      DEFAULT_BUILD_STATE_V2,
      catalogPriceFile(rows),
    );

    expect(summary.isPartial).toBe(false);
    expect(summary.currency).toBe("KRW");
    expect(summary.lines).toHaveLength(7);
    expect(summary.lines.every((line) => line.status === "ok")).toBe(true);
    const expectedTotal = rows.reduce(
      (sum, row) => sum + row.street!.amount,
      0,
    );
    expect(summary.subtotalAmount).toBe(expectedTotal);
  });

  it("maps a row with only MSRP to an unavailable line, not summed", () => {
    const rows = fullStreetRows();
    const gpuIndex = rows.findIndex(
      (r) => r.partId === DEFAULT_BUILD_STATE_V2.gpuId,
    );
    rows[gpuIndex] = {
      partId: DEFAULT_BUILD_STATE_V2.gpuId,
      category: "gpu",
      msrp: {
        amount: 599,
        currency: "USD",
        sourceId: "source.test.gpu.msrp",
        retrievedAt: "2026-08-11",
      },
    };

    const summary = buildPriceSummary(
      DEFAULT_BUILD_STATE_V2,
      catalogPriceFile(rows),
    );

    expect(summary.isPartial).toBe(true);
    const gpuLine = summary.lines.find(
      (l) => l.partId === DEFAULT_BUILD_STATE_V2.gpuId,
    );
    expect(gpuLine?.status).toBe("unavailable");
    expect(gpuLine?.amount).toBeUndefined();
    expect(gpuLine?.reason).toMatch(/MSRP/);
    expect(gpuLine?.reason).not.toMatch(/599/);
    const okLines = summary.lines.filter((l) => l.status === "ok");
    expect(okLines).toHaveLength(6);
  });

  it("maps a missing row to unavailable", () => {
    const summary = buildPriceSummary(
      DEFAULT_BUILD_STATE_V2,
      catalogPriceFile([]),
    );

    expect(summary.isPartial).toBe(true);
    expect(summary.lines).toHaveLength(7);
    expect(summary.lines.every((line) => line.status === "unavailable")).toBe(
      true,
    );
    expect(summary.subtotalAmount).toBe(0);
    expect(
      summary.lines.every((line) => line.reason?.includes("No catalog price")),
    ).toBe(true);
  });

  it("produces a partial total that sums only the priced parts", () => {
    const rows = fullStreetRows().slice(0, 5);
    const summary = buildPriceSummary(
      DEFAULT_BUILD_STATE_V2,
      catalogPriceFile(rows),
    );

    expect(summary.isPartial).toBe(true);
    const okLines = summary.lines.filter((l) => l.status === "ok");
    const unavailableLines = summary.lines.filter(
      (l) => l.status === "unavailable",
    );
    expect(okLines).toHaveLength(5);
    expect(unavailableLines).toHaveLength(2);
    const expectedTotal = rows.reduce(
      (sum, row) => sum + row.street!.amount,
      0,
    );
    expect(summary.subtotalAmount).toBe(expectedTotal);
  });

  it("uses the exact snapshot basis wording for a priced line", () => {
    const rows = fullStreetRows();
    const caseIndex = rows.findIndex(
      (r) => r.partId === DEFAULT_BUILD_STATE_V2.caseId,
    );
    rows[caseIndex] = streetRow(
      DEFAULT_BUILD_STATE_V2.caseId,
      "case",
      234_060,
      { retailer: "Coupang (via Danawa price comparison)", region: "KR", retrievedAt: "2026-08-11" },
    );

    const summary = buildPriceSummary(
      DEFAULT_BUILD_STATE_V2,
      catalogPriceFile(rows),
    );

    const caseLine = summary.lines.find(
      (l) => l.partId === DEFAULT_BUILD_STATE_V2.caseId,
    );
    expect(caseLine?.basis).toBe(
      "Coupang (via Danawa price comparison) listing in KR, retrieved 2026-08-11; snapshot, not a live quote",
    );
  });

  it("never carries phase-2 fixture wording in basis or reason text", () => {
    const summary = buildPriceSummary(
      DEFAULT_BUILD_STATE_V2,
      catalogPriceFile([]),
    );

    for (const line of summary.lines) {
      expect(line.basis.toLowerCase()).not.toContain("phase-2");
      expect(line.basis.toLowerCase()).not.toContain("fixture price");
      expect((line.reason ?? "").toLowerCase()).not.toContain("phase-2");
    }
  });

  it("withholds a non-KRW street price instead of silently summing it", () => {
    const rows = fullStreetRows();
    const ramIndex = rows.findIndex(
      (r) => r.partId === DEFAULT_BUILD_STATE_V2.ramId,
    );
    rows[ramIndex] = streetRow(
      DEFAULT_BUILD_STATE_V2.ramId,
      "ram",
      150,
      { currency: "USD" },
    );

    const summary = buildPriceSummary(
      DEFAULT_BUILD_STATE_V2,
      catalogPriceFile(rows),
    );

    expect(summary.currency).toBe("KRW");
    const ramLine = summary.lines.find(
      (l) => l.partId === DEFAULT_BUILD_STATE_V2.ramId,
    );
    expect(ramLine?.status).toBe("unavailable");
    expect(ramLine?.reason).toMatch(/USD/);
    expect(ramLine?.reason).toMatch(/KRW/);
    const okLines = summary.lines.filter((l) => l.status === "ok");
    expect(okLines).toHaveLength(6);
    expect(summary.isPartial).toBe(true);
  });

  it("derives dataVersion from the loaded catalog price file, not a hardcoded string", () => {
    const summary = buildPriceSummary(
      DEFAULT_BUILD_STATE_V2,
      catalogPriceFile(fullStreetRows()),
    );
    expect(summary.dataVersion).toBe("test-cat6-prices");
    expect(summary.lines.every((l) => l.dataVersion === "test-cat6-prices")).toBe(
      true,
    );
  });

  it("maps the live catalog against the default build honestly (current sourcing coverage)", async () => {
    const catalogPrices = await loadCatalogPrices();
    const summary = buildPriceSummary(DEFAULT_BUILD_STATE_V2, catalogPrices);

    // Documents current real coverage: cpu (no row), gpu (no row), and psu
    // (MSRP-only) are unavailable; the rest are street-priced. Update this
    // lock deliberately if sourcing coverage changes, not silently.
    const unavailableIds = summary.lines
      .filter((l) => l.status === "unavailable")
      .map((l) => l.partId)
      .sort();
    expect(unavailableIds).toEqual(
      [
        DEFAULT_BUILD_STATE_V2.cpuId,
        DEFAULT_BUILD_STATE_V2.gpuId,
        DEFAULT_BUILD_STATE_V2.psuId,
      ].sort(),
    );
    expect(summary.isPartial).toBe(true);
    expect(summary.currency).toBe("KRW");
  });
});

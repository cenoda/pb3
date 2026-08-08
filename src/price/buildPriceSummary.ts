import type { BuildPriceSummary, PriceFixtureFile, PricedPart } from "../contract/compat2";
import { COMPAT2_FIXTURE_BASIS } from "../contract/compat2";
import type { BuildStateV2 } from "../contract/vs2";

const DATA_VERSION = "compat2-fixture-draft";
const FIXTURE_CURRENCY = "USD";

const SELECTED_PARTS: Array<{
  getId: (state: BuildStateV2) => string;
  category: PricedPart["category"];
}> = [
  { getId: (s) => s.caseId, category: "case" },
  { getId: (s) => s.motherboardId, category: "motherboard" },
  { getId: (s) => s.cpuId, category: "cpu" },
  { getId: (s) => s.gpuId, category: "gpu" },
  { getId: (s) => s.coolerId, category: "cooler" },
  { getId: (s) => s.ramId, category: "ram" },
  { getId: (s) => s.psuId, category: "psu" },
];

function lookupPriceRow(
  fixtures: PriceFixtureFile,
  partId: string,
): PricedPart | undefined {
  return fixtures.rows.find((row) => row.partId === partId);
}

export function buildPriceSummary(
  buildState: BuildStateV2,
  fixtures: PriceFixtureFile,
): BuildPriceSummary {
  const lines: PricedPart[] = SELECTED_PARTS.map(({ getId, category }) => {
    const partId = getId(buildState);
    const row = lookupPriceRow(fixtures, partId);

    if (row?.status === "ok" && row.amount != null && row.currency) {
      return row;
    }

    return {
      partId,
      category,
      status: "unavailable",
      basis: COMPAT2_FIXTURE_BASIS,
      reason: row
        ? "fixture price row is not ok"
        : `no fixture price row for part id ${partId}`,
      dataVersion: DATA_VERSION,
    };
  });

  const okLines = lines.filter((line) => line.status === "ok");
  const subtotalAmount = okLines.reduce(
    (sum, line) => sum + (line.amount ?? 0),
    0,
  );
  const isPartial = lines.some((line) => line.status === "unavailable");

  return {
    compatContractVersion: "compat2",
    lines,
    subtotalAmount,
    currency: FIXTURE_CURRENCY,
    isPartial,
    dataVersion: DATA_VERSION,
  };
}

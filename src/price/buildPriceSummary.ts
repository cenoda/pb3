import type { BuildPriceSummary, PricedPart } from "../contract/compat2";
import type { CatalogPriceFile, CatalogPriceRow } from "../contract/cat6";
import type { BuildStateV2 } from "../contract/vs2";

/**
 * O5 / RK9: the street snapshot drives the total, and the total is single-currency.
 * A part whose street price is in a different currency is withheld rather than
 * silently summed, so this constant is also the runtime enforcement point, not
 * just a label.
 */
const RUNTIME_CURRENCY = "KRW" as const;

const NO_PRICE_BASIS =
  "cat6 catalog price snapshot; not a live market quote" as const;

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
  catalogPrices: CatalogPriceFile,
  partId: string,
): CatalogPriceRow | undefined {
  return catalogPrices.rows.find((row) => row.partId === partId);
}

function unavailableLine(
  partId: string,
  category: PricedPart["category"],
  reason: string,
  dataVersion: string,
): PricedPart {
  return {
    partId,
    category,
    status: "unavailable",
    basis: NO_PRICE_BASIS,
    reason,
    dataVersion,
  };
}

export function buildPriceSummary(
  buildState: BuildStateV2,
  catalogPrices: CatalogPriceFile,
): BuildPriceSummary {
  const lines: PricedPart[] = SELECTED_PARTS.map(({ getId, category }) => {
    const partId = getId(buildState);
    const row = lookupPriceRow(catalogPrices, partId);

    if (!row) {
      return unavailableLine(
        partId,
        category,
        `No catalog price has been sourced yet for ${partId}.`,
        catalogPrices.dataVersion,
      );
    }

    if (!row.street) {
      return unavailableLine(
        partId,
        category,
        row.msrp
          ? `Only the manufacturer MSRP is on record for ${partId}; no dated domestic street price snapshot yet.`
          : `No price has been sourced yet for ${partId}.`,
        catalogPrices.dataVersion,
      );
    }

    if (row.street.currency !== RUNTIME_CURRENCY) {
      return unavailableLine(
        partId,
        category,
        `The street price on record for ${partId} is in ${row.street.currency}, not ${RUNTIME_CURRENCY}; it cannot be added to the ${RUNTIME_CURRENCY} total.`,
        catalogPrices.dataVersion,
      );
    }

    return {
      partId,
      category,
      status: "ok",
      amount: row.street.amount,
      currency: row.street.currency,
      basis: `${row.street.retailer} listing in ${row.street.region}, retrieved ${row.street.retrievedAt}; snapshot, not a live quote`,
      dataVersion: catalogPrices.dataVersion,
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
    currency: RUNTIME_CURRENCY,
    isPartial,
    dataVersion: catalogPrices.dataVersion,
  };
}

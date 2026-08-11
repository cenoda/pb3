import type { CatalogPriceFile } from "../contract/cat6";
import { CAT6_CATALOG_PRICES_PATH } from "../contract/cat6";
import { catalogPriceFileSchema } from "../contract/cat6.schema";

export async function loadCatalogPrices(): Promise<CatalogPriceFile> {
  const response = await fetch(CAT6_CATALOG_PRICES_PATH);
  if (!response.ok) {
    throw new Error(
      `Failed to load catalog prices at ${CAT6_CATALOG_PRICES_PATH}: HTTP ${response.status}`,
    );
  }

  const json: unknown = await response.json();
  const parsed = catalogPriceFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid catalog prices at ${CAT6_CATALOG_PRICES_PATH}: ${parsed.error.message}`,
    );
  }

  return parsed.data;
}

import type { PriceFixtureFile } from "../contract/compat2";
import { COMPAT2_PRICE_FIXTURES_PATH } from "../contract/compat2";
import { priceFixtureFileSchema } from "../contract/compat2.schema";

export async function loadPriceFixtures(): Promise<PriceFixtureFile> {
  const response = await fetch(COMPAT2_PRICE_FIXTURES_PATH);
  if (!response.ok) {
    throw new Error(
      `Failed to load price fixtures at ${COMPAT2_PRICE_FIXTURES_PATH}: HTTP ${response.status}`,
    );
  }

  const json: unknown = await response.json();
  const parsed = priceFixtureFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid price fixtures at ${COMPAT2_PRICE_FIXTURES_PATH}: ${parsed.error.message}`,
    );
  }

  return parsed.data;
}

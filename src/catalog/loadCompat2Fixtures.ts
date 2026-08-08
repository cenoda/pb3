import type { CompatibilityExampleFile } from "../contract/compat2";
import { COMPAT2_COMPAT_EXAMPLES_PATH } from "../contract/compat2";
import { compatibilityExampleFileSchema } from "../contract/compat2.schema";

export async function loadCompat2Examples(): Promise<CompatibilityExampleFile> {
  const response = await fetch(COMPAT2_COMPAT_EXAMPLES_PATH);
  if (!response.ok) {
    throw new Error(
      `Failed to load compatibility examples at ${COMPAT2_COMPAT_EXAMPLES_PATH}: HTTP ${response.status}`,
    );
  }

  const json: unknown = await response.json();
  const parsed = compatibilityExampleFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid compatibility examples at ${COMPAT2_COMPAT_EXAMPLES_PATH}: ${parsed.error.message}`,
    );
  }

  return parsed.data;
}

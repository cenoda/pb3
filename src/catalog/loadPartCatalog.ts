import type { PartDefinitionV2 } from "../contract/partV2";
import { PHASE2_PART_PATHS } from "../contract/vs2";
import { partDefinitionV2Schema } from "../contract/vs2.schema";
import {
  createPartCatalog,
  type PartCatalog,
} from "../state/validateBuildState";

export async function loadPartCatalog(): Promise<PartCatalog> {
  const parts = await Promise.all(
    PHASE2_PART_PATHS.map(async (partPath) => {
      const response = await fetch(`/${partPath}`);
      if (!response.ok) {
        throw new Error(
          `Failed to load part fixture at /${partPath}: HTTP ${response.status}`,
        );
      }

      const json: unknown = await response.json();
      const parsed = partDefinitionV2Schema.safeParse(json);
      if (!parsed.success) {
        throw new Error(
          `Invalid part fixture at /${partPath}: ${parsed.error.message}`,
        );
      }

      if (parsed.data.id !== partPath.split("/")[2]) {
        throw new Error(
          `Part id mismatch at /${partPath}: expected folder name to match id`,
        );
      }

      return parsed.data as PartDefinitionV2;
    }),
  );

  return createPartCatalog(parts);
}

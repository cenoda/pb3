import { catalogManifestFileSchema } from "../contract/cat6.schema";
import type { PartDefinitionV2 } from "../contract/partV2";
import { DEFAULT_BUILD_STATE_V2 } from "../contract/vs2";
import { partDefinitionV2Schema } from "../contract/vs2.schema";
import {
  createPartCatalog,
  type PartCatalog,
} from "../state/validateBuildState";

const CATALOG_MANIFEST_PATH = "/parts/catalog-manifest.json";

const DEFAULT_BUILD_PART_KEYS = [
  "caseId",
  "motherboardId",
  "cpuId",
  "gpuId",
  "coolerId",
  "ramId",
  "psuId",
] as const;

function assertDefaultBuildInCatalog(catalog: PartCatalog): void {
  for (const key of DEFAULT_BUILD_PART_KEYS) {
    const partId = DEFAULT_BUILD_STATE_V2[key];
    if (!catalog.get(partId)) {
      throw new Error(
        `Default build ${key}=${partId} is not in the loaded catalog manifest`,
      );
    }
  }
}

export async function loadPartCatalog(): Promise<PartCatalog> {
  const manifestResponse = await fetch(CATALOG_MANIFEST_PATH);
  if (!manifestResponse.ok) {
    throw new Error(
      `Failed to load catalog manifest at ${CATALOG_MANIFEST_PATH}: HTTP ${manifestResponse.status}`,
    );
  }

  const manifestJson: unknown = await manifestResponse.json();
  const manifestParsed = catalogManifestFileSchema.safeParse(manifestJson);
  if (!manifestParsed.success) {
    throw new Error(
      `Invalid catalog manifest at ${CATALOG_MANIFEST_PATH}: ${manifestParsed.error.message}`,
    );
  }

  const manifest = manifestParsed.data;

  const parts = await Promise.all(
    manifest.parts.map(async (entry) => {
      const partPath = entry.path;
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

      if (parsed.data.id !== entry.id) {
        throw new Error(
          `Part id mismatch at /${partPath}: manifest id ${entry.id} !== part id ${parsed.data.id}`,
        );
      }

      if (parsed.data.id !== partPath.split("/")[2]) {
        throw new Error(
          `Part id mismatch at /${partPath}: expected folder name to match id`,
        );
      }

      if (parsed.data.category !== entry.category) {
        throw new Error(
          `Part category mismatch at /${partPath}: manifest category ${entry.category} !== part category ${parsed.data.category}`,
        );
      }

      return parsed.data as PartDefinitionV2;
    }),
  );

  const catalog = createPartCatalog(parts);
  assertDefaultBuildInCatalog(catalog);
  return catalog;
}

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CatalogManifestFile, PartDefinitionV3 } from "../contract/cat6";
import { catalogManifestFileSchema, partDefinitionV3Schema } from "../contract/cat6.schema";

export interface CatalogIdentitySnapshot {
  id: string;
  manufacturer: string;
  modelName: string;
  partNumber?: string;
  displayName: string;
}

export function loadCatalogIdentities(
  repoRoot: string,
): CatalogIdentitySnapshot[] {
  const manifest = catalogManifestFileSchema.parse(
    JSON.parse(
      readFileSync(resolve(repoRoot, "parts/catalog-manifest.json"), "utf8"),
    ),
  ) as CatalogManifestFile;
  return manifest.parts.map((entry) => {
    const part = partDefinitionV3Schema.parse(
      JSON.parse(readFileSync(resolve(repoRoot, entry.path), "utf8")),
    ) as PartDefinitionV3;
    return {
      id: part.id,
      manufacturer: part.identity.manufacturer,
      modelName: part.identity.modelName,
      partNumber: part.identity.partNumber,
      displayName: part.displayName,
    };
  });
}

export function loadPartDefinition(
  repoRoot: string,
  partPath: string,
): PartDefinitionV3 {
  return partDefinitionV3Schema.parse(
    JSON.parse(readFileSync(resolve(repoRoot, partPath), "utf8")),
  ) as PartDefinitionV3;
}

export function loadManifest(repoRoot: string): CatalogManifestFile {
  return catalogManifestFileSchema.parse(
    JSON.parse(
      readFileSync(resolve(repoRoot, "parts/catalog-manifest.json"), "utf8"),
    ),
  ) as CatalogManifestFile;
}

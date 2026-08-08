import type { PartCatalog } from "../state/validateBuildState";
import {
  indexGlbPhysicalNodesFromBytes,
  type GlbPhysicalIndex,
} from "./indexGlbPhysicalNodes";
import { loadPhysicalSpec } from "./loadPhysicalSpec";

/**
 * Fetch and index GLBs for parts that declare physicalSpec.
 * Visual-only parts are skipped.
 */
export async function loadGlbPhysicalIndexes(
  catalog: PartCatalog,
): Promise<Map<string, GlbPhysicalIndex>> {
  const map = new Map<string, GlbPhysicalIndex>();
  const parts = [...catalog.byId.values()];

  await Promise.all(
    parts.map(async (part) => {
      if (!loadPhysicalSpec(part)) return;
      const response = await fetch(`/${part.modelGlbPath}`);
      if (!response.ok) {
        throw new Error(
          `Failed to load GLB /${part.modelGlbPath}: HTTP ${response.status}`,
        );
      }
      const buffer = new Uint8Array(await response.arrayBuffer());
      const index = indexGlbPhysicalNodesFromBytes(part.id, buffer);
      map.set(part.id, index);
    }),
  );

  return map;
}

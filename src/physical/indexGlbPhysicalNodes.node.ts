import fs from "node:fs";
import path from "node:path";
import {
  indexGlbPhysicalNodesFromBytes,
  type GlbPhysicalIndex,
} from "./indexGlbPhysicalNodes";

export type { GlbPhysicalIndex };

/** Node-only helper for unit/fixture integrity tests. */
export function indexGlbPhysicalNodesFromPath(
  partId: string,
  absoluteGlbPath: string,
): GlbPhysicalIndex {
  const bytes = new Uint8Array(fs.readFileSync(absoluteGlbPath));
  return indexGlbPhysicalNodesFromBytes(partId, bytes);
}

export function resolveRepoPartGlbPath(
  modelGlbPath: string,
  repoRoot: string,
): string {
  return path.join(repoRoot, modelGlbPath);
}

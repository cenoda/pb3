/**
 * Load Phase-4 pilot geometry evidence (fail-closed Zod parse).
 */
import type { GeometryEvidenceFile } from "../contract/prov4";
import { geometryEvidenceFileSchema } from "../contract/prov4.schema";

const PATH = "/benchmarks/prov4/pilot-geometry-evidence.json";

export async function loadGeometryEvidence(): Promise<GeometryEvidenceFile> {
  const response = await fetch(PATH);
  if (!response.ok) {
    throw new Error(
      `Failed to load geometry evidence at ${PATH}: HTTP ${response.status}`,
    );
  }
  const json: unknown = await response.json();
  const parsed = geometryEvidenceFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid geometry evidence at ${PATH}: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

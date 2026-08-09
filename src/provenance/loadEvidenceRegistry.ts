/**
 * Load Phase-4 evidence source registry (fail-closed Zod parse).
 */
import type { EvidenceSourceRegistryFile } from "../contract/prov4";
import { evidenceSourceRegistryFileSchema } from "../contract/prov4.schema";

const PATH = "/benchmarks/prov4/evidence-source-registry.json";

export async function loadEvidenceRegistry(): Promise<EvidenceSourceRegistryFile> {
  const response = await fetch(PATH);
  if (!response.ok) {
    throw new Error(
      `Failed to load evidence registry at ${PATH}: HTTP ${response.status}`,
    );
  }
  const json: unknown = await response.json();
  const parsed = evidenceSourceRegistryFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid evidence registry at ${PATH}: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

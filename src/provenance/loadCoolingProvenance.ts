/**
 * Load Phase-4 cooling provenance (empty rows valid).
 */
import type { CoolingProvenanceFile } from "../contract/prov4";
import { coolingProvenanceFileSchema } from "../contract/prov4.schema";

const PATH = "/benchmarks/prov4/pilot-cooling-provenance.json";

export async function loadCoolingProvenance(): Promise<CoolingProvenanceFile> {
  const response = await fetch(PATH);
  if (!response.ok) {
    throw new Error(
      `Failed to load cooling provenance at ${PATH}: HTTP ${response.status}`,
    );
  }
  const json: unknown = await response.json();
  const parsed = coolingProvenanceFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid cooling provenance at ${PATH}: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

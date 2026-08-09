/**
 * Load Phase-4 pilot performance evidence (fail-closed Zod parse).
 */
import type { PerformanceEvidenceFile } from "../contract/prov4";
import { performanceEvidenceFileSchema } from "../contract/prov4.schema";

const PATH = "/benchmarks/prov4/pilot-performance-evidence.json";

export async function loadPerformanceEvidence(): Promise<PerformanceEvidenceFile> {
  const response = await fetch(PATH);
  if (!response.ok) {
    throw new Error(
      `Failed to load performance evidence at ${PATH}: HTTP ${response.status}`,
    );
  }
  const json: unknown = await response.json();
  const parsed = performanceEvidenceFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid performance evidence at ${PATH}: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

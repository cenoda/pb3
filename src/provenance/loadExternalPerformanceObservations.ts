/**
 * Load curated external performance observations (fail-closed Zod parse).
 */
import type { ExternalPerformanceObservationsFile } from "../contract/prov4";
import { externalPerformanceObservationsFileSchema } from "../contract/prov4.schema";

const PATH = "/benchmarks/prov4/external-performance-observations.json";

export async function loadExternalPerformanceObservations(): Promise<ExternalPerformanceObservationsFile> {
  const response = await fetch(PATH);
  if (!response.ok) {
    throw new Error(
      `Failed to load external observations at ${PATH}: HTTP ${response.status}`,
    );
  }
  const json: unknown = await response.json();
  const parsed = externalPerformanceObservationsFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid external observations at ${PATH}: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

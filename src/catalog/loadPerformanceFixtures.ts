import type { PerformanceFixtureFile } from "../contract/vs0";
import { performanceFixtureFileSchema } from "../contract/vs0.schema";

const PERFORMANCE_FIXTURES_PATH =
  "/benchmarks/vs0/performance-fixtures.json";

export async function loadPerformanceFixtures(): Promise<PerformanceFixtureFile> {
  const response = await fetch(PERFORMANCE_FIXTURES_PATH);
  if (!response.ok) {
    throw new Error(
      `Failed to load performance fixtures at ${PERFORMANCE_FIXTURES_PATH}: HTTP ${response.status}`,
    );
  }

  const json: unknown = await response.json();
  const parsed = performanceFixtureFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid performance fixtures at ${PERFORMANCE_FIXTURES_PATH}: ${parsed.error.message}`,
    );
  }

  return parsed.data;
}

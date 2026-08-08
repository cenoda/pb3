import type {
  BaselineFixtureFile,
  CinebenchFixtureFile,
} from "../contract/perf1";
import {
  baselineFixtureFileSchema,
  cinebenchFixtureFileSchema,
} from "../contract/perf1.schema";

const BASELINE_FIXTURES_PATH =
  "/benchmarks/perf1/performance-fixtures.json";
const CINEBENCH_FIXTURES_PATH =
  "/benchmarks/perf1/cinebench-fixtures.json";

export async function loadBaselineFixtures(): Promise<BaselineFixtureFile> {
  const response = await fetch(BASELINE_FIXTURES_PATH);
  if (!response.ok) {
    throw new Error(
      `Failed to load baseline fixtures at ${BASELINE_FIXTURES_PATH}: HTTP ${response.status}`,
    );
  }

  const json: unknown = await response.json();
  const parsed = baselineFixtureFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid baseline fixtures at ${BASELINE_FIXTURES_PATH}: ${parsed.error.message}`,
    );
  }

  return parsed.data;
}

export async function loadCinebenchFixtures(): Promise<CinebenchFixtureFile> {
  const response = await fetch(CINEBENCH_FIXTURES_PATH);
  if (!response.ok) {
    throw new Error(
      `Failed to load Cinebench fixtures at ${CINEBENCH_FIXTURES_PATH}: HTTP ${response.status}`,
    );
  }

  const json: unknown = await response.json();
  const parsed = cinebenchFixtureFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid Cinebench fixtures at ${CINEBENCH_FIXTURES_PATH}: ${parsed.error.message}`,
    );
  }

  return parsed.data;
}

export interface Perf1Fixtures {
  baseline: BaselineFixtureFile;
  cinebench: CinebenchFixtureFile;
}

export async function loadPerf1Fixtures(): Promise<Perf1Fixtures> {
  const [baseline, cinebench] = await Promise.all([
    loadBaselineFixtures(),
    loadCinebenchFixtures(),
  ]);
  return { baseline, cinebench };
}

import type {
  BaselineEstimateResult,
  BaselineFixtureFile,
  BaselineQuery,
  PerformanceEstimate,
  UnavailableResult,
} from "../contract/perf1";

const ALLOWED_UPSCALE_IDS = new Set([
  "upscale.off",
  "upscale.dlss-quality",
]);
const ALLOWED_FRAME_GEN_IDS = new Set(["framegen.off", "framegen.on"]);
const ALLOWED_RAM_TIER_IDS = new Set(["ram.16gb-ddr5", "ram.32gb-ddr5"]);
const ALLOWED_POWER_PROFILE_IDS = new Set(["power.default"]);

const MISSING_COVERAGE_REASON =
  "The combination performance estimator is still in preparation; performance data is not available yet.";

function baselineRowKey(query: BaselineQuery): string {
  return [
    query.cpuId,
    query.gpuId,
    query.gameId,
    query.presetId,
    query.resolution,
    query.upscaleId,
    query.frameGenId,
    query.ramTierId,
    query.powerProfileId,
  ].join("\0");
}

function validateBaselineVocabulary(
  query: BaselineQuery,
): UnavailableResult | null {
  if (!ALLOWED_UPSCALE_IDS.has(query.upscaleId)) {
    return {
      status: "unavailable",
      reason: `upscaleId ${query.upscaleId} is not a supported upscale setting (upscale.off, upscale.dlss-quality).`,
    };
  }
  if (!ALLOWED_FRAME_GEN_IDS.has(query.frameGenId)) {
    return {
      status: "unavailable",
      reason: `frameGenId ${query.frameGenId} is not a supported frame generation setting (framegen.off, framegen.on).`,
    };
  }
  if (!ALLOWED_RAM_TIER_IDS.has(query.ramTierId)) {
    return {
      status: "unavailable",
      reason: `ramTierId ${query.ramTierId} is not a supported memory tier (ram.16gb-ddr5, ram.32gb-ddr5).`,
    };
  }
  if (!ALLOWED_POWER_PROFILE_IDS.has(query.powerProfileId)) {
    return {
      status: "unavailable",
      reason: `powerProfileId ${query.powerProfileId} is not a supported power profile (power.default).`,
    };
  }
  return null;
}

function unavailableForMissingRow(_query: BaselineQuery): UnavailableResult {
  return {
    status: "unavailable",
    reason: MISSING_COVERAGE_REASON,
  };
}

export function estimateBaseline(
  query: BaselineQuery,
  fixtures: BaselineFixtureFile,
): BaselineEstimateResult {
  const vocabularyError = validateBaselineVocabulary(query);
  if (vocabularyError) {
    return vocabularyError;
  }

  const row = fixtures.rows.find(
    (candidate) => baselineRowKey(candidate) === baselineRowKey(query),
  );

  if (!row) {
    return unavailableForMissingRow(query);
  }

  const estimate: PerformanceEstimate = {
    fpsMin: row.fpsMin,
    fpsMax: row.fpsMax,
    confidence: row.confidence,
    dataVersion: row.dataVersion,
    basis: row.basis,
    limitingFactor: row.limitingFactor,
  };

  return estimate;
}

export function buildBaselineLookupIndex(
  fixtures: BaselineFixtureFile,
): Map<string, (typeof fixtures.rows)[number]> {
  const index = new Map<string, (typeof fixtures.rows)[number]>();
  for (const row of fixtures.rows) {
    index.set(baselineRowKey(row), row);
  }
  return index;
}

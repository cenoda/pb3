import type {
  PerformanceEstimate,
  PerformanceFixtureFile,
  PerformanceQuery,
} from "../contract/vs0";
import { VS0_CONTRACT_VERSION } from "../contract/vs0";

export function estimatePerformance(
  query: PerformanceQuery,
  fixtures: PerformanceFixtureFile,
): PerformanceEstimate {
  const row = fixtures.rows.find(
    (r) =>
      r.cpuId === query.cpuId &&
      r.gpuId === query.gpuId &&
      r.gameId === query.gameId &&
      r.presetId === query.presetId &&
      r.resolutionId === query.resolutionId,
  );

  if (!row) {
    return {
      contractVersion: VS0_CONTRACT_VERSION,
      query,
      status: "unavailable",
      fpsMin: null,
      fpsMax: null,
      confidence: "none",
      dataVersion: fixtures.dataVersion,
      basis: "no fixture row for this combination",
      reason: "missing_fixture_row",
    };
  }

  return {
    contractVersion: VS0_CONTRACT_VERSION,
    query,
    status: "ok",
    fpsMin: row.fpsMin,
    fpsMax: row.fpsMax,
    confidence: row.confidence,
    dataVersion: row.dataVersion,
    basis: row.basis,
  };
}

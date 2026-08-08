import type {
  CinebenchFixtureFile,
  UnavailableResult,
  WorkloadEstimate,
  WorkloadEstimateResult,
  WorkloadQuery,
} from "../contract/perf1";

const ALLOWED_WORKLOAD_IDS = new Set(["cinebench.r23", "cinebench.2024"]);
const ALLOWED_METRICS = new Set(["metric.single-core", "metric.multi-core"]);
const ALLOWED_CPU_IDS = new Set(["cpu.zen4-7600", "cpu.zen4-7800x3d"]);

function workloadKey(query: WorkloadQuery): string {
  return [query.cpuId, query.workloadId, query.metric].join("\0");
}

function validateWorkloadVocabulary(
  query: WorkloadQuery,
): UnavailableResult | null {
  if (!ALLOWED_CPU_IDS.has(query.cpuId)) {
    return {
      status: "unavailable",
      reason: `cpuId ${query.cpuId} is not in perf1 Cinebench fixture table.`,
    };
  }
  if (!ALLOWED_METRICS.has(query.metric)) {
    return {
      status: "unavailable",
      reason: `metric ${query.metric} is not in perf1 allowed vocabulary (metric.single-core, metric.multi-core).`,
    };
  }
  if (!ALLOWED_WORKLOAD_IDS.has(query.workloadId)) {
    return {
      status: "unavailable",
      reason: `workloadId ${query.workloadId} is unconfirmed; perf1 only supports cinebench.r23 and cinebench.2024.`,
    };
  }
  return null;
}

export function estimateWorkload(
  query: WorkloadQuery,
  fixtures: CinebenchFixtureFile,
): WorkloadEstimateResult {
  const vocabularyError = validateWorkloadVocabulary(query);
  if (vocabularyError) {
    return vocabularyError;
  }

  const row = fixtures.rows.find(
    (candidate) => workloadKey(candidate) === workloadKey(query),
  );

  if (!row) {
    return {
      status: "unavailable",
      reason: `No fixture row for workload query cpuId=${query.cpuId}, workloadId=${query.workloadId}, metric=${query.metric}.`,
    };
  }

  const estimate: WorkloadEstimate = {
    cpuId: row.cpuId,
    workloadId: row.workloadId,
    metric: row.metric,
    score: row.score,
    confidence: row.confidence,
    dataVersion: row.dataVersion,
    basis: row.basis,
  };

  return estimate;
}

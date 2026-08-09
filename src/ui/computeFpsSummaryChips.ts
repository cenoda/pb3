import type { BuildStateV2 } from "../contract/vs2";
import type { Perf1Fixtures } from "../catalog/loadPerf1Fixtures";
import type { Prov4Fixtures } from "../provenance/loadProv4Fixtures";
import { RESOLUTIONS } from "../contract/vs0";
import { applyCorrection } from "../perf/applyCorrection";
import { baselineQueriesForBuild } from "../perf/baselineQuery";
import { estimateBaseline } from "../perf/estimateBaseline";
import { bindPerformanceEvidenceDetailed } from "../provenance/bindPerformanceEvidence";
import {
  isPilotPerformanceOverlayActive,
  pilotBaselineKeyFor,
} from "../provenance/pilotBuild";
import type {
  BaselineEstimateResult,
  PerfPanelDimensions,
} from "../contract/perf1";
import type { CorrectionInput } from "../contract/perf1";
import type { FpsSummaryChip } from "./buildResultSummaryModel";

function isUnavailable(
  result: BaselineEstimateResult,
): result is { status: "unavailable"; reason: string } {
  return "status" in result && result.status === "unavailable";
}

/**
 * Compact FPS chips for the primary summary (O4 A: three resolutions).
 * Uses the same pilot sidecar overlay rules as PerformancePanel.
 */
export function computeFpsSummaryChips(input: {
  buildState: BuildStateV2;
  perf1Fixtures: Perf1Fixtures;
  dimensions: PerfPanelDimensions;
  correction: CorrectionInput;
  prov4Fixtures?: Prov4Fixtures;
}): FpsSummaryChip[] {
  const { buildState, perf1Fixtures, dimensions, correction, prov4Fixtures } =
    input;
  const queries = baselineQueriesForBuild(buildState, dimensions);
  const labelById = new Map(RESOLUTIONS.map((r) => [r.id, r.label]));
  const sidecarActive =
    !!prov4Fixtures && isPilotPerformanceOverlayActive(buildState, dimensions);
  const nowIso = new Date().toISOString();

  return queries.map((query) => {
    const label = labelById.get(query.resolution) ?? query.resolution;

    if (sidecarActive && prov4Fixtures) {
      const detailed = bindPerformanceEvidenceDetailed({
        key: pilotBaselineKeyFor(query.resolution),
        isPilotBuild: true,
        evidenceFile: prov4Fixtures.performance,
        registry: prov4Fixtures.registry,
        verifications: prov4Fixtures.verifications,
        nowIso,
        externalObservations: prov4Fixtures.externalObservations,
        sourceRights: prov4Fixtures.sourceRights,
        verifiedArtifactDigests: prov4Fixtures.verifiedArtifactDigests,
      });
      if (
        detailed.binding.status === "bound" &&
        detailed.displayClass === "aggregated"
      ) {
        return {
          resolution: query.resolution,
          label,
          status: "ok" as const,
          fpsMin: detailed.binding.evidence.measurement.fpsMin,
          fpsMax: detailed.binding.evidence.measurement.fpsMax,
        };
      }
      if (detailed.displayClass === "synthetic-perf1") {
        const baseline = estimateBaseline(query, perf1Fixtures.baseline);
        if (isUnavailable(baseline)) {
          return {
            resolution: query.resolution,
            label,
            status: "unavailable" as const,
            reason:
              detailed.binding.status === "unavailable"
                ? detailed.binding.explanation
                : baseline.reason,
          };
        }
        const correctionResult = applyCorrection(query, baseline, correction);
        const display =
          correctionResult?.status === "ok" ? correctionResult : baseline;
        return {
          resolution: query.resolution,
          label,
          status: "ok" as const,
          fpsMin: display.fpsMin,
          fpsMax: display.fpsMax,
        };
      }
      if (detailed.binding.status === "unavailable") {
        return {
          resolution: query.resolution,
          label,
          status: "unavailable" as const,
          reason: detailed.binding.explanation,
        };
      }
    }

    const baseline = estimateBaseline(query, perf1Fixtures.baseline);
    if (isUnavailable(baseline)) {
      return {
        resolution: query.resolution,
        label,
        status: "unavailable" as const,
        reason: baseline.reason,
      };
    }

    const correctionResult = applyCorrection(query, baseline, correction);
    if (correctionResult?.status === "ok") {
      return {
        resolution: query.resolution,
        label,
        status: "ok" as const,
        fpsMin: correctionResult.fpsMin,
        fpsMax: correctionResult.fpsMax,
      };
    }

    // null / withheld → show baseline estimate (honesty: no invented derate)
    return {
      resolution: query.resolution,
      label,
      status: "ok" as const,
      fpsMin: baseline.fpsMin,
      fpsMax: baseline.fpsMax,
    };
  });
}

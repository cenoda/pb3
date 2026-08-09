import type { Perf1Fixtures } from "../catalog/loadPerf1Fixtures";
import type {
  BaselineEstimateResult,
  CorrectionInput,
  PerfPanelDimensions,
} from "../contract/perf1";
import { RESOLUTIONS } from "../contract/vs0";
import type { BuildStateV2 } from "../contract/vs2";
import { estimatePilotResolution } from "../estimate/estimatePilotResolution";
import type { Est1Fixtures } from "../estimate/loadEst1Fixtures";
import { applyCorrection } from "../perf/applyCorrection";
import { baselineQueriesForBuild } from "../perf/baselineQuery";
import { estimateBaseline } from "../perf/estimateBaseline";
import { bindPerformanceEvidenceDetailed } from "../provenance/bindPerformanceEvidence";
import type { Prov4Fixtures } from "../provenance/loadProv4Fixtures";
import {
  isPilotPerformanceOverlayActive,
  pilotBaselineKeyFor,
} from "../provenance/pilotBuild";

/** Where a shown number came from, in words a user can weigh (spec R3). */
export type PerformanceTrust =
  | "measured"
  | "estimated-low"
  | "estimated-medium"
  | "demo";

export const TRUST_TEXT: Record<PerformanceTrust, string> = {
  measured: "Based on published benchmark results for this hardware.",
  "estimated-low":
    "Estimated from similar hardware, not measured — low confidence.",
  "estimated-medium":
    "Estimated from similar hardware, not measured — medium confidence.",
  demo: "Demo estimate, not measured. Treat it as a placeholder number.",
};

export interface PerformanceRow {
  resolution: string;
  label: string;
  status: "ok" | "unavailable";
  fpsMin?: number;
  fpsMax?: number;
  trust?: PerformanceTrust;
  /** Why no number exists. Never replaced by a guess (Charter §2). */
  reason?: string;
}

export interface PerformanceRowsInput {
  buildState: BuildStateV2;
  perf1Fixtures: Perf1Fixtures;
  dimensions: PerfPanelDimensions;
  correction: CorrectionInput;
  prov4Fixtures?: Prov4Fixtures;
  est1Fixtures?: Est1Fixtures;
}

function isUnavailable(
  result: BaselineEstimateResult,
): result is { status: "unavailable"; reason: string } {
  return "status" in result && result.status === "unavailable";
}

/**
 * FPS per resolution for the result bar.
 *
 * Source selection is unchanged from the engines: est1 estimate when the pilot
 * overlay is active, aggregated external evidence when bound, otherwise the
 * perf1 synthetic baseline. Every row carries the trust class of its source, so
 * no number can be shown without it (spec R3).
 *
 * This function does not know whether the build is buildable. The caller must
 * not call it for a rejected build (spec R1) — that is enforced in App by the
 * verdict gate.
 */
export function computePerformanceRows(
  input: PerformanceRowsInput,
): PerformanceRow[] {
  const {
    buildState,
    perf1Fixtures,
    dimensions,
    correction,
    prov4Fixtures,
    est1Fixtures,
  } = input;

  const queries = baselineQueriesForBuild(buildState, dimensions);
  const labelById = new Map(RESOLUTIONS.map((r) => [r.id, r.label]));
  const sidecarActive =
    !!prov4Fixtures && isPilotPerformanceOverlayActive(buildState, dimensions);
  const est1Active = sidecarActive && !!est1Fixtures;
  const nowIso = new Date().toISOString();

  return queries.map((query): PerformanceRow => {
    const label = labelById.get(query.resolution) ?? query.resolution;

    if (est1Active && est1Fixtures && prov4Fixtures) {
      const est1 = estimatePilotResolution({
        resolution: query.resolution,
        est1Fixtures,
        prov4Fixtures,
      });
      if (est1.status === "estimated") {
        return {
          resolution: query.resolution,
          label,
          status: "ok",
          fpsMin: est1.fpsMin,
          fpsMax: est1.fpsMax,
          trust:
            est1.confidence === "medium" ? "estimated-medium" : "estimated-low",
        };
      }
      return syntheticRow(
        query,
        label,
        perf1Fixtures,
        correction,
        est1.explanation,
      );
    }

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
          status: "ok",
          fpsMin: detailed.binding.evidence.measurement.fpsMin,
          fpsMax: detailed.binding.evidence.measurement.fpsMax,
          trust: "measured",
        };
      }
      if (detailed.displayClass === "synthetic-perf1") {
        return syntheticRow(
          query,
          label,
          perf1Fixtures,
          correction,
          detailed.binding.status === "unavailable"
            ? detailed.binding.explanation
            : undefined,
        );
      }
      if (detailed.binding.status === "unavailable") {
        return {
          resolution: query.resolution,
          label,
          status: "unavailable",
          reason: detailed.binding.explanation,
        };
      }
    }

    return syntheticRow(query, label, perf1Fixtures, correction);
  });
}

function syntheticRow(
  query: ReturnType<typeof baselineQueriesForBuild>[number],
  label: string,
  perf1Fixtures: Perf1Fixtures,
  correction: CorrectionInput,
  unavailableReason?: string,
): PerformanceRow {
  const baseline = estimateBaseline(query, perf1Fixtures.baseline);
  if (isUnavailable(baseline)) {
    return {
      resolution: query.resolution,
      label,
      status: "unavailable",
      reason: unavailableReason ?? baseline.reason,
    };
  }

  const corrected = applyCorrection(query, baseline, correction);
  // null / withheld → show the baseline estimate; never invent a derate.
  const display = corrected?.status === "ok" ? corrected : baseline;
  return {
    resolution: query.resolution,
    label,
    status: "ok",
    fpsMin: display.fpsMin,
    fpsMax: display.fpsMax,
    trust: display.confidence === "stub" ? "demo" : "estimated-low",
  };
}

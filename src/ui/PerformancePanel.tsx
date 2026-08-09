import { RESOLUTIONS } from "../contract/vs0";
import type { BuildStateV2 } from "../contract/vs2";
import type {
  BaselineEstimateResult,
  CorrectionInput,
  Perf1ResolutionId,
  WorkloadId,
  WorkloadMetric,
} from "../contract/perf1";
import type { PerformanceEvidenceBinding } from "../contract/prov4";
import type { Perf1Fixtures } from "../catalog/loadPerf1Fixtures";
import type { Prov4Fixtures } from "../provenance/loadProv4Fixtures";
import { bindPerformanceEvidence } from "../provenance/bindPerformanceEvidence";
import {
  isPilotPerformanceOverlayActive,
  pilotBaselineKeyFor,
} from "../provenance/pilotBuild";
import { applyCorrection } from "../perf/applyCorrection";
import { baselineQueriesForBuild } from "../perf/baselineQuery";
import { estimateBaseline } from "../perf/estimateBaseline";
import { estimateWorkload } from "../perf/estimateWorkload";
import { usePerfPanelStore } from "../state/perfPanelState";

interface PerformancePanelProps {
  buildState: BuildStateV2;
  perf1Fixtures: Perf1Fixtures;
  /** When present, exact pilot keys overlay sidecar evidence (perf1 unchanged). */
  prov4Fixtures?: Prov4Fixtures;
}

const WORKLOAD_IDS: WorkloadId[] = ["cinebench.r23", "cinebench.2024"];
const WORKLOAD_METRICS: WorkloadMetric[] = [
  "metric.single-core",
  "metric.multi-core",
];

function isUnavailable(
  result: BaselineEstimateResult,
): result is { status: "unavailable"; reason: string } {
  return "status" in result && result.status === "unavailable";
}

function isPerformanceEstimate(
  result: BaselineEstimateResult,
): result is Exclude<BaselineEstimateResult, { status: "unavailable" }> {
  return !isUnavailable(result);
}

export function PerformancePanel({
  buildState,
  perf1Fixtures,
  prov4Fixtures,
}: PerformancePanelProps) {
  const dimensions = usePerfPanelStore((s) => s.dimensions);
  const correction = usePerfPanelStore((s) => s.correction);
  const setUpscaleId = usePerfPanelStore((s) => s.setUpscaleId);
  const setFrameGenId = usePerfPanelStore((s) => s.setFrameGenId);
  const setRamTierId = usePerfPanelStore((s) => s.setRamTierId);
  const setCorrection = usePerfPanelStore((s) => s.setCorrection);
  const resetCorrection = usePerfPanelStore((s) => s.resetCorrection);

  const queries = baselineQueriesForBuild(buildState, dimensions);
  const labelById = new Map(RESOLUTIONS.map((r) => [r.id, r.label]));
  const sidecarActive =
    !!prov4Fixtures &&
    isPilotPerformanceOverlayActive(buildState, dimensions);
  const nowIso = new Date().toISOString();

  const rows = queries.map((query) => {
    const baseline = estimateBaseline(query, perf1Fixtures.baseline);
    const correctionResult =
      isPerformanceEstimate(baseline) ?
        applyCorrection(query, baseline, correction)
      : null;

    let sidecar: PerformanceEvidenceBinding | null = null;
    if (sidecarActive && prov4Fixtures) {
      sidecar = bindPerformanceEvidence({
        key: pilotBaselineKeyFor(query.resolution),
        isPilotBuild: true,
        evidenceFile: prov4Fixtures.performance,
        registry: prov4Fixtures.registry,
        verifications: prov4Fixtures.verifications,
        nowIso,
        verifiedArtifactDigests: prov4Fixtures.verifiedArtifactDigests,
      });
    }

    return { query, baseline, correctionResult, sidecar };
  });

  const cinebenchRows = WORKLOAD_IDS.flatMap((workloadId) =>
    WORKLOAD_METRICS.map((metric) => ({
      workloadId,
      metric,
      result: estimateWorkload(
        {
          cpuId: buildState.cpuId as "cpu.zen4-7600" | "cpu.zen4-7800x3d",
          workloadId,
          metric,
        },
        perf1Fixtures.cinebench,
      ),
    })),
  );

  function updateCorrection(patch: Partial<CorrectionInput>) {
    setCorrection({ ...correction, ...patch });
  }

  return (
    <section className="panel" data-testid="performance-panel">
      <h2 style={{ marginTop: 0 }}>Performance</h2>

      <div
        style={{
          display: "grid",
          gap: "0.5rem",
          marginBottom: "0.75rem",
          fontSize: "0.9rem",
        }}
      >
        <label>
          Upscaling{" "}
          <select
            data-testid="upscale-select"
            value={dimensions.upscaleId}
            onChange={(e) =>
              setUpscaleId(e.target.value as typeof dimensions.upscaleId)
            }
          >
            <option value="upscale.off">Native (off)</option>
            <option value="upscale.dlss-quality">DLSS Quality</option>
          </select>
        </label>
        <label>
          Frame generation{" "}
          <select
            data-testid="framegen-select"
            value={dimensions.frameGenId}
            onChange={(e) =>
              setFrameGenId(e.target.value as typeof dimensions.frameGenId)
            }
          >
            <option value="framegen.off">Off</option>
            <option value="framegen.on">On</option>
          </select>
        </label>
        <label>
          RAM profile{" "}
          <select
            data-testid="ram-select"
            value={dimensions.ramTierId}
            onChange={(e) =>
              setRamTierId(e.target.value as typeof dimensions.ramTierId)
            }
          >
            <option value="ram.16gb-ddr5">16 GB DDR5</option>
            <option value="ram.32gb-ddr5">32 GB DDR5</option>
          </select>
        </label>
      </div>

      <details style={{ marginBottom: "0.75rem", fontSize: "0.9rem" }}>
        <summary>Environment correction (optional)</summary>
        <div
          data-testid="correction-controls"
          style={{
            display: "grid",
            gap: "0.5rem",
            marginTop: "0.5rem",
          }}
        >
          <label>
            CPU power{" "}
            <select
              data-testid="cpu-power-select"
              value={correction.cpuPowerId ?? ""}
              onChange={(e) =>
                updateCorrection({
                  cpuPowerId:
                    e.target.value ?
                      (e.target.value as CorrectionInput["cpuPowerId"])
                    : undefined,
                })
              }
            >
              <option value="">(default)</option>
              <option value="cpu-power.default">Default</option>
              <option value="cpu-power.reduced">Reduced</option>
            </select>
          </label>
          <label>
            GPU power{" "}
            <select
              data-testid="gpu-power-select"
              value={correction.gpuPowerId ?? ""}
              onChange={(e) =>
                updateCorrection({
                  gpuPowerId:
                    e.target.value ?
                      (e.target.value as CorrectionInput["gpuPowerId"])
                    : undefined,
                })
              }
            >
              <option value="">(default)</option>
              <option value="gpu-power.default">Default</option>
              <option value="gpu-power.reduced">Reduced</option>
            </select>
          </label>
          <label>
            Cooling bucket{" "}
            <select
              data-testid="cooling-select"
              value={correction.coolingBucketId ?? ""}
              onChange={(e) =>
                updateCorrection({
                  coolingBucketId:
                    e.target.value ?
                      (e.target.value as CorrectionInput["coolingBucketId"])
                    : undefined,
                })
              }
            >
              <option value="">(none)</option>
              <option value="cooling.sufficient">Sufficient</option>
              <option value="cooling.marginal">Marginal</option>
              <option value="cooling.insufficient">Insufficient</option>
            </select>
          </label>
          <label>
            Load profile{" "}
            <select
              data-testid="load-profile-select"
              value={correction.loadProfileId ?? ""}
              onChange={(e) =>
                updateCorrection({
                  loadProfileId:
                    e.target.value ?
                      (e.target.value as CorrectionInput["loadProfileId"])
                    : undefined,
                })
              }
            >
              <option value="">(none)</option>
              <option value="load.transient">Transient</option>
              <option value="load.sustained">Sustained</option>
            </select>
          </label>
          <label>
            Evidence source id{" "}
            <input
              data-testid="evidence-source-input"
              type="text"
              value={correction.evidenceSourceId ?? ""}
              onChange={(e) =>
                updateCorrection({
                  evidenceSourceId: e.target.value || undefined,
                })
              }
              placeholder="optional — required for sustained+cooling stub"
            />
          </label>
          <button type="button" onClick={resetCorrection}>
            Clear correction
          </button>
        </div>
      </details>

      {sidecarActive ? (
        <p
          data-testid="perf-sidecar-active"
          className="muted"
          style={{ marginTop: 0 }}
        >
          Pilot evidence overlay active
        </p>
      ) : null}

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {rows.map(({ query, baseline, correctionResult, sidecar }) => {
          const resId = query.resolution as Perf1ResolutionId;
          const label = labelById.get(resId) ?? resId;

          if (sidecar?.status === "bound") {
            const ev = sidecar.evidence;
            const m = ev.measurement;
            return (
              <li
                key={resId}
                data-testid={`perf-row-${resId}`}
                data-status="ok"
                data-sidecar="bound"
                data-metric-kind={m.metricKind}
                style={{
                  border: "1px solid #93c5fd",
                  borderRadius: "4px",
                  padding: "0.65rem",
                  marginBottom: "0.5rem",
                }}
              >
                <div style={{ fontWeight: 600 }}>{label}</div>
                <div data-testid={`perf-range-${resId}`}>
                  {m.fpsMin}–{m.fpsMax} FPS
                </div>
                <div
                  data-testid={`perf-confidence-${resId}`}
                  className="muted"
                >
                  confidence: {ev.confidence}
                </div>
                <details data-testid={`perf-detail-${resId}`}>
                  <summary>Evidence details</summary>
                  <div
                    data-testid={`perf-metric-kind-${resId}`}
                    className="muted"
                  >
                    metricKind: {m.metricKind}
                  </div>
                  <div
                    data-testid={`perf-freshness-${resId}`}
                    className="muted"
                  >
                    freshness: {sidecar.freshness.state} —{" "}
                    {sidecar.freshness.explanation}
                  </div>
                  <div
                    data-testid={`perf-sources-${resId}`}
                    className="muted"
                  >
                    sources:{" "}
                    {sidecar.sources
                      .map((s) => `${s.sourceClass} (${s.sourceId})`)
                      .join("; ")}
                  </div>
                  {ev.captureConditions ? (
                    <div
                      data-testid={`perf-capture-${resId}`}
                      className="muted"
                    >
                      capture: {ev.captureConditions.toolName}{" "}
                      {ev.captureConditions.toolVersion} · runs{" "}
                      {ev.captureConditions.runCount} ·{" "}
                      {ev.captureConditions.rangeDerivation}
                    </div>
                  ) : null}
                  {ev.limitingFactor ? (
                    <div
                      data-testid={`perf-limiting-${resId}`}
                      className="muted"
                    >
                      {ev.limitingFactor.category}:{" "}
                      {ev.limitingFactor.explanation}
                    </div>
                  ) : null}
                  <div className="muted">
                    {ev.dataVersion} · {ev.basis}
                  </div>
                </details>
              </li>
            );
          }

          if (sidecar?.status === "unavailable") {
            return (
              <li
                key={resId}
                data-testid={`perf-row-${resId}`}
                data-status="unavailable"
                data-sidecar="unavailable"
                style={{
                  border: "1px solid #fca5a5",
                  borderRadius: "4px",
                  padding: "0.65rem",
                  marginBottom: "0.5rem",
                }}
              >
                <div style={{ fontWeight: 600 }}>{label}</div>
                <div
                  data-testid={`perf-unavailable-${resId}`}
                  className="muted"
                >
                  Evidence overlay unavailable ({sidecar.reason}):{" "}
                  {sidecar.explanation}
                </div>
              </li>
            );
          }

          const unavailable = isUnavailable(baseline);
          const displayEstimate =
            correctionResult?.status === "ok" ? correctionResult : (
              isPerformanceEstimate(baseline) ? baseline : null
            );

          return (
            <li
              key={resId}
              data-testid={`perf-row-${resId}`}
              data-status={unavailable ? "unavailable" : "ok"}
              data-sidecar="off"
              style={{
                border: "1px solid #ddd",
                borderRadius: "4px",
                padding: "0.65rem",
                marginBottom: "0.5rem",
              }}
            >
              <div style={{ fontWeight: 600 }}>{label}</div>
              {unavailable ? (
                <div
                  data-testid={`perf-unavailable-${resId}`}
                  className="muted"
                >
                  {baseline.reason}
                </div>
              ) : displayEstimate ? (
                <>
                  <div data-testid={`perf-range-${resId}`}>
                    {displayEstimate.fpsMin}–{displayEstimate.fpsMax} FPS
                  </div>
                  <div
                    data-testid={`perf-limiting-${resId}`}
                    className="muted"
                  >
                    {displayEstimate.limitingFactor.category}:{" "}
                    {displayEstimate.limitingFactor.explanation}
                  </div>
                  <div className="muted">
                    confidence: {displayEstimate.confidence} ·{" "}
                    {displayEstimate.dataVersion}
                  </div>
                  {correctionResult?.status === "ok" ? (
                    <div
                      data-testid={`perf-correction-reason-${resId}`}
                      style={{ fontSize: "0.85rem", color: "#1d4ed8" }}
                    >
                      Correction: {correctionResult.reason}
                    </div>
                  ) : null}
                  {correctionResult?.status === "withheld" ? (
                    <div
                      data-testid={`perf-withheld-${resId}`}
                      className="status-warn"
                      style={{ fontSize: "0.85rem" }}
                    >
                      {correctionResult.reason}
                    </div>
                  ) : null}
                </>
              ) : null}
            </li>
          );
        })}
      </ul>

      <details data-testid="cinebench-panel" style={{ marginTop: "0.75rem" }}>
        <summary>Cinebench (CPU)</summary>
        <ul style={{ listStyle: "none", margin: "0.5rem 0 0", padding: 0 }}>
          {cinebenchRows.map(({ workloadId, metric, result }) => {
            const key = `${workloadId}-${metric}`;
            return (
              <li
                key={key}
                data-testid={`cinebench-row-${key}`}
                data-status={"status" in result ? result.status : "ok"}
                style={{
                  border: "1px solid #eee",
                  borderRadius: "4px",
                  padding: "0.5rem 0.75rem",
                  marginBottom: "0.35rem",
                  fontSize: "0.85rem",
                }}
              >
                <strong>
                  {workloadId} · {metric}
                </strong>
                {"score" in result ?
                  <div data-testid={`cinebench-score-${key}`}>
                    {result.score} pts (confidence: {result.confidence})
                  </div>
                : <div data-testid={`cinebench-unavailable-${key}`}>
                    {result.reason}
                  </div>
                }
              </li>
            );
          })}
        </ul>
      </details>
    </section>
  );
}

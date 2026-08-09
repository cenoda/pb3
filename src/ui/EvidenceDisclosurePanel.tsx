import type { PilotDisclosureReport } from "../contract/prov4";
import {
  EST1_DRAFT_CAVEAT,
  type CombinationEstimateResult,
} from "../contract/est1";
import type { Est1Fixtures } from "../estimate/loadEst1Fixtures";
import type { Prov4Fixtures } from "../provenance/loadProv4Fixtures";
import { estimatePilotResolution } from "../estimate/estimatePilotResolution";
import { PILOT_RESOLUTIONS } from "../provenance/pilotBuild";

interface EvidenceDisclosurePanelProps {
  report: PilotDisclosureReport;
  est1Fixtures?: Est1Fixtures;
  prov4Fixtures?: Prov4Fixtures;
}

export function EvidenceDisclosurePanel({
  report,
  est1Fixtures,
  prov4Fixtures,
}: EvidenceDisclosurePanelProps) {
  const est1Results: Array<{
    resolution: (typeof PILOT_RESOLUTIONS)[number];
    result: CombinationEstimateResult;
  }> =
    report.isPilotBuild && est1Fixtures && prov4Fixtures
      ? PILOT_RESOLUTIONS.map((resolution) => ({
          resolution,
          result: estimatePilotResolution({
            resolution,
            est1Fixtures,
            prov4Fixtures,
          }),
        }))
      : [];

  return (
    <section
      className="panel"
      data-testid="evidence-disclosure-panel"
      data-pilot-active={report.isPilotBuild ? "true" : "false"}
    >
      <h2 style={{ marginTop: 0 }}>Evidence details</h2>
      <p
        data-testid="evidence-pilot-status"
        className="muted"
        style={{ marginTop: 0 }}
      >
        Pilot evidence:{" "}
        <strong>{report.isPilotBuild ? "active" : "inactive"}</strong>
      </p>
      {!report.isPilotBuild ? (
        <p
          data-testid="evidence-non-pilot"
          className="muted"
          style={{ marginTop: 0 }}
        >
          Non-pilot build: existing performance stub / Experimental /
          unavailable paths remain; pilot evidence does not carry over.
        </p>
      ) : null}

      <details data-testid="evidence-details">
        <summary>Show evidence diagnostics</summary>
        <p
          data-testid="evidence-contract-version"
          className="muted"
          style={{ marginTop: "0.5rem" }}
        >
          Contract: {report.provenanceContractVersion}
        </p>

        {report.isPilotBuild ? (
          <>
            {est1Results.length > 0 ? (
              <>
                <h3>Combination estimates (est1)</h3>
                <p
                  data-testid="evidence-est1-caveat"
                  className="muted"
                  style={{ fontSize: "0.8rem" }}
                  data-draft-caveat={EST1_DRAFT_CAVEAT}
                >
                  {EST1_DRAFT_CAVEAT}
                </p>
                <ul
                  data-testid="evidence-est1-list"
                  style={{
                    listStyle: "none",
                    margin: "0 0 0.75rem",
                    padding: 0,
                  }}
                >
                  {est1Results.map(({ resolution, result }) => (
                    <li
                      key={`est1-${resolution}`}
                      data-testid={`evidence-est1-${resolution}`}
                      data-status={result.status}
                      data-method={
                        result.status === "estimated"
                          ? result.method
                          : undefined
                      }
                      data-reason={
                        result.status === "unavailable"
                          ? result.reason
                          : undefined
                      }
                      style={{
                        border: "1px solid #bfdbfe",
                        borderRadius: "4px",
                        padding: "0.5rem 0.75rem",
                        marginBottom: "0.35rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      <strong>{resolution} est1</strong>
                      {result.status === "estimated" ? (
                        <>
                          <div
                            data-testid={`evidence-est1-method-${resolution}`}
                          >
                            method: {result.method} · confidence:{" "}
                            {result.confidence}
                          </div>
                          <div data-testid={`evidence-est1-range-${resolution}`}>
                            {Math.round(result.fpsMin)}–
                            {Math.round(result.fpsMax)} FPS
                          </div>
                          <div className="muted">{result.basis}</div>
                          <div
                            data-testid={`evidence-est1-contributors-${resolution}`}
                            className="muted"
                          >
                            contributors:{" "}
                            {result.contributors
                              .map((c) => `${c.role}:${c.refId}`)
                              .join("; ")}
                          </div>
                        </>
                      ) : (
                        <div
                          data-testid={`evidence-est1-unavailable-${resolution}`}
                        >
                          unavailable ({result.reason}): {result.explanation}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {report.externalPerformance ? (
              <ul
                data-testid="evidence-external-list"
                style={{
                  listStyle: "none",
                  margin: "0 0 0.75rem",
                  padding: 0,
                }}
              >
                {report.externalPerformance.map((ext) => (
                  <li
                    key={`ext-${ext.resolution}`}
                    data-testid={`evidence-external-${ext.resolution}`}
                    data-display-class={ext.displayClass}
                    data-aggregation-status={ext.aggregation.status}
                    style={{
                      border: "1px solid #dbeafe",
                      borderRadius: "4px",
                      padding: "0.5rem 0.75rem",
                      marginBottom: "0.35rem",
                      fontSize: "0.85rem",
                    }}
                  >
                    <strong>{ext.resolution} external</strong>
                    <div
                      data-testid={`evidence-external-class-${ext.resolution}`}
                    >
                      display: {ext.displayClass}
                    </div>
                    {ext.aggregation.status === "aggregated" ? (
                      <div
                        data-testid={`evidence-external-range-${ext.resolution}`}
                      >
                        aggregated {ext.aggregation.fpsMin}–
                        {ext.aggregation.fpsMax} FPS (
                        {ext.aggregation.confidence})
                      </div>
                    ) : (
                      <div
                        data-testid={`evidence-external-unavailable-${ext.resolution}`}
                      >
                        aggregate unavailable ({ext.aggregation.reason}):{" "}
                        {ext.aggregation.explanation}
                      </div>
                    )}
                    {ext.aggregation.exclusionReasons.length > 0 ? (
                      <details
                        data-testid={`evidence-external-exclusions-${ext.resolution}`}
                      >
                        <summary>
                          {ext.aggregation.exclusionReasons.length} excluded
                          near-miss observation(s)
                        </summary>
                        <ul
                          style={{
                            margin: "0.35rem 0 0",
                            paddingLeft: "1.1rem",
                          }}
                        >
                          {ext.aggregation.exclusionReasons.map((ex) => (
                            <li key={ex.observationId}>
                              {ex.observationId}: {ex.reason} — {ex.detail}
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                    {ext.syntheticReference ? (
                      <div
                        data-testid={`evidence-synthetic-ref-${ext.resolution}`}
                        className="muted"
                      >
                        synthetic reference: {ext.syntheticReference.evidenceId}{" "}
                        ({ext.syntheticReference.measurement.fpsMin}–
                        {ext.syntheticReference.measurement.fpsMax}{" "}
                        illustrative)
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            <ul
              data-testid="evidence-performance-list"
              style={{ listStyle: "none", margin: 0, padding: 0 }}
            >
              {report.performance.map((binding, index) => {
                const resolution =
                  binding.status === "bound"
                    ? binding.evidence.key.resolution
                    : (["1080p", "1440p", "4k"] as const)[index] ??
                      `row-${index}`;
                return (
                  <li
                    key={resolution}
                    data-testid={`evidence-perf-${resolution}`}
                    data-status={binding.status}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: "4px",
                      padding: "0.5rem 0.75rem",
                      marginBottom: "0.35rem",
                      fontSize: "0.85rem",
                    }}
                  >
                    <strong>{resolution}</strong>
                    {binding.status === "bound" ? (
                      <div>
                        <div
                          data-testid={`evidence-perf-confidence-${resolution}`}
                        >
                          confidence: {binding.evidence.confidence} ·{" "}
                          {binding.evidence.measurement.metricKind}
                        </div>
                        <div data-testid={`evidence-perf-range-${resolution}`}>
                          {binding.evidence.measurement.fpsMin}–
                          {binding.evidence.measurement.fpsMax} FPS
                        </div>
                        <div
                          data-testid={`evidence-perf-freshness-${resolution}`}
                        >
                          freshness: {binding.freshness.state}
                        </div>
                        <div data-testid={`evidence-perf-sources-${resolution}`}>
                          sources:{" "}
                          {binding.sources.map((s) => s.sourceClass).join(", ")}
                        </div>
                        <div className="muted">{binding.evidence.basis}</div>
                      </div>
                    ) : (
                      <div
                        data-testid={`evidence-perf-unavailable-${resolution}`}
                      >
                        unavailable ({binding.reason}): {binding.explanation}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <h3>Geometry bindings</h3>
            <ul
              data-testid="evidence-geometry-list"
              style={{ listStyle: "none", margin: 0, padding: 0 }}
            >
              {report.geometry.map((binding) => {
                const partId =
                  binding.status === "bound"
                    ? binding.evidence.partId
                    : binding.partId;
                return (
                  <li
                    key={partId}
                    data-testid={`evidence-geo-${partId}`}
                    data-status={binding.status}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: "4px",
                      padding: "0.5rem 0.75rem",
                      marginBottom: "0.35rem",
                      fontSize: "0.85rem",
                    }}
                  >
                    <strong>{partId}</strong>
                    {binding.status === "bound" ? (
                      <div>
                        <div data-testid={`evidence-geo-grade-${partId}`}>
                          grade: {binding.evidence.modelGrade}
                        </div>
                        <div data-testid={`evidence-geo-join-${partId}`}>
                          phys3EvidenceSourceId:{" "}
                          {binding.evidence.phys3EvidenceSourceId}
                        </div>
                        <div data-testid={`evidence-geo-freshness-${partId}`}>
                          freshness: {binding.freshness.state}
                        </div>
                      </div>
                    ) : (
                      <div data-testid={`evidence-geo-unavailable-${partId}`}>
                        unavailable ({binding.reason}): {binding.explanation}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <h3>Cooling</h3>
            <div
              data-testid="evidence-cooling"
              data-status={report.cooling.status}
              style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}
            >
              {report.cooling.status === "unavailable" ? (
                <>
                  <div data-testid="evidence-cooling-reason">
                    {report.cooling.reason}
                  </div>
                  <div data-testid="evidence-cooling-explanation">
                    {report.cooling.explanation}
                  </div>
                </>
              ) : (
                <div data-testid="evidence-cooling-available">
                  provenance available (no FPS derate)
                </div>
              )}
            </div>
          </>
        ) : null}

        <h3>Limitations</h3>
        <ul data-testid="evidence-limitations" style={{ fontSize: "0.85rem" }}>
          {report.limitations.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}

import {
  EST1_DRAFT_CAVEAT,
  type CombinationEstimateResult,
} from "../contract/est1";
import type { PilotDisclosureReport } from "../contract/prov4";
import { estimatePilotResolution } from "../estimate/estimatePilotResolution";
import type { Est1Fixtures } from "../estimate/loadEst1Fixtures";
import type { Prov4Fixtures } from "../provenance/loadProv4Fixtures";
import { PILOT_RESOLUTIONS } from "../provenance/pilotBuild";

export interface EvidenceDetailsProps {
  report: PilotDisclosureReport;
  est1Fixtures?: Est1Fixtures;
  prov4Fixtures?: Prov4Fixtures;
}

/**
 * Where the numbers came from, in full: source ids, digests, freshness,
 * confidence, exclusions and limitations (spec R5 — nothing is dropped, it is
 * only moved behind the single "Why this result?" disclosure).
 */
export function EvidenceDetails({
  report,
  est1Fixtures,
  prov4Fixtures,
}: EvidenceDetailsProps) {
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
    <div
      className="why-section"
      data-testid="evidence-disclosure-panel"
      data-pilot-active={report.isPilotBuild ? "true" : "false"}
    >
      <h3 className="why-heading">Where these numbers come from</h3>
      <p className="why-note" data-testid="evidence-pilot-status">
        Detailed evidence:{" "}
        <strong>{report.isPilotBuild ? "active" : "inactive"}</strong> for this
        combination · contract{" "}
        <span data-testid="evidence-contract-version">
          {report.provenanceContractVersion}
        </span>
      </p>
      {!report.isPilotBuild ? (
        <p className="why-note" data-testid="evidence-non-pilot">
          Non-pilot build: existing performance stub / Experimental /
          unavailable paths remain; pilot evidence does not carry over.
        </p>
      ) : null}

      {report.isPilotBuild ? (
        <>
          {est1Results.length > 0 ? (
            <>
              <h4 className="why-subheading">Combination estimates (est1)</h4>
              <p
                className="why-note"
                data-testid="evidence-est1-caveat"
                data-draft-caveat={EST1_DRAFT_CAVEAT}
              >
                {EST1_DRAFT_CAVEAT}
              </p>
              <ul className="why-list" data-testid="evidence-est1-list">
                {est1Results.map(({ resolution, result }) => (
                  <li
                    key={`est1-${resolution}`}
                    data-testid={`evidence-est1-${resolution}`}
                    data-status={result.status}
                    data-method={
                      result.status === "estimated" ? result.method : undefined
                    }
                    data-reason={
                      result.status === "unavailable" ? result.reason : undefined
                    }
                  >
                    <strong>{resolution} est1</strong>
                    {result.status === "estimated" ? (
                      <>
                        <div data-testid={`evidence-est1-method-${resolution}`}>
                          method: {result.method} · confidence:{" "}
                          {result.confidence}
                        </div>
                        <div data-testid={`evidence-est1-range-${resolution}`}>
                          {Math.round(result.fpsMin)}–{Math.round(result.fpsMax)}{" "}
                          FPS
                        </div>
                        <div className="why-note">{result.basis}</div>
                        <div
                          className="why-note"
                          data-testid={`evidence-est1-contributors-${resolution}`}
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
            <>
              <h4 className="why-subheading">External observations</h4>
              <ul className="why-list" data-testid="evidence-external-list">
                {report.externalPerformance.map((ext) => (
                  <li
                    key={`ext-${ext.resolution}`}
                    data-testid={`evidence-external-${ext.resolution}`}
                    data-display-class={ext.displayClass}
                    data-aggregation-status={ext.aggregation.status}
                  >
                    <strong>{ext.resolution} external</strong>
                    <div data-testid={`evidence-external-class-${ext.resolution}`}>
                      display: {ext.displayClass}
                    </div>
                    {ext.aggregation.status === "aggregated" ? (
                      <div
                        data-testid={`evidence-external-range-${ext.resolution}`}
                      >
                        aggregated {ext.aggregation.fpsMin}–
                        {ext.aggregation.fpsMax} FPS ({ext.aggregation.confidence})
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
                        <ul className="why-sublist">
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
                        className="why-note"
                        data-testid={`evidence-synthetic-ref-${ext.resolution}`}
                      >
                        synthetic reference: {ext.syntheticReference.evidenceId} (
                        {ext.syntheticReference.measurement.fpsMin}–
                        {ext.syntheticReference.measurement.fpsMax} illustrative)
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <h4 className="why-subheading">Performance bindings</h4>
          <ul className="why-list" data-testid="evidence-performance-list">
            {report.performance.map((binding, index) => {
              const resolution =
                binding.status === "bound"
                  ? binding.evidence.key.resolution
                  : (["1080p", "1440p", "4k"] as const)[index] ?? `row-${index}`;
              return (
                <li
                  key={resolution}
                  data-testid={`evidence-perf-${resolution}`}
                  data-status={binding.status}
                >
                  <strong>{resolution}</strong>
                  {binding.status === "bound" ? (
                    <>
                      <div data-testid={`evidence-perf-confidence-${resolution}`}>
                        confidence: {binding.evidence.confidence} ·{" "}
                        {binding.evidence.measurement.metricKind}
                      </div>
                      <div data-testid={`evidence-perf-range-${resolution}`}>
                        {binding.evidence.measurement.fpsMin}–
                        {binding.evidence.measurement.fpsMax} FPS
                      </div>
                      <div data-testid={`evidence-perf-freshness-${resolution}`}>
                        freshness: {binding.freshness.state}
                      </div>
                      <div data-testid={`evidence-perf-sources-${resolution}`}>
                        sources:{" "}
                        {binding.sources.map((s) => s.sourceClass).join(", ")}
                      </div>
                      <div className="why-note">{binding.evidence.basis}</div>
                    </>
                  ) : (
                    <div data-testid={`evidence-perf-unavailable-${resolution}`}>
                      unavailable ({binding.reason}): {binding.explanation}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <h4 className="why-subheading">Geometry bindings</h4>
          <ul className="why-list" data-testid="evidence-geometry-list">
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
                >
                  <strong>{partId}</strong>
                  {binding.status === "bound" ? (
                    <>
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
                    </>
                  ) : (
                    <div data-testid={`evidence-geo-unavailable-${partId}`}>
                      unavailable ({binding.reason}): {binding.explanation}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <h4 className="why-subheading">Cooling evidence</h4>
          <div
            className="why-note"
            data-testid="evidence-cooling"
            data-status={report.cooling.status}
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

      <h4 className="why-subheading">Limitations</h4>
      <ul className="why-sublist" data-testid="evidence-limitations">
        {report.limitations.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

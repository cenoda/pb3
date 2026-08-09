import type { PilotDisclosureReport } from "../contract/prov4";

interface EvidenceDisclosurePanelProps {
  report: PilotDisclosureReport;
}

export function EvidenceDisclosurePanel({
  report,
}: EvidenceDisclosurePanelProps) {
  return (
    <section
      data-testid="evidence-disclosure-panel"
      data-pilot-active={report.isPilotBuild ? "true" : "false"}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        padding: "0.75rem",
        marginBottom: "1rem",
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>
        Evidence disclosure (prov4)
      </h2>
      <p data-testid="evidence-pilot-status" style={{ fontSize: "0.9rem" }}>
        Pilot overlay:{" "}
        <strong>{report.isPilotBuild ? "active" : "inactive"}</strong>
      </p>
      <p
        data-testid="evidence-contract-version"
        style={{ fontSize: "0.85rem", color: "#4b5563" }}
      >
        Contract: {report.provenanceContractVersion}
      </p>

      {report.isPilotBuild ? (
        <>
          <h3 style={{ fontSize: "0.95rem" }}>Performance bindings</h3>
          <ul
            data-testid="evidence-performance-list"
            style={{ listStyle: "none", margin: 0, padding: 0 }}
          >
            {report.performance.map((binding, index) => {
              const resolution =
                binding.status === "bound" ?
                  binding.evidence.key.resolution
                : (["1080p", "1440p", "4k"] as const)[index] ?? `row-${index}`;
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
                      <div style={{ color: "#4b5563" }}>
                        {binding.evidence.basis}
                      </div>
                    </div>
                  ) : (
                    <div data-testid={`evidence-perf-unavailable-${resolution}`}>
                      unavailable ({binding.reason}): {binding.explanation}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <h3 style={{ fontSize: "0.95rem" }}>Geometry bindings</h3>
          <ul
            data-testid="evidence-geometry-list"
            style={{ listStyle: "none", margin: 0, padding: 0 }}
          >
            {report.geometry.map((binding) => {
              const partId =
                binding.status === "bound" ? binding.evidence.partId : binding.partId;
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

          <h3 style={{ fontSize: "0.95rem" }}>Cooling</h3>
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
      ) : (
        <p data-testid="evidence-non-pilot" style={{ fontSize: "0.9rem" }}>
          Non-pilot build: existing perf1 stub / Experimental / unavailable
          paths remain; pilot evidence does not carry over.
        </p>
      )}

      <h3 style={{ fontSize: "0.95rem" }}>Limitations</h3>
      <ul data-testid="evidence-limitations" style={{ fontSize: "0.85rem" }}>
        {report.limitations.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

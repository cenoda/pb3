import type { PhysicalValidationReport } from "../contract/phys3";

interface PhysicalValidationPanelProps {
  report: PhysicalValidationReport;
  modelGrade?: string;
}

export function PhysicalValidationPanel({
  report,
  modelGrade = "Experimental",
}: PhysicalValidationPanelProps) {
  return (
    <section
      data-testid="physical-validation-panel"
      data-overall-status={report.overallStatus}
      data-geometry-version={report.geometryDataVersion}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        padding: "0.75rem",
        marginBottom: "1rem",
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Physical validation</h2>
      <p data-testid="physical-overall">
        Overall: <strong>{report.overallStatus}</strong>
      </p>
      <p style={{ fontSize: "0.85rem", color: "#4b5563" }}>
        Geometry: {report.geometryDataVersion} · Model grade: {modelGrade}{" "}
        (synthetic fixture; not manufacturer-verified)
      </p>
      <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
        {report.checks.map((check) => (
          <li
            key={check.checkId}
            data-testid={`physical-check-${check.checkId}`}
            data-status={check.status}
            data-kind={check.kind}
          >
            <span>
              [{check.kind}] {check.checkId}: {check.status}
            </span>
            {check.explanation ? (
              <div
                data-testid={`physical-explanation-${check.checkId}`}
                style={{
                  color: "#374151",
                  fontSize: "0.9rem",
                  marginTop: "0.25rem",
                }}
              >
                {check.explanation}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

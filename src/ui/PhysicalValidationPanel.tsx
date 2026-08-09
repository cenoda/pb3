import type { PhysicalValidationReport } from "../contract/phys3";

interface PhysicalValidationPanelProps {
  report: PhysicalValidationReport;
  modelGrade?: string;
}

function humanCheckTitle(checkId: string, kind: string): string {
  if (kind === "clearance") return "Clearance check";
  if (kind === "collision") return "Collision check";
  if (kind === "mount") return "Mount check";
  return checkId;
}

export function PhysicalValidationPanel({
  report,
  modelGrade = "Experimental",
}: PhysicalValidationPanelProps) {
  return (
    <section
      className="panel"
      data-testid="physical-validation-panel"
      data-overall-status={report.overallStatus}
      data-geometry-version={report.geometryDataVersion}
    >
      <h2 style={{ marginTop: 0 }}>Fit</h2>
      <p data-testid="physical-overall" style={{ marginTop: 0 }}>
        Overall: <strong>{report.overallStatus}</strong>
      </p>
      <p className="muted" style={{ marginTop: 0 }}>
        Model grade: {modelGrade} (synthetic fixture; not manufacturer-verified)
      </p>

      <details data-testid="physical-details">
        <summary>Show fit diagnostics</summary>
        <p className="muted" style={{ marginTop: "0.5rem" }}>
          Geometry version: {report.geometryDataVersion}
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
                {humanCheckTitle(check.checkId, check.kind)}: {check.status}
              </span>
              <div className="muted" style={{ fontSize: "0.8rem" }}>
                id: {check.checkId}
              </div>
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
      </details>
    </section>
  );
}

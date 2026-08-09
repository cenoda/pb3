import type { CompatibilityReport } from "../contract/compat2";

interface CompatibilityPanelProps {
  report: CompatibilityReport;
}

const CHECK_LABELS: Record<CompatibilityReport["checks"][number]["checkId"], string> =
  {
    "cpu-socket": "CPU socket ↔ motherboard socket",
    "chipset-bios": "Chipset / BIOS support",
    "ram-support": "RAM type & speed",
    "psu-wattage": "PSU wattage",
    "case-form-factor": "Case form factor",
  };

export function CompatibilityPanel({ report }: CompatibilityPanelProps) {
  return (
    <section
      className="panel"
      data-testid="compatibility-panel"
      data-overall-status={report.overallStatus}
    >
      <h2 style={{ marginTop: 0 }}>Compatibility</h2>
      <p data-testid="compatibility-overall" style={{ marginTop: 0 }}>
        Overall: <strong>{report.overallStatus}</strong>
      </p>
      <details data-testid="compatibility-details">
        <summary>Show compatibility checks</summary>
        <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
          {report.checks.map((check) => (
            <li
              key={check.checkId}
              data-testid={`compat-check-${check.checkId}`}
              data-status={check.status}
            >
              <span>
                {CHECK_LABELS[check.checkId]}: {check.status}
              </span>
              {check.explanation ? (
                <div
                  data-testid={`compat-explanation-${check.checkId}`}
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

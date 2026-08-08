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
      data-testid="compatibility-panel"
      data-overall-status={report.overallStatus}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        padding: "0.75rem",
        marginBottom: "1rem",
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Compatibility</h2>
      <p data-testid="compatibility-overall">
        Overall: <strong>{report.overallStatus}</strong>
      </p>
      <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
        {report.checks.map((check) => (
          <li
            key={check.checkId}
            data-testid={`compat-check-${check.checkId}`}
            data-status={check.status}
          >
            <span>{CHECK_LABELS[check.checkId]}: {check.status}</span>
            {check.explanation ? (
              <div
                data-testid={`compat-explanation-${check.checkId}`}
                style={{ color: "#374151", fontSize: "0.9rem", marginTop: "0.25rem" }}
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

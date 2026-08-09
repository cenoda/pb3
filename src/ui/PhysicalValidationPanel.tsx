import type { PhysicalValidationReport } from "../contract/phys3";
import type { GeometryEvidenceBinding } from "../contract/prov4";

interface PhysicalValidationPanelProps {
  report: PhysicalValidationReport;
  modelGrade?: string;
  /** Optional prov4 geometry bindings for pilot disclosure. */
  geometryBindings?: GeometryEvidenceBinding[];
}

export function PhysicalValidationPanel({
  report,
  modelGrade = "Experimental",
  geometryBindings,
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
      {geometryBindings && geometryBindings.length > 0 ? (
        <div
          data-testid="physical-geometry-provenance"
          style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}
        >
          <strong>prov4 geometry join</strong>
          <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.25rem" }}>
            {geometryBindings.map((binding) => {
              const partId =
                binding.status === "bound" ?
                  binding.evidence.partId
                : binding.partId;
              return (
                <li
                  key={partId}
                  data-testid={`physical-geo-prov-${partId}`}
                  data-status={binding.status}
                >
                  {binding.status === "bound" ? (
                    <>
                      {partId}: {binding.evidence.modelGrade} via{" "}
                      {binding.evidence.phys3EvidenceSourceId}
                    </>
                  ) : (
                    <>
                      {partId}: unavailable ({binding.reason})
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
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

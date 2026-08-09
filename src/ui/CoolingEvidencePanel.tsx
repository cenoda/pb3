import type { CoolingHookResult } from "../contract/phys3";
import type { PilotDisclosureReport } from "../contract/prov4";

interface CoolingEvidencePanelProps {
  result: CoolingHookResult;
  mode: "physical" | "manual";
  /** Optional prov4 cooling disclosure (empty → unavailable). */
  coolingProvenance?: PilotDisclosureReport["cooling"];
}

export function CoolingEvidencePanel({
  result,
  mode,
  coolingProvenance,
}: CoolingEvidencePanelProps) {
  return (
    <section
      data-testid="cooling-evidence-panel"
      data-status={result.status}
      data-mode={mode}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        padding: "0.75rem",
        marginBottom: "1rem",
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Cooling evidence</h2>
      <p style={{ fontSize: "0.9rem" }}>Mode: {mode}</p>
      {result.status === "unavailable" ? (
        <div>
          <p data-testid="cooling-status">
            Status: <strong>unavailable</strong>
          </p>
          <p data-testid="cooling-reason">{result.reason}</p>
          <p data-testid="cooling-explanation">{result.explanation}</p>
          <p style={{ fontSize: "0.85rem", color: "#4b5563" }}>
            Performance baseline remains; correction withheld (no invented
            derate).
          </p>
        </div>
      ) : (
        <div>
          <p data-testid="cooling-status">
            Status: <strong>available</strong>
          </p>
          <p data-testid="cooling-headroom">
            coolingHeadroom: {result.correctionInput.coolingHeadroom}
          </p>
          <p data-testid="cooling-intake">
            intakeRestrictionSeverity:{" "}
            {result.correctionInput.intakeRestrictionSeverity}
          </p>
          <p data-testid="cooling-evidence-id">
            evidenceSourceId: {result.correctionInput.evidenceSourceId}
          </p>
          <p data-testid="cooling-bucket">
            coolingBucketId:{" "}
            {result.correctionInput.coolingBucketId ?? "(not mapped)"}
          </p>
        </div>
      )}
      {coolingProvenance ? (
        <div
          data-testid="cooling-prov4"
          data-status={coolingProvenance.status}
          style={{
            marginTop: "0.75rem",
            fontSize: "0.85rem",
            color: "#4b5563",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "0.5rem",
          }}
        >
          <strong>prov4 cooling provenance</strong>
          {coolingProvenance.status === "unavailable" ? (
            <p data-testid="cooling-prov4-unavailable">
              {coolingProvenance.reason}: {coolingProvenance.explanation}
            </p>
          ) : (
            <p data-testid="cooling-prov4-available">
              provenance row present (still no FPS derate)
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

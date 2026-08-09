import type { CoolingHookResult } from "../contract/phys3";

interface CoolingEvidencePanelProps {
  result: CoolingHookResult;
  mode: "physical" | "manual";
}

export function CoolingEvidencePanel({
  result,
  mode,
}: CoolingEvidencePanelProps) {
  return (
    <section
      className="panel"
      data-testid="cooling-evidence-panel"
      data-status={result.status}
      data-mode={mode}
    >
      <h2 style={{ marginTop: 0 }}>Cooling</h2>
      {result.status === "unavailable" ? (
        <div>
          <p data-testid="cooling-status" style={{ marginTop: 0 }}>
            Status: <strong>unavailable</strong>
          </p>
          <p data-testid="cooling-reason" className="muted" style={{ marginTop: 0 }}>
            {result.reason}
          </p>
          <details data-testid="cooling-details">
            <summary>Show cooling details</summary>
            <p data-testid="cooling-explanation">{result.explanation}</p>
            <p className="muted">
              Performance baseline remains; correction withheld (no invented
              derate).
            </p>
          </details>
        </div>
      ) : (
        <div>
          <p data-testid="cooling-status" style={{ marginTop: 0 }}>
            Status: <strong>available</strong>
          </p>
          <details data-testid="cooling-details">
            <summary>Show cooling details</summary>
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
          </details>
        </div>
      )}
    </section>
  );
}

import {
  statusTone,
  type BuildResultSummaryModel,
} from "./buildResultSummaryModel";

interface BuildResultSummaryProps {
  model: BuildResultSummaryModel;
}

export function BuildResultSummary({ model }: BuildResultSummaryProps) {
  const compatTone = statusTone(model.compatibilityStatus);
  const fitTone = statusTone(model.fitStatus);

  return (
    <section
      className="panel build-result-summary"
      data-testid="build-result-summary"
      data-compat-status={model.compatibilityStatus}
      data-fit-status={model.fitStatus}
      data-price-partial={model.pricePartial ? "true" : "false"}
      data-pilot={model.isPilotBuild ? "true" : "false"}
    >
      <h2 style={{ marginTop: 0 }}>Build results</h2>

      <div className="summary-row" data-testid="summary-compat">
        <span className="summary-label">Compatibility</span>
        <span className={`status-${compatTone}`} data-testid="summary-compat-status">
          {model.compatibilityStatus}
        </span>
      </div>

      <div className="summary-row" data-testid="summary-fit">
        <span className="summary-label">Fit</span>
        <span className={`status-${fitTone}`} data-testid="summary-fit-status">
          {model.fitStatus}
        </span>
      </div>

      <div className="summary-row" data-testid="summary-fps">
        <span className="summary-label">FPS</span>
        <div className="fps-chips">
          {model.fpsChips.map((chip) => (
            <span
              key={chip.resolution}
              className="fps-chip"
              data-testid={`summary-fps-${chip.resolution}`}
              data-status={chip.status}
            >
              <strong>{chip.label}</strong>{" "}
              {chip.status === "ok" ?
                `${chip.fpsMin}–${chip.fpsMax}`
              : "unavailable"}
            </span>
          ))}
        </div>
      </div>

      <div className="summary-row" data-testid="summary-price">
        <span className="summary-label">Price</span>
        <span data-testid="summary-price-total">
          {model.priceCurrency} {model.priceTotal}
          {model.pricePartial ?
            <span className="status-warn" data-testid="summary-price-partial">
              {" "}
              (partial)
            </span>
          : null}
        </span>
      </div>

      {model.isPilotBuild ?
        <p
          className="muted"
          style={{ margin: "0.15rem 0 0" }}
          data-testid="summary-pilot-badge"
        >
          Pilot evidence active
        </p>
      : null}
    </section>
  );
}

import type { BuildPriceSummary } from "../contract/compat2";

interface PriceSummaryPanelProps {
  summary: BuildPriceSummary;
}

export function PriceSummaryPanel({ summary }: PriceSummaryPanelProps) {
  return (
    <section
      className="panel"
      data-testid="price-summary-panel"
      data-is-partial={summary.isPartial ? "true" : "false"}
    >
      <h2 style={{ marginTop: 0 }}>Price</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Static fixture prices — not live market quotes.
      </p>
      <p data-testid="price-subtotal" style={{ marginBottom: "0.5rem" }}>
        Subtotal: {summary.currency} {summary.subtotalAmount}
        {summary.isPartial ? (
          <span data-testid="price-partial-label" className="status-warn">
            {" "}
            (partial total — some parts lack fixture prices)
          </span>
        ) : null}
      </p>
      <details data-testid="price-details">
        <summary>Show line items</summary>
        <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
          {summary.lines.map((line) => (
            <li key={line.partId} data-testid={`price-line-${line.partId}`}>
              {line.partId}:{" "}
              {line.status === "ok" && line.amount != null ? (
                <span>
                  {line.currency} {line.amount}
                </span>
              ) : (
                <span data-testid={`price-unavailable-${line.partId}`}>
                  unavailable ({line.reason ?? "missing price"})
                </span>
              )}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

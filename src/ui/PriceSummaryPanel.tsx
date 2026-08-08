import type { BuildPriceSummary } from "../contract/compat2";

interface PriceSummaryPanelProps {
  summary: BuildPriceSummary;
}

export function PriceSummaryPanel({ summary }: PriceSummaryPanelProps) {
  return (
    <section
      data-testid="price-summary-panel"
      data-is-partial={summary.isPartial ? "true" : "false"}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        padding: "0.75rem",
        marginBottom: "1rem",
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Price estimate</h2>
      <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 0 }}>
        Static fixture prices — not live market quotes.
      </p>
      <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
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
      <p data-testid="price-subtotal" style={{ marginBottom: 0 }}>
        Subtotal: {summary.currency} {summary.subtotalAmount}
        {summary.isPartial ? (
          <span data-testid="price-partial-label" style={{ color: "#b45309" }}>
            {" "}
            (partial total — some parts lack fixture prices)
          </span>
        ) : null}
      </p>
    </section>
  );
}

import type { ReactNode } from "react";
import type { BuildPriceSummary } from "../contract/compat2";
import type { BuildVerdict } from "./buildVerdict";
import { TRUST_TEXT, type PerformanceRow } from "./performanceRows";

export interface ResultBarProps {
  verdict: BuildVerdict;
  /** Present only when the verdict allows results (spec R1). */
  performance: {
    gameName: string;
    presetName: string;
    rows: PerformanceRow[];
    settings: ReactNode;
  } | null;
  price: BuildPriceSummary | null;
  /** The single disclosure (spec §2). */
  why: ReactNode;
}

export function ResultBar({ verdict, performance, price, why }: ResultBarProps) {
  return (
    <div className="result" data-testid="result" data-level={verdict.level}>
      <div className="result-verdict" data-testid="result-verdict">
        <p className="result-headline" data-verdict-level={verdict.level}>
          {verdict.headline}
        </p>
        {verdict.reason ? (
          <p className="result-reason" data-testid="result-reason">
            {verdict.reason}
          </p>
        ) : null}
      </div>

      {performance ? (
        <div className="result-performance" data-testid="result-performance">
          <p className="result-context">
            {performance.gameName} · {performance.presetName}
          </p>
          <div className="fps-rows">
            {performance.rows.map((row) => (
              <div
                key={row.resolution}
                className="fps-row"
                data-testid={`fps-${row.resolution}`}
                data-status={row.status}
              >
                <span className="fps-res">{row.label}</span>
                {row.status === "ok" ? (
                  <span className="fps-value">
                    {row.fpsMin}–{row.fpsMax} <span className="fps-unit">fps</span>
                  </span>
                ) : (
                  <span className="fps-value fps-none">no estimate</span>
                )}
              </div>
            ))}
          </div>
          <p className="result-trust" data-testid="result-trust">
            {trustLine(performance.rows)}
          </p>
          {performance.settings}
        </div>
      ) : null}

      {price ? (
        <div className="result-price" data-testid="result-price">
          <p className="result-context">Total price</p>
          <p className="price-value">
            {formatMoney(price.subtotalAmount, price.currency)}
          </p>
          <p className="result-trust">
            {price.isPartial
              ? "Some parts have no price, so this total is incomplete. Prices are dated domestic street-price snapshots, not live quotes."
              : "Prices are dated domestic street-price snapshots, not live quotes."}
          </p>
        </div>
      ) : null}

      <div className="result-why">{why}</div>
    </div>
  );
}

/**
 * One trust sentence for the block. Rows almost always share a source; when
 * they do not, the weakest one is stated so the block is never over-sold.
 */
function trustLine(rows: readonly PerformanceRow[]): string {
  const shown = rows.filter((row) => row.status === "ok" && row.trust);
  if (shown.length === 0) {
    const reason = rows.find((row) => row.reason)?.reason;
    return reason
      ? `No estimate is available for this combination. ${reason}`
      : "No estimate is available for this combination.";
  }
  const order = ["demo", "estimated-low", "estimated-medium", "measured"];
  const weakest = shown
    .map((row) => row.trust!)
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))[0];
  return TRUST_TEXT[weakest];
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

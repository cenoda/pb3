import { RESOLUTIONS } from "../contract/vs0";
import type { PerformanceFixtureFile } from "../contract/vs0";
import type { BuildState } from "../contract/vs0";
import { estimatePerformance } from "../perf/estimatePerformance";
import { queriesForBuild } from "../perf/queriesForBuild";

interface PerformancePanelProps {
  buildState: BuildState;
  fixtures: PerformanceFixtureFile;
}

export function PerformancePanel({ buildState, fixtures }: PerformancePanelProps) {
  const estimates = queriesForBuild(buildState).map((query) =>
    estimatePerformance(query, fixtures),
  );

  const labelById = new Map(RESOLUTIONS.map((r) => [r.id, r.label]));

  return (
    <section data-testid="performance-panel">
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Performance (stub ranges)</h2>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {estimates.map((estimate) => {
          const label = labelById.get(estimate.query.resolutionId) ?? estimate.query.resolutionId;
          const resId = estimate.query.resolutionId;

          return (
            <li
              key={resId}
              data-testid={`perf-row-${resId}`}
              data-status={estimate.status}
              style={{
                border: "1px solid #ddd",
                borderRadius: "4px",
                padding: "0.75rem",
                marginBottom: "0.5rem",
              }}
            >
              <div style={{ fontWeight: 600 }}>{label}</div>
              {estimate.status === "ok" ? (
                <>
                  <div data-testid={`perf-range-${resId}`}>
                    {estimate.fpsMin}–{estimate.fpsMax} FPS
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#555" }}>
                    confidence: {estimate.confidence} · {estimate.dataVersion} · {estimate.basis}
                  </div>
                </>
              ) : (
                <div
                  data-testid={`perf-unavailable-${resId}`}
                  style={{ fontSize: "0.9rem", color: "#666" }}
                >
                  {estimate.basis}
                  {estimate.reason ? ` (${estimate.reason})` : ""}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

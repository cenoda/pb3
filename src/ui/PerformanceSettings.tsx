import type { PerfPanelDimensions } from "../contract/perf1";

export interface PerformanceSettingsProps {
  dimensions: PerfPanelDimensions;
  onUpscaleChange: (id: PerfPanelDimensions["upscaleId"]) => void;
  onFrameGenChange: (id: PerfPanelDimensions["frameGenId"]) => void;
}

/**
 * The two settings a player actually recognises and that change the numbers
 * next to them (spec §4). Everything else about the estimate is a diagnostic
 * and lives behind "Why this result?".
 */
export function PerformanceSettings({
  dimensions,
  onUpscaleChange,
  onFrameGenChange,
}: PerformanceSettingsProps) {
  return (
    <div className="perf-settings">
      <label className="perf-setting">
        Upscaling
        <select
          data-testid="upscale-select"
          value={dimensions.upscaleId}
          onChange={(event) =>
            onUpscaleChange(
              event.target.value as PerfPanelDimensions["upscaleId"],
            )
          }
        >
          <option value="upscale.off">Off</option>
          <option value="upscale.dlss-quality">DLSS Quality</option>
        </select>
      </label>

      <label className="perf-setting">
        Frame generation
        <select
          data-testid="framegen-select"
          value={dimensions.frameGenId}
          onChange={(event) =>
            onFrameGenChange(
              event.target.value as PerfPanelDimensions["frameGenId"],
            )
          }
        >
          <option value="framegen.off">Off</option>
          <option value="framegen.on">On</option>
        </select>
      </label>
    </div>
  );
}

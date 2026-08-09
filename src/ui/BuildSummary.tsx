import { PHASE0_GAME, PHASE0_PRESET } from "../contract/vs0";
import type { BuildStateV2 } from "../contract/vs2";
import type { PartCatalog } from "../state/validateBuildState";

interface BuildSummaryProps {
  buildState: BuildStateV2;
  catalog: PartCatalog;
}

function displayName(catalog: PartCatalog, id: string): string {
  return catalog.get(id)?.displayName ?? id;
}

export function BuildSummary({ buildState, catalog }: BuildSummaryProps) {
  return (
    <section data-testid="build-summary">
      <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
        <li data-testid="summary-case">
          Case: {displayName(catalog, buildState.caseId)}
        </li>
        <li data-testid="summary-motherboard">
          Motherboard: {displayName(catalog, buildState.motherboardId)}
        </li>
        <li data-testid="summary-cpu">
          CPU: {displayName(catalog, buildState.cpuId)}
        </li>
        <li data-testid="summary-gpu">
          GPU: {displayName(catalog, buildState.gpuId)}
        </li>
        <li data-testid="summary-cooler">
          Cooler: {displayName(catalog, buildState.coolerId)}
        </li>
        <li data-testid="summary-ram">
          RAM: {displayName(catalog, buildState.ramId)}
        </li>
        <li data-testid="summary-psu">
          PSU: {displayName(catalog, buildState.psuId)}
        </li>
        <li data-testid="summary-game">Game: {PHASE0_GAME.displayName}</li>
        <li data-testid="summary-preset">Preset: {PHASE0_PRESET.displayName}</li>
      </ul>
    </section>
  );
}

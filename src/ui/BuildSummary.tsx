import { PHASE0_GAME, PHASE0_PRESET } from "../contract/vs0";
import type { PartCatalog } from "../state/validateBuildState";
import type { BuildState } from "../contract/vs0";

interface BuildSummaryProps {
  buildState: BuildState;
  catalog: PartCatalog;
}

function displayName(catalog: PartCatalog, id: string): string {
  return catalog.get(id)?.displayName ?? id;
}

export function BuildSummary({ buildState, catalog }: BuildSummaryProps) {
  return (
    <section data-testid="build-summary" style={{ marginBottom: "1rem" }}>
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Build summary</h2>
      <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
        <li data-testid="summary-case">
          Case: {displayName(catalog, buildState.caseId)}
        </li>
        <li data-testid="summary-motherboard">
          Motherboard: {displayName(catalog, buildState.motherboardId)}
        </li>
        <li data-testid="summary-cooler">
          Cooler: {displayName(catalog, buildState.coolerId)}
        </li>
        <li data-testid="summary-game">Game: {PHASE0_GAME.displayName}</li>
        <li data-testid="summary-preset">Preset: {PHASE0_PRESET.displayName}</li>
      </ul>
    </section>
  );
}

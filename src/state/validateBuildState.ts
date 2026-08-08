import type { BuildState, PartCategory, PartDefinition } from "../contract/vs0";
import {
  DEFAULT_BUILD_STATE,
  PHASE0_CPU_IDS,
  PHASE0_GAME,
  PHASE0_GPU_IDS,
  PHASE0_PRESET,
  VS0_CONTRACT_VERSION,
} from "../contract/vs0";

export interface PartCatalog {
  byId: Map<string, PartDefinition>;
  getByCategory(category: PartCategory): PartDefinition[];
  get(id: string): PartDefinition | undefined;
}

export function createPartCatalog(parts: PartDefinition[]): PartCatalog {
  const byId = new Map(parts.map((part) => [part.id, part]));

  return {
    byId,
    get(id: string) {
      return byId.get(id);
    },
    getByCategory(category: PartCategory) {
      return parts.filter((part) => part.category === category);
    },
  };
}

export function createBuildStateValidator(catalog: PartCatalog) {
  const cpuIds = new Set<string>(PHASE0_CPU_IDS);
  const gpuIds = new Set<string>(PHASE0_GPU_IDS);

  return (state: BuildState): boolean => {
    if (state.contractVersion !== VS0_CONTRACT_VERSION) {
      return false;
    }

    const casePart = catalog.get(state.caseId);
    const motherboard = catalog.get(state.motherboardId);
    const cpu = catalog.get(state.cpuId);
    const gpu = catalog.get(state.gpuId);
    const cooler = catalog.get(state.coolerId);

    if (!casePart || casePart.category !== "case") return false;
    if (!motherboard || motherboard.category !== "motherboard") return false;
    if (!cpu || cpu.category !== "cpu") return false;
    if (!gpu || gpu.category !== "gpu") return false;
    if (!cooler || cooler.category !== "cooler") return false;
    if (state.gameId !== PHASE0_GAME.id) return false;
    if (state.presetId !== PHASE0_PRESET.id) return false;
    if (!cpuIds.has(state.cpuId)) return false;
    if (!gpuIds.has(state.gpuId)) return false;

    return true;
  };
}

export function isValidBuildState(
  state: BuildState,
  catalog: PartCatalog,
): boolean {
  return createBuildStateValidator(catalog)(state);
}

export { DEFAULT_BUILD_STATE };

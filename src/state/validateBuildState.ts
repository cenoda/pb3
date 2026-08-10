import type { PartDefinitionV2 } from "../contract/partV2";
import { partRequiresCompatSpec } from "../contract/partV2";
import type { PartCategoryV2 } from "../contract/vs2";
import {
  DEFAULT_BUILD_STATE_V2,
  PHASE0_GAME,
  PHASE0_PRESET,
  VS2_CONTRACT_VERSION,
} from "../contract/vs2";
import type { BuildStateV2 } from "../contract/vs2";

export interface PartCatalog {
  byId: Map<string, PartDefinitionV2>;
  getByCategory(category: PartCategoryV2): PartDefinitionV2[];
  get(id: string): PartDefinitionV2 | undefined;
}

export type CatalogAllowedIds = Record<PartCategoryV2, Set<string>>;

export function catalogAllowedIds(catalog: PartCatalog): CatalogAllowedIds {
  const allowed: CatalogAllowedIds = {
    case: new Set(),
    motherboard: new Set(),
    cpu: new Set(),
    gpu: new Set(),
    cooler: new Set(),
    ram: new Set(),
    psu: new Set(),
  };

  for (const part of catalog.byId.values()) {
    allowed[part.category].add(part.id);
  }

  return allowed;
}

export function createPartCatalog(parts: PartDefinitionV2[]): PartCatalog {
  const byId = new Map(parts.map((part) => [part.id, part]));

  return {
    byId,
    get(id: string) {
      return byId.get(id);
    },
    getByCategory(category: PartCategoryV2) {
      return parts.filter((part) => part.category === category);
    },
  };
}

export function createBuildStateValidator(catalog: PartCatalog) {
  return (state: BuildStateV2): boolean => {
    if (state.contractVersion !== VS2_CONTRACT_VERSION) {
      return false;
    }

    const casePart = catalog.get(state.caseId);
    const motherboard = catalog.get(state.motherboardId);
    const cpu = catalog.get(state.cpuId);
    const gpu = catalog.get(state.gpuId);
    const cooler = catalog.get(state.coolerId);
    const ram = catalog.get(state.ramId);
    const psu = catalog.get(state.psuId);

    if (!casePart || casePart.category !== "case") return false;
    if (!motherboard || motherboard.category !== "motherboard") return false;
    if (!cpu || cpu.category !== "cpu") return false;
    if (!gpu || gpu.category !== "gpu") return false;
    if (!cooler || cooler.category !== "cooler") return false;
    if (!ram || ram.category !== "ram") return false;
    if (!psu || psu.category !== "psu") return false;
    if (state.gameId !== PHASE0_GAME.id) return false;
    if (state.presetId !== PHASE0_PRESET.id) return false;

    return true;
  };
}

export function isValidBuildState(
  state: BuildStateV2,
  catalog: PartCatalog,
): boolean {
  return createBuildStateValidator(catalog)(state);
}

export function assertPartCompatFields(catalog: PartCatalog): void {
  for (const part of catalog.byId.values()) {
    if (partRequiresCompatSpec(part.category) && !part.compatSpec) {
      throw new Error(
        `Part ${part.id} (${part.category}) is missing required compatSpec`,
      );
    }
  }
}

export { DEFAULT_BUILD_STATE_V2 as DEFAULT_BUILD_STATE };

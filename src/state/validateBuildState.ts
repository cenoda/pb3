import type { PartDefinitionV2 } from "../contract/partV2";
import { partRequiresCompatSpec } from "../contract/partV2";
import type { PartCategoryV2 } from "../contract/vs2";
import {
  DEFAULT_BUILD_STATE_V2,
  PHASE0_CPU_IDS,
  PHASE0_GAME,
  PHASE0_GPU_IDS,
  PHASE0_PRESET,
  PHASE2_CASE_IDS,
  PHASE2_MOTHERBOARD_IDS,
  PHASE2_PSU_IDS,
  PHASE2_RAM_IDS,
  VS2_CONTRACT_VERSION,
} from "../contract/vs2";
import type { BuildStateV2 } from "../contract/vs2";

export interface PartCatalog {
  byId: Map<string, PartDefinitionV2>;
  getByCategory(category: PartCategoryV2): PartDefinitionV2[];
  get(id: string): PartDefinitionV2 | undefined;
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
  const cpuIds = new Set<string>(PHASE0_CPU_IDS);
  const gpuIds = new Set<string>(PHASE0_GPU_IDS);
  const caseIds = new Set<string>(PHASE2_CASE_IDS);
  const motherboardIds = new Set<string>(PHASE2_MOTHERBOARD_IDS);
  const ramIds = new Set<string>(PHASE2_RAM_IDS);
  const psuIds = new Set<string>(PHASE2_PSU_IDS);

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
    if (!cpuIds.has(state.cpuId as (typeof PHASE0_CPU_IDS)[number]))
      return false;
    if (!gpuIds.has(state.gpuId as (typeof PHASE0_GPU_IDS)[number]))
      return false;
    if (!caseIds.has(state.caseId as (typeof PHASE2_CASE_IDS)[number]))
      return false;
    if (
      !motherboardIds.has(
        state.motherboardId as (typeof PHASE2_MOTHERBOARD_IDS)[number],
      )
    )
      return false;
    if (!ramIds.has(state.ramId as (typeof PHASE2_RAM_IDS)[number]))
      return false;
    if (!psuIds.has(state.psuId as (typeof PHASE2_PSU_IDS)[number]))
      return false;

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

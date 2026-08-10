import { create } from "zustand";
import type { BuildStateV2 } from "../contract/vs2";
import type { CatalogAllowedIds } from "./validateBuildState";

interface BuildStore {
  buildState: BuildStateV2 | null;
  initialized: boolean;
  init: (state: BuildStateV2, allowed: CatalogAllowedIds) => void;
  setCase: (caseId: string) => void;
  setMotherboard: (motherboardId: string) => void;
  setCpu: (cpuId: string) => void;
  setGpu: (gpuId: string) => void;
  setCooler: (coolerId: string) => void;
  setRam: (ramId: string) => void;
  setPsu: (psuId: string) => void;
}

let allowedIds: CatalogAllowedIds | null = null; // injected from manifest-loaded catalog via init()

function allowedSet(category: keyof CatalogAllowedIds): Set<string> {
  return allowedIds?.[category] ?? new Set();
}

function updateField(
  store: BuildStore,
  field: keyof BuildStateV2,
  value: string,
  allowed: Set<string>,
): Partial<BuildStore> | BuildStore {
  if (!store.buildState || !allowed.has(value)) {
    return store;
  }
  return {
    buildState: { ...store.buildState, [field]: value },
  };
}

export const useBuildStore = create<BuildStore>((set) => ({
  buildState: null,
  initialized: false,
  init: (state, allowed) => {
    allowedIds = allowed;
    set({ buildState: state, initialized: true });
  },
  setCase: (caseId) =>
    set((store) => updateField(store, "caseId", caseId, allowedSet("case"))),
  setMotherboard: (motherboardId) =>
    set((store) =>
      updateField(
        store,
        "motherboardId",
        motherboardId,
        allowedSet("motherboard"),
      ),
    ),
  setCpu: (cpuId) =>
    set((store) => updateField(store, "cpuId", cpuId, allowedSet("cpu"))),
  setGpu: (gpuId) =>
    set((store) => updateField(store, "gpuId", gpuId, allowedSet("gpu"))),
  setCooler: (coolerId) =>
    set((store) =>
      updateField(store, "coolerId", coolerId, allowedSet("cooler")),
    ),
  setRam: (ramId) =>
    set((store) => updateField(store, "ramId", ramId, allowedSet("ram"))),
  setPsu: (psuId) =>
    set((store) => updateField(store, "psuId", psuId, allowedSet("psu"))),
}));

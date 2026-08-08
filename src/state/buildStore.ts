import { create } from "zustand";
import type { BuildStateV2 } from "../contract/vs2";
import {
  PHASE0_CPU_IDS,
  PHASE0_GPU_IDS,
  PHASE2_CASE_IDS,
  PHASE2_MOTHERBOARD_IDS,
  PHASE2_PSU_IDS,
  PHASE2_RAM_IDS,
} from "../contract/vs2";

interface BuildStore {
  buildState: BuildStateV2 | null;
  initialized: boolean;
  init: (state: BuildStateV2) => void;
  setCase: (caseId: string) => void;
  setMotherboard: (motherboardId: string) => void;
  setCpu: (cpuId: string) => void;
  setGpu: (gpuId: string) => void;
  setCooler: (coolerId: string) => void;
  setRam: (ramId: string) => void;
  setPsu: (psuId: string) => void;
}

const caseIdSet = new Set<string>(PHASE2_CASE_IDS);
const motherboardIdSet = new Set<string>(PHASE2_MOTHERBOARD_IDS);
const cpuIdSet = new Set<string>(PHASE0_CPU_IDS);
const gpuIdSet = new Set<string>(PHASE0_GPU_IDS);
const ramIdSet = new Set<string>(PHASE2_RAM_IDS);
const psuIdSet = new Set<string>(PHASE2_PSU_IDS);

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
  init: (state) => set({ buildState: state, initialized: true }),
  setCase: (caseId) =>
    set((store) => updateField(store, "caseId", caseId, caseIdSet)),
  setMotherboard: (motherboardId) =>
    set((store) =>
      updateField(store, "motherboardId", motherboardId, motherboardIdSet),
    ),
  setCpu: (cpuId) =>
    set((store) => updateField(store, "cpuId", cpuId, cpuIdSet)),
  setGpu: (gpuId) =>
    set((store) => updateField(store, "gpuId", gpuId, gpuIdSet)),
  setCooler: (coolerId) =>
    set((store) => {
      if (!store.buildState) return store;
      return { buildState: { ...store.buildState, coolerId } };
    }),
  setRam: (ramId) =>
    set((store) => updateField(store, "ramId", ramId, ramIdSet)),
  setPsu: (psuId) =>
    set((store) => updateField(store, "psuId", psuId, psuIdSet)),
}));

import { create } from "zustand";
import type { BuildState } from "../contract/vs0";
import { PHASE0_CPU_IDS, PHASE0_GPU_IDS } from "../contract/vs0";

interface BuildStore {
  buildState: BuildState | null;
  initialized: boolean;
  init: (state: BuildState) => void;
  setCpu: (cpuId: string) => void;
  setGpu: (gpuId: string) => void;
}

const cpuIdSet = new Set<string>(PHASE0_CPU_IDS);
const gpuIdSet = new Set<string>(PHASE0_GPU_IDS);

export const useBuildStore = create<BuildStore>((set) => ({
  buildState: null,
  initialized: false,
  init: (state) => set({ buildState: state, initialized: true }),
  setCpu: (cpuId) =>
    set((store) => {
      if (!store.buildState || !cpuIdSet.has(cpuId)) {
        return store;
      }
      return {
        buildState: { ...store.buildState, cpuId },
      };
    }),
  setGpu: (gpuId) =>
    set((store) => {
      if (!store.buildState || !gpuIdSet.has(gpuId)) {
        return store;
      }
      return {
        buildState: { ...store.buildState, gpuId },
      };
    }),
}));

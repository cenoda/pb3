import { create } from "zustand";
import {
  DEFAULT_PERF_PANEL_DIMENSIONS,
  type CorrectionInput,
  type PerfPanelDimensions,
} from "../contract/perf1";

interface PerfPanelState {
  dimensions: PerfPanelDimensions;
  correction: CorrectionInput;
  setUpscaleId: (upscaleId: PerfPanelDimensions["upscaleId"]) => void;
  setFrameGenId: (frameGenId: PerfPanelDimensions["frameGenId"]) => void;
  setRamTierId: (ramTierId: PerfPanelDimensions["ramTierId"]) => void;
  setCorrection: (correction: CorrectionInput) => void;
  resetCorrection: () => void;
}

export const usePerfPanelStore = create<PerfPanelState>((set) => ({
  dimensions: { ...DEFAULT_PERF_PANEL_DIMENSIONS },
  correction: {},
  setUpscaleId: (upscaleId) =>
    set((state) => ({
      dimensions: { ...state.dimensions, upscaleId },
    })),
  setFrameGenId: (frameGenId) =>
    set((state) => ({
      dimensions: { ...state.dimensions, frameGenId },
    })),
  setRamTierId: (ramTierId) =>
    set((state) => ({
      dimensions: { ...state.dimensions, ramTierId },
    })),
  setCorrection: (correction) => set({ correction }),
  resetCorrection: () => set({ correction: {} }),
}));

import { create } from "zustand";
import type { AssemblyUserChoices } from "../physical/buildAssemblyState";

interface AssemblyStore {
  coolerOrientationId: "normal" | "rotated-180";
  setCoolerOrientation: (orientationId: "normal" | "rotated-180") => void;
  resetToAuto: () => void;
  userChoices: () => AssemblyUserChoices;
}

export const useAssemblyStore = create<AssemblyStore>((set, get) => ({
  coolerOrientationId: "normal",
  setCoolerOrientation: (orientationId) => set({ coolerOrientationId: orientationId }),
  resetToAuto: () => set({ coolerOrientationId: "normal" }),
  userChoices: () => ({
    coolerOrientationId: get().coolerOrientationId,
  }),
}));

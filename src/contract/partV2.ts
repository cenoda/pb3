import type {
  CaseCompatSpec,
  CpuCompatSpec,
  GpuCompatSpec,
  MotherboardCompatSpec,
  PsuCompatSpec,
  RamCompatSpec,
} from "./compat2";
import type { CaseClearanceLimits, DimensionsMm } from "./cat6";
import type { PhysicalSpec } from "./phys3";
import type { PartCategoryV2 } from "./vs2";

/**
 * Phase-2 catalog part shape: vs0 part.json base fields plus optional nested compatSpec.
 * Optional nested physicalSpec is Phase-3 phys3 metadata; omitted means visual-only.
 */
export interface PartDefinitionV2 {
  contractVersion: "vs0" | "cat6";
  id: string;
  category: PartCategoryV2;
  displayName: string;
  modelGlbPath: string;
  notes?: string;
  compatSpec?:
    | CpuCompatSpec
    | MotherboardCompatSpec
    | GpuCompatSpec
    | RamCompatSpec
    | PsuCompatSpec
    | CaseCompatSpec;
  physicalSpec?: PhysicalSpec;
  /** cat6-authored dimensions; absent when the vendor published none. */
  dimensionsMm?: DimensionsMm;
  /** cat6 case clearance limits for scalar clearance-limit evaluation. */
  clearanceLimits?: CaseClearanceLimits;
  /** Minimal provenance for runtime evidence attribution. */
  provenance?: {
    clearanceLimits?: { sourceId: string };
    dimensions?: { sourceId: string };
  };
}

const CATEGORIES_REQUIRING_COMPAT: ReadonlySet<PartCategoryV2> = new Set([
  "case",
  "motherboard",
  "cpu",
  "gpu",
  "ram",
  "psu",
]);

export function partRequiresCompatSpec(category: PartCategoryV2): boolean {
  return CATEGORIES_REQUIRING_COMPAT.has(category);
}

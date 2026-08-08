import type {
  CaseCompatSpec,
  CpuCompatSpec,
  GpuCompatSpec,
  MotherboardCompatSpec,
  PsuCompatSpec,
  RamCompatSpec,
} from "./compat2";
import type { PartCategoryV2 } from "./vs2";

/**
 * Phase-2 catalog part shape: vs0 part.json base fields plus optional nested compatSpec.
 */
export interface PartDefinitionV2 {
  contractVersion: "vs0";
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

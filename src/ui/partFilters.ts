import type { MotherboardCompatSpec, RamCompatSpec } from "../contract/compat2";
import type { PartDefinitionV2 } from "../contract/partV2";
import type { PartCategoryV2 } from "../contract/vs2";
import type { PartCatalog } from "../state/validateBuildState";

export type PartFilterKey =
  | "motherboardFormFactor"
  | "ramCapacityGb"
  | "psuWattageMin";

export interface PartFilters {
  motherboardFormFactor: "all" | "ATX" | "Micro-ATX";
  ramCapacityGb: "all" | "16" | "32";
  psuWattageMin: "all" | "550" | "750";
}

export const DEFAULT_PART_FILTERS: PartFilters = {
  motherboardFormFactor: "all",
  ramCapacityGb: "all",
  psuWattageMin: "all",
};

function matchesMotherboardFilter(
  part: PartDefinitionV2,
  filter: PartFilters["motherboardFormFactor"],
): boolean {
  if (filter === "all" || part.category !== "motherboard") return true;
  const spec = part.compatSpec as MotherboardCompatSpec | undefined;
  return spec?.formFactor === filter;
}

function matchesRamFilter(
  part: PartDefinitionV2,
  filter: PartFilters["ramCapacityGb"],
): boolean {
  if (filter === "all" || part.category !== "ram") return true;
  const spec = part.compatSpec as RamCompatSpec | undefined;
  if (!spec) return false;
  return String(spec.capacityGb) === filter;
}

function matchesPsuFilter(
  part: PartDefinitionV2,
  filter: PartFilters["psuWattageMin"],
): boolean {
  if (filter === "all" || part.category !== "psu") return true;
  const wattage = (part.compatSpec as { wattage?: number } | undefined)
    ?.wattage;
  if (wattage == null) return false;
  if (filter === "550") return wattage >= 550;
  if (filter === "750") return wattage >= 750;
  return true;
}

export function filterPartsByCategory(
  parts: PartDefinitionV2[],
  category: PartCategoryV2,
  filters: PartFilters,
): PartDefinitionV2[] {
  return parts.filter((part) => {
    if (part.category !== category) return false;
    if (!matchesMotherboardFilter(part, filters.motherboardFormFactor))
      return false;
    if (!matchesRamFilter(part, filters.ramCapacityGb)) return false;
    if (!matchesPsuFilter(part, filters.psuWattageMin)) return false;
    return true;
  });
}

export function listFilteredParts(
  catalog: PartCatalog,
  category: PartCategoryV2,
  filters: PartFilters,
): PartDefinitionV2[] {
  return filterPartsByCategory(catalog.getByCategory(category), category, filters);
}

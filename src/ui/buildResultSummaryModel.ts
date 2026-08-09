import type { CompatibilityReport, BuildPriceSummary } from "../contract/compat2";
import type { PhysicalValidationReport } from "../contract/phys3";
import type { Perf1ResolutionId } from "../contract/perf1";

export type FpsChipStatus = "ok" | "unavailable";

export interface FpsSummaryChip {
  resolution: Perf1ResolutionId;
  label: string;
  status: FpsChipStatus;
  fpsMin?: number;
  fpsMax?: number;
  reason?: string;
}

export interface BuildResultSummaryModel {
  compatibilityStatus: CompatibilityReport["overallStatus"];
  fitStatus: PhysicalValidationReport["overallStatus"];
  fpsChips: FpsSummaryChip[];
  priceTotal: number;
  priceCurrency: string;
  pricePartial: boolean;
  isPilotBuild: boolean;
}

export function buildResultSummaryModel(input: {
  compatibility: CompatibilityReport;
  physical: PhysicalValidationReport;
  price: BuildPriceSummary;
  fpsChips: FpsSummaryChip[];
  isPilotBuild: boolean;
}): BuildResultSummaryModel {
  return {
    compatibilityStatus: input.compatibility.overallStatus,
    fitStatus: input.physical.overallStatus,
    fpsChips: input.fpsChips,
    priceTotal: input.price.subtotalAmount,
    priceCurrency: input.price.currency,
    pricePartial: input.price.isPartial,
    isPilotBuild: input.isPilotBuild,
  };
}

export function statusTone(
  status: string,
): "ok" | "warn" | "bad" {
  if (
    status === "compatible" ||
    status === "fit" ||
    status === "ok"
  ) {
    return "ok";
  }
  if (
    status === "unavailable" ||
    status === "partial" ||
    status === "warning"
  ) {
    return "warn";
  }
  return "bad";
}

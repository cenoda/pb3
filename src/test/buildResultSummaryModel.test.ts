import { describe, expect, it } from "vitest";
import {
  buildResultSummaryModel,
  statusTone,
  type FpsSummaryChip,
} from "../ui/buildResultSummaryModel";
import type { CompatibilityReport, BuildPriceSummary } from "../contract/compat2";
import type { PhysicalValidationReport } from "../contract/phys3";

const compatibility = {
  compatContractVersion: "compat2",
  buildStateVersion: "vs2",
  checks: [],
  overallStatus: "compatible",
  dataVersion: "test",
} as CompatibilityReport;

const physical = {
  overallStatus: "fit",
  geometryDataVersion: "phys3-exp-20260808",
  checks: [],
} as unknown as PhysicalValidationReport;

const price = {
  compatContractVersion: "compat2",
  lines: [],
  subtotalAmount: 1234,
  currency: "USD",
  isPartial: false,
  dataVersion: "test",
} as BuildPriceSummary;

const fpsChips: FpsSummaryChip[] = [
  {
    resolution: "1080p",
    label: "1080p",
    status: "ok",
    fpsMin: 84,
    fpsMax: 91,
  },
  {
    resolution: "1440p",
    label: "1440p",
    status: "ok",
    fpsMin: 52,
    fpsMax: 64,
  },
  {
    resolution: "4k",
    label: "4K",
    status: "unavailable",
    reason: "missing",
  },
];

describe("buildResultSummaryModel", () => {
  it("maps overall statuses, price, fps chips, and pilot flag", () => {
    const model = buildResultSummaryModel({
      compatibility,
      physical,
      price,
      fpsChips,
      isPilotBuild: true,
    });
    expect(model.compatibilityStatus).toBe("compatible");
    expect(model.fitStatus).toBe("fit");
    expect(model.priceTotal).toBe(1234);
    expect(model.pricePartial).toBe(false);
    expect(model.isPilotBuild).toBe(true);
    expect(model.fpsChips).toHaveLength(3);
    expect(model.fpsChips[2]?.status).toBe("unavailable");
  });

  it("statusTone classifies known statuses", () => {
    expect(statusTone("compatible")).toBe("ok");
    expect(statusTone("fit")).toBe("ok");
    expect(statusTone("unavailable")).toBe("warn");
    expect(statusTone("interference")).toBe("bad");
    expect(statusTone("incompatible")).toBe("bad");
  });
});

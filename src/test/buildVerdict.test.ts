import { describe, expect, it } from "vitest";
import type { CompatibilityReport } from "../contract/compat2";
import type { PhysicalValidationReport } from "../contract/phys3";
import { buildVerdict } from "../ui/buildVerdict";

const NAMES: Record<string, string> = {
  "mb.atx-b650-01": "ATX B650 Board 01 (fixture)",
  "case.micro-atx-mini-01": "Micro-ATX Mini Case 01 (fixture)",
  "cpu.zen4-7600": "Ryzen 5 7600 (fixture)",
  "cooler.air-twin-tower-01": "Air Twin Tower Cooler 01 (fixture)",
};

const nameOf = (partId: string) => NAMES[partId] ?? partId;

function compat(
  overrides: Partial<CompatibilityReport> = {},
): CompatibilityReport {
  return {
    compatContractVersion: "compat2",
    buildStateVersion: "vs2",
    checks: [],
    overallStatus: "compatible",
    dataVersion: "test",
    ...overrides,
  } as CompatibilityReport;
}

function physical(
  overrides: Partial<PhysicalValidationReport> = {},
): PhysicalValidationReport {
  return {
    physicalContractVersion: "phys3",
    buildStateVersion: "vs2",
    assemblyState: {
      physicalContractVersion: "phys3",
      buildStateVersion: "vs2",
      mountSelections: [],
    },
    checks: [],
    overallStatus: "fit",
    geometryDataVersion: "test",
    ...overrides,
  } as PhysicalValidationReport;
}

describe("buildVerdict", () => {
  it("passes a build whose checks all succeed", () => {
    const verdict = buildVerdict({
      compatibility: compat(),
      physical: physical(),
      nameOf,
    });
    expect(verdict.level).toBe("ok");
    expect(verdict.showResults).toBe(true);
    expect(verdict.reason).toBeNull();
  });

  /*
   * The Phase 5 audit defect: an incompatible build reported 1080p 125-145 fps
   * and a price, higher than the valid build it replaced. showResults is the
   * single gate that must stay false (spec R1).
   */
  it("blocks results for an incompatible build", () => {
    const verdict = buildVerdict({
      compatibility: compat({
        overallStatus: "incompatible",
        checks: [
          {
            checkId: "case-form-factor",
            status: "incompatible",
            explanation:
              "Motherboard mb.atx-b650-01 is ATX; case case.micro-atx-mini-01 supports Micro-ATX only.",
            involvedPartIds: ["case.micro-atx-mini-01", "mb.atx-b650-01"],
          },
        ],
      }),
      physical: physical(),
      nameOf,
    });

    expect(verdict.showResults).toBe(false);
    expect(verdict.level).toBe("blocked");
  });

  it("names parts by product name and says what to change", () => {
    const verdict = buildVerdict({
      compatibility: compat({
        overallStatus: "incompatible",
        checks: [
          {
            checkId: "case-form-factor",
            status: "incompatible",
            explanation:
              "Motherboard mb.atx-b650-01 is ATX; case case.micro-atx-mini-01 supports Micro-ATX only.",
            involvedPartIds: ["case.micro-atx-mini-01", "mb.atx-b650-01"],
          },
        ],
      }),
      physical: physical(),
      nameOf,
    });

    expect(verdict.reason).toBe(
      "Motherboard ATX B650 Board 01 (fixture) is ATX; case Micro-ATX Mini Case 01 (fixture) supports Micro-ATX only. Change the case or the motherboard.",
    );
    expect(verdict.reason).not.toMatch(/mb\.|case\.|cpu\./);
  });

  it("blocks results when parts physically interfere", () => {
    const verdict = buildVerdict({
      compatibility: compat(),
      physical: physical({
        overallStatus: "interference",
        checks: [
          {
            checkId: "collision:cooler-case",
            kind: "collision",
            status: "interference",
            involvedPartIds: ["cooler.air-twin-tower-01"],
            involvedNodeNames: [],
            explanation: "Cooler cooler.air-twin-tower-01 overlaps the side panel.",
            evidenceSourceIds: [],
          },
        ],
      }),
      nameOf,
    });

    expect(verdict.showResults).toBe(false);
    expect(verdict.reason).toContain("Air Twin Tower Cooler 01 (fixture)");
  });

  it("blocks results when the build cannot be assembled at all", () => {
    const verdict = buildVerdict({
      compatibility: compat(),
      physical: physical({ overallStatus: "unavailable" }),
      nameOf,
    });

    expect(verdict.showResults).toBe(false);
    expect(verdict.headline).toBe("This build cannot be assembled.");
  });

  it("still shows results when a check could not be run, and says so", () => {
    const verdict = buildVerdict({
      compatibility: compat({
        overallStatus: "unavailable",
        checks: [
          {
            checkId: "chipset-bios",
            status: "unavailable",
            explanation:
              "No documented minimum BIOS version for cpu.zen4-7600 on mb.atx-b650-01.",
            involvedPartIds: ["cpu.zen4-7600", "mb.atx-b650-01"],
          },
        ],
      }),
      physical: physical(),
      nameOf,
    });

    expect(verdict.level).toBe("caution");
    expect(verdict.showResults).toBe(true);
    expect(verdict.reason).toContain("Ryzen 5 7600 (fixture)");
  });
});

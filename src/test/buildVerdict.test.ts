import { describe, expect, it } from "vitest";
import type { CompatibilityReport } from "../contract/compat2";
import type { PhysicalValidationReport } from "../contract/phys3";
import { buildVerdict } from "../ui/buildVerdict";

const NAMES: Record<string, string> = {
  "motherboard.gigabyte-b650-aorus-elite-ax-v2": "ATX B650 Board 01 (fixture)",
  "case.lian-li-a3-matx-black": "Micro-ATX Mini Case 01 (fixture)",
  "cpu.amd-ryzen-5-7600": "Ryzen 5 7600 (fixture)",
  "cooler.noctua-nh-d15-g2": "Air Twin Tower Cooler 01 (fixture)",
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
              "Motherboard motherboard.gigabyte-b650-aorus-elite-ax-v2 is ATX; case case.lian-li-a3-matx-black supports Micro-ATX only.",
            involvedPartIds: ["case.lian-li-a3-matx-black", "motherboard.gigabyte-b650-aorus-elite-ax-v2"],
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
              "Motherboard motherboard.gigabyte-b650-aorus-elite-ax-v2 is ATX; case case.lian-li-a3-matx-black supports Micro-ATX only.",
            involvedPartIds: ["case.lian-li-a3-matx-black", "motherboard.gigabyte-b650-aorus-elite-ax-v2"],
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

  it("Case A — OBB interference cannot cause authoritative interference", () => {
    const verdict = buildVerdict({
      compatibility: compat(),
      physical: physical({
        overallStatus: "unavailable",
        checks: [
          {
            checkId: "collision:cooler-case",
            kind: "collision",
            status: "interference",
            involvedPartIds: ["cooler.noctua-nh-d15-g2"],
            involvedNodeNames: ["collision:cooler-body"],
            explanation:
              "Cooler cooler.noctua-nh-d15-g2 overlaps the side panel.",
            evidenceSourceIds: [],
          },
        ],
      }),
      nameOf,
    });

    expect(verdict.level).toBe("blocked");
    expect(verdict.headline).toBe("This build cannot be assembled.");
    expect(verdict.showResults).toBe(false);
    expect(verdict.reason).not.toContain("side panel");
    expect(verdict.reason).toBe(
      "We could not work out how these parts fit together. Change a part to try another combination.",
    );
  });

  it("Case B — advisory OBB interference alongside authoritative fit", () => {
    const verdict = buildVerdict({
      compatibility: compat(),
      physical: physical({
        overallStatus: "fit",
        checks: [
          {
            checkId: "clearance-limit:cpu-cooler-height",
            kind: "clearance-limit",
            status: "fit",
            involvedPartIds: [
              "case.fractal-design-north-tg-dark",
              "cooler.noctua-nh-d15-g2",
            ],
            involvedNodeNames: ["clearance-limit:maxCpuCoolerHeight"],
            evidenceSourceIds: [],
          },
          {
            checkId: "clearance:cooler-sidekeepout",
            kind: "clearance",
            status: "interference",
            involvedPartIds: ["cooler.noctua-nh-d15-g2"],
            involvedNodeNames: ["clearance:cooler-sidekeepout"],
            explanation: "Cooler overlaps side keepout volume.",
            evidenceSourceIds: [],
          },
        ],
      }),
      nameOf,
    });

    expect(verdict.level).toBe("ok");
    expect(verdict.showResults).toBe(true);
    expect(verdict.reason).toBeNull();
  });

  it("Case C — authoritative scalar interference blocks with clearance-limit reason", () => {
    const verdict = buildVerdict({
      compatibility: compat(),
      physical: physical({
        overallStatus: "interference",
        checks: [
          {
            checkId: "clearance-limit:cpu-cooler-height",
            kind: "clearance-limit",
            status: "interference",
            involvedPartIds: [
              "case.lian-li-a3-matx-black",
              "cooler.noctua-nh-d15-g2",
            ],
            involvedNodeNames: ["clearance-limit:maxCpuCoolerHeight"],
            explanation:
              "Cooler cooler.noctua-nh-d15-g2 is 168 mm height; case case.lian-li-a3-matx-black limit is 165 mm.",
            evidenceSourceIds: [],
          },
        ],
      }),
      nameOf,
    });

    expect(verdict.showResults).toBe(false);
    expect(verdict.level).toBe("blocked");
    expect(verdict.reason).toContain("Air Twin Tower Cooler 01 (fixture)");
  });

  it("blocks results when the build cannot be assembled at all", () => {
    const verdict = buildVerdict({
      compatibility: compat(),
      physical: physical({
        overallStatus: "unavailable",
        checks: [
          {
            checkId: "coverage:x",
            kind: "collision",
            status: "unavailable",
            involvedPartIds: ["a"],
            involvedNodeNames: ["part:a"],
            explanation: "missing geometry",
            evidenceSourceIds: [],
          },
        ],
      }),
      nameOf,
    });

    expect(verdict.showResults).toBe(false);
    expect(verdict.headline).toBe("This build cannot be assembled.");
  });

  it("shows caution when physical validation is conditional", () => {
    const verdict = buildVerdict({
      compatibility: compat(),
      physical: physical({
        overallStatus: "conditional",
        checks: [
          {
            checkId: "clearance-limit:gpu-length",
            kind: "clearance-limit",
            status: "conditional",
            involvedPartIds: ["case.lian-li-a3-matx-black", "gpu.asus-dual-rtx4070-o12g"],
            involvedNodeNames: ["clearance-limit:maxGpuLength"],
            explanation: "GPU length fits some published branches and fails others.",
            evidenceSourceIds: [],
          },
        ],
      }),
      nameOf,
    });

    expect(verdict.level).toBe("caution");
    expect(verdict.showResults).toBe(true);
    expect(verdict.headline).toContain("configuration");
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
              "No documented minimum BIOS version for cpu.amd-ryzen-5-7600 on motherboard.gigabyte-b650-aorus-elite-ax-v2.",
            involvedPartIds: ["cpu.amd-ryzen-5-7600", "motherboard.gigabyte-b650-aorus-elite-ax-v2"],
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

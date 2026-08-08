import { describe, expect, it } from "vitest";
import { loadCompat2Examples } from "../catalog/loadCompat2Fixtures";
import { loadPartCatalog } from "../catalog/loadPartCatalog";
import { buildCompatibilityReport } from "../compat/buildCompatibilityReport";
import { checkCaseFormFactor } from "../compat/checkCaseFormFactor";
import { checkChipsetBios } from "../compat/checkChipsetBios";
import { checkCpuSocket } from "../compat/checkCpuSocket";
import { checkPsuWattage } from "../compat/checkPsuWattage";
import { checkRamSupport } from "../compat/checkRamSupport";
import { resolveCompatibilityInputs } from "../compat/compatibilityInputs";
import { PSU_HEADROOM_MULTIPLIER } from "../contract/compat2";
import { DEFAULT_BUILD_STATE_V2 } from "../contract/vs2";
import {
  assertPartCompatFields,
  createBuildStateValidator,
} from "../state/validateBuildState";

describe("compatibilityChecks", () => {
  it("default build is fully compatible", async () => {
    const catalog = await loadPartCatalog();
    const report = buildCompatibilityReport(DEFAULT_BUILD_STATE_V2, catalog);
    expect(report.overallStatus).toBe("compatible");
    expect(report.checks).toHaveLength(5);
    expect(report.checks.every((check) => check.status === "compatible")).toBe(
      true,
    );
  });

  it("cpu-socket reports incompatible for AM5 CPU on AM4 board", async () => {
    const catalog = await loadPartCatalog();
    const inputs = resolveCompatibilityInputs(
      {
        ...DEFAULT_BUILD_STATE_V2,
        motherboardId: "mb.micro-b450-01",
      },
      catalog,
    );
    const result = checkCpuSocket(inputs);
    expect(result.status).toBe("incompatible");
    expect(result.explanation).toBeTruthy();
  });

  it("chipset-bios is unavailable when BIOS map entry is missing", async () => {
    const catalog = await loadPartCatalog();
    const inputs = resolveCompatibilityInputs(
      {
        ...DEFAULT_BUILD_STATE_V2,
        cpuId: "cpu.zen4-7800x3d",
      },
      catalog,
    );
    const result = checkChipsetBios(inputs);
    expect(result.status).toBe("unavailable");
    expect(result.explanation).toContain("cpu.zen4-7800x3d");
  });

  it("ram-support is incompatible when kit exceeds motherboard max speed", async () => {
    const catalog = await loadPartCatalog();
    const inputs = resolveCompatibilityInputs(
      {
        ...DEFAULT_BUILD_STATE_V2,
        ramId: "ram.ddr5-16gb-7200",
      },
      catalog,
    );
    const result = checkRamSupport(inputs);
    expect(result.status).toBe("incompatible");
    expect(result.explanation).toContain("7200");
  });

  it("psu-wattage is incompatible when draw exceeds PSU capacity", async () => {
    const catalog = await loadPartCatalog();
    const inputs = resolveCompatibilityInputs(
      {
        ...DEFAULT_BUILD_STATE_V2,
        cpuId: "cpu.zen4-7800x3d",
        gpuId: "gpu.rtx4080",
        psuId: "psu.550w-sfx",
      },
      catalog,
    );
    const result = checkPsuWattage(inputs);
    expect(result.status).toBe("incompatible");
    expect(result.explanation).toContain(String(PSU_HEADROOM_MULTIPLIER));
  });

  it("case-form-factor is incompatible for ATX board in Micro-ATX-only case", async () => {
    const catalog = await loadPartCatalog();
    const inputs = resolveCompatibilityInputs(
      {
        ...DEFAULT_BUILD_STATE_V2,
        caseId: "case.micro-atx-mini-01",
      },
      catalog,
    );
    const result = checkCaseFormFactor(inputs);
    expect(result.status).toBe("incompatible");
    expect(result.explanation).toContain("ATX");
  });

  it("aggregate prefers incompatible over unavailable", async () => {
    const catalog = await loadPartCatalog();
    const report = buildCompatibilityReport(
      {
        ...DEFAULT_BUILD_STATE_V2,
        cpuId: "cpu.zen4-7800x3d",
        motherboardId: "mb.micro-b450-01",
      },
      catalog,
    );
    expect(report.overallStatus).toBe("incompatible");
  });

  it("compatibility example fixtures parse and include all statuses", async () => {
    const examples = await loadCompat2Examples();
    const statuses = new Set(
      examples.examples.flatMap((example) =>
        example.checks.map((check) => check.status),
      ),
    );
    expect(statuses.has("compatible")).toBe(true);
    expect(statuses.has("incompatible")).toBe(true);
    expect(statuses.has("unavailable")).toBe(true);
  });
});

describe("fixture integrity", () => {
  it("loads 13 phase-2 parts with compatSpec where required", async () => {
    const catalog = await loadPartCatalog();
    expect(catalog.byId.size).toBe(13);
    assertPartCompatFields(catalog);
    const isValid = createBuildStateValidator(catalog);
    expect(isValid(DEFAULT_BUILD_STATE_V2)).toBe(true);
  });
});

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
  it("default build compat checks pass except chipset-bios (O6 — no BIOS minimum modeled)", async () => {
    const catalog = await loadPartCatalog();
    const report = buildCompatibilityReport(DEFAULT_BUILD_STATE_V2, catalog);
    expect(report.overallStatus).toBe("unavailable");
    expect(report.checks).toHaveLength(5);
    const byId = Object.fromEntries(
      report.checks.map((c) => [c.checkId, c.status]),
    );
    expect(byId["cpu-socket"]).toBe("compatible");
    expect(byId["chipset-bios"]).toBe("unavailable");
    expect(byId["ram-support"]).toBe("compatible");
    expect(byId["psu-wattage"]).toBe("compatible");
    expect(byId["case-form-factor"]).toBe("compatible");
  });

  it("cpu-socket reports incompatible for AM5 CPU on LGA1851 board (slot 9 negative)", async () => {
    const catalog = await loadPartCatalog();
    const inputs = resolveCompatibilityInputs(
      {
        ...DEFAULT_BUILD_STATE_V2,
        motherboardId: "motherboard.asus-tuf-gaming-b860m-plus-wifi",
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
        cpuId: "cpu.amd-ryzen-7-7800x3d",
      },
      catalog,
    );
    const result = checkChipsetBios(inputs);
    expect(result.status).toBe("unavailable");
    expect(result.explanation).toContain("cpu.amd-ryzen-7-7800x3d");
  });

  it("ram-support is incompatible when kit exceeds motherboard max speed", async () => {
    const catalog = await loadPartCatalog();
    const inputs = resolveCompatibilityInputs(
      {
        ...DEFAULT_BUILD_STATE_V2,
        ramId: "ram.gskill-trident-z5-rgb-ddr5-8400",
      },
      catalog,
    );
    const result = checkRamSupport(inputs);
    expect(result.status).toBe("incompatible");
    expect(result.explanation).toContain("8400");
  });

  it("psu-wattage is incompatible when draw exceeds PSU capacity", async () => {
    const catalog = await loadPartCatalog();
    const inputs = resolveCompatibilityInputs(
      {
        ...DEFAULT_BUILD_STATE_V2,
        cpuId: "cpu.amd-ryzen-7-7800x3d",
        gpuId: "gpu.asus-proart-rtx4080-o16g",
        psuId: "psu.cooler-master-v550-sfx-gold",
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
        caseId: "case.lian-li-a3-matx-black",
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
        cpuId: "cpu.amd-ryzen-7-7800x3d",
        motherboardId: "motherboard.asus-tuf-gaming-b860m-plus-wifi",
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
  it("loads 22 catalog parts with compatSpec where required", async () => {
    const catalog = await loadPartCatalog();
    expect(catalog.byId.size).toBe(22);
    assertPartCompatFields(catalog);
    const isValid = createBuildStateValidator(catalog);
    expect(isValid(DEFAULT_BUILD_STATE_V2)).toBe(true);
  });
});

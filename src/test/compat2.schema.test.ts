import { describe, expect, it } from "vitest";
import {
  buildPriceSummarySchema,
  compatibilityCheckResultSchema,
  compatibilityExampleFileSchema,
  compatibilityReportSchema,
  priceFixtureFileSchema,
} from "../contract/compat2.schema";

const compatibleCheck = {
  checkId: "cpu-socket" as const,
  status: "compatible" as const,
  involvedPartIds: ["cpu.zen4-7600", "mb.atx-b650-01"],
};

const incompatibleCheck = {
  checkId: "cpu-socket" as const,
  status: "incompatible" as const,
  explanation:
    "CPU cpu.zen4-7600 uses socket AM5; motherboard mb.micro-b450-01 uses socket AM4.",
  involvedPartIds: ["cpu.zen4-7600", "mb.micro-b450-01"],
};

describe("compat2.schema", () => {
  it("accepts compatible check without explanation", () => {
    const parsed = compatibilityCheckResultSchema.safeParse(compatibleCheck);
    expect(parsed.success).toBe(true);
  });

  it("rejects incompatible check without explanation", () => {
    const parsed = compatibilityCheckResultSchema.safeParse({
      ...incompatibleCheck,
      explanation: undefined,
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a full compatibility report", () => {
    const parsed = compatibilityReportSchema.safeParse({
      compatContractVersion: "compat2",
      buildStateVersion: "vs2",
      checks: [compatibleCheck],
      overallStatus: "compatible",
      dataVersion: "compat2-fixture-draft",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects partial price summary when isPartial is false", () => {
    const parsed = buildPriceSummarySchema.safeParse({
      compatContractVersion: "compat2",
      lines: [
        {
          partId: "gpu.rtx4070",
          category: "gpu",
          status: "ok",
          amount: 599,
          currency: "USD",
          basis: "phase-2 fixture price; not a live market quote",
          dataVersion: "compat2-fixture-draft",
        },
        {
          partId: "ram.ddr5-32gb-6000",
          category: "ram",
          status: "unavailable",
          basis: "phase-2 fixture price; not a live market quote",
          reason: "no fixture price row",
          dataVersion: "compat2-fixture-draft",
        },
      ],
      subtotalAmount: 599,
      currency: "USD",
      isPartial: false,
      dataVersion: "compat2-fixture-draft",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts fixture file shapes", () => {
    const compatFile = compatibilityExampleFileSchema.safeParse({
      compatContractVersion: "compat2",
      dataVersion: "compat2-fixture-draft",
      examples: [
        {
          compatContractVersion: "compat2",
          buildStateVersion: "vs2",
          checks: [incompatibleCheck],
          overallStatus: "incompatible",
          dataVersion: "compat2-fixture-draft",
        },
      ],
    });
    expect(compatFile.success).toBe(true);

    const priceFile = priceFixtureFileSchema.safeParse({
      compatContractVersion: "compat2",
      dataVersion: "compat2-fixture-draft",
      rows: [
        {
          partId: "gpu.rtx4070",
          category: "gpu",
          status: "ok",
          amount: 599,
          currency: "USD",
          basis: "phase-2 fixture price; not a live market quote",
          dataVersion: "compat2-fixture-draft",
        },
      ],
    });
    expect(priceFile.success).toBe(true);
  });
});

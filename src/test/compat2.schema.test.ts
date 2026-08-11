import { describe, expect, it } from "vitest";
import {
  buildPriceSummarySchema,
  compatibilityCheckResultSchema,
  compatibilityExampleFileSchema,
  compatibilityReportSchema,
} from "../contract/compat2.schema";

const compatibleCheck = {
  checkId: "cpu-socket" as const,
  status: "compatible" as const,
  involvedPartIds: ["cpu.amd-ryzen-5-7600", "motherboard.gigabyte-b650-aorus-elite-ax-v2"],
};

const incompatibleCheck = {
  checkId: "cpu-socket" as const,
  status: "incompatible" as const,
  explanation:
    "CPU cpu.amd-ryzen-5-7600 uses socket AM5; motherboard motherboard.asus-tuf-gaming-b860m-plus-wifi uses socket LGA1851.",
  involvedPartIds: ["cpu.amd-ryzen-5-7600", "motherboard.asus-tuf-gaming-b860m-plus-wifi"],
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
          partId: "gpu.asus-dual-rtx4070-o12g",
          category: "gpu",
          status: "ok",
          amount: 599,
          currency: "KRW",
          basis: "test retailer listing in KR, retrieved 2026-08-11; snapshot, not a live quote",
          dataVersion: "test",
        },
        {
          partId: "ram.teamgroup-t-create-expert-ddr5-6000-32gb",
          category: "ram",
          status: "unavailable",
          basis: "cat6 catalog price snapshot; not a live market quote",
          reason: "no catalog price row",
          dataVersion: "test",
        },
      ],
      subtotalAmount: 599,
      currency: "KRW",
      isPartial: false,
      dataVersion: "test",
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
  });
});

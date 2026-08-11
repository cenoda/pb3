import { z } from "zod";
import { partCategoryV2Schema, vs2ContractVersionSchema } from "./vs2.schema";

export const compat2ContractVersionSchema = z.literal("compat2");

export const compatibilityCheckIdSchema = z.enum([
  "cpu-socket",
  "chipset-bios",
  "ram-support",
  "psu-wattage",
  "case-form-factor",
]);

export const compatibilityStatusSchema = z.enum([
  "compatible",
  "incompatible",
  "unavailable",
]);

export const compatibilityCheckResultSchema = z
  .object({
    checkId: compatibilityCheckIdSchema,
    status: compatibilityStatusSchema,
    explanation: z.string().min(1).optional(),
    involvedPartIds: z.array(z.string().min(1)).min(1),
  })
  .superRefine((value, ctx) => {
    if (value.status === "incompatible" && !value.explanation?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "incompatible CompatibilityCheckResult must include a non-empty explanation",
        path: ["explanation"],
      });
    }
  });

export const compatibilityReportSchema = z.object({
  compatContractVersion: compat2ContractVersionSchema,
  buildStateVersion: vs2ContractVersionSchema,
  checks: z.array(compatibilityCheckResultSchema),
  overallStatus: compatibilityStatusSchema,
  dataVersion: z.string().min(1),
});

export const pricedPartSchema = z.object({
  partId: z.string().min(1),
  category: partCategoryV2Schema,
  status: z.enum(["ok", "unavailable"]),
  amount: z.number().nonnegative().optional(),
  currency: z.string().min(1).optional(),
  basis: z.string().min(1),
  reason: z.string().optional(),
  dataVersion: z.string().min(1),
});

export const buildPriceSummarySchema = z
  .object({
    compatContractVersion: compat2ContractVersionSchema,
    lines: z.array(pricedPartSchema),
    subtotalAmount: z.number().nonnegative(),
    currency: z.string().min(1),
    isPartial: z.boolean(),
    dataVersion: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    const hasUnavailable = value.lines.some(
      (line) => line.status === "unavailable",
    );
    if (hasUnavailable && !value.isPartial) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "isPartial must be true when any line is unavailable",
        path: ["isPartial"],
      });
    }
  });

export const compatibilityExampleFileSchema = z.object({
  compatContractVersion: compat2ContractVersionSchema,
  dataVersion: z.string().min(1),
  examples: z.array(compatibilityReportSchema),
});

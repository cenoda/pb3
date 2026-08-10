import { z } from "zod";

const nonEmptyString = z.string().min(1);

const positiveFiniteNumber = z
  .number()
  .finite()
  .refine((n) => n > 0, "must be greater than zero");

export const dimensionsMmSchema = z
  .object({
    lengthMm: positiveFiniteNumber.optional(),
    heightMm: positiveFiniteNumber.optional(),
    thicknessMm: positiveFiniteNumber.optional(),
    raw: nonEmptyString,
    assignmentBasis: nonEmptyString,
  })
  .refine(
    (dimensions) =>
      dimensions.lengthMm !== undefined ||
      dimensions.heightMm !== undefined ||
      dimensions.thicknessMm !== undefined,
    {
      message:
        "dimensionsMm must record at least one published axis; a part with no published dimension omits the field entirely",
    },
  );

export const clearanceConditionSchema = z.object({
  subject: z.literal("psu.lengthMm"),
  operator: z.enum(["lte", "gt"]),
  valueMm: positiveFiniteNumber,
});

export const clearanceLimitSchema = z.object({
  limitMm: positiveFiniteNumber,
  condition: nonEmptyString.optional(),
  appliesWhen: z.array(clearanceConditionSchema).min(1).optional(),
});

const nonEmptyClearanceLimitArray = z.array(clearanceLimitSchema).min(1);

export const caseClearanceLimitsSchema = z.object({
  maxGpuLength: nonEmptyClearanceLimitArray.optional(),
  maxCpuCoolerHeight: nonEmptyClearanceLimitArray.optional(),
  maxPsuLength: nonEmptyClearanceLimitArray.optional(),
  raw: nonEmptyString,
});

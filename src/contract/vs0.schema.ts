import { z } from "zod";

export const vs0ContractVersionSchema = z.literal("vs0");

export const partCategorySchema = z.enum([
  "case",
  "motherboard",
  "cpu",
  "gpu",
  "cooler",
]);

export const resolutionIdSchema = z.enum(["1080p", "1440p", "4k"]);

export const estimateConfidenceSchema = z.enum([
  "stub",
  "low",
  "medium",
  "high",
  "none",
]);

export const estimateStatusSchema = z.enum(["ok", "unavailable"]);

export const partDefinitionSchema = z.object({
  contractVersion: vs0ContractVersionSchema,
  id: z.string().min(1),
  category: partCategorySchema,
  displayName: z.string().min(1),
  modelGlbPath: z.string().min(1),
  notes: z.string().optional(),
});

export const buildStateSchema = z.object({
  contractVersion: vs0ContractVersionSchema,
  caseId: z.string().min(1),
  motherboardId: z.string().min(1),
  cpuId: z.string().min(1),
  gpuId: z.string().min(1),
  coolerId: z.string().min(1),
  gameId: z.string().min(1),
  presetId: z.string().min(1),
});

export const performanceQuerySchema = z.object({
  contractVersion: vs0ContractVersionSchema,
  cpuId: z.string().min(1),
  gpuId: z.string().min(1),
  gameId: z.string().min(1),
  presetId: z.string().min(1),
  resolutionId: resolutionIdSchema,
});

export const performanceEstimateSchema = z.object({
  contractVersion: vs0ContractVersionSchema,
  query: performanceQuerySchema,
  status: estimateStatusSchema,
  fpsMin: z.number().nullable(),
  fpsMax: z.number().nullable(),
  confidence: estimateConfidenceSchema,
  dataVersion: z.string().min(1),
  basis: z.string().min(1),
  reason: z.string().optional(),
});

export const performanceFixtureRowSchema = z.object({
  cpuId: z.string().min(1),
  gpuId: z.string().min(1),
  gameId: z.string().min(1),
  presetId: z.string().min(1),
  resolutionId: resolutionIdSchema,
  fpsMin: z.number(),
  fpsMax: z.number(),
  confidence: estimateConfidenceSchema,
  dataVersion: z.string().min(1),
  basis: z.string().min(1),
});

export const performanceFixtureFileSchema = z.object({
  contractVersion: vs0ContractVersionSchema,
  dataVersion: z.string().min(1),
  rows: z.array(performanceFixtureRowSchema),
});

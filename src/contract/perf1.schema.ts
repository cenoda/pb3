import { z } from "zod";
import { estimateConfidenceSchema } from "./vs0.schema";

export const perf1ContractVersionSchema = z.literal("perf1");

export const cpuIdSchema = z.enum(["cpu.amd-ryzen-5-7600", "cpu.amd-ryzen-7-7800x3d"]);
export const gpuIdSchema = z.enum(["gpu.asus-dual-rtx4070-o12g", "gpu.asus-proart-rtx4080-o16g"]);
export const gameIdSchema = z.literal("game.cyberpunk-2077");
export const presetIdSchema = z.literal("preset.raster-ultra");
export const perf1ResolutionIdSchema = z.enum(["1080p", "1440p", "4k"]);
export const upscaleIdSchema = z.enum(["upscale.off", "upscale.dlss-quality"]);
export const frameGenIdSchema = z.enum(["framegen.off", "framegen.on"]);
export const ramTierIdSchema = z.enum(["ram.16gb-ddr5", "ram.32gb-ddr5"]);
export const powerProfileIdSchema = z.literal("power.default");

export const cpuPowerIdSchema = z.enum([
  "cpu-power.default",
  "cpu-power.reduced",
]);
export const gpuPowerIdSchema = z.enum([
  "gpu-power.default",
  "gpu-power.reduced",
]);
export const coolingBucketIdSchema = z.enum([
  "cooling.sufficient",
  "cooling.marginal",
  "cooling.insufficient",
]);
export const loadProfileIdSchema = z.enum(["load.transient", "load.sustained"]);

export const workloadIdSchema = z.enum(["cinebench.r23", "cinebench.2024"]);
export const workloadMetricSchema = z.enum([
  "metric.single-core",
  "metric.multi-core",
]);

export const limitingFactorCategorySchema = z.enum([
  "GPU-bound",
  "CPU-bound",
  "VRAM pressure",
  "power limit",
  "RAM-bound",
]);

export const limitingFactorSchema = z.object({
  category: limitingFactorCategorySchema,
  explanation: z.string().min(1),
});

export const baselineQuerySchema = z.object({
  cpuId: cpuIdSchema,
  gpuId: gpuIdSchema,
  gameId: gameIdSchema,
  presetId: presetIdSchema,
  resolution: perf1ResolutionIdSchema,
  upscaleId: upscaleIdSchema,
  frameGenId: frameGenIdSchema,
  ramTierId: ramTierIdSchema,
  powerProfileId: powerProfileIdSchema,
});

export const performanceEstimateSchema = z.object({
  fpsMin: z.number(),
  fpsMax: z.number(),
  confidence: estimateConfidenceSchema,
  dataVersion: z.string().min(1),
  basis: z.string().min(1),
  limitingFactor: limitingFactorSchema,
});

export const unavailableResultSchema = z.object({
  status: z.literal("unavailable"),
  reason: z.string().min(1),
});

export const correctionInputSchema = z.object({
  cpuPowerId: cpuPowerIdSchema.optional(),
  gpuPowerId: gpuPowerIdSchema.optional(),
  coolingBucketId: coolingBucketIdSchema.optional(),
  loadProfileId: loadProfileIdSchema.optional(),
  coolingHeadroom: z.number().optional(),
  intakeRestrictionSeverity: z.string().optional(),
  evidenceSourceId: z.string().optional(),
});

export const correctedEstimateSchema = z.object({
  status: z.literal("ok"),
  fpsMin: z.number(),
  fpsMax: z.number(),
  confidence: estimateConfidenceSchema,
  dataVersion: z.string().min(1),
  basis: z.string().min(1),
  limitingFactor: limitingFactorSchema,
  reason: z.string().min(1),
});

export const withheldCorrectionSchema = z.object({
  status: z.literal("withheld"),
  reason: z.string().min(1),
});

export const correctionResultSchema = z.discriminatedUnion("status", [
  correctedEstimateSchema,
  withheldCorrectionSchema,
]);

export const workloadQuerySchema = z.object({
  cpuId: cpuIdSchema,
  workloadId: workloadIdSchema,
  metric: workloadMetricSchema,
});

export const workloadEstimateSchema = z.object({
  cpuId: cpuIdSchema,
  workloadId: workloadIdSchema,
  metric: workloadMetricSchema,
  score: z.number(),
  confidence: estimateConfidenceSchema,
  dataVersion: z.string().min(1),
  basis: z.string().min(1),
});

/** Validates fpsMin <= fpsMax on supported baseline / corrected rows. */
function fpsRangeRefinement(
  row: { fpsMin: number; fpsMax: number },
  ctx: z.RefinementCtx,
): void {
  if (row.fpsMin > row.fpsMax) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `fpsMin (${row.fpsMin}) must be <= fpsMax (${row.fpsMax})`,
    });
  }
}

export const baselineFixtureRowSchema = baselineQuerySchema
  .extend({
    fpsMin: z.number(),
    fpsMax: z.number(),
    confidence: estimateConfidenceSchema,
    dataVersion: z.string().min(1),
    basis: z.string().min(1),
    limitingFactor: limitingFactorSchema,
  })
  .superRefine(fpsRangeRefinement);

export const baselineFixtureFileSchema = z.object({
  contractVersion: perf1ContractVersionSchema,
  dataVersion: z.string().min(1),
  description: z.string().optional(),
  rows: z.array(baselineFixtureRowSchema),
});

export const cinebenchFixtureRowSchema = z.object({
  cpuId: cpuIdSchema,
  workloadId: workloadIdSchema,
  metric: workloadMetricSchema,
  score: z.number(),
  confidence: estimateConfidenceSchema,
  dataVersion: z.string().min(1),
  basis: z.string().min(1),
});

export const cinebenchFixtureFileSchema = z.object({
  contractVersion: perf1ContractVersionSchema,
  dataVersion: z.string().min(1),
  description: z.string().optional(),
  rows: z.array(cinebenchFixtureRowSchema),
});

export const correctionExampleSchema = z.object({
  note: z.string().optional(),
  query: baselineQuerySchema,
  correction: correctionInputSchema,
  result: correctionResultSchema,
});

export const correctionExamplesFileSchema = z.object({
  contractVersion: perf1ContractVersionSchema,
  dataVersion: z.string().min(1),
  description: z.string().optional(),
  examples: z.array(correctionExampleSchema),
});

const unavailableBaselineExampleSchema = z.object({
  note: z.string().optional(),
  query: z
    .object({
      cpuId: z.string().min(1),
      gpuId: z.string().min(1),
      gameId: z.string().min(1),
      presetId: z.string().min(1),
      resolution: z.string().min(1),
      upscaleId: z.string().min(1),
      frameGenId: z.string().min(1),
      ramTierId: z.string().min(1),
      powerProfileId: z.string().min(1),
    })
    .passthrough(),
  result: unavailableResultSchema,
});

const unavailableWorkloadExampleSchema = z.object({
  note: z.string().optional(),
  query: z
    .object({
      cpuId: z.string().min(1),
      workloadId: z.string().min(1),
      metric: z.string().min(1),
    })
    .passthrough(),
  result: unavailableResultSchema,
});

export const unavailableExampleSchema = z.union([
  unavailableBaselineExampleSchema,
  unavailableWorkloadExampleSchema,
]);

export const unavailableExamplesFileSchema = z.object({
  contractVersion: perf1ContractVersionSchema,
  dataVersion: z.string().min(1),
  description: z.string().optional(),
  examples: z.array(unavailableExampleSchema),
});

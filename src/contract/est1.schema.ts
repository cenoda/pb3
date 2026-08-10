/**
 * Zod schemas for est1 estimator contract.
 * Authority: docs/phases/phase-4.1/specs/estimator-data-contract.md
 */
import { z } from "zod";
import { EST1_CONTRACT_VERSION } from "./est1";

export const est1ContractVersionSchema = z.literal(EST1_CONTRACT_VERSION);

export const estimatorResolutionSchema = z.enum(["1080p", "1440p", "4k"]);
export const rayTracingStateSchema = z.enum(["off", "on", "partial"]);

export const estimatorMethodSchema = z.enum([
  "exact-aggregate",
  "vendor-anchor",
  "scaled-combination",
]);

export const estimatorContributorRoleSchema = z.enum([
  "primary-anchor",
  "exact-observation",
  "scale-edge",
  "review-validation",
]);

export const estimatorRefKindSchema = z.enum([
  "prov4-observation",
  "prov4-aggregate",
  "vendor-anchor",
  "cpu-scale-edge",
]);

export const estimatorUnavailableReasonSchema = z.enum([
  "no_candidates",
  "missing_scale_edge",
  "comparability_failed",
  "range_too_wide",
  "rights_denied",
  "validation_failed",
  "policy_block",
]);

export const estimatorQuerySchema = z.object({
  cpuId: z.literal("cpu.amd-ryzen-5-7600"),
  gpuId: z.literal("gpu.asus-dual-rtx4070-o12g"),
  gameId: z.literal("game.cyberpunk-2077"),
  presetId: z.literal("preset.raster-ultra"),
  resolution: estimatorResolutionSchema,
  upscaleId: z.literal("upscale.off"),
  frameGenId: z.literal("framegen.off"),
  rayTracingState: z.literal("off"),
  ramTierId: z.literal("ram.32gb-ddr5"),
  powerProfileId: z.literal("power.default"),
});

export const cpuScaleEdgeSchema = z
  .object({
    edgeId: z.string().min(1),
    fromCpuId: z.string().min(1),
    toCpuId: z.string().min(1),
    resolution: estimatorResolutionSchema.optional(),
    gameId: z.string().min(1).optional(),
    factor: z.number().finite().positive(),
    uncertainty: z.number().finite().nonnegative(),
    sourceIds: z.array(z.string().min(1)).min(1),
    basis: z.string().min(1),
    dataVersion: z.string().min(1),
  })
  .strict();

export const cpuScaleEdgeFileSchema = z
  .object({
    estimatorContractVersion: est1ContractVersionSchema,
    dataVersion: z.string().min(1),
    edges: z.array(cpuScaleEdgeSchema),
  })
  .strict()
  .superRefine((file, ctx) => {
    const seen = new Set<string>();
    for (const edge of file.edges) {
      if (seen.has(edge.edgeId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate edgeId: ${edge.edgeId}`,
          path: ["edges"],
        });
      }
      seen.add(edge.edgeId);
    }
  });

export const vendorPerformanceAnchorSchema = z
  .object({
    anchorId: z.string().min(1),
    sourceId: z.string().min(1),
    sourceUrl: z.string().min(1),
    publishedAt: z.string().min(1),
    accessedAt: z.string().min(1),
    cpuId: z.string().min(1).optional(),
    gpuId: z.string().min(1),
    gameId: z.string().min(1),
    presetId: z.string().min(1).optional(),
    exactSettings: z.string().min(1),
    resolution: estimatorResolutionSchema,
    upscaleId: z.string().min(1),
    frameGenId: z.string().min(1),
    rayTracingState: rayTracingStateSchema,
    fpsAverage: z.number().finite().positive().optional(),
    fpsRangeMin: z.number().finite().positive().optional(),
    fpsRangeMax: z.number().finite().positive().optional(),
    testSystem: z.string().min(1),
    sampleNotes: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((anchor, ctx) => {
    const hasAvg = anchor.fpsAverage !== undefined;
    const hasRange =
      anchor.fpsRangeMin !== undefined && anchor.fpsRangeMax !== undefined;
    if (!hasAvg && !hasRange) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vendor anchor must include fpsAverage and/or fps range",
        path: ["fpsAverage"],
      });
    }
    if (
      anchor.fpsRangeMin !== undefined &&
      anchor.fpsRangeMax !== undefined &&
      !(anchor.fpsRangeMin < anchor.fpsRangeMax)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fpsRangeMin must be < fpsRangeMax",
        path: ["fpsRangeMin"],
      });
    }
  });

export const vendorPerformanceAnchorFileSchema = z
  .object({
    estimatorContractVersion: est1ContractVersionSchema,
    dataVersion: z.string().min(1),
    anchors: z.array(vendorPerformanceAnchorSchema),
  })
  .strict()
  .superRefine((file, ctx) => {
    const seen = new Set<string>();
    for (const anchor of file.anchors) {
      if (seen.has(anchor.anchorId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate anchorId: ${anchor.anchorId}`,
          path: ["anchors"],
        });
      }
      seen.add(anchor.anchorId);
    }
  });

export const estimatorContributorSchema = z.object({
  role: estimatorContributorRoleSchema,
  refKind: estimatorRefKindSchema,
  refId: z.string().min(1),
});

export const estimatorExclusionReasonSchema = z.object({
  code: z.string().min(1),
  detail: z.string().min(1),
});

export const combinationEstimateSchema = z
  .object({
    status: z.literal("estimated"),
    estimatorContractVersion: est1ContractVersionSchema,
    query: estimatorQuerySchema,
    fpsMin: z.number().finite(),
    fpsMax: z.number().finite(),
    fpsAverage: z.number().finite(),
    confidence: z.enum(["low", "medium"]),
    method: estimatorMethodSchema,
    basis: z.string().min(1),
    draftCaveat: z.string().min(1),
    contributors: z.array(estimatorContributorSchema),
    exclusionReasons: z.array(estimatorExclusionReasonSchema),
    dataVersion: z.string().min(1),
  })
  .strict()
  .superRefine((est, ctx) => {
    if (!(est.fpsMin < est.fpsMax)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fpsMin must be strictly less than fpsMax",
        path: ["fpsMin"],
      });
    }
    if (!(est.fpsMin <= est.fpsAverage && est.fpsAverage <= est.fpsMax)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fpsAverage must satisfy fpsMin ≤ fpsAverage ≤ fpsMax",
        path: ["fpsAverage"],
      });
    }
    if (est.method === "scaled-combination" && est.confidence !== "low") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "scaled-combination confidence must be low (O5)",
        path: ["confidence"],
      });
    }
  });

export const combinationEstimateUnavailableSchema = z
  .object({
    status: z.literal("unavailable"),
    estimatorContractVersion: est1ContractVersionSchema,
    query: estimatorQuerySchema,
    reason: estimatorUnavailableReasonSchema,
    explanation: z.string().min(1),
    exclusionReasons: z.array(estimatorExclusionReasonSchema),
    dataVersion: z.string().min(1),
    draftCaveat: z.string().min(1),
  })
  .strict();

export const combinationEstimateResultSchema = z.union([
  combinationEstimateSchema,
  combinationEstimateUnavailableSchema,
]);

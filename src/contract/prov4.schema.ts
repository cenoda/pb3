/**
 * Phase-4 provenance Zod schemas (`prov4`).
 * Authority: docs/phases/phase-4/specs/provenance-data-contract.md
 */
import { z } from "zod";
import { estimateConfidenceSchema } from "./vs0.schema";
import { physicalModelGradeSchema } from "./phys3.schema";
import { PROV4_CONTRACT_VERSION } from "./prov4";

export const prov4ContractVersionSchema = z.literal(PROV4_CONTRACT_VERSION);

// --- Shared primitives ---

const nonEmptyString = z.string().min(1);

/** Lowercase hex SHA-256 (exactly 64 chars). */
export const sha256HexSchema = z
  .string()
  .regex(/^[0-9a-f]{64}$/, "sha256 must be 64 lowercase hex characters");

export const freshnessPolicySchema = z.object({
  maxAgeDays: z.number().int().nonnegative().optional(),
});

export const freshnessInputSchema = z.object({
  asOf: z.string().optional(),
  policy: freshnessPolicySchema,
  nowIso: nonEmptyString,
});

export const freshnessResultSchema = z.object({
  state: z.enum(["current", "stale", "unknown"]),
  ageDays: z.number().optional(),
  explanation: nonEmptyString,
});

export const metricUnavailableSchema = z.object({
  status: z.literal("unavailable"),
  reason: nonEmptyString,
});

export const rawArtifactReferenceSchema = z.object({
  kind: z.enum(["repo-file", "content-addressed", "lab-archive"]),
  locator: nonEmptyString,
  sha256: sha256HexSchema,
  mediaType: nonEmptyString,
  byteLength: z.number().int().positive(),
});

export const frametimeDistributionSummarySchema = z
  .object({
    sampleCount: z.number().int().positive(),
    p50Ms: z.number().finite().positive(),
    p95Ms: z.number().finite().positive(),
    p99Ms: z.number().finite().positive(),
  })
  .superRefine((s, ctx) => {
    if (!(s.p50Ms <= s.p95Ms && s.p95Ms <= s.p99Ms)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "frametime percentiles must satisfy p50Ms ≤ p95Ms ≤ p99Ms",
      });
    }
  });

const frametimeAvailableSchema = z.discriminatedUnion("representation", [
  z.object({
    status: z.literal("available"),
    representation: z.literal("summary"),
    summary: frametimeDistributionSummarySchema,
  }),
  z.object({
    status: z.literal("available"),
    representation: z.literal("raw-artifact"),
    artifact: rawArtifactReferenceSchema,
  }),
  z.object({
    status: z.literal("available"),
    representation: z.literal("summary-and-raw"),
    summary: frametimeDistributionSummarySchema,
    artifact: rawArtifactReferenceSchema,
  }),
]);

export const frametimeEvidenceSchema = z.union([
  frametimeAvailableSchema,
  metricUnavailableSchema,
]);

const numberOrUnavailable = z.union([
  z.number().finite(),
  metricUnavailableSchema,
]);

export const performanceMeasurementSchema = z.discriminatedUnion("metricKind", [
  z.object({
    metricKind: z.literal("first-party-measured"),
    fpsMin: z.number().finite(),
    fpsMax: z.number().finite(),
    fpsAverage: z.number().finite(),
    fpsOnePercentLow: z.number().finite(),
    frametime: frametimeAvailableSchema,
  }),
  z.object({
    metricKind: z.literal("synthetic-stub"),
    fpsMin: z.number().finite(),
    fpsMax: z.number().finite(),
    fpsAverage: metricUnavailableSchema,
    fpsOnePercentLow: metricUnavailableSchema,
    frametime: metricUnavailableSchema,
  }),
  z.object({
    metricKind: z.literal("external-review"),
    fpsMin: z.number().finite(),
    fpsMax: z.number().finite(),
    fpsAverage: numberOrUnavailable,
    fpsOnePercentLow: numberOrUnavailable,
    frametime: frametimeEvidenceSchema,
  }),
  z.object({
    metricKind: z.literal("external-aggregated"),
    fpsMin: z.number().finite(),
    fpsMax: z.number().finite(),
    fpsAverage: z.number().finite(),
    fpsOnePercentLow: metricUnavailableSchema,
    frametime: metricUnavailableSchema,
  }),
]);

export const rangeDerivationMethodSchema = z.enum([
  "repeated-run-min-max",
  "repeated-run-mean-pm-band",
  "imported-review-stated-range",
  "external-aggregated-weighted-percentiles",
  "external-aggregated-two-source-range",
  "synthetic-fixture-range",
]);

export const sourceMethodQualitySchema = z.enum([
  "tier-a-reviewed",
  "tier-b-reviewed",
  "manufacturer",
]);

export const conditionCompletenessSchema = z.enum([
  "full-disclosed",
  "partial-disclosed",
  "minimal",
]);

export const recencyClassSchema = z.enum(["current", "recent", "aged"]);

export const rayTracingStateSchema = z.enum(["off", "on", "partial"]);

export const observationWeightingSchema = z.object({
  sourceMethodQuality: sourceMethodQualitySchema,
  conditionCompleteness: conditionCompletenessSchema,
  recencyClass: recencyClassSchema,
});

export const observationExclusionReasonSchema = z.enum([
  "cpu_mismatch",
  "gpu_mismatch",
  "game_mismatch",
  "preset_mismatch",
  "resolution_mismatch",
  "upscale_mismatch",
  "framegen_mismatch",
  "ray_tracing_mismatch",
  "settings_mismatch",
  "duplicate_source",
  "source_rights_denied",
]);

export const observationExclusionSchema = z.object({
  observationId: nonEmptyString,
  reason: observationExclusionReasonSchema,
  detail: nonEmptyString,
});

export const externalPerformanceObservationSchema = z
  .object({
    observationId: nonEmptyString,
    sourceId: nonEmptyString,
    sourceUrl: nonEmptyString,
    publishedAt: nonEmptyString,
    accessedAt: nonEmptyString,
    cpuId: nonEmptyString,
    gpuId: nonEmptyString,
    gameId: nonEmptyString,
    gamePatchVersion: nonEmptyString.optional(),
    presetId: nonEmptyString,
    exactSettings: nonEmptyString,
    resolution: z.enum(["1080p", "1440p", "4k"]),
    upscaleId: nonEmptyString,
    frameGenId: nonEmptyString,
    rayTracingState: rayTracingStateSchema,
    fpsAverage: z.number().finite().positive().optional(),
    fpsRangeMin: z.number().finite().positive().optional(),
    fpsRangeMax: z.number().finite().positive().optional(),
    fpsOnePercentLow: numberOrUnavailable.optional(),
    frametime: frametimeEvidenceSchema.optional(),
    testSystem: nonEmptyString,
    driverVersion: nonEmptyString.optional(),
    sampleNotes: nonEmptyString.optional(),
    weighting: observationWeightingSchema,
  })
  .superRefine((obs, ctx) => {
    if (
      obs.fpsRangeMin !== undefined &&
      obs.fpsRangeMax !== undefined &&
      !(obs.fpsRangeMin < obs.fpsRangeMax)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fpsRangeMin must be strictly less than fpsRangeMax",
        path: ["fpsRangeMin"],
      });
    }
  });

export const externalPerformanceObservationsFileSchema = z
  .object({
    provenanceContractVersion: prov4ContractVersionSchema,
    dataVersion: nonEmptyString,
    observations: z.array(externalPerformanceObservationSchema),
  })
  .superRefine((file, ctx) => {
    const ids = file.observations.map((o) => o.observationId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "duplicate observationId in external observations file",
      });
    }
  });

export const performanceCaptureConditionsSchema = z.object({
  protocolId: nonEmptyString,
  protocolVersion: nonEmptyString,
  runCount: z.number().int().nonnegative(),
  rangeDerivation: rangeDerivationMethodSchema,
  gamePatchVersion: nonEmptyString,
  gpuDriverVersion: nonEmptyString,
  toolName: nonEmptyString,
  toolVersion: nonEmptyString,
  graphicsSettings: z.object({
    presetId: z.literal("preset.raster-ultra"),
    exactSettings: nonEmptyString,
  }),
  powerThermal: z.object({
    cpuPowerLimitId: z.enum(["cpu-power.default", "cpu-power.reduced"]),
    gpuPowerLimitId: z.enum(["gpu-power.default", "gpu-power.reduced"]),
    conditions: nonEmptyString,
  }),
  /**
   * Optional: first-party / high rows must supply it (superRefine).
   * External aggregates must omit it — no invented raw capture.
   */
  rawArtifact: rawArtifactReferenceSchema.optional(),
});

export const pilotBaselineKeySchema = z.object({
  cpuId: z.literal("cpu.amd-ryzen-5-7600"),
  gpuId: z.literal("gpu.asus-dual-rtx4070-o12g"),
  gameId: z.literal("game.cyberpunk-2077"),
  presetId: z.literal("preset.raster-ultra"),
  resolution: z.enum(["1080p", "1440p", "4k"]),
  upscaleId: z.literal("upscale.off"),
  frameGenId: z.literal("framegen.off"),
  ramTierId: z.literal("ram.32gb-ddr5"),
  powerProfileId: z.literal("power.default"),
});

export const pilotBuildPartIdsSchema = z.object({
  caseId: z.literal("case.fractal-design-north-tg-dark"),
  motherboardId: z.literal("motherboard.gigabyte-b650-aorus-elite-ax-v2"),
  cpuId: z.literal("cpu.amd-ryzen-5-7600"),
  gpuId: z.literal("gpu.asus-dual-rtx4070-o12g"),
  coolerId: z.literal("cooler.noctua-nh-d15-g2"),
  ramId: z.literal("ram.teamgroup-t-create-expert-ddr5-6000-32gb"),
  psuId: z.literal("psu.corsair-rm750e"),
});

const limitingFactorSchema = z.object({
  category: z.enum([
    "GPU-bound",
    "CPU-bound",
    "VRAM pressure",
    "power limit",
    "RAM-bound",
  ]),
  explanation: nonEmptyString,
});

const HIGH_RANGE_DERIVATIONS = new Set([
  "repeated-run-min-max",
  "repeated-run-mean-pm-band",
]);

/**
 * Single-record performance evidence schema with metricKind / confidence /
 * captureConditions / first-party runCount≥2 / high-gate structural rules.
 */
export const performanceEvidenceRecordSchema = z
  .object({
    provenanceContractVersion: prov4ContractVersionSchema,
    evidenceId: nonEmptyString,
    key: pilotBaselineKeySchema,
    buildPartIds: pilotBuildPartIdsSchema,
    measurement: performanceMeasurementSchema,
    confidence: estimateConfidenceSchema,
    dataVersion: nonEmptyString,
    basis: nonEmptyString,
    sourceIds: z.array(nonEmptyString).min(1),
    capturedAt: nonEmptyString,
    freshnessPolicy: freshnessPolicySchema,
    captureConditions: performanceCaptureConditionsSchema.optional(),
    verificationId: nonEmptyString.optional(),
    limitingFactor: limitingFactorSchema.optional(),
  })
  .superRefine((row, ctx) => {
    const { measurement, confidence, captureConditions, verificationId, key } =
      row;

    if (!(measurement.fpsMin < measurement.fpsMax)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fpsMin must be strictly less than fpsMax",
        path: ["measurement", "fpsMin"],
      });
    }

    // stub ↔ synthetic-stub coupling
    if (confidence === "stub") {
      if (measurement.metricKind !== "synthetic-stub") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'confidence "stub" requires metricKind "synthetic-stub"',
          path: ["measurement", "metricKind"],
        });
      }
      if (captureConditions !== undefined) {
        if (captureConditions.rangeDerivation !== "synthetic-fixture-range") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "synthetic-stub optional captureConditions must use synthetic-fixture-range",
            path: ["captureConditions", "rangeDerivation"],
          });
        }
      }
    }

    if (measurement.metricKind === "synthetic-stub" && confidence !== "stub") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'metricKind "synthetic-stub" requires confidence "stub"',
        path: ["confidence"],
      });
    }

    // Non-stub confidence requires complete captureConditions
    if (
      confidence === "low" ||
      confidence === "medium" ||
      confidence === "high"
    ) {
      if (!captureConditions) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `confidence "${confidence}" requires complete captureConditions`,
          path: ["captureConditions"],
        });
      }
    }

    // first-party-measured: charter ordering + runCount >= 2 at every confidence
    if (measurement.metricKind === "first-party-measured") {
      if (!captureConditions) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "first-party-measured requires captureConditions with runCount >= 2",
          path: ["captureConditions"],
        });
      } else if (!captureConditions.rawArtifact) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "first-party-measured requires captureConditions.rawArtifact",
          path: ["captureConditions", "rawArtifact"],
        });
      } else if (captureConditions.runCount < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "first-party-measured requires captureConditions.runCount >= 2 (reject 0 and 1)",
          path: ["captureConditions", "runCount"],
        });
      }

      if (!(
        measurement.fpsMin <= measurement.fpsAverage &&
        measurement.fpsAverage <= measurement.fpsMax
      )) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "first-party-measured requires fpsMin ≤ fpsAverage ≤ fpsMax",
          path: ["measurement", "fpsAverage"],
        });
      }
      if (!(measurement.fpsOnePercentLow <= measurement.fpsAverage)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "first-party-measured requires fpsOnePercentLow ≤ fpsAverage",
          path: ["measurement", "fpsOnePercentLow"],
        });
      }

      if (confidence === "stub" || confidence === "none") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'first-party-measured cannot use confidence "stub" or "none"',
          path: ["confidence"],
        });
      }
    }

    // external-review cannot claim high
    if (
      (measurement.metricKind === "external-review" ||
        measurement.metricKind === "external-aggregated") &&
      confidence === "high"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'external-review and external-aggregated cannot declare confidence "high"',
        path: ["confidence"],
      });
    }

    if (measurement.metricKind === "external-aggregated") {
      if (confidence !== "low" && confidence !== "medium") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'external-aggregated requires confidence "low" or "medium"',
          path: ["confidence"],
        });
      }
      if (!(
        measurement.fpsMin <= measurement.fpsAverage &&
        measurement.fpsAverage <= measurement.fpsMax
      )) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "external-aggregated requires fpsMin ≤ fpsAverage ≤ fpsMax",
          path: ["measurement", "fpsAverage"],
        });
      }
      if (measurement.fpsOnePercentLow.status !== "unavailable") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "external-aggregated charter 1% low must be explicit unavailable",
          path: ["measurement", "fpsOnePercentLow"],
        });
      }
      if (measurement.frametime.status !== "unavailable") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "external-aggregated charter frametime must be explicit unavailable",
          path: ["measurement", "frametime"],
        });
      }
      // External aggregates have no first-party raw capture; inventing one is forbidden.
      if (captureConditions?.rawArtifact !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "external-aggregated must not claim captureConditions.rawArtifact",
          path: ["captureConditions", "rawArtifact"],
        });
      }
    }

    // High gate (structural; registry/digest cross-checks are integrity/binding)
    if (confidence === "high") {
      if (measurement.metricKind !== "first-party-measured") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'confidence "high" requires metricKind "first-party-measured"',
          path: ["measurement", "metricKind"],
        });
      }
      if (!verificationId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'confidence "high" requires verificationId',
          path: ["verificationId"],
        });
      }
      if (captureConditions) {
        if (!captureConditions.rawArtifact) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'confidence "high" requires captureConditions.rawArtifact',
            path: ["captureConditions", "rawArtifact"],
          });
        }
        if (!HIGH_RANGE_DERIVATIONS.has(captureConditions.rangeDerivation)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'confidence "high" requires rangeDerivation repeated-run-min-max or repeated-run-mean-pm-band',
            path: ["captureConditions", "rangeDerivation"],
          });
        }
        // Pilot power.default → both limits *.default (M0 has no correction cells)
        if (key.powerProfileId === "power.default") {
          if (
            captureConditions.powerThermal.cpuPowerLimitId !==
              "cpu-power.default" ||
            captureConditions.powerThermal.gpuPowerLimitId !==
              "gpu-power.default"
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                "pilot power.default requires cpu/gpu power limits *.default",
              path: ["captureConditions", "powerThermal"],
            });
          }
        }
      }
    }
  });

export const performanceEvidenceFileSchema = z
  .object({
    provenanceContractVersion: prov4ContractVersionSchema,
    dataVersion: nonEmptyString,
    rows: z.array(performanceEvidenceRecordSchema),
  })
  .superRefine((file, ctx) => {
    const ids = file.rows.map((r) => r.evidenceId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "duplicate evidenceId in performance evidence file",
      });
    }
    const resolutions = file.rows.map((r) => r.key.resolution);
    if (file.rows.length > 0) {
      const expected = ["1080p", "1440p", "4k"] as const;
      if (file.rows.length !== 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `pilot performance file must contain exactly 3 rows (got ${file.rows.length})`,
        });
      }
      for (const res of expected) {
        const count = resolutions.filter((r) => r === res).length;
        if (count !== 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `pilot performance file must have exactly one row for ${res} (got ${count})`,
          });
        }
      }
    }
  });

// --- Source registry ---

export const evidenceSourceClassSchema = z.enum([
  "first-party",
  "project-synthetic",
  "external-review",
  "manufacturer-spec",
]);

export const evidenceRightsClassSchema = z.enum([
  "apache-2.0-project",
  "public-spec",
  "fair-use-citation",
  "licensed",
  "unavailable",
]);

export const sourceRightsDecisionSchema = z.enum([
  "approved",
  "approved-metadata-only",
  "excluded",
]);

export const sourceRightsRecordEntrySchema = z.object({
  sourceId: nonEmptyString,
  publisher: nonEmptyString,
  canonicalUrl: nonEmptyString,
  accessFindings: nonEmptyString,
  robotsTermsFindings: nonEmptyString,
  citationRights: evidenceRightsClassSchema,
  storeExtractedObservation: z.boolean(),
  decision: sourceRightsDecisionSchema,
  notes: nonEmptyString.optional(),
});

export const sourceRightsRecordFileSchema = z
  .object({
    provenanceContractVersion: prov4ContractVersionSchema,
    recordVersion: nonEmptyString,
    reviewedAt: nonEmptyString,
    reviewerLabel: nonEmptyString,
    decisions: z.array(sourceRightsRecordEntrySchema),
  })
  .superRefine((file, ctx) => {
    const ids = file.decisions.map((d) => d.sourceId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "duplicate sourceId in source rights record",
      });
    }
  });

export const evidenceSourceSchema = z
  .object({
    sourceId: nonEmptyString,
    sourceClass: evidenceSourceClassSchema,
    rightsClass: evidenceRightsClassSchema,
    title: nonEmptyString,
    origin: nonEmptyString,
    citation: nonEmptyString.optional(),
    publishedAt: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((src, ctx) => {
    if (src.sourceClass === "external-review") {
      if (!src.citation || src.citation.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "external-review requires non-empty citation",
          path: ["citation"],
        });
      }
    }
    if (
      src.sourceClass === "project-synthetic" &&
      src.rightsClass !== "apache-2.0-project"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'project-synthetic must use rightsClass "apache-2.0-project"',
        path: ["rightsClass"],
      });
    }
  });

export const evidenceSourceRegistryFileSchema = z
  .object({
    provenanceContractVersion: prov4ContractVersionSchema,
    registryVersion: nonEmptyString,
    sources: z.array(evidenceSourceSchema),
  })
  .superRefine((file, ctx) => {
    const ids = file.sources.map((s) => s.sourceId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "duplicate sourceId in evidence source registry",
      });
    }
  });

// --- Human verification ---

export const verificationKindSchema = z.enum([
  "performance-capture-attestation",
  "geometry-dimension-check",
  "geometry-mount-check",
]);

export const verificationVerdictSchema = z.enum(["pass", "fail", "incomplete"]);

export const humanVerificationRecordSchema = z
  .object({
    verificationId: nonEmptyString,
    kind: verificationKindSchema,
    verdict: verificationVerdictSchema,
    reviewedAt: nonEmptyString,
    reviewerLabel: nonEmptyString,
    checklist: z.array(nonEmptyString),
    sourceIds: z.array(nonEmptyString),
    attestedArtifactDigests: z.array(sha256HexSchema).optional(),
    notes: z.string().optional(),
  })
  .superRefine((rec, ctx) => {
    if (rec.verdict === "pass") {
      if (rec.checklist.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'verdict "pass" requires non-empty checklist',
          path: ["checklist"],
        });
      }
      if (rec.sourceIds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'verdict "pass" requires at least one sourceId',
          path: ["sourceIds"],
        });
      }
    }
    if (
      rec.kind === "performance-capture-attestation" &&
      rec.verdict === "pass"
    ) {
      if (
        !rec.attestedArtifactDigests ||
        rec.attestedArtifactDigests.length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "pass performance-capture-attestation requires non-empty attestedArtifactDigests",
          path: ["attestedArtifactDigests"],
        });
      }
    }
  });

export const humanVerificationFileSchema = z
  .object({
    provenanceContractVersion: prov4ContractVersionSchema,
    records: z.array(humanVerificationRecordSchema),
  })
  .superRefine((file, ctx) => {
    const ids = file.records.map((r) => r.verificationId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "duplicate verificationId in human verification file",
      });
    }
  });

/**
 * Cross-check that a high-confidence performance row's verification attests
 * the capture (and frametime) artifact digests. Used by integrity tests and
 * binders; not a standalone Zod object schema.
 */
export function highGateDigestsIncludeCapture(
  record: z.infer<typeof performanceEvidenceRecordSchema>,
  verification: z.infer<typeof humanVerificationRecordSchema>,
): boolean {
  if (record.confidence !== "high") return true;
  if (!record.captureConditions?.rawArtifact) return false;
  if (verification.kind !== "performance-capture-attestation") return false;
  if (verification.verdict !== "pass") return false;
  const digests = new Set(verification.attestedArtifactDigests ?? []);
  if (!digests.has(record.captureConditions.rawArtifact.sha256)) return false;
  const ft = record.measurement.frametime;
  if (
    ft.status === "available" &&
    (ft.representation === "raw-artifact" ||
      ft.representation === "summary-and-raw")
  ) {
    if (!digests.has(ft.artifact.sha256)) return false;
  }
  return true;
}

// --- Geometry ---

export const measuredDimensionSchema = z.object({
  label: nonEmptyString,
  valueMm: z.number().finite(),
  toleranceMm: z.number().finite().optional(),
});

export const geometryEvidenceRecordSchema = z
  .object({
    provenanceContractVersion: prov4ContractVersionSchema,
    evidenceId: nonEmptyString,
    partId: nonEmptyString,
    phys3EvidenceSourceId: nonEmptyString,
    modelGrade: physicalModelGradeSchema,
    geometryDataVersion: nonEmptyString,
    sourceIds: z.array(nonEmptyString).min(1),
    reviewedAt: nonEmptyString,
    freshnessPolicy: freshnessPolicySchema,
    verificationId: nonEmptyString.optional(),
    basis: nonEmptyString,
    measuredDimensionsMm: z.array(measuredDimensionSchema).optional(),
  })
  .superRefine((row, ctx) => {
    if (
      (row.modelGrade === "Community" || row.modelGrade === "Verified") &&
      !row.verificationId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `modelGrade "${row.modelGrade}" requires verificationId`,
        path: ["verificationId"],
      });
    }
  });

export const geometryEvidenceFileSchema = z
  .object({
    provenanceContractVersion: prov4ContractVersionSchema,
    dataVersion: nonEmptyString,
    rows: z.array(geometryEvidenceRecordSchema),
  })
  .superRefine((file, ctx) => {
    const evidenceIds = file.rows.map((r) => r.evidenceId);
    if (new Set(evidenceIds).size !== evidenceIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "duplicate evidenceId in geometry evidence file",
      });
    }
    const phys3Ids = file.rows.map((r) => r.phys3EvidenceSourceId);
    if (new Set(phys3Ids).size !== phys3Ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "duplicate phys3EvidenceSourceId in geometry evidence file",
      });
    }
    const composites = file.rows.map(
      (r) => `${r.partId}\0${r.geometryDataVersion}`,
    );
    if (new Set(composites).size !== composites.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "duplicate (partId, geometryDataVersion) in geometry evidence file",
      });
    }
  });

// --- Cooling ---

export const coolingEvidenceProvenanceSchema = z.object({
  provenanceContractVersion: prov4ContractVersionSchema,
  evidenceSourceId: nonEmptyString,
  sourceIds: z.array(nonEmptyString).min(1),
  capturedAt: nonEmptyString,
  freshnessPolicy: freshnessPolicySchema,
  verificationId: nonEmptyString.optional(),
  basis: nonEmptyString,
});

export const coolingProvenanceFileSchema = z.object({
  provenanceContractVersion: prov4ContractVersionSchema,
  dataVersion: nonEmptyString,
  rows: z.array(coolingEvidenceProvenanceSchema),
});

// --- Binding result shapes (runtime / unit tests) ---

export const performanceEvidenceBindingSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("bound"),
    evidence: performanceEvidenceRecordSchema,
    freshness: freshnessResultSchema,
    sources: z.array(evidenceSourceSchema),
    verification: humanVerificationRecordSchema.optional(),
  }),
  z.object({
    status: z.literal("unavailable"),
    reason: z.enum([
      "not_pilot_key",
      "missing_evidence_row",
      "missing_source",
      "incomplete_capture_conditions",
      "incomplete_charter_metrics",
      "raw_artifact_integrity_failed",
      "confidence_ceiling_violation",
      "verification_required",
      "verification_failed",
      "stale_withheld",
    ]),
    explanation: nonEmptyString,
  }),
]);

export const geometryEvidenceBindingSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("bound"),
    evidence: geometryEvidenceRecordSchema,
    freshness: freshnessResultSchema,
    sources: z.array(evidenceSourceSchema),
    verification: humanVerificationRecordSchema.optional(),
  }),
  z.object({
    status: z.literal("unavailable"),
    partId: nonEmptyString,
    reason: z.enum([
      "not_pilot_part",
      "missing_physical_spec",
      "missing_evidence_row",
      "missing_source",
      "grade_ceiling_violation",
      "verification_required",
      "phys3_ref_mismatch",
    ]),
    explanation: nonEmptyString,
  }),
]);

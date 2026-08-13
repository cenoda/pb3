/**
 * Phase-7.1 ingest sidecar Zod schemas (`ing7`).
 * Authority: docs/phases/phase-7.1/specs/phase-7.1.md §12.
 */

import { z } from "zod";
import { ING7_CONTRACT_VERSION } from "./ing7";
import { evidenceRightsClassSchema, sha256HexSchema } from "./prov4.schema";

export { sha256HexSchema };

const nonEmptyString = z.string().min(1);

export const ing7ContractVersionSchema = z.literal(ING7_CONTRACT_VERSION);

export const iso8601DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be ISO-8601 date (YYYY-MM-DD)")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), {
    message: "must be a valid calendar date",
  });

export const ingestStageSchema = z.enum([
  "candidate",
  "fetched",
  "normalized",
  "sku-exact",
  "sku-ambiguous",
  "sku-unavailable",
  "review-candidate",
  "rights-reviewed",
  "rights-rejected",
  "owner-approved",
  "owner-rejected",
  "fetch-failed",
  "normalize-failed",
  "shipped",
]);

export const ingestSourceKindSchema = z.enum([
  "manufacturer-spec-page",
  "manufacturer-image-page",
  "licensed-still",
  "domestic-street-price",
]);

export const skuMatchVerdictSchema = z.enum([
  "exact",
  "ambiguous",
  "unavailable",
]);

export const rightsDraftDecisionSchema = z.enum([
  "pending",
  "rejected",
  "approved-metadata-only",
]);

export const recommendedDecisionSchema = z.union([
  rightsDraftDecisionSchema,
  z.literal("approved"),
]);

export const variantAxisSchema = z.enum([
  "boxed-tray",
  "region",
  "revision",
  "capacity",
  "color",
  "generation",
  "model",
]);

export const skuMatchedBySchema = z.enum([
  "partNumber",
  "modelNumber",
  "canonicalSku",
]);

export const ingestCandidateSchema = z.object({
  contractVersion: ing7ContractVersionSchema,
  candidateId: nonEmptyString,
  stage: z.literal("candidate"),
  sourceKind: ingestSourceKindSchema,
  intendedPartId: nonEmptyString.optional(),
  canonicalUrl: nonEmptyString,
  fetchUrl: nonEmptyString.optional(),
  createdAt: iso8601DateSchema,
});

export const ingestFetchedSchema = z
  .object({
    contractVersion: ing7ContractVersionSchema,
    candidateId: nonEmptyString,
    stage: z.enum(["fetched", "fetch-failed"]),
    canonicalUrl: nonEmptyString,
    retrievedAt: iso8601DateSchema,
    httpStatus: z.number().int().optional(),
    contentType: nonEmptyString.optional(),
    sha256: sha256HexSchema.optional(),
    bytesPath: nonEmptyString.optional(),
    error: nonEmptyString.optional(),
  })
  .superRefine((row, ctx) => {
    if (row.stage === "fetched") {
      if (!row.sha256) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "fetched records require sha256",
          path: ["sha256"],
        });
      }
      if (!row.bytesPath) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "fetched records require bytesPath",
          path: ["bytesPath"],
        });
      }
    }
    if (row.stage === "fetch-failed" && !row.error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fetch-failed records require error",
        path: ["error"],
      });
    }
  });

export const normalizedIdentitySchema = z.object({
  manufacturer: nonEmptyString.optional(),
  modelName: nonEmptyString.optional(),
  partNumbers: z.array(nonEmptyString),
  variantTokens: z.array(nonEmptyString),
});

export const ingestNormalizedSchema = z.object({
  contractVersion: ing7ContractVersionSchema,
  candidateId: nonEmptyString,
  stage: z.enum(["normalized", "normalize-failed"]),
  sourceKind: ingestSourceKindSchema,
  inputSha256: sha256HexSchema,
  identity: normalizedIdentitySchema,
  extractedFields: z.record(z.unknown()),
  rawQuotes: z.array(z.string()),
  error: nonEmptyString.optional(),
});

export const skuMatchRecordSchema = z
  .object({
    contractVersion: ing7ContractVersionSchema,
    candidateId: nonEmptyString,
    stage: z.enum([
      "sku-exact",
      "sku-ambiguous",
      "sku-unavailable",
      "review-candidate",
    ]),
    verdict: skuMatchVerdictSchema,
    matchedPartId: nonEmptyString.optional(),
    matchedBy: skuMatchedBySchema.optional(),
    evidence: nonEmptyString,
    variantConflicts: z.array(variantAxisSchema),
    rejectedPartIds: z.array(nonEmptyString),
  })
  .superRefine((row, ctx) => {
    if (row.verdict === "exact" && !row.matchedPartId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "exact verdict requires matchedPartId",
        path: ["matchedPartId"],
      });
    }
  });

export const rightsReviewRecordSchema = z
  .object({
    contractVersion: ing7ContractVersionSchema,
    candidateId: nonEmptyString,
    stage: z.enum(["rights-reviewed", "rights-rejected"]),
    sourceId: nonEmptyString,
    publisher: nonEmptyString,
    author: nonEmptyString.optional(),
    canonicalUrl: nonEmptyString,
    citation: nonEmptyString,
    rightsClass: evidenceRightsClassSchema,
    retrievedAt: iso8601DateSchema,
    decision: rightsDraftDecisionSchema,
    recommendedDecision: recommendedDecisionSchema,
    recommendReason: nonEmptyString,
    verbatimTerms: nonEmptyString,
    exactSkuEvidence: z.string(),
    rejectRuleIds: z.array(nonEmptyString),
  })
  .superRefine((row, ctx) => {
    if ((row.decision as string) === "approved") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "agent rights records must not use decision approved",
        path: ["decision"],
      });
    }
  });

export const proposedChangeTargetSchema = z.enum([
  "part.json",
  "catalog-prices.json",
  "image-source-registry.json",
  "catalog-source-registry.json",
  "catalog-manifest.json",
  "image-file",
]);

export const proposedFieldChangeSchema = z.object({
  target: proposedChangeTargetSchema,
  path: nonEmptyString,
  op: z.enum(["add", "replace", "remove", "unchanged"]),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  reason: nonEmptyString,
});

const packetSourceSchema = z.object({
  url: nonEmptyString,
  citation: nonEmptyString,
  publisher: nonEmptyString,
  retrievedAt: iso8601DateSchema,
  sha256: sha256HexSchema,
});

const packetImageSchema = z.object({
  previewPath: nonEmptyString,
  sha256: sha256HexSchema,
  bytes: z.number().int().nonnegative(),
  mimeType: nonEmptyString,
});

function afterHasSourceId(after: unknown): boolean {
  return (
    typeof after === "object" &&
    after !== null &&
    "sourceId" in after &&
    typeof (after as { sourceId: unknown }).sourceId === "string" &&
    (after as { sourceId: string }).sourceId.length > 0
  );
}

export const ownerReviewPacketSchema = z
  .object({
    contractVersion: ing7ContractVersionSchema,
    packetId: nonEmptyString,
    candidateId: nonEmptyString,
    partId: nonEmptyString.optional(),
    sku: skuMatchRecordSchema,
    source: packetSourceSchema,
    rights: rightsReviewRecordSchema,
    image: packetImageSchema.optional(),
    proposedChanges: z.array(proposedFieldChangeSchema),
    conflicts: z.array(z.string()),
    unresolvedFields: z.array(z.string()),
    ownerDecision: z.enum(["approved", "rejected"]).optional(),
    ownerDecidedAt: iso8601DateSchema.optional(),
  })
  .superRefine((packet, ctx) => {
    const required: Array<keyof typeof packet> = [
      "sku",
      "source",
      "rights",
      "proposedChanges",
      "conflicts",
      "unresolvedFields",
    ];
    for (const key of required) {
      if (packet[key] === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `owner packet missing required section ${key}`,
          path: [key],
        });
      }
    }
    for (const [i, change] of packet.proposedChanges.entries()) {
      const needsSourceId =
        change.target === "image-file" ||
        change.target === "image-source-registry.json" ||
        change.target === "catalog-prices.json" ||
        (change.target === "part.json" &&
          (change.path.includes("image") ||
            change.path.includes("performanceSpec") ||
            change.path.includes("provenance") ||
            change.path.includes("compatSpec")));
      if (needsSourceId && !afterHasSourceId(change.after)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "proposed image/spec/price change requires after.sourceId",
          path: ["proposedChanges", i, "after"],
        });
      }
    }
  });

export const dryRunReportSchema = z.object({
  contractVersion: ing7ContractVersionSchema,
  reportId: nonEmptyString,
  generatedAt: iso8601DateSchema,
  adapterIds: z.array(nonEmptyString),
  packets: z.array(nonEmptyString),
  shippedTreeDirty: z.literal(false),
  summary: z.object({
    exact: z.number().int().nonnegative(),
    ambiguous: z.number().int().nonnegative(),
    unavailable: z.number().int().nonnegative(),
    rightsRejected: z.number().int().nonnegative(),
    pendingOwner: z.number().int().nonnegative(),
  }),
});

export const ingestCandidateListSchema = z
  .array(ingestCandidateSchema)
  .superRefine((rows, ctx) => {
    const ids = rows.map((r) => r.candidateId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "candidateId values must be unique",
      });
    }
  });

export const ingestCandidateFileSchema = z.object({
  contractVersion: ing7ContractVersionSchema,
  listVersion: nonEmptyString,
  candidates: ingestCandidateListSchema,
});

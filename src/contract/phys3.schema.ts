import { z } from "zod";
import { PHYS3_CONTRACT_VERSION, type PhysicalValidationStatus } from "./phys3";

export const phys3ContractVersionSchema = z.literal(PHYS3_CONTRACT_VERSION);

export const physicalModelGradeSchema = z.enum([
  "Verified",
  "Community",
  "Experimental",
]);

const quatSchema = z
  .tuple([z.number(), z.number(), z.number(), z.number()])
  .refine(
    (q) => q.every((n) => Number.isFinite(n)),
    "quaternion components must be finite",
  );

const vec3Schema = z
  .tuple([z.number(), z.number(), z.number()])
  .refine(
    (v) => v.every((n) => Number.isFinite(n)),
    "vector components must be finite",
  );

const collisionNodeNameSchema = z
  .string()
  .regex(/^collision:.+$/, "collision node must use collision: prefix") as z.ZodType<
  `collision:${string}`
>;

const clearanceNodeNameSchema = z
  .string()
  .regex(/^clearance:.+$/, "clearance node must use clearance: prefix") as z.ZodType<
  `clearance:${string}`
>;

const anchorNodeNameSchema = z
  .string()
  .regex(/^anchor:.+$/, "anchor node must use anchor: prefix") as z.ZodType<
  `anchor:${string}`
>;

const socketNodeNameSchema = z
  .string()
  .regex(/^socket:.+$/, "socket node must use socket: prefix") as z.ZodType<
  `socket:${string}`
>;

export const physicalEvidenceRefSchema = z.object({
  sourceId: z.string().min(1),
  geometryDataVersion: z.string().min(1),
  modelGrade: physicalModelGradeSchema,
  basis: z.string().min(1),
});

export const orientationVariantSchema = z.object({
  orientationId: z.string().min(1),
  offsetQuaternion: quatSchema,
  isDefault: z.boolean().optional(),
});

export const anchorDefinitionSchema = z.object({
  anchorId: z.string().min(1),
  nodeName: anchorNodeNameSchema,
  mountInterfaceId: z.string().min(1),
  acceptsPartCategory: z.string().min(1),
  isDefault: z.boolean().optional(),
});

export const socketDefinitionSchema = z
  .object({
    socketId: z.string().min(1),
    nodeName: socketNodeNameSchema,
    mountInterfaceId: z.string().min(1),
    targetPartCategory: z.string().min(1),
    orientationVariants: z.array(orientationVariantSchema).min(1),
  })
  .superRefine((socket, ctx) => {
    const defaults = socket.orientationVariants.filter((v) => v.isDefault);
    if (defaults.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `socket ${socket.socketId} must declare exactly one default orientation`,
      });
    }
    const ids = socket.orientationVariants.map((v) => v.orientationId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `socket ${socket.socketId} has duplicate orientationId`,
      });
    }
  });

export const allowedContactSchema = z.object({
  collisionNodeA: collisionNodeNameSchema,
  collisionNodeB: collisionNodeNameSchema,
  reason: z.string().min(1),
});

export const physicalSpecSchema = z
  .object({
    physicalContractVersion: phys3ContractVersionSchema,
    evidence: physicalEvidenceRefSchema,
    anchors: z.array(anchorDefinitionSchema),
    sockets: z.array(socketDefinitionSchema),
    collisionNodes: z.array(collisionNodeNameSchema),
    clearanceNodes: z.array(clearanceNodeNameSchema),
    allowedContacts: z.array(allowedContactSchema).optional(),
  })
  .superRefine((spec, ctx) => {
    const anchorIds = spec.anchors.map((a) => a.anchorId);
    if (new Set(anchorIds).size !== anchorIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "duplicate anchorId in physicalSpec",
      });
    }
    const socketIds = spec.sockets.map((s) => s.socketId);
    if (new Set(socketIds).size !== socketIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "duplicate socketId in physicalSpec",
      });
    }
    const nodeNames = [
      ...spec.anchors.map((a) => a.nodeName),
      ...spec.sockets.map((s) => s.nodeName),
      ...spec.collisionNodes,
      ...spec.clearanceNodes,
    ];
    if (new Set(nodeNames).size !== nodeNames.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "duplicate declared physical node names in physicalSpec",
      });
    }
  });

export const mountSelectionSchema = z.object({
  movingPartId: z.string().min(1),
  socketId: z.string().min(1),
  targetPartId: z.string().min(1),
  anchorId: z.string().min(1),
  orientationId: z.string().min(1),
});

export const mountTransformSchema = z.object({
  positionMm: vec3Schema,
  orientationQuaternion: quatSchema,
});

export const mountUnavailableReasonSchema = z.enum([
  "missing_physical_spec",
  "missing_socket_node",
  "missing_anchor_node",
  "interface_mismatch",
  "no_candidate",
  "ambiguous_candidate",
  "invalid_transform",
  "unsupported_geometry",
]);

function aggregateOverallStatus(
  checks: Array<{ kind: string; status: PhysicalValidationStatus }>,
): PhysicalValidationStatus {
  const authoritative = checks.filter((c) => c.kind === "clearance-limit");
  if (authoritative.length === 0) return "unavailable";
  if (authoritative.some((c) => c.status === "interference"))
    return "interference";
  if (authoritative.some((c) => c.status === "unavailable"))
    return "unavailable";
  if (authoritative.some((c) => c.status === "conditional"))
    return "conditional";
  return "fit";
}

export const mountResolutionSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("mounted"),
    selection: mountSelectionSchema,
    transform: mountTransformSchema,
    evidence: z.array(physicalEvidenceRefSchema).min(1),
  }),
  z.object({
    status: z.literal("unavailable"),
    movingPartId: z.string().min(1),
    reason: mountUnavailableReasonSchema,
    explanation: z.string().min(1),
    involvedNodeNames: z.array(z.string()),
  }),
]);

export const assemblyStateSchema = z.object({
  physicalContractVersion: phys3ContractVersionSchema,
  buildStateVersion: z.literal("vs2"),
  mountSelections: z.array(mountSelectionSchema),
});

export const physicalValidationStatusSchema = z.enum([
  "fit",
  "interference",
  "unavailable",
  "conditional",
]);

export const physicalCheckResultSchema = z
  .object({
    checkId: z.string().min(1),
    kind: z.enum(["collision", "clearance", "clearance-limit"]),
    status: physicalValidationStatusSchema,
    involvedPartIds: z.array(z.string().min(1)).min(1),
    involvedNodeNames: z.array(z.string().min(1)).min(1),
    explanation: z.string().min(1).optional(),
    evidenceSourceIds: z.array(z.string()),
  })
  .superRefine((check, ctx) => {
    if (
      (check.status === "interference" ||
        check.status === "unavailable" ||
        check.status === "conditional") &&
      !check.explanation
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${check.status} checks require a non-empty explanation`,
      });
    }
  });

export const physicalValidationReportSchema = z
  .object({
    physicalContractVersion: phys3ContractVersionSchema,
    buildStateVersion: z.literal("vs2"),
    assemblyState: assemblyStateSchema,
    checks: z.array(physicalCheckResultSchema).min(1),
    overallStatus: physicalValidationStatusSchema,
    geometryDataVersion: z.string().min(1),
  })
  .superRefine((report, ctx) => {
    const expected = aggregateOverallStatus(report.checks);
    if (report.overallStatus !== expected) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `overallStatus "${report.overallStatus}" does not match aggregate precedence (expected "${expected}")`,
      });
    }
  });

export const intakeRestrictionSeveritySchema = z.enum([
  "intake.none",
  "intake.moderate",
  "intake.severe",
]);

export const coolingEvidenceRecordSchema = z.object({
  physicalContractVersion: phys3ContractVersionSchema,
  evidenceSourceId: z.string().min(1),
  buildPartIds: z.array(z.string().min(1)).min(1),
  mountSelections: z.array(mountSelectionSchema),
  geometryDataVersion: z.string().min(1),
  coolingHeadroom: z.number().finite(),
  intakeRestrictionSeverity: intakeRestrictionSeveritySchema,
  basis: z.string().min(1),
});

export const coolingHookResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("available"),
    correctionInput: z.object({
      coolingHeadroom: z.number().finite(),
      intakeRestrictionSeverity: intakeRestrictionSeveritySchema,
      evidenceSourceId: z.string().min(1),
      coolingBucketId: z
        .enum([
          "cooling.sufficient",
          "cooling.marginal",
          "cooling.insufficient",
        ])
        .optional(),
    }),
  }),
  z.object({
    status: z.literal("unavailable"),
    reason: z.enum([
      "physical_validation_incomplete",
      "missing_exact_evidence",
      "unaccepted_normalization",
      "unaccepted_bucket_mapping",
    ]),
    explanation: z.string().min(1),
  }),
]);

export const physicalValidationExampleFileSchema = z.object({
  physicalContractVersion: phys3ContractVersionSchema,
  geometryDataVersion: z.string().min(1),
  examples: z.array(physicalValidationReportSchema),
});

export const coolingEvidenceFileSchema = z.object({
  physicalContractVersion: phys3ContractVersionSchema,
  dataVersion: z.string().min(1),
  rows: z.array(coolingEvidenceRecordSchema),
});

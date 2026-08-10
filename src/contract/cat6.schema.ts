import { z } from "zod";
import {
  evidenceRightsClassSchema,
  evidenceSourceClassSchema,
  sha256HexSchema,
} from "./prov4.schema";
import { physicalSpecSchema } from "./phys3.schema";
import {
  compatSpecSchema,
  partCategoryV2Schema,
} from "./vs2.schema";
import { CAT6_CONTRACT_VERSION, CAT6_ID_SUFFIX_PATTERN } from "./cat6";

export const cat6ContractVersionSchema = z.literal(CAT6_CONTRACT_VERSION);

const nonEmptyString = z.string().min(1);

export const iso8601DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be ISO-8601 date (YYYY-MM-DD)")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), {
    message: "must be a valid calendar date",
  });

const positiveFiniteNumber = z
  .number()
  .finite()
  .refine((n) => n > 0, "must be greater than zero");

export const catalogSourceRefSchema = z.object({
  sourceId: nonEmptyString,
  retrievedAt: iso8601DateSchema,
});

export const partIdentitySchema = z.object({
  manufacturer: nonEmptyString,
  modelName: nonEmptyString,
  partNumber: nonEmptyString.optional(),
  chipModel: nonEmptyString.optional(),
  releasedAt: iso8601DateSchema.optional(),
});

export const dimensionsMmSchema = z.object({
  lengthMm: positiveFiniteNumber,
  heightMm: positiveFiniteNumber,
  thicknessMm: positiveFiniteNumber,
  raw: nonEmptyString,
  assignmentBasis: nonEmptyString,
});

export const performanceSpecSchema = z.object({
  boostClockMhz: positiveFiniteNumber.optional(),
  boostClockBasis: nonEmptyString.optional(),
  baseClockMhz: positiveFiniteNumber.optional(),
  defaultPowerLimitW: positiveFiniteNumber.optional(),
  powerLimitBasis: nonEmptyString.optional(),
});

export const catalogImageRefSchema = z.object({
  path: nonEmptyString,
  sourceId: nonEmptyString,
  rightsClass: evidenceRightsClassSchema,
  retrievedAt: iso8601DateSchema,
});

export const catalogProvenanceSchema = z.object({
  identity: catalogSourceRefSchema,
  compatSpec: catalogSourceRefSchema.optional(),
  dimensions: catalogSourceRefSchema.optional(),
  performanceSpec: catalogSourceRefSchema.optional(),
  msrp: catalogSourceRefSchema.optional(),
  streetPrice: catalogSourceRefSchema.optional(),
});

function matchesCat6IdPattern(id: string, category: string): boolean {
  const dot = id.indexOf(".");
  if (dot <= 0 || dot === id.length - 1) return false;
  const prefix = id.slice(0, dot);
  const suffix = id.slice(dot + 1);
  if (prefix !== category) return false;
  return CAT6_ID_SUFFIX_PATTERN.test(suffix);
}

function refineGroupPresence(
  part: {
    compatSpec?: unknown;
    dimensionsMm?: unknown;
    performanceSpec?: unknown;
    provenance: {
      compatSpec?: unknown;
      dimensions?: unknown;
      performanceSpec?: unknown;
    };
  },
  ctx: z.RefinementCtx,
): void {
  const pairs: Array<{
    field: "compatSpec" | "dimensionsMm" | "performanceSpec";
    provenanceKey: "compatSpec" | "dimensions" | "performanceSpec";
  }> = [
    { field: "compatSpec", provenanceKey: "compatSpec" },
    { field: "dimensionsMm", provenanceKey: "dimensions" },
    { field: "performanceSpec", provenanceKey: "performanceSpec" },
  ];

  for (const { field, provenanceKey } of pairs) {
    const hasField = part[field] !== undefined;
    const hasProvenance = part.provenance[provenanceKey] !== undefined;
    if (hasField && !hasProvenance) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${field} present requires provenance.${provenanceKey}`,
        path: ["provenance", provenanceKey],
      });
    }
    if (hasProvenance && !hasField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `provenance.${provenanceKey} present requires ${field}`,
        path: [field],
      });
    }
  }
}

export const partDefinitionV3Schema = z
  .object({
    contractVersion: cat6ContractVersionSchema,
    id: nonEmptyString,
    category: partCategoryV2Schema,
    displayName: nonEmptyString.refine(
      (name) => !/\(fixture\)/.test(name),
      'displayName must not contain "(fixture)"',
    ),
    identity: partIdentitySchema,
    modelGlbPath: nonEmptyString,
    dimensionsMm: dimensionsMmSchema.optional(),
    performanceSpec: performanceSpecSchema.optional(),
    provenance: catalogProvenanceSchema,
    image: catalogImageRefSchema.optional(),
    notes: z.string().optional(),
    compatSpec: compatSpecSchema.optional(),
    physicalSpec: physicalSpecSchema.optional(),
  })
  .superRefine((part, ctx) => {
    if (!matchesCat6IdPattern(part.id, part.category)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "id must match cat6 §3 pattern: {category}.{vendor-model-variant}",
        path: ["id"],
      });
    }
    refineGroupPresence(part, ctx);
  });

export const catalogSourceSchema = z.object({
  sourceId: nonEmptyString,
  sourceClass: evidenceSourceClassSchema,
  rightsClass: evidenceRightsClassSchema,
  title: nonEmptyString,
  origin: nonEmptyString,
  citation: nonEmptyString,
  publishedAt: iso8601DateSchema.optional(),
  documentSha256: sha256HexSchema.optional(),
  notes: z.string().optional(),
});

export const catalogSourceRegistryFileSchema = z
  .object({
    catalogContractVersion: cat6ContractVersionSchema,
    registryVersion: nonEmptyString,
    sources: z.array(catalogSourceSchema),
  })
  .superRefine((file, ctx) => {
    const ids = file.sources.map((s) => s.sourceId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "duplicate sourceId in catalog source registry",
      });
    }
  });

export const catalogManifestEntrySchema = z.object({
  id: nonEmptyString,
  category: partCategoryV2Schema,
  path: nonEmptyString,
});

export const catalogManifestFileSchema = z
  .object({
    catalogContractVersion: cat6ContractVersionSchema,
    catalogVersion: nonEmptyString,
    parts: z.array(catalogManifestEntrySchema),
  })
  .superRefine((file, ctx) => {
    const ids = file.parts.map((p) => p.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "duplicate id in catalog manifest",
      });
    }
  });

export const catalogMsrpSchema = z.object({
  amount: positiveFiniteNumber,
  currency: nonEmptyString,
  sourceId: nonEmptyString,
  retrievedAt: iso8601DateSchema,
});

export const catalogStreetPriceSchema = z.object({
  amount: positiveFiniteNumber,
  currency: nonEmptyString,
  retailer: nonEmptyString,
  region: nonEmptyString,
  sourceId: nonEmptyString,
  retrievedAt: iso8601DateSchema,
});

export const catalogPriceRowSchema = z
  .object({
    partId: nonEmptyString,
    category: partCategoryV2Schema,
    msrp: catalogMsrpSchema.optional(),
    street: catalogStreetPriceSchema.optional(),
  })
  .superRefine((row, ctx) => {
    if (!row.msrp && !row.street) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "price row must include msrp and/or street",
      });
    }
  });

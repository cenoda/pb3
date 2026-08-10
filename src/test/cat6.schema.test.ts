import { describe, expect, it } from "vitest";
import {
  catalogManifestFileSchema,
  catalogPriceRowSchema,
  catalogSourceRegistryFileSchema,
  partDefinitionV3Schema,
} from "../contract/cat6.schema";

const identityProvenance = {
  sourceId: "source.cat6.gpu.asus-dual-rtx4070-o12g.product-page",
  retrievedAt: "2026-08-10",
};

const minimalValidPart = {
  contractVersion: "cat6" as const,
  id: "gpu.asus-dual-rtx4070-o12g",
  category: "gpu" as const,
  displayName: "ASUS Dual GeForce RTX 4070 OC Edition 12GB",
  identity: {
    manufacturer: "ASUS",
    modelName: "Dual GeForce RTX 4070 OC Edition 12GB",
  },
  modelGlbPath: "parts/gpu/gpu.asus-dual-rtx4070-o12g/model.glb",
  provenance: {
    identity: identityProvenance,
  },
};

const validRegistry = {
  catalogContractVersion: "cat6" as const,
  registryVersion: "cat6-registry-20260810",
  sources: [
    {
      sourceId: "source.cat6.gpu.asus-dual-rtx4070-o12g.product-page",
      sourceClass: "manufacturer-spec" as const,
      rightsClass: "public-spec" as const,
      title: "ASUS Dual RTX 4070 OC product page",
      origin: "ASUS",
      citation: "https://example.invalid/asus-dual-rtx4070-oc",
      publishedAt: "2023-04-12",
    },
  ],
};

const validManifest = {
  catalogContractVersion: "cat6" as const,
  catalogVersion: "cat6-20260810",
  parts: [
    {
      id: "gpu.asus-dual-rtx4070-o12g",
      category: "gpu" as const,
      path: "parts/gpu/gpu.asus-dual-rtx4070-o12g/part.json",
    },
  ],
};

const sampleDimensionsMm = {
  lengthMm: 267.01,
  heightMm: 133.94,
  thicknessMm: 51.13,
  raw: "267.01 x 133.94 x 51.13 mm",
  assignmentBasis:
    "Three unlabeled figures read as length, height, and thickness by graphics-card convention.",
};

const sampleClearanceLimits = {
  raw: "GPU max length: 355 mm with and without front fan mounted",
  maxGpuLength: [
    { limitMm: 355, condition: "with and without front fan mounted" },
  ],
};

const casePartBase = {
  contractVersion: "cat6" as const,
  id: "case.fractal-design-north-tg-dark",
  category: "case" as const,
  displayName: "Fractal Design North Black TG Dark",
  identity: {
    manufacturer: "Fractal Design",
    modelName: "North Black TG Dark",
  },
  modelGlbPath: "parts/case/case.fractal-design-north-tg-dark/model.glb",
  provenance: {
    identity: identityProvenance,
  },
};

describe("cat6.schema", () => {
  it("accepts a minimal valid cat6 part", () => {
    expect(partDefinitionV3Schema.safeParse(minimalValidPart).success).toBe(true);
  });

  it("accepts a part carrying compatSpec, dimensionsMm and performanceSpec with their provenance entries", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...minimalValidPart,
      compatSpec: { tdpWatts: 200 },
      dimensionsMm: sampleDimensionsMm,
      performanceSpec: {
        boostClockMhz: 2505,
        boostClockBasis: "Default Mode boost",
        defaultPowerLimitW: 200,
        powerLimitBasis: "TGP",
      },
      provenance: {
        identity: identityProvenance,
        compatSpec: identityProvenance,
        dimensions: identityProvenance,
        performanceSpec: identityProvenance,
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts a dimensionsMm with raw and assignmentBasis present", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...minimalValidPart,
      dimensionsMm: sampleDimensionsMm,
      provenance: {
        identity: identityProvenance,
        dimensions: identityProvenance,
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a dimensionsMm missing raw", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...minimalValidPart,
      dimensionsMm: {
        lengthMm: 267.01,
        heightMm: 133.94,
        thicknessMm: 51.13,
        assignmentBasis: "assignment without raw",
      },
      provenance: {
        identity: identityProvenance,
        dimensions: identityProvenance,
      },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a dimensionsMm missing assignmentBasis", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...minimalValidPart,
      dimensionsMm: {
        lengthMm: 267.01,
        heightMm: 133.94,
        thicknessMm: 51.13,
        raw: "267.01 x 133.94 x 51.13 mm",
      },
      provenance: {
        identity: identityProvenance,
        dimensions: identityProvenance,
      },
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects contractVersion "vs0"', () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...minimalValidPart,
      contractVersion: "vs0",
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects a displayName containing "(fixture)"', () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...minimalValidPart,
      displayName: "ASUS Dual RTX 4070 (fixture)",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an id whose category prefix does not equal the category field", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...minimalValidPart,
      id: "cpu.asus-dual-rtx4070-o12g",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an id that does not match the id pattern in contract §3", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...minimalValidPart,
      id: "gpu.ASUS-DUAL",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an id whose suffix has no hyphen segment", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...minimalValidPart,
      id: "gpu.asus",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects compatSpec present without provenance.compatSpec", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...minimalValidPart,
      compatSpec: { tdpWatts: 200 },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects provenance.compatSpec present without compatSpec", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...minimalValidPart,
      provenance: {
        identity: identityProvenance,
        compatSpec: identityProvenance,
      },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects dimensionsMm present without provenance.dimensions", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...minimalValidPart,
      dimensionsMm: sampleDimensionsMm,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects provenance.dimensions present without dimensionsMm", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...minimalValidPart,
      provenance: {
        identity: identityProvenance,
        dimensions: identityProvenance,
      },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects performanceSpec present without provenance.performanceSpec", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...minimalValidPart,
      performanceSpec: { boostClockMhz: 2505 },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects provenance.performanceSpec present without performanceSpec", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...minimalValidPart,
      provenance: {
        identity: identityProvenance,
        performanceSpec: identityProvenance,
      },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a non-ISO-8601 retrievedAt", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...minimalValidPart,
      provenance: {
        identity: {
          ...identityProvenance,
          retrievedAt: "08/10/2026",
        },
      },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a dimension that is zero, negative, or non-finite", () => {
    for (const lengthMm of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const parsed = partDefinitionV3Schema.safeParse({
        ...minimalValidPart,
        dimensionsMm: {
          ...sampleDimensionsMm,
          lengthMm,
        },
        provenance: {
          identity: identityProvenance,
          dimensions: identityProvenance,
        },
      });
      expect(parsed.success).toBe(false);
    }
  });

  it("rejects a non-positive thicknessMm", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...minimalValidPart,
      dimensionsMm: {
        ...sampleDimensionsMm,
        thicknessMm: 0,
      },
      provenance: {
        identity: identityProvenance,
        dimensions: identityProvenance,
      },
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a part with clearanceLimits and provenance.clearanceLimits", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...casePartBase,
      clearanceLimits: sampleClearanceLimits,
      provenance: {
        identity: identityProvenance,
        clearanceLimits: identityProvenance,
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects clearanceLimits without provenance.clearanceLimits", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...casePartBase,
      clearanceLimits: sampleClearanceLimits,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects provenance.clearanceLimits without clearanceLimits", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...casePartBase,
      provenance: {
        identity: identityProvenance,
        clearanceLimits: identityProvenance,
      },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an empty limits array", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...casePartBase,
      clearanceLimits: {
        raw: "GPU max length: 355 mm",
        maxGpuLength: [],
      },
      provenance: {
        identity: identityProvenance,
        clearanceLimits: identityProvenance,
      },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a non-positive limitMm", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...casePartBase,
      clearanceLimits: {
        raw: "GPU max length: 0 mm",
        maxGpuLength: [{ limitMm: 0 }],
      },
      provenance: {
        identity: identityProvenance,
        clearanceLimits: identityProvenance,
      },
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a ClearanceLimit with no condition", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...casePartBase,
      clearanceLimits: {
        raw: "GPU max length: 355 mm",
        maxGpuLength: [{ limitMm: 355 }],
      },
      provenance: {
        identity: identityProvenance,
        clearanceLimits: identityProvenance,
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts two limits for the same measurement with different conditions", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...casePartBase,
      clearanceLimits: {
        raw: "PSU max length: 1 HDD Tray: 255 mm max, 2 HDD Tray: 155 mm max",
        maxPsuLength: [
          { limitMm: 255, condition: "1 HDD Tray" },
          { limitMm: 155, condition: "2 HDD Tray" },
        ],
      },
      provenance: {
        identity: identityProvenance,
        clearanceLimits: identityProvenance,
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an incomplete image object", () => {
    const parsed = partDefinitionV3Schema.safeParse({
      ...minimalValidPart,
      image: {
        path: "image.jpg",
        sourceId: "source.cat6.image",
      },
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a valid source registry file", () => {
    expect(catalogSourceRegistryFileSchema.safeParse(validRegistry).success).toBe(
      true,
    );
  });

  it("rejects a registry source with an empty citation", () => {
    const parsed = catalogSourceRegistryFileSchema.safeParse({
      ...validRegistry,
      sources: [
        {
          ...validRegistry.sources[0],
          citation: "",
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a valid catalog manifest", () => {
    expect(catalogManifestFileSchema.safeParse(validManifest).success).toBe(true);
  });

  it("rejects duplicate ids within catalog manifest", () => {
    const parsed = catalogManifestFileSchema.safeParse({
      ...validManifest,
      parts: [
        validManifest.parts[0],
        {
          ...validManifest.parts[0],
          path: "parts/gpu/gpu.asus-dual-rtx4070-o12g/part-alt.json",
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a price row that has neither msrp nor street", () => {
    const parsed = catalogPriceRowSchema.safeParse({
      partId: "gpu.asus-dual-rtx4070-o12g",
      category: "gpu",
    });
    expect(parsed.success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  assemblyStateSchema,
  coolingEvidenceFileSchema,
  coolingHookResultSchema,
  mountResolutionSchema,
  physicalCheckResultSchema,
  physicalSpecSchema,
  physicalValidationExampleFileSchema,
  physicalValidationReportSchema,
} from "../contract/phys3.schema";
import { PHYS3_GEOMETRY_DATA_VERSION } from "../contract/phys3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const evidence = {
  sourceId: "evidence.phys3.synthetic.case.mid-tower-atx-01",
  geometryDataVersion: PHYS3_GEOMETRY_DATA_VERSION,
  modelGrade: "Experimental" as const,
  basis: "project-authored synthetic fixture; not manufacturer-verified",
};

const validPhysicalSpec = {
  physicalContractVersion: "phys3" as const,
  evidence,
  anchors: [
    {
      anchorId: "anchor.mb",
      nodeName: "anchor:mb" as const,
      mountInterfaceId: "iface.case-mb.atx",
      acceptsPartCategory: "motherboard",
      isDefault: true,
    },
  ],
  sockets: [
    {
      socketId: "socket.case",
      nodeName: "socket:case" as const,
      mountInterfaceId: "iface.case-mb.atx",
      targetPartCategory: "case",
      orientationVariants: [
        {
          orientationId: "normal",
          offsetQuaternion: [0, 0, 0, 1] as const,
          isDefault: true,
        },
      ],
    },
  ],
  collisionNodes: ["collision:case-floor" as const],
  clearanceNodes: ["clearance:cooler-sidekeepout" as const],
  allowedContacts: [
    {
      collisionNodeA: "collision:case-floor" as const,
      collisionNodeB: "collision:mb-board" as const,
      reason: "intended motherboard tray contact",
    },
  ],
};

const assembly = {
  physicalContractVersion: "phys3" as const,
  buildStateVersion: "vs2" as const,
  mountSelections: [],
};

const fitCheck = {
  checkId: "collision:a|collision:b",
  kind: "collision" as const,
  status: "fit" as const,
  involvedPartIds: ["a", "b"],
  involvedNodeNames: ["collision:a", "collision:b"],
  evidenceSourceIds: ["ev"],
};

const unavailableCheck = {
  checkId: "coverage:x",
  kind: "collision" as const,
  status: "unavailable" as const,
  involvedPartIds: ["x"],
  involvedNodeNames: ["part:x"],
  explanation: "missing coverage",
  evidenceSourceIds: [],
};

const interferenceCheck = {
  checkId: "clearance:c|collision:d",
  kind: "clearance" as const,
  status: "interference" as const,
  involvedPartIds: ["c", "d"],
  involvedNodeNames: ["clearance:c", "collision:d"],
  explanation: "clearance violated",
  evidenceSourceIds: ["ev"],
};

describe("phys3.schema", () => {
  it("accepts a valid physicalSpec", () => {
    expect(physicalSpecSchema.safeParse(validPhysicalSpec).success).toBe(true);
  });

  it("rejects wrong contract version", () => {
    const parsed = physicalSpecSchema.safeParse({
      ...validPhysicalSpec,
      physicalContractVersion: "vs2",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects collision node without collision: prefix", () => {
    const parsed = physicalSpecSchema.safeParse({
      ...validPhysicalSpec,
      collisionNodes: ["case-floor"],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects socket without exactly one default orientation", () => {
    const parsed = physicalSpecSchema.safeParse({
      ...validPhysicalSpec,
      sockets: [
        {
          ...validPhysicalSpec.sockets[0],
          orientationVariants: [
            {
              orientationId: "normal",
              offsetQuaternion: [0, 0, 0, 1],
            },
            {
              orientationId: "rotated-180",
              offsetQuaternion: [0, 1, 0, 0],
            },
          ],
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects duplicate anchorId", () => {
    const parsed = physicalSpecSchema.safeParse({
      ...validPhysicalSpec,
      anchors: [
        validPhysicalSpec.anchors[0],
        { ...validPhysicalSpec.anchors[0], nodeName: "anchor:mb-b" },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects interference check without explanation", () => {
    const parsed = physicalCheckResultSchema.safeParse({
      checkId: "collision:a|collision:b",
      kind: "collision",
      status: "interference",
      involvedPartIds: ["a", "b"],
      involvedNodeNames: ["collision:a", "collision:b"],
      evidenceSourceIds: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts fit check without explanation", () => {
    const parsed = physicalCheckResultSchema.safeParse(fitCheck);
    expect(parsed.success).toBe(true);
  });

  it("accepts mounted and unavailable mount resolutions", () => {
    expect(
      mountResolutionSchema.safeParse({
        status: "mounted",
        selection: {
          movingPartId: "mb.atx-b650-01",
          socketId: "socket.case",
          targetPartId: "case.mid-tower-atx-01",
          anchorId: "anchor.mb",
          orientationId: "normal",
        },
        transform: {
          positionMm: [0, 20, -40],
          orientationQuaternion: [0, 0, 0, 1],
        },
        evidence: [evidence],
      }).success,
    ).toBe(true);

    expect(
      mountResolutionSchema.safeParse({
        status: "unavailable",
        movingPartId: "mb.micro-b450-01",
        reason: "missing_physical_spec",
        explanation: "visual-only fallback lacks physicalSpec",
        involvedNodeNames: [],
      }).success,
    ).toBe(true);
  });

  it("accepts assembly state", () => {
    expect(assemblyStateSchema.safeParse(assembly).success).toBe(true);
  });

  it("rejects empty checks on a physical validation report", () => {
    const parsed = physicalValidationReportSchema.safeParse({
      physicalContractVersion: "phys3",
      buildStateVersion: "vs2",
      assemblyState: assembly,
      checks: [],
      overallStatus: "fit",
      geometryDataVersion: PHYS3_GEOMETRY_DATA_VERSION,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects overall fit when a check is unavailable", () => {
    const parsed = physicalValidationReportSchema.safeParse({
      physicalContractVersion: "phys3",
      buildStateVersion: "vs2",
      assemblyState: assembly,
      checks: [fitCheck, unavailableCheck],
      overallStatus: "fit",
      geometryDataVersion: PHYS3_GEOMETRY_DATA_VERSION,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects overall unavailable when a check is interference", () => {
    const parsed = physicalValidationReportSchema.safeParse({
      physicalContractVersion: "phys3",
      buildStateVersion: "vs2",
      assemblyState: assembly,
      checks: [unavailableCheck, interferenceCheck],
      overallStatus: "unavailable",
      geometryDataVersion: PHYS3_GEOMETRY_DATA_VERSION,
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts correctly aggregated fit/interference/unavailable reports", () => {
    expect(
      physicalValidationReportSchema.safeParse({
        physicalContractVersion: "phys3",
        buildStateVersion: "vs2",
        assemblyState: assembly,
        checks: [fitCheck],
        overallStatus: "fit",
        geometryDataVersion: PHYS3_GEOMETRY_DATA_VERSION,
      }).success,
    ).toBe(true);

    expect(
      physicalValidationReportSchema.safeParse({
        physicalContractVersion: "phys3",
        buildStateVersion: "vs2",
        assemblyState: assembly,
        checks: [fitCheck, unavailableCheck],
        overallStatus: "unavailable",
        geometryDataVersion: PHYS3_GEOMETRY_DATA_VERSION,
      }).success,
    ).toBe(true);

    expect(
      physicalValidationReportSchema.safeParse({
        physicalContractVersion: "phys3",
        buildStateVersion: "vs2",
        assemblyState: assembly,
        checks: [fitCheck, unavailableCheck, interferenceCheck],
        overallStatus: "interference",
        geometryDataVersion: PHYS3_GEOMETRY_DATA_VERSION,
      }).success,
    ).toBe(true);
  });

  it("validates benchmarks/phys3/physical-validation-examples.json", () => {
    const repoRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../..",
    );
    const raw = JSON.parse(
      fs.readFileSync(
        path.join(repoRoot, "benchmarks/phys3/physical-validation-examples.json"),
        "utf8",
      ),
    );
    const parsed = physicalValidationExampleFileSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.data.physicalContractVersion).toBe("phys3");
    expect(parsed.data.geometryDataVersion).toBe(PHYS3_GEOMETRY_DATA_VERSION);
    const statuses = new Set(parsed.data.examples.map((e) => e.overallStatus));
    expect(statuses.has("fit")).toBe(true);
    expect(statuses.has("interference")).toBe(true);
    expect(statuses.has("unavailable")).toBe(true);
    for (const example of parsed.data.examples) {
      expect(example.checks.length).toBeGreaterThan(0);
      expect(
        physicalValidationReportSchema.safeParse(example).success,
      ).toBe(true);
    }
  });

  it("accepts empty cooling evidence file and unavailable hook result", () => {
    expect(
      coolingEvidenceFileSchema.safeParse({
        physicalContractVersion: "phys3",
        dataVersion: PHYS3_GEOMETRY_DATA_VERSION,
        rows: [],
      }).success,
    ).toBe(true);

    expect(
      coolingHookResultSchema.safeParse({
        status: "unavailable",
        reason: "missing_exact_evidence",
        explanation: "Phase 3 production cooling evidence rows are empty",
      }).success,
    ).toBe(true);
  });

  it("accepts stub-only available cooling hook shape for unit tests", () => {
    expect(
      coolingHookResultSchema.safeParse({
        status: "available",
        correctionInput: {
          coolingHeadroom: 0.8,
          intakeRestrictionSeverity: "intake.none",
          evidenceSourceId: "stub-only.unit-test",
        },
      }).success,
    ).toBe(true);
  });

  it("rejects non-finite orientation quaternion", () => {
    const parsed = physicalSpecSchema.safeParse({
      ...validPhysicalSpec,
      sockets: [
        {
          ...validPhysicalSpec.sockets[0],
          orientationVariants: [
            {
              orientationId: "normal",
              offsetQuaternion: [0, Number.NaN, 0, 1],
              isDefault: true,
            },
          ],
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });
});

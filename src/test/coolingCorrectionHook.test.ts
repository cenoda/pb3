import { describe, expect, it } from "vitest";
import {
  PHYS3_CONTRACT_VERSION,
  PHYS3_GEOMETRY_DATA_VERSION,
} from "../contract/phys3";
import type {
  CoolingEvidenceFile,
  PhysicalValidationReport,
} from "../contract/phys3";
import { buildCoolingCorrectionInput } from "../physical/cooling/buildCoolingCorrectionInput";
import { loadCoolingEvidence } from "../physical/cooling/loadCoolingEvidence";

const emptyAssemblyReport = (
  overallStatus: PhysicalValidationReport["overallStatus"],
): PhysicalValidationReport => ({
  physicalContractVersion: PHYS3_CONTRACT_VERSION,
  buildStateVersion: "vs2",
  assemblyState: {
    physicalContractVersion: PHYS3_CONTRACT_VERSION,
    buildStateVersion: "vs2",
    mountSelections: [],
  },
  checks: [],
  overallStatus,
  geometryDataVersion: PHYS3_GEOMETRY_DATA_VERSION,
});

describe("coolingCorrectionHook", () => {
  it("runtime production file is empty and yields unavailable", async () => {
    const file = await loadCoolingEvidence();
    expect(file.rows).toEqual([]);

    const result = buildCoolingCorrectionInput({
      buildPartIds: ["case.mid-tower-atx-01"],
      mountSelections: [],
      geometryDataVersion: PHYS3_GEOMETRY_DATA_VERSION,
      physicalReport: emptyAssemblyReport("fit"),
      evidenceFile: file,
      allowStubRows: false,
    });
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.reason).toBe("missing_exact_evidence");
    }
  });

  it("withholds when physical validation is incomplete", () => {
    const result = buildCoolingCorrectionInput({
      buildPartIds: ["case.mid-tower-atx-01"],
      mountSelections: [],
      geometryDataVersion: PHYS3_GEOMETRY_DATA_VERSION,
      physicalReport: emptyAssemblyReport("unavailable"),
      evidenceFile: {
        physicalContractVersion: "phys3",
        dataVersion: PHYS3_GEOMETRY_DATA_VERSION,
        rows: [],
      },
      allowStubRows: true,
    });
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.reason).toBe("physical_validation_incomplete");
    }
  });

  it("stub-only exact match populates hook fields without bucket mapping", () => {
    const mount = {
      movingPartId: "cooler.air-twin-tower-01",
      socketId: "socket.motherboard",
      targetPartId: "mb.atx-b650-01",
      anchorId: "anchor.cooler",
      orientationId: "normal",
    };
    const stubFile: CoolingEvidenceFile = {
      physicalContractVersion: "phys3",
      dataVersion: PHYS3_GEOMETRY_DATA_VERSION,
      rows: [
        {
          physicalContractVersion: "phys3",
          evidenceSourceId: "stub-only.unit-test.cooling",
          buildPartIds: ["case.mid-tower-atx-01", "cooler.air-twin-tower-01"],
          mountSelections: [mount],
          geometryDataVersion: PHYS3_GEOMETRY_DATA_VERSION,
          coolingHeadroom: 0.75,
          intakeRestrictionSeverity: "intake.moderate",
          basis: "STUB-ONLY unit test object; not runtime correction data",
        },
      ],
    };

    const hit = buildCoolingCorrectionInput({
      buildPartIds: ["cooler.air-twin-tower-01", "case.mid-tower-atx-01"],
      mountSelections: [mount],
      geometryDataVersion: PHYS3_GEOMETRY_DATA_VERSION,
      physicalReport: emptyAssemblyReport("fit"),
      evidenceFile: stubFile,
      allowStubRows: true,
    });
    expect(hit.status).toBe("available");
    if (hit.status === "available") {
      expect(hit.correctionInput.coolingHeadroom).toBe(0.75);
      expect(hit.correctionInput.intakeRestrictionSeverity).toBe(
        "intake.moderate",
      );
      expect(hit.correctionInput.evidenceSourceId).toBe(
        "stub-only.unit-test.cooling",
      );
      expect(hit.correctionInput.coolingBucketId).toBeUndefined();
    }

    const stale = buildCoolingCorrectionInput({
      buildPartIds: ["cooler.air-twin-tower-01", "case.mid-tower-atx-01"],
      mountSelections: [mount],
      geometryDataVersion: "stale-version",
      physicalReport: emptyAssemblyReport("fit"),
      evidenceFile: stubFile,
      allowStubRows: true,
    });
    expect(stale.status).toBe("unavailable");

    const missing = buildCoolingCorrectionInput({
      buildPartIds: ["cooler.air-twin-tower-01", "case.mid-tower-atx-01"],
      mountSelections: [{ ...mount, orientationId: "rotated-180" }],
      geometryDataVersion: PHYS3_GEOMETRY_DATA_VERSION,
      physicalReport: emptyAssemblyReport("fit"),
      evidenceFile: stubFile,
      allowStubRows: true,
    });
    expect(missing.status).toBe("unavailable");
  });
});

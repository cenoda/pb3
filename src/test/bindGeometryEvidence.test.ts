import { describe, expect, it } from "vitest";
import type { PhysicalSpec } from "../contract/phys3";
import { PHYS3_GEOMETRY_DATA_VERSION } from "../contract/phys3";
import type {
  EvidenceSourceRegistryFile,
  GeometryEvidenceFile,
  HumanVerificationFile,
} from "../contract/prov4";
import { bindGeometryEvidence } from "../provenance/bindGeometryEvidence";

const registry: EvidenceSourceRegistryFile = {
  provenanceContractVersion: "prov4",
  registryVersion: "test",
  sources: [
    {
      sourceId: "src.project-synthetic.geometry",
      sourceClass: "project-synthetic",
      rightsClass: "apache-2.0-project",
      title: "Synthetic geometry",
      origin: "parts fixtures",
    },
  ],
};

const verifications: HumanVerificationFile = {
  provenanceContractVersion: "prov4",
  records: [],
};

const phys3SourceId = "evidence.phys3.synthetic.cpu.amd-ryzen-5-7600";

const physicalSpec: PhysicalSpec = {
  physicalContractVersion: "phys3",
  evidence: {
    sourceId: phys3SourceId,
    geometryDataVersion: PHYS3_GEOMETRY_DATA_VERSION,
    modelGrade: "Experimental",
    basis: "synthetic",
  },
  anchors: [],
  sockets: [],
  collisionNodes: [],
  clearanceNodes: [],
};

const geometryFile: GeometryEvidenceFile = {
  provenanceContractVersion: "prov4",
  dataVersion: "test",
  rows: [
    {
      provenanceContractVersion: "prov4",
      evidenceId: "geo.cpu.amd-ryzen-5-7600",
      partId: "cpu.amd-ryzen-5-7600",
      phys3EvidenceSourceId: phys3SourceId,
      modelGrade: "Experimental",
      geometryDataVersion: PHYS3_GEOMETRY_DATA_VERSION,
      sourceIds: ["src.project-synthetic.geometry"],
      reviewedAt: "2026-08-01T00:00:00Z",
      freshnessPolicy: { maxAgeDays: 365 },
      basis: "Experimental synthetic",
    },
  ],
};

const nowIso = "2026-08-09T00:00:00Z";

describe("bindGeometryEvidence", () => {
  it("returns not_pilot_part for non-pilot ids", () => {
    const binding = bindGeometryEvidence({
      partId: "cpu.amd-ryzen-7-7800x3d",
      physicalSpec,
      evidenceFile: geometryFile,
      registry,
      verifications,
      nowIso,
    });
    expect(binding.status).toBe("unavailable");
    if (binding.status === "unavailable") {
      expect(binding.reason).toBe("not_pilot_part");
    }
  });

  it("returns missing_physical_spec when spec absent", () => {
    const binding = bindGeometryEvidence({
      partId: "cpu.amd-ryzen-5-7600",
      physicalSpec: undefined,
      evidenceFile: geometryFile,
      registry,
      verifications,
      nowIso,
    });
    expect(binding.status).toBe("unavailable");
    if (binding.status === "unavailable") {
      expect(binding.reason).toBe("missing_physical_spec");
    }
  });

  it("joins on phys3EvidenceSourceId then asserts part/version/grade", () => {
    const binding = bindGeometryEvidence({
      partId: "cpu.amd-ryzen-5-7600",
      physicalSpec,
      evidenceFile: geometryFile,
      registry,
      verifications,
      nowIso,
    });
    expect(binding.status).toBe("bound");
    if (binding.status === "bound") {
      expect(binding.evidence.phys3EvidenceSourceId).toBe(phys3SourceId);
      expect(binding.evidence.modelGrade).toBe("Experimental");
    }
  });

  it("returns phys3_ref_mismatch when partId diverges after join", () => {
    const binding = bindGeometryEvidence({
      partId: "gpu.asus-dual-rtx4070-o12g",
      physicalSpec: {
        ...physicalSpec,
        evidence: {
          ...physicalSpec.evidence,
          sourceId: phys3SourceId,
        },
      },
      evidenceFile: geometryFile,
      registry,
      verifications,
      nowIso,
    });
    expect(binding.status).toBe("unavailable");
    if (binding.status === "unavailable") {
      expect(binding.reason).toBe("phys3_ref_mismatch");
    }
  });

  it("returns missing_evidence_row when phys3 id not found", () => {
    const binding = bindGeometryEvidence({
      partId: "cpu.amd-ryzen-5-7600",
      physicalSpec: {
        ...physicalSpec,
        evidence: {
          ...physicalSpec.evidence,
          sourceId: "evidence.phys3.synthetic.missing",
        },
      },
      evidenceFile: geometryFile,
      registry,
      verifications,
      nowIso,
    });
    expect(binding.status).toBe("unavailable");
    if (binding.status === "unavailable") {
      expect(binding.reason).toBe("missing_evidence_row");
    }
  });

  it("returns missing_source when registry unresolved", () => {
    const binding = bindGeometryEvidence({
      partId: "cpu.amd-ryzen-5-7600",
      physicalSpec,
      evidenceFile: {
        ...geometryFile,
        rows: [
          {
            ...geometryFile.rows[0]!,
            sourceIds: ["src.missing"],
          },
        ],
      },
      registry,
      verifications,
      nowIso,
    });
    expect(binding.status).toBe("unavailable");
    if (binding.status === "unavailable") {
      expect(binding.reason).toBe("missing_source");
    }
  });

  it("returns grade_ceiling_violation when Verified on synthetic-only", () => {
    const binding = bindGeometryEvidence({
      partId: "cpu.amd-ryzen-5-7600",
      physicalSpec: {
        ...physicalSpec,
        evidence: {
          ...physicalSpec.evidence,
          modelGrade: "Verified",
        },
      },
      evidenceFile: {
        ...geometryFile,
        rows: [
          {
            ...geometryFile.rows[0]!,
            modelGrade: "Verified",
            verificationId: "verify.geo",
          },
        ],
      },
      registry,
      verifications: {
        provenanceContractVersion: "prov4",
        records: [
          {
            verificationId: "verify.geo",
            kind: "geometry-dimension-check",
            verdict: "pass",
            reviewedAt: "2026-08-01T00:00:00Z",
            reviewerLabel: "owner",
            checklist: ["dims"],
            sourceIds: ["src.project-synthetic.geometry"],
          },
        ],
      },
      nowIso,
    });
    expect(binding.status).toBe("unavailable");
    if (binding.status === "unavailable") {
      expect(binding.reason).toBe("grade_ceiling_violation");
    }
  });
});

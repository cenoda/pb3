import { describe, expect, it } from "vitest";
import type {
  EvidenceSourceRegistryFile,
  HumanVerificationFile,
  PerformanceEvidenceFile,
  PerformanceEvidenceRecord,
} from "../contract/prov4";
import { bindPerformanceEvidence } from "../provenance/bindPerformanceEvidence";
import { pilotBaselineKeyFor } from "../provenance/pilotBuild";

const ARTIFACT_SHA =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const registry: EvidenceSourceRegistryFile = {
  provenanceContractVersion: "prov4",
  registryVersion: "test",
  sources: [
    {
      sourceId: "src.first-party.lab",
      sourceClass: "first-party",
      rightsClass: "apache-2.0-project",
      title: "Lab",
      origin: "lab notes",
    },
    {
      sourceId: "src.project-synthetic.pilot",
      sourceClass: "project-synthetic",
      rightsClass: "apache-2.0-project",
      title: "Synthetic",
      origin: "fixtures",
    },
    {
      sourceId: "src.review.external",
      sourceClass: "external-review",
      rightsClass: "fair-use-citation",
      title: "Review",
      origin: "https://example.com",
      citation: "https://example.com/review",
    },
  ],
};

const capture = {
  protocolId: "proto.cp2077-raster-ultra-baseline",
  protocolVersion: "2026.08.1",
  runCount: 2,
  rangeDerivation: "repeated-run-min-max" as const,
  gamePatchVersion: "2.21",
  gpuDriverVersion: "560.00",
  toolName: "PresentMon",
  toolVersion: "2.0.0",
  graphicsSettings: {
    presetId: "preset.raster-ultra" as const,
    exactSettings: "Ultra, RT off",
  },
  powerThermal: {
    cpuPowerLimitId: "cpu-power.default" as const,
    gpuPowerLimitId: "gpu-power.default" as const,
    conditions: "ambient 22C",
  },
  rawArtifact: {
    kind: "repo-file" as const,
    locator: "benchmarks/prov4/raw/example.json",
    sha256: ARTIFACT_SHA,
    mediaType: "application/json",
    byteLength: 10,
  },
};

const buildPartIds = {
  caseId: "case.mid-tower-atx-01" as const,
  motherboardId: "mb.atx-b650-01" as const,
  cpuId: "cpu.zen4-7600" as const,
  gpuId: "gpu.rtx4070" as const,
  coolerId: "cooler.air-twin-tower-01" as const,
  ramId: "ram.ddr5-32gb-6000" as const,
  psuId: "psu.750w-atx" as const,
};

function measuredRow(
  overrides: Partial<PerformanceEvidenceRecord> = {},
): PerformanceEvidenceRecord {
  return {
    provenanceContractVersion: "prov4",
    evidenceId: "perf.1080p",
    key: pilotBaselineKeyFor("1080p"),
    buildPartIds,
    measurement: {
      metricKind: "first-party-measured",
      fpsMin: 90,
      fpsMax: 110,
      fpsAverage: 100,
      fpsOnePercentLow: 78,
      frametime: {
        status: "available",
        representation: "summary",
        summary: { sampleCount: 100, p50Ms: 10, p95Ms: 14, p99Ms: 18 },
      },
    },
    confidence: "medium",
    dataVersion: "test",
    basis: "lab",
    sourceIds: ["src.first-party.lab"],
    capturedAt: "2026-08-01T00:00:00Z",
    freshnessPolicy: { maxAgeDays: 365 },
    captureConditions: capture,
    ...overrides,
  };
}

function stubRow(
  resolution: "1080p" | "1440p" | "4k",
  evidenceId: string,
): PerformanceEvidenceRecord {
  return {
    provenanceContractVersion: "prov4",
    evidenceId,
    key: pilotBaselineKeyFor(resolution),
    buildPartIds,
    measurement: {
      metricKind: "synthetic-stub",
      fpsMin: 40,
      fpsMax: 60,
      fpsAverage: { status: "unavailable", reason: "stub" },
      fpsOnePercentLow: { status: "unavailable", reason: "stub" },
      frametime: { status: "unavailable", reason: "stub" },
    },
    confidence: "stub",
    dataVersion: "test",
    basis: "residual stub",
    sourceIds: ["src.project-synthetic.pilot"],
    capturedAt: "2026-08-01T00:00:00Z",
    freshnessPolicy: { maxAgeDays: 365 },
  };
}

const verifications: HumanVerificationFile = {
  provenanceContractVersion: "prov4",
  records: [
    {
      verificationId: "verify.high",
      kind: "performance-capture-attestation",
      verdict: "pass",
      reviewedAt: "2026-08-02T00:00:00Z",
      reviewerLabel: "owner",
      checklist: [
        "protocol",
        "tool",
        "patch",
        "driver",
        "settings",
        "power",
        "runs",
        "range",
        "charter",
        "digests",
      ],
      sourceIds: ["src.first-party.lab"],
      attestedArtifactDigests: [ARTIFACT_SHA],
    },
  ],
};

function fileWith(rows: PerformanceEvidenceRecord[]): PerformanceEvidenceFile {
  return {
    provenanceContractVersion: "prov4",
    dataVersion: "test",
    rows,
  };
}

const nowIso = "2026-08-09T00:00:00Z";

describe("bindPerformanceEvidence", () => {
  it("returns not_pilot_key when build is not pilot", () => {
    const binding = bindPerformanceEvidence({
      key: pilotBaselineKeyFor("1080p"),
      isPilotBuild: false,
      evidenceFile: fileWith([measuredRow()]),
      registry,
      verifications,
      nowIso,
    });
    expect(binding.status).toBe("unavailable");
    if (binding.status === "unavailable") {
      expect(binding.reason).toBe("not_pilot_key");
    }
  });

  it("returns missing_evidence_row when resolution absent", () => {
    const binding = bindPerformanceEvidence({
      key: pilotBaselineKeyFor("4k"),
      isPilotBuild: true,
      evidenceFile: fileWith([measuredRow()]),
      registry,
      verifications,
      nowIso,
    });
    expect(binding.status).toBe("unavailable");
    if (binding.status === "unavailable") {
      expect(binding.reason).toBe("missing_evidence_row");
    }
  });

  it("returns missing_source when registry id unresolved", () => {
    const binding = bindPerformanceEvidence({
      key: pilotBaselineKeyFor("1080p"),
      isPilotBuild: true,
      evidenceFile: fileWith([
        measuredRow({ sourceIds: ["src.does-not-exist"] }),
      ]),
      registry,
      verifications,
      nowIso,
    });
    expect(binding.status).toBe("unavailable");
    if (binding.status === "unavailable") {
      expect(binding.reason).toBe("missing_source");
    }
  });

  it("returns incomplete_capture_conditions when first-party lacks envelope", () => {
    const row = measuredRow();
    const { captureConditions: _c, ...rest } = row;
    const binding = bindPerformanceEvidence({
      key: pilotBaselineKeyFor("1080p"),
      isPilotBuild: true,
      evidenceFile: fileWith([rest as PerformanceEvidenceRecord]),
      registry,
      verifications,
      nowIso,
    });
    expect(binding.status).toBe("unavailable");
    if (binding.status === "unavailable") {
      expect(binding.reason).toBe("incomplete_capture_conditions");
    }
  });

  it("returns incomplete_capture_conditions when runCount < 2", () => {
    const binding = bindPerformanceEvidence({
      key: pilotBaselineKeyFor("1080p"),
      isPilotBuild: true,
      evidenceFile: fileWith([
        measuredRow({
          captureConditions: { ...capture, runCount: 1 },
        }),
      ]),
      registry,
      verifications,
      nowIso,
    });
    expect(binding.status).toBe("unavailable");
    if (binding.status === "unavailable") {
      expect(binding.reason).toBe("incomplete_capture_conditions");
    }
  });

  it("returns raw_artifact_integrity_failed when digest not verified", () => {
    const binding = bindPerformanceEvidence({
      key: pilotBaselineKeyFor("1080p"),
      isPilotBuild: true,
      evidenceFile: fileWith([measuredRow()]),
      registry,
      verifications,
      nowIso,
      verifiedArtifactDigests: new Set(),
    });
    expect(binding.status).toBe("unavailable");
    if (binding.status === "unavailable") {
      expect(binding.reason).toBe("raw_artifact_integrity_failed");
    }
  });

  it("returns confidence_ceiling_violation for high on synthetic-only", () => {
    const binding = bindPerformanceEvidence({
      key: pilotBaselineKeyFor("1080p"),
      isPilotBuild: true,
      evidenceFile: fileWith([
        measuredRow({
          confidence: "high",
          sourceIds: ["src.project-synthetic.pilot"],
          verificationId: "verify.high",
        }),
      ]),
      registry,
      verifications,
      nowIso,
    });
    expect(binding.status).toBe("unavailable");
    if (binding.status === "unavailable") {
      expect(binding.reason).toBe("confidence_ceiling_violation");
    }
  });

  it("returns verification_required when high lacks verificationId", () => {
    const binding = bindPerformanceEvidence({
      key: pilotBaselineKeyFor("1080p"),
      isPilotBuild: true,
      evidenceFile: fileWith([
        measuredRow({
          confidence: "high",
        }),
      ]),
      registry,
      verifications,
      nowIso,
    });
    expect(binding.status).toBe("unavailable");
    if (binding.status === "unavailable") {
      expect(binding.reason).toBe("verification_required");
    }
  });

  it("returns verification_failed when digests do not match", () => {
    const binding = bindPerformanceEvidence({
      key: pilotBaselineKeyFor("1080p"),
      isPilotBuild: true,
      evidenceFile: fileWith([
        measuredRow({
          confidence: "high",
          verificationId: "verify.high",
          captureConditions: {
            ...capture,
            rawArtifact: {
              ...capture.rawArtifact,
              sha256:
                "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            },
          },
        }),
      ]),
      registry,
      verifications,
      nowIso,
    });
    expect(binding.status).toBe("unavailable");
    if (binding.status === "unavailable") {
      expect(binding.reason).toBe("verification_failed");
    }
  });

  it("binds first-party medium and residual stub", () => {
    const measured = bindPerformanceEvidence({
      key: pilotBaselineKeyFor("1080p"),
      isPilotBuild: true,
      evidenceFile: fileWith([
        measuredRow(),
        stubRow("1440p", "perf.1440p"),
        stubRow("4k", "perf.4k"),
      ]),
      registry,
      verifications,
      nowIso,
      verifiedArtifactDigests: new Set([ARTIFACT_SHA]),
    });
    expect(measured.status).toBe("bound");
    if (measured.status === "bound") {
      expect(measured.evidence.confidence).toBe("medium");
      expect(measured.freshness.state).toBe("current");
    }

    const stub = bindPerformanceEvidence({
      key: pilotBaselineKeyFor("1440p"),
      isPilotBuild: true,
      evidenceFile: fileWith([
        measuredRow(),
        stubRow("1440p", "perf.1440p"),
        stubRow("4k", "perf.4k"),
      ]),
      registry,
      verifications,
      nowIso,
    });
    expect(stub.status).toBe("bound");
    if (stub.status === "bound") {
      expect(stub.evidence.measurement.metricKind).toBe("synthetic-stub");
    }
  });

  it("binds high when verification digests include capture sha256", () => {
    const binding = bindPerformanceEvidence({
      key: pilotBaselineKeyFor("1080p"),
      isPilotBuild: true,
      evidenceFile: fileWith([
        measuredRow({
          confidence: "high",
          verificationId: "verify.high",
        }),
      ]),
      registry,
      verifications,
      nowIso,
      verifiedArtifactDigests: new Set([ARTIFACT_SHA]),
    });
    expect(binding.status).toBe("bound");
    if (binding.status === "bound") {
      expect(binding.verification?.verdict).toBe("pass");
    }
  });
});

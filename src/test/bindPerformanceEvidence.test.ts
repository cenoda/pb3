import { describe, expect, it } from "vitest";
import type {
  EvidenceSourceRegistryFile,
  HumanVerificationFile,
  PerformanceEvidenceFile,
  PerformanceEvidenceRecord,
  SourceRightsRecordFile,
} from "../contract/prov4";
import {
  bindPerformanceEvidence,
  bindPerformanceEvidenceDetailed,
} from "../provenance/bindPerformanceEvidence";
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
    {
      sourceId: "src.review.external.b",
      sourceClass: "external-review",
      rightsClass: "fair-use-citation",
      title: "Review B",
      origin: "https://example.com/b",
      citation: "https://example.com/review-b",
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
  caseId: "case.fractal-design-north-tg-dark" as const,
  motherboardId: "motherboard.gigabyte-b650-aorus-elite-ax-v2" as const,
  cpuId: "cpu.amd-ryzen-5-7600" as const,
  gpuId: "gpu.asus-dual-rtx4070-o12g" as const,
  coolerId: "cooler.noctua-nh-d15-g2" as const,
  ramId: "ram.teamgroup-t-create-expert-ddr5-6000-32gb" as const,
  psuId: "psu.corsair-rm750e" as const,
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
    const binding = bindPerformanceEvidenceDetailed({
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
    expect(binding.binding.status).toBe("bound");
    if (binding.binding.status === "bound") {
      expect(binding.binding.verification?.verdict).toBe("pass");
    }
  });

  it("prefers external aggregate over synthetic stub when comparable observations exist", () => {
    const externalObservations = {
      provenanceContractVersion: "prov4" as const,
      dataVersion: "test-ext",
      observations: [
        {
          observationId: "o1",
          sourceId: "src.review.external",
          sourceUrl: "https://example.com/a",
          publishedAt: "2024-01-01",
          accessedAt: "2026-08-10",
          cpuId: "cpu.amd-ryzen-5-7600",
          gpuId: "gpu.asus-dual-rtx4070-o12g",
          gameId: "game.cyberpunk-2077",
          presetId: "preset.raster-ultra",
          exactSettings: "Ultra RT off DLSS off FG off",
          resolution: "1080p" as const,
          upscaleId: "upscale.off",
          frameGenId: "framegen.off",
          rayTracingState: "off" as const,
          fpsAverage: 82,
          testSystem: "bench",
          weighting: {
            sourceMethodQuality: "tier-a-reviewed" as const,
            conditionCompleteness: "full-disclosed" as const,
            recencyClass: "recent" as const,
          },
        },
        {
          observationId: "o2",
          sourceId: "src.review.external.b",
          sourceUrl: "https://example.com/b",
          publishedAt: "2024-01-02",
          accessedAt: "2026-08-11",
          cpuId: "cpu.amd-ryzen-5-7600",
          gpuId: "gpu.asus-dual-rtx4070-o12g",
          gameId: "game.cyberpunk-2077",
          presetId: "preset.raster-ultra",
          exactSettings: "Ultra RT off DLSS off FG off",
          resolution: "1080p" as const,
          upscaleId: "upscale.off",
          frameGenId: "framegen.off",
          rayTracingState: "off" as const,
          fpsAverage: 91,
          testSystem: "bench",
          weighting: {
            sourceMethodQuality: "tier-b-reviewed" as const,
            conditionCompleteness: "full-disclosed" as const,
            recencyClass: "recent" as const,
          },
        },
      ],
    };

    const sourceRights: SourceRightsRecordFile = {
      provenanceContractVersion: "prov4",
      recordVersion: "test",
      reviewedAt: "2026-08-09",
      reviewerLabel: "test",
      decisions: [
        {
          sourceId: "src.review.external",
          publisher: "Review A",
          canonicalUrl: "https://example.com/a",
          accessFindings: "public",
          robotsTermsFindings: "cite only",
          citationRights: "fair-use-citation",
          storeExtractedObservation: true,
          decision: "approved",
        },
        {
          sourceId: "src.review.external.b",
          publisher: "Review B",
          canonicalUrl: "https://example.com/b",
          accessFindings: "public",
          robotsTermsFindings: "cite only",
          citationRights: "fair-use-citation",
          storeExtractedObservation: true,
          decision: "approved",
        },
      ],
    };

    const binding = bindPerformanceEvidenceDetailed({
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
      externalObservations,
      sourceRights,
    });
    expect(binding.displayClass).toBe("aggregated");
    expect(binding.binding.status).toBe("bound");
    if (binding.binding.status === "bound") {
      expect(binding.binding.evidence.measurement.metricKind).toBe(
        "external-aggregated",
      );
      expect(binding.binding.evidence.confidence).toBe("low");
      expect(
        binding.binding.evidence.captureConditions?.rawArtifact,
      ).toBeUndefined();
      expect(binding.binding.evidence.capturedAt).toBe(
        "2026-08-11T00:00:00.000Z",
      );
      expect(binding.binding.evidence.capturedAt).not.toBe(
        "2026-08-09T00:00:00.000Z",
      );
    }
  });

  it("fails closed when external observations lack sourceRights", () => {
    const binding = bindPerformanceEvidenceDetailed({
      key: pilotBaselineKeyFor("1080p"),
      isPilotBuild: true,
      evidenceFile: fileWith([stubRow("1080p", "perf.1080p")]),
      registry,
      verifications,
      nowIso,
      externalObservations: {
        provenanceContractVersion: "prov4",
        dataVersion: "test",
        observations: [],
      },
    });
    expect(binding.displayClass).toBe("synthetic-perf1");
    expect(binding.binding.status).toBe("unavailable");
    if (binding.binding.status === "unavailable") {
      expect(binding.binding.reason).toBe("missing_source");
    }
  });

  it("falls back to synthetic-perf1 when external aggregate is unavailable", () => {
    const binding = bindPerformanceEvidenceDetailed({
      key: pilotBaselineKeyFor("1080p"),
      isPilotBuild: true,
      evidenceFile: fileWith([
        stubRow("1080p", "perf.1080p"),
        stubRow("1440p", "perf.1440p"),
        stubRow("4k", "perf.4k"),
      ]),
      registry,
      verifications,
      nowIso,
      externalObservations: {
        provenanceContractVersion: "prov4",
        dataVersion: "empty",
        observations: [],
      },
      sourceRights: {
        provenanceContractVersion: "prov4",
        recordVersion: "test",
        reviewedAt: "2026-08-09",
        reviewerLabel: "test",
        decisions: [],
      },
    });
    expect(binding.displayClass).toBe("synthetic-perf1");
    expect(binding.binding.status).toBe("unavailable");
    expect(binding.syntheticReference?.evidenceId).toBe("perf.1080p");
  });
});

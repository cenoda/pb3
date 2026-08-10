import { describe, expect, it } from "vitest";
import {
  evidenceSourceRegistryFileSchema,
  evidenceSourceSchema,
  geometryEvidenceRecordSchema,
  highGateDigestsIncludeCapture,
  humanVerificationRecordSchema,
  performanceCaptureConditionsSchema,
  performanceEvidenceFileSchema,
  performanceEvidenceRecordSchema,
  rawArtifactReferenceSchema,
} from "../contract/prov4.schema";

const ARTIFACT_SHA =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const validRawArtifact = {
  kind: "repo-file" as const,
  locator: "benchmarks/prov4/raw/example.json",
  sha256: ARTIFACT_SHA,
  mediaType: "application/json",
  byteLength: 128,
};

const validCaptureConditions = {
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
    exactSettings: "Ultra preset, RT off, DLSS off, FG off",
  },
  powerThermal: {
    cpuPowerLimitId: "cpu-power.default" as const,
    gpuPowerLimitId: "gpu-power.default" as const,
    conditions: "stock cooler ambient 22C sustained",
  },
  rawArtifact: validRawArtifact,
};

const pilotKey = {
  cpuId: "cpu.amd-ryzen-5-7600" as const,
  gpuId: "gpu.asus-dual-rtx4070-o12g" as const,
  gameId: "game.cyberpunk-2077" as const,
  presetId: "preset.raster-ultra" as const,
  resolution: "1080p" as const,
  upscaleId: "upscale.off" as const,
  frameGenId: "framegen.off" as const,
  ramTierId: "ram.32gb-ddr5" as const,
  powerProfileId: "power.default" as const,
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

function firstPartyMeasured(overrides: Record<string, unknown> = {}) {
  return {
    provenanceContractVersion: "prov4" as const,
    evidenceId: "perf.pilot.1080p.measured",
    key: pilotKey,
    buildPartIds,
    measurement: {
      metricKind: "first-party-measured" as const,
      fpsMin: 90,
      fpsMax: 110,
      fpsAverage: 100,
      fpsOnePercentLow: 78,
      frametime: {
        status: "available" as const,
        representation: "summary" as const,
        summary: {
          sampleCount: 1000,
          p50Ms: 10,
          p95Ms: 14,
          p99Ms: 18,
        },
      },
    },
    confidence: "medium" as const,
    dataVersion: "prov4-pilot-20260809",
    basis: "first-party lab capture (medium)",
    sourceIds: ["src.first-party.lab-cp2077"],
    capturedAt: "2026-08-01T12:00:00Z",
    freshnessPolicy: { maxAgeDays: 365 },
    captureConditions: validCaptureConditions,
    ...overrides,
  };
}

function syntheticStub(overrides: Record<string, unknown> = {}) {
  return {
    provenanceContractVersion: "prov4" as const,
    evidenceId: "perf.pilot.1440p.stub",
    key: { ...pilotKey, resolution: "1440p" as const },
    buildPartIds,
    measurement: {
      metricKind: "synthetic-stub" as const,
      fpsMin: 50,
      fpsMax: 70,
      fpsAverage: {
        status: "unavailable" as const,
        reason: "synthetic residual cell; no charter metrics",
      },
      fpsOnePercentLow: {
        status: "unavailable" as const,
        reason: "synthetic residual cell; no charter metrics",
      },
      frametime: {
        status: "unavailable" as const,
        reason: "synthetic residual cell; no charter metrics",
      },
    },
    confidence: "stub" as const,
    dataVersion: "prov4-pilot-20260809",
    basis: "residual synthetic stub for pilot disclosure continuity",
    sourceIds: ["src.project-synthetic.pilot"],
    capturedAt: "2026-08-01T12:00:00Z",
    freshnessPolicy: { maxAgeDays: 365 },
    ...overrides,
  };
}

function highMeasured(overrides: Record<string, unknown> = {}) {
  return firstPartyMeasured({
    evidenceId: "perf.pilot.1080p.high",
    confidence: "high",
    verificationId: "verify.perf.1080p.pass",
    basis: "first-party lab capture with attestation",
    ...overrides,
  });
}

function passAttestation(overrides: Record<string, unknown> = {}) {
  return {
    verificationId: "verify.perf.1080p.pass",
    kind: "performance-capture-attestation" as const,
    verdict: "pass" as const,
    reviewedAt: "2026-08-02T12:00:00Z",
    reviewerLabel: "owner-lab",
    checklist: [
      "protocol/version match",
      "tool/version match",
      "game patch match",
      "driver match",
      "graphics settings match",
      "power/thermal conditions match",
      "run count >= 2",
      "range derivation match",
      "charter metrics present",
      "raw artifact digests match",
    ],
    sourceIds: ["src.first-party.lab-cp2077"],
    attestedArtifactDigests: [ARTIFACT_SHA],
    ...overrides,
  };
}

describe("prov4.schema — RawArtifactReference", () => {
  it("accepts a structured artifact reference", () => {
    expect(rawArtifactReferenceSchema.safeParse(validRawArtifact).success).toBe(
      true,
    );
  });

  it("rejects bare string artifact refs", () => {
    expect(rawArtifactReferenceSchema.safeParse("trust-me-run-1").success).toBe(
      false,
    );
  });

  it("rejects uppercase or short sha256", () => {
    expect(
      rawArtifactReferenceSchema.safeParse({
        ...validRawArtifact,
        sha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      }).success,
    ).toBe(false);
    expect(
      rawArtifactReferenceSchema.safeParse({
        ...validRawArtifact,
        sha256: "abcd",
      }).success,
    ).toBe(false);
  });

  it("rejects non-positive byteLength", () => {
    expect(
      rawArtifactReferenceSchema.safeParse({
        ...validRawArtifact,
        byteLength: 0,
      }).success,
    ).toBe(false);
  });
});

describe("prov4.schema — first-party runCount gate", () => {
  it("accepts first-party-measured with runCount >= 2 at medium", () => {
    expect(
      performanceEvidenceRecordSchema.safeParse(firstPartyMeasured()).success,
    ).toBe(true);
  });

  it("rejects first-party-measured with runCount 0 (including medium)", () => {
    const parsed = performanceEvidenceRecordSchema.safeParse(
      firstPartyMeasured({
        confidence: "medium",
        captureConditions: { ...validCaptureConditions, runCount: 0 },
      }),
    );
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(
        parsed.error.issues.some((i) =>
          i.message.includes("runCount >= 2"),
        ),
      ).toBe(true);
    }
  });

  it("rejects first-party-measured with runCount 1 (including medium)", () => {
    const parsed = performanceEvidenceRecordSchema.safeParse(
      firstPartyMeasured({
        confidence: "medium",
        captureConditions: { ...validCaptureConditions, runCount: 1 },
      }),
    );
    expect(parsed.success).toBe(false);
  });

  it("rejects first-party-measured with runCount 0 at high", () => {
    expect(
      performanceEvidenceRecordSchema.safeParse(
        highMeasured({
          captureConditions: { ...validCaptureConditions, runCount: 0 },
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects first-party-measured with runCount 1 at high", () => {
    expect(
      performanceEvidenceRecordSchema.safeParse(
        highMeasured({
          captureConditions: { ...validCaptureConditions, runCount: 1 },
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects first-party-measured missing captureConditions", () => {
    const row = firstPartyMeasured();
    const { captureConditions: _omit, ...without } = row;
    expect(performanceEvidenceRecordSchema.safeParse(without).success).toBe(
      false,
    );
  });
});

describe("prov4.schema — high gate structural failures", () => {
  it("accepts a complete high first-party row", () => {
    expect(performanceEvidenceRecordSchema.safeParse(highMeasured()).success).toBe(
      true,
    );
  });

  it("rejects high without verificationId", () => {
    const row = highMeasured() as Record<string, unknown>;
    delete row.verificationId;
    expect(performanceEvidenceRecordSchema.safeParse(row).success).toBe(false);
  });

  it("rejects high with synthetic-fixture-range derivation", () => {
    expect(
      performanceEvidenceRecordSchema.safeParse(
        highMeasured({
          captureConditions: {
            ...validCaptureConditions,
            rangeDerivation: "synthetic-fixture-range",
          },
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects high with fps-only synthetic-stub measurement", () => {
    expect(
      performanceEvidenceRecordSchema.safeParse(
        syntheticStub({
          confidence: "high",
          verificationId: "verify.x",
          captureConditions: validCaptureConditions,
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects high missing captureConditions", () => {
    const row = highMeasured();
    const { captureConditions: _omit, ...without } = row;
    expect(performanceEvidenceRecordSchema.safeParse(without).success).toBe(
      false,
    );
  });

  it("rejects incomplete high that invents charter metrics as unavailable", () => {
    expect(
      performanceEvidenceRecordSchema.safeParse(
        highMeasured({
          measurement: {
            metricKind: "first-party-measured",
            fpsMin: 90,
            fpsMax: 110,
            fpsAverage: {
              status: "unavailable",
              reason: "missing",
            },
            fpsOnePercentLow: 78,
            frametime: {
              status: "available",
              representation: "summary",
              summary: {
                sampleCount: 10,
                p50Ms: 10,
                p95Ms: 12,
                p99Ms: 14,
              },
            },
          },
        }),
      ).success,
    ).toBe(false);
  });
});

describe("prov4.schema — synthetic stub and coupling", () => {
  it("accepts synthetic-stub residual cell", () => {
    expect(performanceEvidenceRecordSchema.safeParse(syntheticStub()).success).toBe(
      true,
    );
  });

  it("rejects stub confidence with first-party-measured", () => {
    expect(
      performanceEvidenceRecordSchema.safeParse(
        firstPartyMeasured({ confidence: "stub" }),
      ).success,
    ).toBe(false);
  });

  it("rejects fpsMin >= fpsMax", () => {
    expect(
      performanceEvidenceRecordSchema.safeParse(
        syntheticStub({
          measurement: {
            metricKind: "synthetic-stub",
            fpsMin: 70,
            fpsMax: 70,
            fpsAverage: {
              status: "unavailable",
              reason: "x",
            },
            fpsOnePercentLow: {
              status: "unavailable",
              reason: "x",
            },
            frametime: {
              status: "unavailable",
              reason: "x",
            },
          },
        }),
      ).success,
    ).toBe(false);
  });
});

describe("prov4.schema — performance file (exactly 3 rows)", () => {
  it("accepts exactly one row per resolution", () => {
    const file = {
      provenanceContractVersion: "prov4",
      dataVersion: "prov4-pilot-20260809",
      rows: [
        firstPartyMeasured({
          evidenceId: "a",
          key: { ...pilotKey, resolution: "1080p" },
        }),
        syntheticStub({
          evidenceId: "b",
          key: { ...pilotKey, resolution: "1440p" },
        }),
        syntheticStub({
          evidenceId: "c",
          key: { ...pilotKey, resolution: "4k" },
        }),
      ],
    };
    expect(performanceEvidenceFileSchema.safeParse(file).success).toBe(true);
  });

  it("rejects missing resolution row", () => {
    const file = {
      provenanceContractVersion: "prov4",
      dataVersion: "prov4-pilot-20260809",
      rows: [
        firstPartyMeasured({
          evidenceId: "a",
          key: { ...pilotKey, resolution: "1080p" },
        }),
        syntheticStub({
          evidenceId: "b",
          key: { ...pilotKey, resolution: "1440p" },
        }),
      ],
    };
    expect(performanceEvidenceFileSchema.safeParse(file).success).toBe(false);
  });
});

describe("prov4.schema — sources and verification", () => {
  it("requires citation for external-review", () => {
    expect(
      evidenceSourceSchema.safeParse({
        sourceId: "src.review.example",
        sourceClass: "external-review",
        rightsClass: "fair-use-citation",
        title: "Example review",
        origin: "https://example.com/review",
      }).success,
    ).toBe(false);
    expect(
      evidenceSourceSchema.safeParse({
        sourceId: "src.review.example",
        sourceClass: "external-review",
        rightsClass: "fair-use-citation",
        title: "Example review",
        origin: "https://example.com/review",
        citation: "https://example.com/review",
      }).success,
    ).toBe(true);
  });

  it("requires apache-2.0-project for project-synthetic", () => {
    expect(
      evidenceSourceSchema.safeParse({
        sourceId: "src.syn",
        sourceClass: "project-synthetic",
        rightsClass: "public-spec",
        title: "Synthetic",
        origin: "fixtures",
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate sourceIds in registry", () => {
    expect(
      evidenceSourceRegistryFileSchema.safeParse({
        provenanceContractVersion: "prov4",
        registryVersion: "1",
        sources: [
          {
            sourceId: "dup",
            sourceClass: "project-synthetic",
            rightsClass: "apache-2.0-project",
            title: "a",
            origin: "a",
          },
          {
            sourceId: "dup",
            sourceClass: "project-synthetic",
            rightsClass: "apache-2.0-project",
            title: "b",
            origin: "b",
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("requires attestedArtifactDigests for pass performance-capture-attestation", () => {
    expect(
      humanVerificationRecordSchema.safeParse(
        passAttestation({ attestedArtifactDigests: [] }),
      ).success,
    ).toBe(false);
    expect(
      humanVerificationRecordSchema.safeParse(
        passAttestation({ attestedArtifactDigests: undefined }),
      ).success,
    ).toBe(false);
    expect(humanVerificationRecordSchema.safeParse(passAttestation()).success).toBe(
      true,
    );
  });

  it("highGateDigestsIncludeCapture requires capture sha256 in digests", () => {
    const record = highMeasured();
    const ok = passAttestation();
    expect(highGateDigestsIncludeCapture(record as never, ok as never)).toBe(
      true,
    );
    expect(
      highGateDigestsIncludeCapture(
        record as never,
        passAttestation({
          attestedArtifactDigests: [
            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          ],
        }) as never,
      ),
    ).toBe(false);
  });
});

describe("prov4.schema — geometry", () => {
  it("accepts Experimental geometry without verificationId", () => {
    expect(
      geometryEvidenceRecordSchema.safeParse({
        provenanceContractVersion: "prov4",
        evidenceId: "geo.cpu.amd-ryzen-5-7600",
        partId: "cpu.amd-ryzen-5-7600",
        phys3EvidenceSourceId: "evidence.phys3.synthetic.cpu.amd-ryzen-5-7600",
        modelGrade: "Experimental",
        geometryDataVersion: "phys3-exp-20260808",
        sourceIds: ["src.project-synthetic.geometry"],
        reviewedAt: "2026-08-01T00:00:00Z",
        freshnessPolicy: { maxAgeDays: 365 },
        basis: "synthetic Experimental fixture",
      }).success,
    ).toBe(true);
  });

  it("requires verificationId for Community grade", () => {
    expect(
      geometryEvidenceRecordSchema.safeParse({
        provenanceContractVersion: "prov4",
        evidenceId: "geo.cpu",
        partId: "cpu.amd-ryzen-5-7600",
        phys3EvidenceSourceId: "evidence.phys3.synthetic.cpu.amd-ryzen-5-7600",
        modelGrade: "Community",
        geometryDataVersion: "phys3-exp-20260808",
        sourceIds: ["src.x"],
        reviewedAt: "2026-08-01T00:00:00Z",
        freshnessPolicy: {},
        basis: "community",
      }).success,
    ).toBe(false);
  });
});

describe("prov4.schema — captureConditions shape", () => {
  it("accepts valid capture conditions", () => {
    expect(
      performanceCaptureConditionsSchema.safeParse(validCaptureConditions)
        .success,
    ).toBe(true);
  });

  it("rejects captureConditions with string rawArtifact", () => {
    expect(
      performanceCaptureConditionsSchema.safeParse({
        ...validCaptureConditions,
        rawArtifact: "trust-me-run-1",
      }).success,
    ).toBe(false);
  });
});

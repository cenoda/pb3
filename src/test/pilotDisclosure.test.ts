import { describe, expect, it } from "vitest";
import { DEFAULT_BUILD_STATE_V2 } from "../contract/vs2";
import { PHYS3_GEOMETRY_DATA_VERSION } from "../contract/phys3";
import type { PhysicalSpec } from "../contract/phys3";
import type {
  CoolingProvenanceFile,
  EvidenceSourceRegistryFile,
  GeometryEvidenceFile,
  HumanVerificationFile,
  PerformanceEvidenceFile,
} from "../contract/prov4";
import { buildPilotDisclosureReport } from "../provenance/buildPilotDisclosureReport";
import {
  isPilotBuild,
  PILOT_PART_IDS,
  pilotBaselineKeyFor,
} from "../provenance/pilotBuild";

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
      origin: "lab",
    },
    {
      sourceId: "src.project-synthetic.pilot",
      sourceClass: "project-synthetic",
      rightsClass: "apache-2.0-project",
      title: "Synthetic",
      origin: "fixtures",
    },
    {
      sourceId: "src.project-synthetic.geometry",
      sourceClass: "project-synthetic",
      rightsClass: "apache-2.0-project",
      title: "Geometry",
      origin: "parts",
    },
  ],
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

const capture = {
  protocolId: "proto.x",
  protocolVersion: "1",
  runCount: 2,
  rangeDerivation: "repeated-run-min-max" as const,
  gamePatchVersion: "2.21",
  gpuDriverVersion: "560",
  toolName: "PresentMon",
  toolVersion: "2",
  graphicsSettings: {
    presetId: "preset.raster-ultra" as const,
    exactSettings: "Ultra",
  },
  powerThermal: {
    cpuPowerLimitId: "cpu-power.default" as const,
    gpuPowerLimitId: "gpu-power.default" as const,
    conditions: "ok",
  },
  rawArtifact: {
    kind: "lab-archive" as const,
    locator: "lab://run-1",
    sha256: ARTIFACT_SHA,
    mediaType: "application/json",
    byteLength: 12,
  },
};

function performanceFile(): PerformanceEvidenceFile {
  return {
    provenanceContractVersion: "prov4",
    dataVersion: "test",
    rows: [
      {
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
            summary: { sampleCount: 10, p50Ms: 10, p95Ms: 12, p99Ms: 14 },
          },
        },
        confidence: "medium",
        dataVersion: "test",
        basis: "measured",
        sourceIds: ["src.first-party.lab"],
        capturedAt: "2026-08-01T00:00:00Z",
        freshnessPolicy: { maxAgeDays: 365 },
        captureConditions: capture,
      },
      ...(["1440p", "4k"] as const).map((resolution) => ({
        provenanceContractVersion: "prov4" as const,
        evidenceId: `perf.${resolution}`,
        key: pilotBaselineKeyFor(resolution),
        buildPartIds,
        measurement: {
          metricKind: "synthetic-stub" as const,
          fpsMin: 40,
          fpsMax: 60,
          fpsAverage: { status: "unavailable" as const, reason: "stub" },
          fpsOnePercentLow: {
            status: "unavailable" as const,
            reason: "stub",
          },
          frametime: { status: "unavailable" as const, reason: "stub" },
        },
        confidence: "stub" as const,
        dataVersion: "test",
        basis: "residual stub",
        sourceIds: ["src.project-synthetic.pilot"],
        capturedAt: "2026-08-01T00:00:00Z",
        freshnessPolicy: { maxAgeDays: 365 },
      })),
    ],
  };
}

function geometryFile(): GeometryEvidenceFile {
  return {
    provenanceContractVersion: "prov4",
    dataVersion: "test",
    rows: PILOT_PART_IDS.map((partId) => ({
      provenanceContractVersion: "prov4" as const,
      evidenceId: `geo.${partId}`,
      partId,
      phys3EvidenceSourceId: `evidence.phys3.synthetic.${partId}`,
      modelGrade: "Experimental" as const,
      geometryDataVersion: PHYS3_GEOMETRY_DATA_VERSION,
      sourceIds: ["src.project-synthetic.geometry"],
      reviewedAt: "2026-08-01T00:00:00Z",
      freshnessPolicy: { maxAgeDays: 365 },
      basis: "Experimental",
    })),
  };
}

function specsMap(): Map<string, PhysicalSpec | undefined> {
  const map = new Map<string, PhysicalSpec | undefined>();
  for (const partId of PILOT_PART_IDS) {
    map.set(partId, {
      physicalContractVersion: "phys3",
      evidence: {
        sourceId: `evidence.phys3.synthetic.${partId}`,
        geometryDataVersion: PHYS3_GEOMETRY_DATA_VERSION,
        modelGrade: "Experimental",
        basis: "synthetic",
      },
      anchors: [],
      sockets: [],
      collisionNodes: [],
      clearanceNodes: [],
    });
  }
  return map;
}

const emptyCooling: CoolingProvenanceFile = {
  provenanceContractVersion: "prov4",
  dataVersion: "test",
  rows: [],
};

const verifications: HumanVerificationFile = {
  provenanceContractVersion: "prov4",
  records: [],
};

describe("pilotBuild + buildPilotDisclosureReport", () => {
  it("recognizes DEFAULT_BUILD_STATE_V2 as the pilot build", () => {
    expect(isPilotBuild(DEFAULT_BUILD_STATE_V2)).toBe(true);
    expect(
      isPilotBuild({
        ...DEFAULT_BUILD_STATE_V2,
        gpuId: "gpu.rtx4080",
      }),
    ).toBe(false);
  });

  it("always emits 3 performance + 7 geometry bindings for pilot", () => {
    const report = buildPilotDisclosureReport({
      state: DEFAULT_BUILD_STATE_V2,
      physicalSpecsByPartId: specsMap(),
      registry,
      performance: performanceFile(),
      geometry: geometryFile(),
      cooling: emptyCooling,
      verifications,
      nowIso: "2026-08-09T00:00:00Z",
    });
    expect(report.isPilotBuild).toBe(true);
    expect(report.performance).toHaveLength(3);
    expect(report.geometry).toHaveLength(7);
    expect(report.performance.every((b) => b.status === "bound")).toBe(true);
    expect(report.geometry.every((b) => b.status === "bound")).toBe(true);
    expect(report.cooling.status).toBe("unavailable");
    if (report.cooling.status === "unavailable") {
      expect(report.cooling.reason).toBe("empty_production_rows");
    }
    expect(report.limitations.some((l) => /synthetic-stub/i.test(l))).toBe(
      true,
    );
  });

  it("marks non-pilot builds inactive without inventing overlay rows", () => {
    const report = buildPilotDisclosureReport({
      state: { ...DEFAULT_BUILD_STATE_V2, gpuId: "gpu.rtx4080" },
      physicalSpecsByPartId: specsMap(),
      registry,
      performance: performanceFile(),
      geometry: geometryFile(),
      cooling: emptyCooling,
      verifications,
      nowIso: "2026-08-09T00:00:00Z",
    });
    expect(report.isPilotBuild).toBe(false);
    expect(report.performance).toHaveLength(0);
    expect(report.geometry).toHaveLength(0);
  });
});

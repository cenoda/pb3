import { describe, expect, it } from "vitest";
import type {
  ExternalPerformanceObservation,
  SourceRightsRecordFile,
} from "../contract/prov4";
import { aggregateComparableObservations } from "../provenance/aggregatePerformanceEvidence";
import { pilotBaselineKeyFor } from "../provenance/pilotBuild";

function obs(
  overrides: Partial<ExternalPerformanceObservation> & {
    observationId: string;
    sourceId: string;
    fpsAverage?: number;
  },
): ExternalPerformanceObservation {
  return {
    sourceUrl: "https://example.com/review",
    publishedAt: "2024-01-01",
    accessedAt: "2026-08-09",
    cpuId: "cpu.amd-ryzen-5-7600",
    gpuId: "gpu.asus-dual-rtx4070-o12g",
    gameId: "game.cyberpunk-2077",
    presetId: "preset.raster-ultra",
    exactSettings: "Ultra RT off DLSS off FG off",
    resolution: "1080p",
    upscaleId: "upscale.off",
    frameGenId: "framegen.off",
    rayTracingState: "off",
    testSystem: "review bench",
    weighting: {
      sourceMethodQuality: "tier-a-reviewed",
      conditionCompleteness: "full-disclosed",
      recencyClass: "recent",
    },
    ...overrides,
  };
}

function rightsFor(...sourceIds: string[]): SourceRightsRecordFile {
  return {
    provenanceContractVersion: "prov4",
    recordVersion: "test-rights",
    reviewedAt: "2026-08-09",
    reviewerLabel: "test",
    decisions: sourceIds.map((sourceId) => ({
      sourceId,
      publisher: sourceId,
      canonicalUrl: `https://example.com/${sourceId}`,
      accessFindings: "public",
      robotsTermsFindings: "cite only",
      citationRights: "fair-use-citation" as const,
      storeExtractedObservation: true,
      decision: "approved" as const,
    })),
  };
}

describe("aggregateComparableObservations", () => {
  it("returns unavailable when no observations exist", () => {
    const result = aggregateComparableObservations(
      pilotBaselineKeyFor("1080p"),
      [],
      rightsFor(),
    );
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.reason).toBe("no_observations");
    }
  });

  it("excludes cpu mismatch observations with reasons", () => {
    const result = aggregateComparableObservations(
      pilotBaselineKeyFor("1080p"),
      [
        obs({
          observationId: "o1",
          sourceId: "src.a",
          cpuId: "cpu.amd-ryzen-7-7800x3d",
          fpsAverage: 100,
        }),
      ],
      rightsFor("src.a"),
    );
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.reason).toBe("no_comparable_observations");
      expect(result.exclusionReasons[0]?.reason).toBe("cpu_mismatch");
    }
  });

  it("returns unavailable for single average-only observation", () => {
    const result = aggregateComparableObservations(
      pilotBaselineKeyFor("1080p"),
      [obs({ observationId: "o1", sourceId: "src.a", fpsAverage: 88 })],
      rightsFor("src.a"),
    );
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.reason).toBe("single_average_only");
      expect(result.referenceObservationIds).toEqual(["o1"]);
    }
  });

  it("aggregates two independent observations into low-confidence range", () => {
    const result = aggregateComparableObservations(
      pilotBaselineKeyFor("1080p"),
      [
        obs({ observationId: "o1", sourceId: "src.a", fpsAverage: 82 }),
        obs({ observationId: "o2", sourceId: "src.b", fpsAverage: 91 }),
      ],
      rightsFor("src.a", "src.b"),
    );
    expect(result.status).toBe("aggregated");
    if (result.status === "aggregated") {
      expect(result.fpsMin).toBe(82);
      expect(result.fpsMax).toBe(91);
      expect(result.confidence).toBe("low");
      expect(result.aggregationMethod).toBe("two-observation-range");
    }
  });

  it("uses weighted percentiles for three or more observations", () => {
    const result = aggregateComparableObservations(
      pilotBaselineKeyFor("1080p"),
      [
        obs({ observationId: "o1", sourceId: "src.a", fpsAverage: 80 }),
        obs({ observationId: "o2", sourceId: "src.b", fpsAverage: 90 }),
        obs({ observationId: "o3", sourceId: "src.c", fpsAverage: 100 }),
      ],
      rightsFor("src.a", "src.b", "src.c"),
    );
    expect(result.status).toBe("aggregated");
    if (result.status === "aggregated") {
      expect(result.confidence).toBe("medium");
      expect(result.aggregationMethod).toBe("three-plus-weighted-percentiles");
      expect(result.fpsMin).toBeLessThan(result.fpsMax);
    }
  });

  it("preserves published range for single observation with range", () => {
    const result = aggregateComparableObservations(
      pilotBaselineKeyFor("1080p"),
      [
        obs({
          observationId: "o1",
          sourceId: "src.a",
          fpsAverage: 85,
          fpsRangeMin: 80,
          fpsRangeMax: 90,
        }),
      ],
      rightsFor("src.a"),
    );
    expect(result.status).toBe("aggregated");
    if (result.status === "aggregated") {
      expect(result.fpsMin).toBe(80);
      expect(result.fpsMax).toBe(90);
      expect(result.aggregationMethod).toBe("published-range");
      expect(result.confidence).toBe("low");
    }
  });

  it("does not interpolate across resolutions", () => {
    const result = aggregateComparableObservations(
      pilotBaselineKeyFor("1440p"),
      [
        obs({
          observationId: "o1",
          sourceId: "src.a",
          resolution: "1080p",
          fpsAverage: 90,
        }),
      ],
      rightsFor("src.a"),
    );
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.exclusionReasons[0]?.reason).toBe("resolution_mismatch");
    }
  });

  it("does not aggregate when source rights deny extraction", () => {
    const denied: SourceRightsRecordFile = {
      provenanceContractVersion: "prov4",
      recordVersion: "test",
      reviewedAt: "2026-08-09",
      reviewerLabel: "test",
      decisions: [
        {
          sourceId: "src.a",
          publisher: "A",
          canonicalUrl: "https://example.com/a",
          accessFindings: "public",
          robotsTermsFindings: "metadata",
          citationRights: "fair-use-citation",
          storeExtractedObservation: false,
          decision: "approved-metadata-only",
        },
        {
          sourceId: "src.b",
          publisher: "B",
          canonicalUrl: "https://example.com/b",
          accessFindings: "public",
          robotsTermsFindings: "metadata",
          citationRights: "fair-use-citation",
          storeExtractedObservation: false,
          decision: "approved-metadata-only",
        },
      ],
    };
    const result = aggregateComparableObservations(
      pilotBaselineKeyFor("1080p"),
      [
        obs({ observationId: "o1", sourceId: "src.a", fpsAverage: 82 }),
        obs({ observationId: "o2", sourceId: "src.b", fpsAverage: 91 }),
      ],
      denied,
    );
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(
        result.exclusionReasons.every(
          (e) => e.reason === "source_rights_denied",
        ),
      ).toBe(true);
    }
  });
});

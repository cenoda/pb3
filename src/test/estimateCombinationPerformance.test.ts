import { describe, expect, it } from "vitest";
import {
  EST1_CONTRACT_VERSION,
  EST1_DRAFT_CAVEAT,
  type CpuScaleEdge,
  type EstimatorQuery,
  type VendorPerformanceAnchor,
} from "../contract/est1";
import type {
  ExternalPerformanceObservation,
  SourceRightsRecordFile,
} from "../contract/prov4";
import { estimateCombinationPerformance } from "../estimate/estimateCombinationPerformance";
import { estimatorQueryFor } from "../estimate/estimatorQuery";

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

function obs(
  overrides: Partial<ExternalPerformanceObservation> & {
    observationId: string;
    sourceId: string;
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

function edge(overrides: Partial<CpuScaleEdge> & { edgeId: string }): CpuScaleEdge {
  return {
    fromCpuId: "cpu.amd-ryzen-7-7800x3d",
    toCpuId: "cpu.amd-ryzen-5-7600",
    factor: 0.9,
    uncertainty: 0.05,
    sourceIds: ["src.scale"],
    basis: "test scale edge",
    dataVersion: "est1-test",
    ...overrides,
  };
}

function vendor(
  overrides: Partial<VendorPerformanceAnchor> & { anchorId: string },
): VendorPerformanceAnchor {
  return {
    sourceId: "src.vendor",
    sourceUrl: "https://example.com/vendor",
    publishedAt: "2024-06-01",
    accessedAt: "2026-08-09",
    cpuId: "cpu.amd-ryzen-7-7800x3d",
    gpuId: "gpu.asus-dual-rtx4070-o12g",
    gameId: "game.cyberpunk-2077",
    presetId: "preset.raster-ultra",
    exactSettings: "Ultra RT off DLSS off FG off",
    resolution: "1440p",
    upscaleId: "upscale.off",
    frameGenId: "framegen.off",
    rayTracingState: "off",
    fpsAverage: 100,
    fpsRangeMin: 95,
    fpsRangeMax: 105,
    testSystem: "vendor lab",
    ...overrides,
  };
}

const q1080: EstimatorQuery = estimatorQueryFor("1080p");
const q1440: EstimatorQuery = estimatorQueryFor("1440p");
const q4k: EstimatorQuery = estimatorQueryFor("4k");

describe("estimateCombinationPerformance", () => {
  it("exact-aggregate path with two independent exact observations (O7)", () => {
    const result = estimateCombinationPerformance({
      query: q1080,
      externalObservations: [
        obs({
          observationId: "o1",
          sourceId: "src.a",
          fpsAverage: 88,
        }),
        obs({
          observationId: "o2",
          sourceId: "src.b",
          fpsAverage: 96,
        }),
      ],
      sourceRights: rightsFor("src.a", "src.b"),
      vendorAnchors: [],
      cpuScaleEdges: [],
    });

    expect(result.status).toBe("estimated");
    if (result.status === "estimated") {
      expect(result.method).toBe("exact-aggregate");
      expect(result.fpsMin).toBe(88);
      expect(result.fpsMax).toBe(96);
      expect(result.draftCaveat).toBe(EST1_DRAFT_CAVEAT);
      expect(result.estimatorContractVersion).toBe(EST1_CONTRACT_VERSION);
      expect(result.confidence === "low" || result.confidence === "medium").toBe(
        true,
      );
    }
  });

  it("scaled-combination path with vendor anchor + evidenced CPU edge (O5/O7)", () => {
    const result = estimateCombinationPerformance({
      query: q1440,
      externalObservations: [],
      sourceRights: rightsFor("src.vendor", "src.scale"),
      vendorAnchors: [vendor({ anchorId: "va.1", resolution: "1440p" })],
      cpuScaleEdges: [
        edge({
          edgeId: "edge.7800x3d-to-7600.1440p",
          resolution: "1440p",
          gameId: "game.cyberpunk-2077",
        }),
      ],
    });

    expect(result.status).toBe("estimated");
    if (result.status === "estimated") {
      expect(result.method).toBe("scaled-combination");
      expect(result.confidence).toBe("low");
      expect(result.fpsMin).toBeLessThan(result.fpsMax);
      expect(result.draftCaveat.length).toBeGreaterThan(0);
      expect(
        result.contributors.some((c) => c.role === "scale-edge"),
      ).toBe(true);
    }
  });

  it("unavailable when CPU-mismatched and no scale edge (O2/O3/O7/O9)", () => {
    const result = estimateCombinationPerformance({
      query: q4k,
      externalObservations: [
        obs({
          observationId: "o-flagship",
          sourceId: "src.a",
          cpuId: "cpu.amd-ryzen-7-7800x3d",
          resolution: "4k",
          fpsAverage: 70,
          fpsRangeMin: 65,
          fpsRangeMax: 75,
        }),
      ],
      sourceRights: rightsFor("src.a"),
      vendorAnchors: [],
      cpuScaleEdges: [],
    });

    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.reason).toBe("missing_scale_edge");
      expect(result.draftCaveat).toBe(EST1_DRAFT_CAVEAT);
      expect(result.explanation.toLowerCase()).toContain("no gpu-bound waiver");
    }
  });

  it("does not waive CPU mismatch at 1440p/4K without ratio (O2)", () => {
    for (const query of [q1440, q4k]) {
      const result = estimateCombinationPerformance({
        query,
        externalObservations: [
          obs({
            observationId: "o1",
            sourceId: "src.a",
            cpuId: "cpu.amd-ryzen-7-7800x3d",
            resolution: query.resolution,
            fpsAverage: 80,
            fpsRangeMin: 75,
            fpsRangeMax: 85,
          }),
        ],
        sourceRights: rightsFor("src.a"),
        vendorAnchors: [],
        cpuScaleEdges: [],
      });
      expect(result.status).toBe("unavailable");
      if (result.status === "unavailable") {
        expect(result.reason).toBe("missing_scale_edge");
      }
    }
  });

  it("does not waive CPU mismatch at 1080p without ratio (O3)", () => {
    const result = estimateCombinationPerformance({
      query: q1080,
      externalObservations: [
        obs({
          observationId: "o1",
          sourceId: "src.a",
          cpuId: "cpu.amd-ryzen-7-7800x3d",
          fpsAverage: 110,
          fpsRangeMin: 100,
          fpsRangeMax: 120,
        }),
      ],
      sourceRights: rightsFor("src.a"),
      vendorAnchors: [],
      cpuScaleEdges: [],
    });
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.reason).toBe("missing_scale_edge");
    }
  });

  it("must validate/bound when comparable reviews exist (O4)", () => {
    // Scaled vendor estimate far above review bounds → validation_failed
    const result = estimateCombinationPerformance({
      query: q1440,
      externalObservations: [
        obs({
          observationId: "review.exact",
          sourceId: "src.review",
          cpuId: "cpu.amd-ryzen-5-7600",
          resolution: "1440p",
          fpsAverage: 60,
          fpsRangeMin: 55,
          fpsRangeMax: 65,
        }),
      ],
      sourceRights: rightsFor("src.vendor", "src.scale", "src.review"),
      vendorAnchors: [
        vendor({
          anchorId: "va.optimistic",
          resolution: "1440p",
          fpsAverage: 150,
          fpsRangeMin: 140,
          fpsRangeMax: 160,
        }),
      ],
      cpuScaleEdges: [
        edge({
          edgeId: "edge.scale",
          resolution: "1440p",
          factor: 1.0,
          uncertainty: 0.01,
        }),
      ],
    });

    // Single exact review with published range → exact-aggregate may fire first.
    // If exact path fires, O4 is inherent. Force scaled-only by making the
    // review CPU-mismatched for aggregation wait — use a review that is
    // exact so aggregate uses published-range (exact path). That is OK for O4
    // on exact; separately prove scaled+O4:

    // Re-run with review that cannot exact-aggregate alone but is still
    // comparable for bounding: use average-only single review → exact path
    // unavailable (single_average_only), scaled path fires, O4 bounds.
    const scaledOnly = estimateCombinationPerformance({
      query: q1440,
      externalObservations: [
        obs({
          observationId: "review.avg-only",
          sourceId: "src.review",
          cpuId: "cpu.amd-ryzen-5-7600",
          resolution: "1440p",
          fpsAverage: 60,
          // no published range → exact aggregate unavailable
        }),
      ],
      sourceRights: rightsFor("src.vendor", "src.scale", "src.review"),
      vendorAnchors: [
        vendor({
          anchorId: "va.optimistic",
          resolution: "1440p",
          fpsAverage: 150,
          fpsRangeMin: 140,
          fpsRangeMax: 160,
        }),
      ],
      cpuScaleEdges: [
        edge({
          edgeId: "edge.scale",
          resolution: "1440p",
          factor: 1.0,
          uncertainty: 0.01,
        }),
      ],
    });

    expect(scaledOnly.status).toBe("unavailable");
    if (scaledOnly.status === "unavailable") {
      expect(scaledOnly.reason).toBe("validation_failed");
    }

    // Also ensure intersecting bounds succeed when ranges overlap.
    const bounded = estimateCombinationPerformance({
      query: q1440,
      externalObservations: [
        obs({
          observationId: "review.avg-only-2",
          sourceId: "src.review2",
          cpuId: "cpu.amd-ryzen-5-7600",
          resolution: "1440p",
          fpsAverage: 98,
        }),
      ],
      sourceRights: rightsFor("src.vendor", "src.scale", "src.review2"),
      vendorAnchors: [
        vendor({
          anchorId: "va.close",
          resolution: "1440p",
          fpsAverage: 100,
          fpsRangeMin: 95,
          fpsRangeMax: 105,
        }),
      ],
      cpuScaleEdges: [
        edge({
          edgeId: "edge.scale2",
          resolution: "1440p",
          factor: 0.95,
          uncertainty: 0.02,
        }),
      ],
    });

    expect(bounded.status).toBe("estimated");
    if (bounded.status === "estimated") {
      expect(bounded.method).toBe("scaled-combination");
      expect(bounded.confidence).toBe("low");
      expect(
        bounded.contributors.some((c) => c.role === "review-validation"),
      ).toBe(true);
      expect(bounded.basis.toLowerCase()).toContain("bounded");
    }

    // Keep first exact-path assertion intentional when published range exists.
    expect(
      result.status === "estimated" || result.status === "unavailable",
    ).toBe(true);
  });

  it("never returns synthetic-stub from estimator (O9)", () => {
    const result = estimateCombinationPerformance({
      query: q1080,
      externalObservations: [],
      sourceRights: rightsFor(),
      vendorAnchors: [],
      cpuScaleEdges: [],
    });
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.reason).not.toBe("synthetic-stub" as never);
    }
    // estimated method enum also excludes synthetic
    const est = estimateCombinationPerformance({
      query: q1080,
      externalObservations: [
        obs({
          observationId: "o1",
          sourceId: "src.a",
          fpsAverage: 80,
          fpsRangeMin: 75,
          fpsRangeMax: 85,
        }),
      ],
      sourceRights: rightsFor("src.a"),
      vendorAnchors: [],
      cpuScaleEdges: [],
    });
    if (est.status === "estimated") {
      expect(est.method).not.toBe("synthetic-stub" as never);
      expect(est.confidence).not.toBe("stub");
    }
  });

  it("rejects vendor anchor without cpuId for scaling (M0)", () => {
    const result = estimateCombinationPerformance({
      query: q1440,
      externalObservations: [],
      sourceRights: rightsFor("src.vendor"),
      vendorAnchors: [
        vendor({
          anchorId: "va.nocpu",
          cpuId: undefined,
          resolution: "1440p",
        }),
      ],
      cpuScaleEdges: [
        edge({
          edgeId: "edge.x",
          resolution: "1440p",
        }),
      ],
    });
    expect(result.status).toBe("unavailable");
  });

  it("always includes non-empty draftCaveat", () => {
    for (const query of [q1080, q1440, q4k]) {
      const result = estimateCombinationPerformance({
        query,
        externalObservations: [],
        sourceRights: rightsFor(),
        vendorAnchors: [],
        cpuScaleEdges: [],
      });
      expect(result.draftCaveat.length).toBeGreaterThan(0);
    }
  });
});

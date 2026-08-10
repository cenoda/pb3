import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  cpuScaleEdgeFileSchema,
  vendorPerformanceAnchorFileSchema,
} from "../contract/est1.schema";
import { estimateCombinationPerformance } from "../estimate/estimateCombinationPerformance";
import { estimatorQueryFor } from "../estimate/estimatorQuery";
import type {
  ExternalPerformanceObservation,
  SourceRightsRecordFile,
} from "../contract/prov4";
import type { CpuScaleEdge } from "../contract/est1";

const ROOT = resolve(__dirname, "../..");

function readJson(rel: string): unknown {
  return JSON.parse(readFileSync(resolve(ROOT, rel), "utf8"));
}

describe("est1 integrity", () => {
  it("parses on-disk cpu-scale-edges and vendor anchors", () => {
    const edges = cpuScaleEdgeFileSchema.parse(
      readJson("benchmarks/est1/cpu-scale-edges.json"),
    );
    const anchors = vendorPerformanceAnchorFileSchema.parse(
      readJson("benchmarks/est1/vendor-performance-anchors.json"),
    );
    expect(edges.estimatorContractVersion).toBe("est1");
    expect(anchors.estimatorContractVersion).toBe("est1");
    // Honest empty corpus is valid — path proofs live in unit tests.
    expect(Array.isArray(edges.edges)).toBe(true);
    expect(Array.isArray(anchors.anchors)).toBe(true);
  });

  it("shipped empty corpus yields unavailable for pilot × 3 (not synthetic)", () => {
    const edges = cpuScaleEdgeFileSchema.parse(
      readJson("benchmarks/est1/cpu-scale-edges.json"),
    );
    const anchors = vendorPerformanceAnchorFileSchema.parse(
      readJson("benchmarks/est1/vendor-performance-anchors.json"),
    );
    const emptyRights: SourceRightsRecordFile = {
      provenanceContractVersion: "prov4",
      recordVersion: "empty",
      reviewedAt: "2026-08-09",
      reviewerLabel: "integrity",
      decisions: [],
    };

    for (const resolution of ["1080p", "1440p", "4k"] as const) {
      const result = estimateCombinationPerformance({
        query: estimatorQueryFor(resolution),
        externalObservations: [],
        sourceRights: emptyRights,
        vendorAnchors: anchors.anchors,
        cpuScaleEdges: edges.edges,
      });
      expect(result.status).toBe("unavailable");
      expect(result.draftCaveat.length).toBeGreaterThan(0);
    }
  });

  it("path matrix: exact / scaled / unavailable via in-memory fixtures (O7)", () => {
    const rights: SourceRightsRecordFile = {
      provenanceContractVersion: "prov4",
      recordVersion: "path-matrix",
      reviewedAt: "2026-08-09",
      reviewerLabel: "integrity",
      decisions: ["src.a", "src.b", "src.vendor", "src.scale"].map(
        (sourceId) => ({
          sourceId,
          publisher: sourceId,
          canonicalUrl: `https://example.com/${sourceId}`,
          accessFindings: "public",
          robotsTermsFindings: "ok",
          citationRights: "fair-use-citation" as const,
          storeExtractedObservation: true,
          decision: "approved" as const,
        }),
      ),
    };

    const baseObs = (
      overrides: Partial<ExternalPerformanceObservation> & {
        observationId: string;
        sourceId: string;
      },
    ): ExternalPerformanceObservation => ({
      sourceUrl: "https://example.com",
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
      testSystem: "lab",
      weighting: {
        sourceMethodQuality: "tier-a-reviewed",
        conditionCompleteness: "full-disclosed",
        recencyClass: "recent",
      },
      ...overrides,
    });

    const exact = estimateCombinationPerformance({
      query: estimatorQueryFor("1080p"),
      externalObservations: [
        baseObs({
          observationId: "e1",
          sourceId: "src.a",
          fpsAverage: 90,
        }),
        baseObs({
          observationId: "e2",
          sourceId: "src.b",
          fpsAverage: 100,
        }),
      ],
      sourceRights: rights,
      vendorAnchors: [],
      cpuScaleEdges: [],
    });
    expect(exact.status).toBe("estimated");
    if (exact.status === "estimated") {
      expect(exact.method).toBe("exact-aggregate");
    }

    const scaleEdge: CpuScaleEdge = {
      edgeId: "edge.path",
      fromCpuId: "cpu.amd-ryzen-7-7800x3d",
      toCpuId: "cpu.amd-ryzen-5-7600",
      resolution: "1440p",
      factor: 0.92,
      uncertainty: 0.04,
      sourceIds: ["src.scale"],
      basis: "path-proof edge (test-only semantics)",
      dataVersion: "est1-test",
    };

    const scaled = estimateCombinationPerformance({
      query: estimatorQueryFor("1440p"),
      externalObservations: [],
      sourceRights: rights,
      vendorAnchors: [
        {
          anchorId: "va.path",
          sourceId: "src.vendor",
          sourceUrl: "https://example.com/v",
          publishedAt: "2024-01-01",
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
          fpsAverage: 110,
          fpsRangeMin: 100,
          fpsRangeMax: 120,
          testSystem: "vendor",
        },
      ],
      cpuScaleEdges: [scaleEdge],
    });
    expect(scaled.status).toBe("estimated");
    if (scaled.status === "estimated") {
      expect(scaled.method).toBe("scaled-combination");
      expect(scaled.confidence).toBe("low");
    }

    const unavailable = estimateCombinationPerformance({
      query: estimatorQueryFor("4k"),
      externalObservations: [
        baseObs({
          observationId: "u1",
          sourceId: "src.a",
          cpuId: "cpu.amd-ryzen-7-7800x3d",
          resolution: "4k",
          fpsAverage: 55,
          fpsRangeMin: 50,
          fpsRangeMax: 60,
        }),
      ],
      sourceRights: rights,
      vendorAnchors: [],
      cpuScaleEdges: [],
    });
    expect(unavailable.status).toBe("unavailable");
    if (unavailable.status === "unavailable") {
      expect(unavailable.reason).toBe("missing_scale_edge");
    }
  });
});

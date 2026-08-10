import { describe, expect, it } from "vitest";
import type {
  ExternalPerformanceObservation,
  SourceRightsRecordFile,
} from "../contract/prov4";
import { groupComparableObservations } from "../provenance/groupComparablePerformance";
import { pilotBaselineKeyFor } from "../provenance/pilotBuild";

const base: ExternalPerformanceObservation = {
  observationId: "obs.base",
  sourceId: "src.a",
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
  testSystem: "bench",
  weighting: {
    sourceMethodQuality: "tier-a-reviewed",
    conditionCompleteness: "full-disclosed",
    recencyClass: "recent",
  },
};

const rights: SourceRightsRecordFile = {
  provenanceContractVersion: "prov4",
  recordVersion: "test-rights",
  reviewedAt: "2026-08-09",
  reviewerLabel: "test",
  decisions: [
    {
      sourceId: "src.a",
      publisher: "A",
      canonicalUrl: "https://example.com/a",
      accessFindings: "public",
      robotsTermsFindings: "cite only",
      citationRights: "fair-use-citation",
      storeExtractedObservation: true,
      decision: "approved",
    },
    {
      sourceId: "src.b",
      publisher: "B",
      canonicalUrl: "https://example.com/b",
      accessFindings: "public",
      robotsTermsFindings: "cite only",
      citationRights: "fair-use-citation",
      storeExtractedObservation: true,
      decision: "approved",
    },
    {
      sourceId: "src.meta",
      publisher: "Meta",
      canonicalUrl: "https://example.com/meta",
      accessFindings: "public",
      robotsTermsFindings: "metadata only",
      citationRights: "public-spec",
      storeExtractedObservation: false,
      decision: "approved-metadata-only",
    },
  ],
};

describe("groupComparableObservations", () => {
  it("groups exact-match observations and excludes mismatches", () => {
    const result = groupComparableObservations(
      pilotBaselineKeyFor("1080p"),
      [
        base,
        {
          ...base,
          observationId: "obs.gpu",
          gpuId: "gpu.asus-proart-rtx4080-o16g",
          sourceId: "src.b",
        },
        { ...base, observationId: "obs.dup", sourceId: "src.a" },
      ],
      rights,
    );
    expect(result.comparable).toHaveLength(1);
    expect(result.comparable[0]?.observationId).toBe("obs.base");
    expect(result.exclusions).toHaveLength(2);
    expect(result.exclusions.map((e) => e.reason).sort()).toEqual([
      "duplicate_source",
      "gpu_mismatch",
    ]);
  });

  it("excludes material exactSettings mismatches", () => {
    const result = groupComparableObservations(
      pilotBaselineKeyFor("1080p"),
      [
        {
          ...base,
          observationId: "obs.psycho",
          exactSettings: "Psycho RT off DLSS off FG off",
        },
      ],
      rights,
    );
    expect(result.comparable).toHaveLength(0);
    expect(result.exclusions[0]?.reason).toBe("settings_mismatch");
  });

  it("excludes exactSettings that contradict structured fields", () => {
    const result = groupComparableObservations(
      pilotBaselineKeyFor("1080p"),
      [
        {
          ...base,
          observationId: "obs.rt-claim",
          exactSettings: "Ultra RT on DLSS Quality FG off",
          rayTracingState: "off",
          upscaleId: "upscale.off",
        },
      ],
      rights,
    );
    expect(result.comparable).toHaveLength(0);
    expect(result.exclusions[0]?.reason).toBe("settings_mismatch");
  });

  it("excludes observations whose source rights deny storeExtractedObservation", () => {
    const result = groupComparableObservations(
      pilotBaselineKeyFor("1080p"),
      [
        {
          ...base,
          observationId: "obs.meta",
          sourceId: "src.meta",
          fpsAverage: 90,
        },
      ],
      rights,
    );
    expect(result.comparable).toHaveLength(0);
    expect(result.exclusions[0]?.reason).toBe("source_rights_denied");
  });
});

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PHASE2_PART_PATHS } from "../contract/vs2";
import {
  coolingProvenanceFileSchema,
  evidenceSourceRegistryFileSchema,
  geometryEvidenceFileSchema,
  highGateDigestsIncludeCapture,
  humanVerificationFileSchema,
  performanceEvidenceFileSchema,
} from "../contract/prov4.schema";
import type { PerformanceEvidenceRecord } from "../contract/prov4";
import { PILOT_PART_IDS } from "../provenance/pilotBuild";

const repoRoot = join(import.meta.dirname, "../..");
const prov4Dir = join(repoRoot, "benchmarks/prov4");

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sha256File(absPath: string): { sha256: string; byteLength: number } {
  const buf = readFileSync(absPath);
  return {
    sha256: createHash("sha256").update(buf).digest("hex"),
    byteLength: buf.byteLength,
  };
}

describe("prov4 fixture integrity", () => {
  const registry = evidenceSourceRegistryFileSchema.parse(
    readJson(join(prov4Dir, "evidence-source-registry.json")),
  );
  const performance = performanceEvidenceFileSchema.parse(
    readJson(join(prov4Dir, "pilot-performance-evidence.json")),
  );
  const geometry = geometryEvidenceFileSchema.parse(
    readJson(join(prov4Dir, "pilot-geometry-evidence.json")),
  );
  const cooling = coolingProvenanceFileSchema.parse(
    readJson(join(prov4Dir, "pilot-cooling-provenance.json")),
  );
  const verifications = humanVerificationFileSchema.parse(
    readJson(join(prov4Dir, "human-verification-records.json")),
  );

  it("parses registry with unique sourceIds", () => {
    expect(registry.provenanceContractVersion).toBe("prov4");
    const ids = registry.sources.map((s) => s.sourceId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has exactly three performance rows, all registry-bound", () => {
    expect(performance.rows).toHaveLength(3);
    const resolutions = performance.rows.map((r) => r.key.resolution).sort();
    expect(resolutions).toEqual(["1080p", "1440p", "4k"]);
    for (const row of performance.rows) {
      expect(row.sourceIds.length).toBeGreaterThan(0);
      for (const id of row.sourceIds) {
        expect(registry.sources.some((s) => s.sourceId === id)).toBe(true);
      }
    }
  });

  it("ships no first-party-measured cell while corrective evidence work is pending", () => {
    const measured = performance.rows.filter(
      (r) => r.measurement.metricKind === "first-party-measured",
    );
    expect(measured).toHaveLength(0);
    expect(registry.sources.some((s) => s.sourceClass === "first-party")).toBe(false);
  });

  it("marks all three cells as synthetic-stub with MetricUnavailable charter fields", () => {
    const stubs = performance.rows.filter(
      (r) => r.measurement.metricKind === "synthetic-stub",
    );
    expect(stubs.length).toBe(3);
    for (const row of stubs) {
      expect(row.confidence).toBe("stub");
      const m = row.measurement;
      expect(m.metricKind).toBe("synthetic-stub");
      if (m.metricKind !== "synthetic-stub") return;
      expect(m.fpsAverage.status).toBe("unavailable");
      expect(m.fpsOnePercentLow.status).toBe("unavailable");
      expect(m.frametime.status).toBe("unavailable");
    }
  });

  it("has no repo-file raw artifact claims while corrective evidence work is pending", () => {
    expect(
      existsSync(join(prov4Dir, "raw/pilot-1080p-capture.json")),
    ).toBe(false);
    let artifactCount = 0;
    for (const row of performance.rows) {
      const artifacts = [];
      if (row.captureConditions?.rawArtifact.kind === "repo-file") {
        artifacts.push(row.captureConditions.rawArtifact);
      }
      const ft = row.measurement.frametime;
      if (
        ft.status === "available" &&
        (ft.representation === "raw-artifact" ||
          ft.representation === "summary-and-raw") &&
        ft.artifact.kind === "repo-file"
      ) {
        artifacts.push(ft.artifact);
      }
      for (const art of artifacts) {
        artifactCount += 1;
        const abs = join(repoRoot, art.locator);
        expect(existsSync(abs)).toBe(true);
        const onDisk = sha256File(abs);
        expect(onDisk.sha256).toBe(art.sha256);
        expect(onDisk.byteLength).toBe(art.byteLength);
      }
    }
    expect(artifactCount).toBe(0);
  });

  it("when high claims exist, verification digests include capture sha256", () => {
    const highRows = performance.rows.filter((r) => r.confidence === "high");
    for (const row of highRows) {
      expect(row.verificationId).toBeDefined();
      const verification = verifications.records.find(
        (v) => v.verificationId === row.verificationId,
      );
      expect(verification).toBeDefined();
      expect(
        highGateDigestsIncludeCapture(
          row as PerformanceEvidenceRecord,
          verification!,
        ),
      ).toBe(true);
    }
  });

  it("has seven geometry rows joined to on-disk physicalSpec.evidence.sourceId", () => {
    expect(geometry.rows).toHaveLength(7);
    expect(geometry.rows.map((r) => r.partId).sort()).toEqual(
      [...PILOT_PART_IDS].sort(),
    );

    const partById = new Map(
      PHASE2_PART_PATHS.map((rel) => {
        const part = readJson(join(repoRoot, rel)) as {
          id: string;
          physicalSpec?: {
            evidence: {
              sourceId: string;
              geometryDataVersion: string;
              modelGrade: string;
            };
          };
        };
        return [part.id, part] as const;
      }),
    );

    for (const row of geometry.rows) {
      expect(row.modelGrade).toBe("Experimental");
      const part = partById.get(row.partId);
      expect(part?.physicalSpec).toBeDefined();
      expect(row.phys3EvidenceSourceId).toBe(
        part!.physicalSpec!.evidence.sourceId,
      );
      expect(row.geometryDataVersion).toBe(
        part!.physicalSpec!.evidence.geometryDataVersion,
      );
      expect(row.modelGrade).toBe(part!.physicalSpec!.evidence.modelGrade);
      for (const id of row.sourceIds) {
        expect(registry.sources.some((s) => s.sourceId === id)).toBe(true);
      }
    }
  });

  it("accepts empty cooling provenance production rows", () => {
    expect(cooling.rows).toHaveLength(0);
  });

  it("keeps human verification empty when no high claims ship", () => {
    const highClaims = performance.rows.some((r) => r.confidence === "high");
    if (!highClaims) {
      expect(verifications.records).toHaveLength(0);
    }
  });
});

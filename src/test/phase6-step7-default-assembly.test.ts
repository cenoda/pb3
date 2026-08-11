/**
 * Phase 6 Step 7 — default build assembly verification (unit).
 * Locks: full mount, authoritative clearance-limit fit for cooler + every
 * published PSU branch, and no OBB interference on the default orientation.
 * The manifest catalog size (14 at Step 7, 22 after Step 9's growth) is not
 * pinned here beyond "the default parts resolve" — see
 * cat6.manifest.test.ts and loadPartCatalog.test.ts for the size lock.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { catalogManifestFileSchema } from "../contract/cat6.schema";
import { DEFAULT_BUILD_STATE_V2 } from "../contract/vs2";
import { partDefinitionV2Schema } from "../contract/vs2.schema";
import { buildAssemblyState } from "../physical/buildAssemblyState";
import { buildPhysicalValidationReport } from "../physical/buildPhysicalValidationReport";
import {
  indexGlbPhysicalNodesFromPath,
  type GlbPhysicalIndex,
} from "../physical/indexGlbPhysicalNodes.node";
import { createPartCatalog } from "../state/validateBuildState";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function loadCatalogAndIndexes() {
  const manifest = catalogManifestFileSchema.parse(
    JSON.parse(
      fs.readFileSync(
        path.join(repoRoot, "parts/catalog-manifest.json"),
        "utf8",
      ),
    ),
  );
  const parts = manifest.parts.map((entry) => {
    const raw = JSON.parse(
      fs.readFileSync(path.join(repoRoot, entry.path), "utf8"),
    );
    return partDefinitionV2Schema.parse(raw);
  });
  const catalog = createPartCatalog(parts);
  const indexes = new Map<string, GlbPhysicalIndex>();
  for (const part of parts) {
    if (!part.physicalSpec) continue;
    indexes.set(
      part.id,
      indexGlbPhysicalNodesFromPath(
        part.id,
        path.join(repoRoot, part.modelGlbPath),
      ),
    );
  }
  return { catalog, indexes, parts, manifest };
}

describe("Phase 6 Step 7 — default build assembly", () => {
  it("resolves the default build against the cat6 manifest catalog", () => {
    const { catalog, parts, manifest } = loadCatalogAndIndexes();
    expect(manifest.catalogContractVersion).toBe("cat6");
    expect(manifest.parts).toHaveLength(22);
    expect(parts).toHaveLength(22);

    const d = DEFAULT_BUILD_STATE_V2;
    const defaultIds = [
      d.caseId,
      d.motherboardId,
      d.cpuId,
      d.gpuId,
      d.coolerId,
      d.ramId,
      d.psuId,
    ];
    for (const id of defaultIds) {
      expect(catalog.byId.has(id), id).toBe(true);
    }
    expect(d.caseId).toBe("case.fractal-design-north-tg-dark");
    expect(d.coolerId).toBe("cooler.noctua-nh-d15-g2");
    expect(d.psuId).toBe("psu.corsair-rm750e");
  });

  it("assembles fully: all mounts, no missing required physical data, authoritative fit", () => {
    const { catalog, indexes } = loadCatalogAndIndexes();
    const assembly = buildAssemblyState(
      DEFAULT_BUILD_STATE_V2,
      catalog,
      indexes,
    );
    expect(assembly.allMounted).toBe(true);
    expect(assembly.unavailableReasons).toEqual([]);
    expect(assembly.assemblyState.mountSelections).toHaveLength(6);
    expect(
      assembly.parts.every(
        (p) => p.isRoot || p.resolution?.status === "mounted",
      ),
    ).toBe(true);

    const report = buildPhysicalValidationReport({
      assembly,
      partsById: catalog.byId,
      glbIndexes: indexes,
    });
    expect(report.overallStatus).toBe("fit");
    expect(
      report.checks.some(
        (c) =>
          c.kind === "clearance-limit" && c.status === "interference",
      ),
    ).toBe(false);
    expect(
      report.checks.some(
        (c) =>
          c.kind === "clearance-limit" && c.status === "unavailable",
      ),
    ).toBe(false);
  });

  it("authoritative clearance-limits: cooler fit, PSU fit on every published branch, no OBB interference", () => {
    const { catalog, indexes } = loadCatalogAndIndexes();
    const d = DEFAULT_BUILD_STATE_V2;
    const casePart = catalog.byId.get(d.caseId)!;
    const cooler = catalog.byId.get(d.coolerId)!;
    const psu = catalog.byId.get(d.psuId)!;

    // Published arithmetic (RK1 / I5 counter-check).
    const coolerHeight = cooler.dimensionsMm!.heightMm;
    const coolerLimits = casePart.clearanceLimits!.maxCpuCoolerHeight!;
    expect(coolerHeight).toBe(168);
    expect(coolerLimits).toHaveLength(1);
    expect(coolerLimits[0]!.limitMm).toBe(170);
    expect(coolerHeight).toBeLessThanOrEqual(coolerLimits[0]!.limitMm);

    const psuLength = psu.dimensionsMm!.lengthMm;
    const psuLimits = casePart.clearanceLimits!.maxPsuLength!;
    expect(psuLength).toBe(140);
    expect(psuLimits).toHaveLength(2);
    expect(psuLimits.map((b) => b.limitMm).sort((a, b) => a - b)).toEqual([
      155, 255,
    ]);
    for (const branch of psuLimits) {
      expect(psuLength).toBeLessThanOrEqual(branch.limitMm);
    }

    const assembly = buildAssemblyState(d, catalog, indexes);
    const report = buildPhysicalValidationReport({
      assembly,
      partsById: catalog.byId,
      glbIndexes: indexes,
    });

    expect(
      report.checks.find(
        (c) => c.checkId === "clearance-limit:cpu-cooler-height",
      )?.status,
    ).toBe("fit");
    expect(
      report.checks.find((c) => c.checkId === "clearance-limit:psu-length")
        ?.status,
    ).toBe("fit");
    expect(
      report.checks.find((c) => c.checkId === "clearance-limit:gpu-length")
        ?.status,
    ).toBe("fit");

    // Advisory OBB geometry must not report false interference on default.
    expect(
      report.checks.some(
        (c) =>
          (c.kind === "collision" || c.kind === "clearance") &&
          c.status === "interference",
      ),
    ).toBe(false);
    expect(report.overallStatus).toBe("fit");
  });
});

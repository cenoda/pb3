import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadPartCatalog } from "../catalog/loadPartCatalog";
import type { CatalogManifestFile } from "../contract/cat6";
import { catalogManifestFileSchema } from "../contract/cat6.schema";
import { partDefinitionV2Schema } from "../contract/vs2.schema";
import { PROV4_PILOT_PART_IDS } from "../contract/prov4";
import { baselineFixtureFileSchema } from "../contract/perf1.schema";
import {
  cpuScaleEdgeFileSchema,
  vendorPerformanceAnchorFileSchema,
} from "../contract/est1.schema";
import {
  DEFAULT_BUILD_STATE_V2,
  PHASE0_CPU_IDS,
  PHASE0_GPU_IDS,
  PHASE2_CASE_IDS,
  PHASE2_MOTHERBOARD_IDS,
  PHASE2_PSU_IDS,
  PHASE2_RAM_IDS,
} from "../contract/vs2";
import { priceFixtureFileSchema } from "../contract/compat2.schema";
import { estimatorQueryFor } from "../estimate/estimatorQuery";
import { useBuildStore } from "../state/buildStore";
import {
  catalogAllowedIds,
  createBuildStateValidator,
} from "../state/validateBuildState";

const ROOT = resolve(__dirname, "../..");
const MANIFEST_REL = "parts/catalog-manifest.json";

/** Slot 14 admitted in Step 6 — runtime manifest matches authored set. */

function readManifestFromDisk(): CatalogManifestFile {
  const raw = JSON.parse(readFileSync(resolve(ROOT, MANIFEST_REL), "utf8"));
  return catalogManifestFileSchema.parse(raw);
}

function manifestIdsByCategory(
  manifest: CatalogManifestFile,
  category: CatalogManifestFile["parts"][number]["category"],
): Set<string> {
  return new Set(
    manifest.parts.filter((entry) => entry.category === category).map((p) => p.id),
  );
}

function collectAuthoredPartJsonPaths(): string[] {
  const paths: string[] = [];
  const partsRoot = join(ROOT, "parts");

  for (const category of readdirSync(partsRoot)) {
    const categoryDir = join(partsRoot, category);
    if (!statSync(categoryDir).isDirectory()) continue;

    for (const partDir of readdirSync(categoryDir)) {
      const partJson = join(categoryDir, partDir, "part.json");
      if (!existsSync(partJson)) continue;

      const parsed = partDefinitionV2Schema.safeParse(
        JSON.parse(readFileSync(partJson, "utf8")),
      );
      if (parsed.success && parsed.data.contractVersion === "cat6") {
        paths.push(relative(ROOT, partJson));
      }
    }
  }

  return paths.sort();
}

describe("cat6 manifest — Step 5 (O8)", () => {
  it("T1 — manifest integrity: paths, parse, folder/category, unique ids, schema", () => {
    const manifest = readManifestFromDisk();
    const ids = manifest.parts.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const entry of manifest.parts) {
      const absPath = resolve(ROOT, entry.path);
      expect(existsSync(absPath), `missing path ${entry.path}`).toBe(true);

      const parsed = partDefinitionV2Schema.parse(
        JSON.parse(readFileSync(absPath, "utf8")),
      );
      const folderBasename = entry.path.split("/")[2];
      expect(parsed.id).toBe(entry.id);
      expect(parsed.id).toBe(folderBasename);
      expect(parsed.category).toBe(entry.category);
      expect(entry.path.split("/")[1]).toBe(entry.category);
    }
  });

  it("T2 — legacy runtime allowlists are subsets of manifest-derived category sets", () => {
    const manifest = readManifestFromDisk();

    function expectLegacySubset(
      category: CatalogManifestFile["parts"][number]["category"],
      legacyIds: readonly string[],
    ): void {
      const manifestIds = manifestIdsByCategory(manifest, category);
      for (const id of legacyIds) {
        expect(manifestIds.has(id), `${category}: legacy id ${id}`).toBe(true);
      }
    }

    expectLegacySubset("case", PHASE2_CASE_IDS);
    expectLegacySubset("motherboard", PHASE2_MOTHERBOARD_IDS);
    expectLegacySubset("ram", PHASE2_RAM_IDS);
    expectLegacySubset("psu", PHASE2_PSU_IDS);
    expectLegacySubset("cpu", PHASE0_CPU_IDS);
    expectLegacySubset("gpu", PHASE0_GPU_IDS);
  });

  it("T2 — cooler: manifest membership gates selection (no legacy allowlist existed)", async () => {
    const catalog = await loadPartCatalog();
    const allowed = catalogAllowedIds(catalog);
    const isValid = createBuildStateValidator(catalog);

    expect(allowed.cooler.has("cooler.noctua-nh-d15-g2")).toBe(true);
    expect(
      isValid({
        ...DEFAULT_BUILD_STATE_V2,
        coolerId: "cooler.noctua-nh-d15-g2",
      }),
    ).toBe(true);
    expect(
      isValid({
        ...DEFAULT_BUILD_STATE_V2,
        coolerId: "cooler.not-in-manifest",
      }),
    ).toBe(false);

    useBuildStore.getState().init(DEFAULT_BUILD_STATE_V2, allowed);
    useBuildStore.getState().setCooler("cooler.noctua-nh-d15-g2");
    expect(useBuildStore.getState().buildState?.coolerId).toBe(
      "cooler.noctua-nh-d15-g2",
    );

    const beforeReject = useBuildStore.getState().buildState?.coolerId;
    useBuildStore.getState().setCooler("cooler.not-in-manifest");
    expect(useBuildStore.getState().buildState?.coolerId).toBe(beforeReject);
  });

  it("T3 — every manifest part modelGlbPath exists on disk", () => {
    const manifest = readManifestFromDisk();

    for (const entry of manifest.parts) {
      const part = partDefinitionV2Schema.parse(
        JSON.parse(readFileSync(resolve(ROOT, entry.path), "utf8")),
      );
      const glbPath = resolve(ROOT, part.modelGlbPath);
      expect(existsSync(glbPath), `missing GLB for ${entry.id}`).toBe(true);
    }
  });

  it("T4 — authored minus manifest is empty (runtime set matches authored cat6 parts)", () => {
    const manifest = readManifestFromDisk();
    const manifestIds = new Set(manifest.parts.map((entry) => entry.id));

    const authoredIds = collectAuthoredPartJsonPaths().map(
      (path) => partDefinitionV2Schema.parse(JSON.parse(readFileSync(resolve(ROOT, path), "utf8"))).id,
    );
    const authoredSet = new Set(authoredIds);
    const withheld = [...authoredSet].filter((id) => !manifestIds.has(id)).sort();
    const unexpectedManifestOnly = [...manifestIds].filter(
      (id) => !authoredSet.has(id),
    );

    expect(withheld).toEqual([]);
    expect(unexpectedManifestOnly).toEqual([]);
  });

  it("T5 — join guards: default build, perf1, prov4 pilot, est1 part ids in manifest", () => {
    const manifest = readManifestFromDisk();
    const manifestIds = new Set(manifest.parts.map((entry) => entry.id));

    const defaultPartIds = [
      DEFAULT_BUILD_STATE_V2.caseId,
      DEFAULT_BUILD_STATE_V2.motherboardId,
      DEFAULT_BUILD_STATE_V2.cpuId,
      DEFAULT_BUILD_STATE_V2.gpuId,
      DEFAULT_BUILD_STATE_V2.coolerId,
      DEFAULT_BUILD_STATE_V2.ramId,
      DEFAULT_BUILD_STATE_V2.psuId,
    ];
    for (const partId of defaultPartIds) {
      expect(manifestIds.has(partId), `default build part ${partId}`).toBe(true);
    }

    const perf1 = baselineFixtureFileSchema.parse(
      JSON.parse(
        readFileSync(resolve(ROOT, "benchmarks/perf1/performance-fixtures.json"), "utf8"),
      ),
    );
    const perfPartIds = new Set<string>();
    for (const row of perf1.rows) {
      perfPartIds.add(row.cpuId);
      perfPartIds.add(row.gpuId);
    }
    for (const partId of perfPartIds) {
      expect(manifestIds.has(partId), `perf1 part ${partId}`).toBe(true);
    }

    for (const partId of PROV4_PILOT_PART_IDS) {
      expect(manifestIds.has(partId), `prov4 pilot part ${partId}`).toBe(true);
    }

    const estQuery = estimatorQueryFor("1080p");
    expect(manifestIds.has(estQuery.cpuId), "est1 query cpuId").toBe(true);
    expect(manifestIds.has(estQuery.gpuId), "est1 query gpuId").toBe(true);

    const estEdges = cpuScaleEdgeFileSchema.parse(
      JSON.parse(
        readFileSync(resolve(ROOT, "benchmarks/est1/cpu-scale-edges.json"), "utf8"),
      ),
    );
    const estAnchors = vendorPerformanceAnchorFileSchema.parse(
      JSON.parse(
        readFileSync(
          resolve(ROOT, "benchmarks/est1/vendor-performance-anchors.json"),
          "utf8",
        ),
      ),
    );
    for (const edge of estEdges.edges) {
      expect(manifestIds.has(edge.fromCpuId), `est1 edge from ${edge.fromCpuId}`).toBe(
        true,
      );
      expect(manifestIds.has(edge.toCpuId), `est1 edge to ${edge.toCpuId}`).toBe(
        true,
      );
    }
    for (const anchor of estAnchors.anchors) {
      if (anchor.cpuId !== undefined) {
        expect(
          manifestIds.has(anchor.cpuId),
          `est1 anchor cpu ${anchor.cpuId}`,
        ).toBe(true);
      }
      expect(manifestIds.has(anchor.gpuId), `est1 anchor gpu ${anchor.gpuId}`).toBe(
        true,
      );
    }
  });

  it("T6 — price2 referenced part ids are a subset of manifest ids (B11 guard)", () => {
    const manifest = readManifestFromDisk();
    const manifestIds = new Set(manifest.parts.map((entry) => entry.id));

    const prices = priceFixtureFileSchema.parse(
      JSON.parse(
        readFileSync(resolve(ROOT, "benchmarks/price2/price-fixtures.json"), "utf8"),
      ),
    );

    for (const row of prices.rows) {
      expect(
        manifestIds.has(row.partId),
        `price2 part ${row.partId} must be in manifest`,
      ).toBe(true);
    }
  });
});

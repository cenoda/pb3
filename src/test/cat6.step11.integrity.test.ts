import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { CatalogManifestFile } from "../contract/cat6";
import {
  catalogManifestFileSchema,
  catalogPriceFileSchema,
  catalogSourceRegistryFileSchema,
  imageSourceRegistryFileSchema,
  partDefinitionV3Schema,
} from "../contract/cat6.schema";
import { indexGlbPhysicalNodesFromPath } from "../physical/indexGlbPhysicalNodes.node";

const ROOT = resolve(__dirname, "../..");

function readJson<T>(relPath: string): T {
  return JSON.parse(readFileSync(resolve(ROOT, relPath), "utf8")) as T;
}

function readManifest(): CatalogManifestFile {
  return catalogManifestFileSchema.parse(
    readJson("parts/catalog-manifest.json"),
  );
}

function collectPartJsonPaths(): string[] {
  const paths: string[] = [];
  const partsRoot = join(ROOT, "parts");
  for (const category of readdirSync(partsRoot)) {
    const categoryDir = join(partsRoot, category);
    if (!statSync(categoryDir).isDirectory()) continue;
    for (const partDir of readdirSync(categoryDir)) {
      const partJson = join(categoryDir, partDir, "part.json");
      try {
        if (statSync(partJson).isFile()) paths.push(partJson);
      } catch {
        // no part.json in this directory
      }
    }
  }
  return paths;
}

describe("cat6 integrity — Step 11 catalog + price gates", () => {
  it("every manifest part.json parses strictly as cat6 (partDefinitionV3Schema)", () => {
    const manifest = readManifest();
    const errors: string[] = [];
    for (const entry of manifest.parts) {
      const raw = readJson<unknown>(entry.path);
      const parsed = partDefinitionV3Schema.safeParse(raw);
      if (!parsed.success) {
        errors.push(`${entry.id}: ${parsed.error.message}`);
      }
    }
    expect(errors).toEqual([]);
  });

  it("every manifest GLB parses as valid glTF 2.0", () => {
    const manifest = readManifest();
    const errors: string[] = [];
    for (const entry of manifest.parts) {
      const part = partDefinitionV3Schema.parse(readJson(entry.path));
      try {
        indexGlbPhysicalNodesFromPath(
          entry.id,
          resolve(ROOT, part.modelGlbPath),
        );
      } catch (err) {
        errors.push(`${entry.id}: ${(err as Error).message}`);
      }
    }
    expect(errors).toEqual([]);
  });

  it("every populated cat6 image binds to an approved image-source-registry decision and an on-disk file", () => {
    const registry = imageSourceRegistryFileSchema.parse(
      readJson("benchmarks/cat6/image-source-registry.json"),
    );
    const byId = new Map(registry.sources.map((s) => [s.sourceId, s]));
    const paths = collectPartJsonPaths();
    const violations: string[] = [];
    for (const p of paths) {
      const raw = readJson<{
        contractVersion?: string;
        id?: string;
        image?: {
          path: string;
          sourceId: string;
          rightsClass: string;
        };
      }>(p);
      if (raw.contractVersion !== "cat6" || raw.image === undefined) continue;
      const entry = byId.get(raw.image.sourceId);
      if (!entry) {
        violations.push(`${raw.id}: sourceId ${raw.image.sourceId} not in registry`);
        continue;
      }
      if (entry.decision !== "approved") {
        violations.push(
          `${raw.id}: registry decision is ${entry.decision}, not approved`,
        );
      }
      if (entry.rightsClass !== raw.image.rightsClass) {
        violations.push(
          `${raw.id}: part rightsClass ${raw.image.rightsClass} !== registry ${entry.rightsClass}`,
        );
      }
      const filePath = resolve(ROOT, raw.image.path);
      try {
        if (!statSync(filePath).isFile()) {
          violations.push(`${raw.id}: image.path is not a file: ${raw.image.path}`);
        }
      } catch {
        violations.push(`${raw.id}: missing file ${raw.image.path}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("no image file under parts/** is unreferenced by a cat6 image.path", () => {
    const partsRoot = join(ROOT, "parts");
    const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);
    const referenced = new Set<string>();
    for (const p of collectPartJsonPaths()) {
      const raw = readJson<{ image?: { path?: string } }>(p);
      if (raw.image?.path) referenced.add(resolve(ROOT, raw.image.path));
    }
    const unreferenced: string[] = [];
    for (const category of readdirSync(partsRoot)) {
      const categoryDir = join(partsRoot, category);
      if (!statSync(categoryDir).isDirectory()) continue;
      for (const partDir of readdirSync(categoryDir)) {
        const dir = join(categoryDir, partDir);
        if (!statSync(dir).isDirectory()) continue;
        for (const file of readdirSync(dir)) {
          const ext = file.slice(file.lastIndexOf("."));
          if (imageExtensions.has(ext.toLowerCase())) {
            const full = join(dir, file);
            if (!referenced.has(full)) unreferenced.push(full);
          }
        }
      }
    }
    expect(unreferenced).toEqual([]);
  });

  it("every dimensionsMm on an authored cat6 part carries provenance.dimensions", () => {
    const paths = collectPartJsonPaths();
    const violations: string[] = [];
    for (const p of paths) {
      const raw = readJson<{
        contractVersion?: string;
        id?: string;
        dimensionsMm?: unknown;
        provenance?: { dimensions?: unknown };
      }>(p);
      if (raw.contractVersion !== "cat6") continue;
      if (raw.dimensionsMm !== undefined && raw.provenance?.dimensions === undefined) {
        violations.push(raw.id ?? p);
      }
    }
    expect(violations).toEqual([]);
  });

  it("every cat6 catalog price source resolves in the source registry", () => {
    const prices = catalogPriceFileSchema.parse(
      readJson("benchmarks/cat6/catalog-prices.json"),
    );
    const registry = catalogSourceRegistryFileSchema.parse(
      readJson("benchmarks/cat6/catalog-source-registry.json"),
    );
    const registryIds = new Set(registry.sources.map((s) => s.sourceId));
    const registryIdCounts = new Map<string, number>();
    for (const s of registry.sources) {
      registryIdCounts.set(s.sourceId, (registryIdCounts.get(s.sourceId) ?? 0) + 1);
    }

    const unresolved: string[] = [];
    const duplicated: string[] = [];
    for (const row of prices.rows) {
      for (const sourceId of [row.msrp?.sourceId, row.street?.sourceId]) {
        if (!sourceId) continue;
        if (!registryIds.has(sourceId)) unresolved.push(`${row.partId}: ${sourceId}`);
        else if ((registryIdCounts.get(sourceId) ?? 0) !== 1) duplicated.push(sourceId);
      }
    }
    expect(unresolved).toEqual([]);
    expect(duplicated).toEqual([]);
  });

  it("catalog-prices.json partIds are unique and every row has msrp and/or street", () => {
    const prices = catalogPriceFileSchema.parse(
      readJson("benchmarks/cat6/catalog-prices.json"),
    );
    const ids = prices.rows.map((r) => r.partId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const row of prices.rows) {
      expect(row.msrp !== undefined || row.street !== undefined, row.partId).toBe(
        true,
      );
    }
  });

  it("every street price row uses KRW (the runtime total currency)", () => {
    const prices = catalogPriceFileSchema.parse(
      readJson("benchmarks/cat6/catalog-prices.json"),
    );
    for (const row of prices.rows) {
      if (row.street) {
        expect(row.street.currency, row.partId).toBe("KRW");
        expect(row.street.region, row.partId).toBe("KR");
      }
    }
  });

  it("no cat6 catalog price row carries a mixed-currency street snapshot that would silently sum", () => {
    const prices = catalogPriceFileSchema.parse(
      readJson("benchmarks/cat6/catalog-prices.json"),
    );
    const currencies = new Set(
      prices.rows.flatMap((r) => (r.street ? [r.street.currency] : [])),
    );
    expect([...currencies]).toEqual(["KRW"]);
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractAmdProductSpec,
  extractManufacturerGpuImage,
  extractWikimediaCpuImage,
} from "../ingest/adapters/extract";
import { matchExactSku } from "../ingest/matchExactSku";
import { loadCatalogIdentities } from "../ingest/catalogSnapshot";
import {
  commonsFileTitleFromUrl,
  resolveFetchUrl,
} from "../ingest/resolveFetchUrl";
import { loadCandidateFile } from "../ingest/loadCandidates";

const ROOT = resolve(__dirname, "../..");
const FIX = resolve(ROOT, "src/test/fixtures/ing7");

describe("ing7 live-shaped extractors", () => {
  it("parses Commons imageinfo API envelope without inventing a boxed OPN", () => {
    const extracted = extractWikimediaCpuImage(
      readFileSync(resolve(FIX, "wikimedia-ryzen-5-7600.api.json")),
    );
    expect(extracted.ok).toBe(true);
    expect(extracted.extractedFields.licenseShortName).toBe("FAL");
    expect(extracted.extractedFields.author).toBe("Smial");
    expect(extracted.identity.partNumbers).toEqual([]);
    expect(extracted.identity.modelName).toMatch(/Ryzen 5 7600/i);
    const match = matchExactSku({
      candidateId: "live.7600",
      identity: extracted.identity,
      catalog: loadCatalogIdentities(ROOT),
    });
    expect(match.verdict).toBe("ambiguous");
  });

  it("reads tray OPN 100-000000910 from a live-shaped 7800X3D Commons title", () => {
    const extracted = extractWikimediaCpuImage(
      readFileSync(resolve(FIX, "wikimedia-ryzen-7-7800x3d.api.json")),
    );
    expect(extracted.ok).toBe(true);
    expect(extracted.identity.partNumbers).toContain("100-000000910");
    const match = matchExactSku({
      candidateId: "live.7800",
      identity: extracted.identity,
      catalog: loadCatalogIdentities(ROOT),
    });
    expect(match.verdict).not.toBe("exact");
  });

  it("parses AMD product-specifications dt/dd HTML", () => {
    const extracted = extractAmdProductSpec(
      readFileSync(resolve(FIX, "amd-ryzen-5-7600-spec.live.html")),
    );
    expect(extracted.ok).toBe(true);
    expect(extracted.identity.partNumbers).toEqual([
      "100-000001015",
      "100-100001015BOX",
    ]);
    expect(extracted.extractedFields.baseClockMhz).toBe(3800);
    expect(extracted.extractedFields.boostClockMhz).toBe(5100);
    expect(extracted.extractedFields.defaultTdpW).toBe(65);
    const match = matchExactSku({
      candidateId: "live.amd",
      identity: extracted.identity,
      catalog: loadCatalogIdentities(ROOT),
    });
    expect(match.verdict).toBe("exact");
    expect(match.matchedPartId).toBe("cpu.amd-ryzen-5-7600");
  });

  it("does not treat related-product SUPER tokens on an ASUS page as this SKU", () => {
    const html = Buffer.from(
      `<html><h1>ASUS Dual GeForce RTX 4070 OC Edition 12GB GDDR6X</h1>
<div class="sku">DUAL-RTX4070-O12G</div>
<footer>Related: Dual 4070 SUPER and NH-D15 G2</footer></html>`,
    );
    const extracted = extractManufacturerGpuImage(html);
    expect(extracted.identity.partNumbers).toEqual(["DUAL-RTX4070-O12G"]);
    expect(extracted.identity.variantTokens).not.toContain("SUPER");
    const match = matchExactSku({
      candidateId: "live.gpu",
      identity: extracted.identity,
      catalog: loadCatalogIdentities(ROOT),
    });
    expect(match.verdict).toBe("exact");
    expect(match.matchedPartId).toBe("gpu.asus-dual-rtx4070-o12g");
  });

  it("still parses the first-slice AMD JSON fixture", () => {
    const extracted = extractAmdProductSpec(
      readFileSync(resolve(FIX, "amd-ryzen-5-7600-spec.html")),
    );
    expect(extracted.extractedFields.boostClockMhz).toBe(5100);
    expect(extracted.identity.partNumbers).toContain("100-100001015BOX");
  });

  it("resolves a Commons File: page to the imageinfo API", () => {
    const file =
      "https://commons.wikimedia.org/wiki/File:AMD_Ryzen_5_7600_top_IMGP6773_smial_wp.jpg";
    expect(commonsFileTitleFromUrl(file)).toBe(
      "File:AMD Ryzen 5 7600 top IMGP6773 smial wp.jpg",
    );
    const api = resolveFetchUrl(file, "licensed-still");
    expect(api).toContain("api.php");
    expect(api).toContain("titles=File");
    expect(resolveFetchUrl("https://www.amd.com/x", "manufacturer-spec-page")).toBe(
      "https://www.amd.com/x",
    );
  });

  it("loads the checked-in candidate list", () => {
    const rows = loadCandidateFile(ROOT);
    expect(rows).toHaveLength(4);
    expect(new Set(rows.map((r) => r.candidateId)).size).toBe(4);
  });
});

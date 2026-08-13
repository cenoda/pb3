import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { imageSourceRegistryFileSchema } from "../contract/cat6.schema";

const ROOT = resolve(__dirname, "../..");

describe("cat6 image source registry — Step 1 shape", () => {
  it("parses benchmarks/cat6/image-source-registry.json", () => {
    const raw = JSON.parse(
      readFileSync(resolve(ROOT, "benchmarks/cat6/image-source-registry.json"), "utf8"),
    );
    const parsed = imageSourceRegistryFileSchema.safeParse(raw);
    expect(parsed.success, parsed.success ? "" : parsed.error.message).toBe(
      true,
    );
  });

  it("rejects duplicate sourceId", () => {
    const parsed = imageSourceRegistryFileSchema.safeParse({
      catalogContractVersion: "cat6",
      registryVersion: "test",
      reviewedAt: "2026-08-13",
      sources: [
        {
          sourceId: "source.cat6.image.dup",
          publisher: "Test",
          canonicalUrl: "https://example.invalid/a",
          citation: "https://example.invalid/a",
          rightsClass: "cc-attribution",
          retrievedAt: "2026-08-13",
          decision: "approved",
          verbatimTerms: "CC BY 4.0",
        },
        {
          sourceId: "source.cat6.image.dup",
          publisher: "Test",
          canonicalUrl: "https://example.invalid/b",
          citation: "https://example.invalid/b",
          rightsClass: "cc-attribution",
          retrievedAt: "2026-08-13",
          decision: "rejected",
          verbatimTerms: "All rights reserved",
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts cc-attribution rights class", () => {
    const parsed = imageSourceRegistryFileSchema.safeParse({
      catalogContractVersion: "cat6",
      registryVersion: "test",
      reviewedAt: "2026-08-13",
      sources: [
        {
          sourceId: "source.cat6.image.cc",
          publisher: "Wikimedia Commons",
          canonicalUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
          citation: "https://commons.wikimedia.org/wiki/File:Example.jpg",
          rightsClass: "cc-attribution",
          retrievedAt: "2026-08-13",
          decision: "approved",
          verbatimTerms: "CC BY 4.0",
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { ING7_CONTRACT_VERSION, type IngestNormalized, type SkuMatchRecord } from "../contract/ing7";
import { rightsReviewRecordSchema } from "../contract/ing7.schema";
import { reviewRights } from "../ingest/reviewRights";

const SHA_EVIDENCE = "partNumber 100-100001015BOX";

function match(verdict: SkuMatchRecord["verdict"], stage: SkuMatchRecord["stage"]): SkuMatchRecord {
  return {
    contractVersion: ING7_CONTRACT_VERSION,
    candidateId: "cand.test",
    stage,
    verdict,
    matchedPartId: verdict === "exact" ? "cpu.amd-ryzen-5-7600" : undefined,
    matchedBy: verdict === "exact" ? "partNumber" : undefined,
    evidence: SHA_EVIDENCE,
    variantConflicts: [],
    rejectedPartIds: [],
  };
}

function normalized(
  sourceKind: IngestNormalized["sourceKind"],
  fields: Record<string, unknown>,
): IngestNormalized {
  return {
    contractVersion: ING7_CONTRACT_VERSION,
    candidateId: "cand.test",
    stage: "normalized",
    sourceKind,
    inputSha256: "ab".repeat(32),
    identity: { partNumbers: ["100-100001015BOX"], variantTokens: ["BOX"] },
    extractedFields: fields,
    rawQuotes: [],
  };
}

describe("ing7 rights review", () => {
  it("never emits decision approved", () => {
    const rec = reviewRights({
      candidateId: "cand.test",
      sourceKind: "licensed-still",
      canonicalUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
      retrievedAt: "2026-08-13",
      match: match("exact", "sku-exact"),
      normalized: normalized("licensed-still", {
        storageGrant: true,
        author: "Smial",
        publisher: "Wikimedia Commons",
      }),
      verbatimTerms: "Free Art License (FAL); copy, distribute, and modify permitted.",
      publisher: "Wikimedia Commons",
      author: "Smial",
      sourceId: "source.cat6.image.wikimedia.ryzen-5-7600-top-fal",
    });
    expect(rec.decision).not.toBe("approved");
    expect(rec.decision).toBe("pending");
    expect(rec.recommendedDecision).toBe("approved");
    expect(rightsReviewRecordSchema.parse(rec).decision).toBe("pending");
  });

  it("rejects ASUS press-kit terms via R1", () => {
    const terms =
      "ASUS and its suppliers do not grant any express or implied right. No portion of the information (including without limitation documents and photos) on this Site may be reproduced without the prior written permission of ASUS.";
    const rec = reviewRights({
      candidateId: "cand.gpu",
      sourceKind: "manufacturer-image-page",
      canonicalUrl:
        "https://www.asus.com/us/motherboards-components/graphics-cards/dual/dual-rtx4070-o12g/",
      retrievedAt: "2026-08-13",
      match: {
        ...match("exact", "sku-exact"),
        candidateId: "cand.gpu",
        matchedPartId: "gpu.asus-dual-rtx4070-o12g",
        evidence: "partNumber DUAL-RTX4070-O12G",
      },
      normalized: normalized("manufacturer-image-page", {
        storageGrant: false,
        wouldStoreDerivative: true,
        modificationProhibited: true,
      }),
      verbatimTerms: terms,
      publisher: "ASUSTeK Computer Inc.",
      author: "ASUSTeK Computer Inc.",
      sourceId: "source.cat6.image.asus.dual-rtx4070-o12g.press",
    });
    expect(rec.decision).toBe("rejected");
    expect(rec.stage).toBe("rights-rejected");
    expect(rec.rejectRuleIds).toContain("R1");
    expect(rec.decision).not.toBe("approved");
  });

  it("CC0 fixture recommends approved but stays pending", () => {
    const rec = reviewRights({
      candidateId: "cand.cc0",
      sourceKind: "licensed-still",
      canonicalUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
      retrievedAt: "2026-08-13",
      match: match("exact", "sku-exact"),
      normalized: normalized("licensed-still", {
        storageGrant: true,
        rightsClass: "licensed",
      }),
      verbatimTerms: "Creative Commons CC0 1.0 Universal Public Domain Dedication.",
      publisher: "Wikimedia Commons",
      author: "FritzchensFritz",
      sourceId: "source.cat6.image.wikimedia.ryzen-7-7800x3d-package-cc0",
    });
    expect(rec.decision).toBe("pending");
    expect(rec.recommendedDecision).toBe("approved");
  });
});

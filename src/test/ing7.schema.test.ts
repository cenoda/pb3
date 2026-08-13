import { describe, expect, it } from "vitest";
import { ING7_CONTRACT_VERSION } from "../contract/ing7";
import {
  dryRunReportSchema,
  ingestCandidateListSchema,
  ingestCandidateSchema,
  ingestFetchedSchema,
  ownerReviewPacketSchema,
  rightsDraftDecisionSchema,
  rightsReviewRecordSchema,
} from "../contract/ing7.schema";

const SHA = "ab".repeat(32);

const candidate = {
  contractVersion: ING7_CONTRACT_VERSION,
  candidateId: "cand.cpu-7600.wikimedia",
  stage: "candidate" as const,
  sourceKind: "licensed-still" as const,
  intendedPartId: "cpu.amd-ryzen-5-7600",
  canonicalUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
  createdAt: "2026-08-13",
};

const sku = {
  contractVersion: ING7_CONTRACT_VERSION,
  candidateId: candidate.candidateId,
  stage: "sku-exact" as const,
  verdict: "exact" as const,
  matchedPartId: "cpu.amd-ryzen-5-7600",
  matchedBy: "partNumber" as const,
  evidence: "partNumber 100-100001015BOX",
  variantConflicts: [] as string[],
  rejectedPartIds: [] as string[],
};

const rights = {
  contractVersion: ING7_CONTRACT_VERSION,
  candidateId: candidate.candidateId,
  stage: "rights-reviewed" as const,
  sourceId: "source.cat6.image.wikimedia.ryzen-5-7600-top-fal",
  publisher: "Wikimedia Commons",
  author: "Smial",
  canonicalUrl: candidate.canonicalUrl,
  citation: candidate.canonicalUrl,
  rightsClass: "cc-attribution" as const,
  retrievedAt: "2026-08-13",
  decision: "pending" as const,
  recommendedDecision: "approved" as const,
  recommendReason: "FAL still; owner must approve storage",
  verbatimTerms: "Free Art License",
  exactSkuEvidence: "100-100001015BOX",
  rejectRuleIds: [] as string[],
};

describe("ing7 schema", () => {
  it("accepts a valid candidate", () => {
    expect(ingestCandidateSchema.parse(candidate).candidateId).toBe(
      candidate.candidateId,
    );
  });

  it("rejects duplicate candidateId in a list", () => {
    const parsed = ingestCandidateListSchema.safeParse([candidate, candidate]);
    expect(parsed.success).toBe(false);
  });

  it("accepts unique candidateIds", () => {
    const parsed = ingestCandidateListSchema.safeParse([
      candidate,
      { ...candidate, candidateId: "cand.other" },
    ]);
    expect(parsed.success).toBe(true);
  });

  it("requires lowercase hex SHA-256 on fetched success", () => {
    const ok = ingestFetchedSchema.safeParse({
      contractVersion: ING7_CONTRACT_VERSION,
      candidateId: candidate.candidateId,
      stage: "fetched",
      canonicalUrl: candidate.canonicalUrl,
      retrievedAt: "2026-08-13",
      sha256: SHA,
      bytesPath: "cand.cpu-7600.wikimedia.bin",
    });
    expect(ok.success).toBe(true);

    const badHex = ingestFetchedSchema.safeParse({
      contractVersion: ING7_CONTRACT_VERSION,
      candidateId: candidate.candidateId,
      stage: "fetched",
      canonicalUrl: candidate.canonicalUrl,
      retrievedAt: "2026-08-13",
      sha256: "GG".repeat(32),
      bytesPath: "x.bin",
    });
    expect(badHex.success).toBe(false);

    const missing = ingestFetchedSchema.safeParse({
      contractVersion: ING7_CONTRACT_VERSION,
      candidateId: candidate.candidateId,
      stage: "fetched",
      canonicalUrl: candidate.canonicalUrl,
      retrievedAt: "2026-08-13",
    });
    expect(missing.success).toBe(false);
  });

  it("rejects non-ISO createdAt", () => {
    const parsed = ingestCandidateSchema.safeParse({
      ...candidate,
      createdAt: "13 August 2026",
    });
    expect(parsed.success).toBe(false);
  });

  it("rights draft enum rejects decision approved", () => {
    expect(rightsDraftDecisionSchema.safeParse("approved").success).toBe(
      false,
    );
    const parsed = rightsReviewRecordSchema.safeParse({
      ...rights,
      decision: "approved",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts recommendedDecision approved while decision stays pending", () => {
    expect(rightsReviewRecordSchema.parse(rights).recommendedDecision).toBe(
      "approved",
    );
  });

  it("owner packet requires the six owner-facing sections", () => {
    const packet = {
      contractVersion: ING7_CONTRACT_VERSION,
      packetId: "pkt.cpu-7600.wikimedia",
      candidateId: candidate.candidateId,
      partId: "cpu.amd-ryzen-5-7600",
      sku,
      source: {
        url: candidate.canonicalUrl,
        citation: candidate.canonicalUrl,
        publisher: "Wikimedia Commons",
        retrievedAt: "2026-08-13",
        sha256: SHA,
      },
      rights,
      proposedChanges: [] as unknown[],
      conflicts: [] as string[],
      unresolvedFields: [] as string[],
    };
    expect(ownerReviewPacketSchema.safeParse(packet).success).toBe(true);

    const { sku: _sku, ...missingSku } = packet;
    expect(ownerReviewPacketSchema.safeParse(missingSku).success).toBe(false);
  });

  it("rejects a proposed image change without after.sourceId", () => {
    const parsed = ownerReviewPacketSchema.safeParse({
      contractVersion: ING7_CONTRACT_VERSION,
      packetId: "pkt.img",
      candidateId: candidate.candidateId,
      sku,
      source: {
        url: candidate.canonicalUrl,
        citation: candidate.canonicalUrl,
        publisher: "Wikimedia Commons",
        retrievedAt: "2026-08-13",
        sha256: SHA,
      },
      rights,
      proposedChanges: [
        {
          target: "image-file",
          path: "parts/cpu/cpu.amd-ryzen-5-7600/image.jpg",
          op: "add",
          after: { path: "parts/cpu/cpu.amd-ryzen-5-7600/image.jpg" },
          reason: "new still",
        },
      ],
      conflicts: [],
      unresolvedFields: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("dry-run report requires shippedTreeDirty false", () => {
    const ok = dryRunReportSchema.safeParse({
      contractVersion: ING7_CONTRACT_VERSION,
      reportId: "rep.ing7.2026-08-13",
      generatedAt: "2026-08-13",
      adapterIds: ["wikimedia-cpu-image"],
      packets: ["pkt.cpu-7600.wikimedia"],
      shippedTreeDirty: false,
      summary: {
        exact: 1,
        ambiguous: 0,
        unavailable: 0,
        rightsRejected: 0,
        pendingOwner: 1,
      },
    });
    expect(ok.success).toBe(true);

    const dirty = dryRunReportSchema.safeParse({
      contractVersion: ING7_CONTRACT_VERSION,
      reportId: "rep.ing7.2026-08-13",
      generatedAt: "2026-08-13",
      adapterIds: [],
      packets: [],
      shippedTreeDirty: true,
      summary: {
        exact: 0,
        ambiguous: 0,
        unavailable: 0,
        rightsRejected: 0,
        pendingOwner: 0,
      },
    });
    expect(dirty.success).toBe(false);
  });
});

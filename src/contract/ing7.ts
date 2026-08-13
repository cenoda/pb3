/**
 * Phase-7.1 catalog ingest sidecar (`ing7`).
 * Authority: docs/phases/phase-7.1/specs/phase-7.1.md §12.
 *
 * Does not change cat6 / prov4 / est1 public shapes.
 */

import type { EvidenceRightsClass } from "./prov4";

export const ING7_CONTRACT_VERSION = "ing7" as const;
export type Ing7ContractVersion = typeof ING7_CONTRACT_VERSION;

export type IngestStage =
  | "candidate"
  | "fetched"
  | "normalized"
  | "sku-exact"
  | "sku-ambiguous"
  | "sku-unavailable"
  | "review-candidate"
  | "rights-reviewed"
  | "rights-rejected"
  | "owner-approved"
  | "owner-rejected"
  | "fetch-failed"
  | "normalize-failed"
  | "shipped";

export type IngestSourceKind =
  | "manufacturer-spec-page"
  | "manufacturer-image-page"
  | "licensed-still"
  | "domestic-street-price";

export type SkuMatchVerdict = "exact" | "ambiguous" | "unavailable";

/** Agent-drafted rights only. `approved` is owner-only (O7). */
export type RightsDraftDecision =
  | "pending"
  | "rejected"
  | "approved-metadata-only";

export type VariantAxis =
  | "boxed-tray"
  | "region"
  | "revision"
  | "capacity"
  | "color"
  | "generation"
  | "model";

export type SkuMatchedBy = "partNumber" | "modelNumber" | "canonicalSku";

export interface IngestCandidate {
  contractVersion: Ing7ContractVersion;
  candidateId: string;
  stage: "candidate";
  sourceKind: IngestSourceKind;
  /** Hint only; matcher is authoritative. */
  intendedPartId?: string;
  canonicalUrl: string;
  createdAt: string;
}

export interface IngestFetched {
  contractVersion: Ing7ContractVersion;
  candidateId: string;
  stage: "fetched" | "fetch-failed";
  canonicalUrl: string;
  retrievedAt: string;
  httpStatus?: number;
  contentType?: string;
  /** SHA-256 of stored bytes; required on success. */
  sha256?: string;
  /** Relative to the ingest workspace `fetched/` directory. */
  bytesPath?: string;
  error?: string;
}

export interface NormalizedIdentity {
  manufacturer?: string;
  modelName?: string;
  /** Every explicit PN / OPN / model number printed. */
  partNumbers: string[];
  /** BOX, WOF, SUPER, Rev. 1.3, 32GB, … */
  variantTokens: string[];
}

export interface IngestNormalized {
  contractVersion: Ing7ContractVersion;
  candidateId: string;
  stage: "normalized" | "normalize-failed";
  sourceKind: IngestSourceKind;
  inputSha256: string;
  identity: NormalizedIdentity;
  /** Only keys the adapter declares. */
  extractedFields: Record<string, unknown>;
  rawQuotes: string[];
  error?: string;
}

export interface SkuMatchRecord {
  contractVersion: Ing7ContractVersion;
  candidateId: string;
  stage:
    | "sku-exact"
    | "sku-ambiguous"
    | "sku-unavailable"
    | "review-candidate";
  verdict: SkuMatchVerdict;
  matchedPartId?: string;
  matchedBy?: SkuMatchedBy;
  evidence: string;
  variantConflicts: VariantAxis[];
  rejectedPartIds: string[];
}

export interface RightsReviewRecord {
  contractVersion: Ing7ContractVersion;
  candidateId: string;
  stage: "rights-reviewed" | "rights-rejected";
  sourceId: string;
  publisher: string;
  author?: string;
  canonicalUrl: string;
  citation: string;
  rightsClass: EvidenceRightsClass;
  retrievedAt: string;
  /** Never `"approved"` from the agent. */
  decision: RightsDraftDecision;
  recommendedDecision: RightsDraftDecision | "approved";
  recommendReason: string;
  verbatimTerms: string;
  exactSkuEvidence: string;
  rejectRuleIds: string[];
}

export type ProposedChangeTarget =
  | "part.json"
  | "catalog-prices.json"
  | "image-source-registry.json"
  | "catalog-source-registry.json"
  | "catalog-manifest.json"
  | "image-file";

export interface ProposedFieldChange {
  target: ProposedChangeTarget;
  /** JSON pointer or repo-relative image path. */
  path: string;
  op: "add" | "replace" | "remove" | "unchanged";
  before?: unknown;
  after?: unknown;
  reason: string;
}

export interface OwnerReviewPacket {
  contractVersion: Ing7ContractVersion;
  packetId: string;
  candidateId: string;
  partId?: string;
  sku: SkuMatchRecord;
  source: {
    url: string;
    citation: string;
    publisher: string;
    retrievedAt: string;
    sha256: string;
  };
  rights: RightsReviewRecord;
  image?: {
    previewPath: string;
    sha256: string;
    bytes: number;
    mimeType: string;
  };
  proposedChanges: ProposedFieldChange[];
  conflicts: string[];
  unresolvedFields: string[];
  ownerDecision?: "approved" | "rejected";
  ownerDecidedAt?: string;
}

export interface DryRunReport {
  contractVersion: Ing7ContractVersion;
  reportId: string;
  generatedAt: string;
  adapterIds: string[];
  packets: string[];
  shippedTreeDirty: false;
  summary: {
    exact: number;
    ambiguous: number;
    unavailable: number;
    rightsRejected: number;
    pendingOwner: number;
  };
}

export const ING7_ADAPTER_IDS = [
  "wikimedia-cpu-image",
  "manufacturer-gpu-image",
  "amd-product-spec",
] as const;

export type Ing7AdapterId = (typeof ING7_ADAPTER_IDS)[number];

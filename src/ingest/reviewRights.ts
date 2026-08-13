import type { EvidenceRightsClass } from "../contract/prov4";
import {
  ING7_CONTRACT_VERSION,
  type IngestNormalized,
  type IngestSourceKind,
  type RightsReviewRecord,
  type SkuMatchRecord,
  type SkuMatchVerdict,
} from "../contract/ing7";

export const RIGHTS_REJECT_RULES = {
  R1: "No storage/redistribution grant on manufacturer terms",
  R2: "Screenshot / captured UI / video frame",
  R3: "Matcher verdict is not exact",
  R4: "License missing, unclear, or contradictory",
  R5: "Modification prohibited and a derivative would be stored",
  R6: "Metadata-only source",
} as const;

export type RightsRejectRuleId = keyof typeof RIGHTS_REJECT_RULES;

export interface ReviewRightsInput {
  candidateId: string;
  sourceKind: IngestSourceKind;
  canonicalUrl: string;
  retrievedAt: string;
  match: SkuMatchRecord;
  normalized: IngestNormalized;
  verbatimTerms: string;
  publisher: string;
  author?: string;
  sourceId: string;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function detectR1(sourceKind: IngestSourceKind, terms: string, storageGrant?: boolean): boolean {
  if (storageGrant === true) return false;
  if (sourceKind !== "manufacturer-image-page") return false;
  if (storageGrant === false) return true;
  const t = terms.toLowerCase();
  return (
    t.includes("do not grant") ||
    t.includes("prior written permission") ||
    t.includes("no portion of the information") ||
    t.includes("unauthorized use")
  );
}

function detectR2(normalized: IngestNormalized): boolean {
  const kind = asString(normalized.extractedFields.imageKind)?.toLowerCase();
  return (
    kind === "screenshot" ||
    kind === "captured-ui" ||
    kind === "video-frame" ||
    kind === "watermarked-composite"
  );
}

function detectR4(
  sourceKind: IngestSourceKind,
  terms: string,
  publisher: string,
  author: string | undefined,
): boolean {
  if (!terms.trim()) return true;
  const t = terms.toLowerCase();
  if (t.includes("contact us for permission") && !t.includes("creative commons") && !t.includes("cc0") && !t.includes("free art")) {
    return true;
  }
  if (sourceKind === "licensed-still" && !publisher) return true;
  if (sourceKind === "licensed-still" && !author) return true;
  if (
    sourceKind === "licensed-still" &&
    !/cc0|creative commons|free art|fal|cc-by|cc by/i.test(terms)
  ) {
    return true;
  }
  return false;
}

function detectR5(normalized: IngestNormalized, terms: string): boolean {
  const prohibited = asBoolean(normalized.extractedFields.modificationProhibited);
  const derivative = asBoolean(normalized.extractedFields.wouldStoreDerivative);
  if (prohibited === true && derivative === true) return true;
  const t = terms.toLowerCase();
  return t.includes("must not edit") && derivative === true;
}

function detectR6(normalized: IngestNormalized): boolean {
  return (
    asBoolean(normalized.extractedFields.metadataOnly) === true &&
    asBoolean(normalized.extractedFields.wantsImageStorage) === true
  );
}

function rightsClassFor(
  sourceKind: IngestSourceKind,
  terms: string,
  extracted: Record<string, unknown>,
): EvidenceRightsClass {
  const explicit = asString(extracted.rightsClass) as EvidenceRightsClass | undefined;
  if (explicit) return explicit;
  if (sourceKind === "manufacturer-spec-page") return "public-spec";
  const t = terms.toLowerCase();
  if (t.includes("cc0")) return "licensed";
  if (t.includes("free art") || t.includes("fal") || t.includes("cc by") || t.includes("cc-by")) {
    return "cc-attribution";
  }
  if (sourceKind === "manufacturer-image-page") return "licensed";
  return "unavailable";
}

export function reviewRights(input: ReviewRightsInput): RightsReviewRecord {
  const storageGrant = asBoolean(input.normalized.extractedFields.storageGrant);
  const rejectRuleIds: RightsRejectRuleId[] = [];
  const verdict: SkuMatchVerdict = input.match.verdict;

  if (verdict !== "exact") rejectRuleIds.push("R3");
  if (detectR1(input.sourceKind, input.verbatimTerms, storageGrant)) {
    rejectRuleIds.push("R1");
  }
  if (detectR2(input.normalized)) rejectRuleIds.push("R2");
  if (
    detectR4(input.sourceKind, input.verbatimTerms, input.publisher, input.author)
  ) {
    rejectRuleIds.push("R4");
  }
  if (detectR5(input.normalized, input.verbatimTerms)) rejectRuleIds.push("R5");
  if (detectR6(input.normalized)) rejectRuleIds.push("R6");

  const hardImageReject = rejectRuleIds.some((id) =>
    ["R1", "R2", "R4", "R5", "R6"].includes(id),
  );
  const specFactsOnly = input.sourceKind === "manufacturer-spec-page";

  let decision: RightsReviewRecord["decision"];
  let recommendedDecision: RightsReviewRecord["recommendedDecision"];
  let stage: RightsReviewRecord["stage"];
  let recommendReason: string;

  if (specFactsOnly && !hardImageReject && verdict === "exact") {
    decision = "approved-metadata-only";
    recommendedDecision = "approved-metadata-only";
    stage = "rights-reviewed";
    recommendReason = "Structured specification facts only; no image storage grant implied.";
  } else if (hardImageReject) {
    decision = "rejected";
    recommendedDecision = "rejected";
    stage = "rights-rejected";
    recommendReason = rejectRuleIds
      .map((id) => `${id}: ${RIGHTS_REJECT_RULES[id]}`)
      .join("; ");
  } else if (verdict !== "exact") {
    decision = "rejected";
    recommendedDecision = "rejected";
    stage = "rights-reviewed";
    recommendReason = "R3: not sku-exact; ship path closed.";
  } else {
    decision = "pending";
    recommendedDecision = "approved";
    stage = "rights-reviewed";
    recommendReason =
      "License terms appear to allow storage; owner must set decision approved.";
  }

  if (decision === ("approved" as string)) {
    throw new Error("reviewRights must not emit decision approved");
  }

  return {
    contractVersion: ING7_CONTRACT_VERSION,
    candidateId: input.candidateId,
    stage,
    sourceId: input.sourceId,
    publisher: input.publisher,
    author: input.author,
    canonicalUrl: input.canonicalUrl,
    citation: asString(input.normalized.extractedFields.citation) ?? input.canonicalUrl,
    rightsClass: rightsClassFor(
      input.sourceKind,
      input.verbatimTerms,
      input.normalized.extractedFields,
    ),
    retrievedAt: input.retrievedAt,
    decision,
    recommendedDecision,
    recommendReason,
    verbatimTerms: input.verbatimTerms,
    exactSkuEvidence: input.match.evidence,
    rejectRuleIds,
  };
}

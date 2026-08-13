import { ING7_CONTRACT_VERSION, type OwnerReviewPacket, type RightsReviewRecord, type SkuMatchRecord } from "../contract/ing7";
import { ownerReviewPacketSchema } from "../contract/ing7.schema";
import {
  buildProposedDiff,
  collectConflicts,
  collectUnresolved,
} from "./proposedDiff";
import type { PartDefinitionV3 } from "../contract/cat6";
import type { IngestNormalized } from "../contract/ing7";

export interface BuildPacketInput {
  packetId: string;
  candidateId: string;
  match: SkuMatchRecord;
  rights: RightsReviewRecord;
  normalized: IngestNormalized;
  canonicalUrl: string;
  retrievedAt: string;
  sha256: string;
  part?: PartDefinitionV3;
  image?: OwnerReviewPacket["image"];
}

export function buildReviewPacket(input: BuildPacketInput): OwnerReviewPacket {
  const proposedChanges = buildProposedDiff({
    match: input.match,
    normalized: input.normalized,
    rights: input.rights,
    part: input.part,
    retrievedAt: input.retrievedAt,
  });
  const packet: OwnerReviewPacket = {
    contractVersion: ING7_CONTRACT_VERSION,
    packetId: input.packetId,
    candidateId: input.candidateId,
    partId: input.match.matchedPartId,
    sku: input.match,
    source: {
      url: input.canonicalUrl,
      citation: input.rights.citation,
      publisher: input.rights.publisher,
      retrievedAt: input.retrievedAt,
      sha256: input.sha256,
    },
    rights: input.rights,
    image: input.image,
    proposedChanges,
    conflicts: collectConflicts(proposedChanges, input.match, input.rights),
    unresolvedFields: collectUnresolved(input.normalized, input.match),
  };
  return ownerReviewPacketSchema.parse(packet);
}

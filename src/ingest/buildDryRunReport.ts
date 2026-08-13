import { ING7_CONTRACT_VERSION, type DryRunReport, type OwnerReviewPacket } from "../contract/ing7";
import { dryRunReportSchema } from "../contract/ing7.schema";
import { sortLex } from "./stableJson";

export function buildDryRunReport(input: {
  reportId: string;
  generatedAt: string;
  adapterIds: string[];
  packets: OwnerReviewPacket[];
}): DryRunReport {
  let exact = 0;
  let ambiguous = 0;
  let unavailable = 0;
  let rightsRejected = 0;
  let pendingOwner = 0;
  for (const packet of input.packets) {
    if (packet.sku.verdict === "exact") exact += 1;
    if (packet.sku.verdict === "ambiguous") ambiguous += 1;
    if (packet.sku.verdict === "unavailable") unavailable += 1;
    if (packet.rights.stage === "rights-rejected" || packet.rights.decision === "rejected") {
      rightsRejected += 1;
    }
    if (packet.rights.decision === "pending") pendingOwner += 1;
  }
  const report: DryRunReport = {
    contractVersion: ING7_CONTRACT_VERSION,
    reportId: input.reportId,
    generatedAt: input.generatedAt,
    adapterIds: sortLex(input.adapterIds),
    packets: sortLex(input.packets.map((p) => p.packetId)),
    shippedTreeDirty: false,
    summary: {
      exact,
      ambiguous,
      unavailable,
      rightsRejected,
      pendingOwner,
    },
  };
  return dryRunReportSchema.parse(report);
}

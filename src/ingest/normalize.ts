import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ING7_CONTRACT_VERSION, type IngestFetched, type IngestNormalized } from "../contract/ing7";
import { ingestNormalizedSchema } from "../contract/ing7.schema";
import { extractForSourceKind } from "./adapters/extract";
import type { IngestWorkspace } from "./workspace";
import { writeJsonFile } from "./workspace";

export function normalizeFetched(
  workspace: IngestWorkspace,
  fetched: IngestFetched,
  sourceKind: IngestNormalized["sourceKind"],
): IngestNormalized {
  if (fetched.stage !== "fetched" || !fetched.bytesPath || !fetched.sha256) {
    const failed: IngestNormalized = {
      contractVersion: ING7_CONTRACT_VERSION,
      candidateId: fetched.candidateId,
      stage: "normalize-failed",
      sourceKind,
      inputSha256: fetched.sha256 ?? "00".repeat(32),
      identity: { partNumbers: [], variantTokens: [] },
      extractedFields: {},
      rawQuotes: [],
      error: fetched.error ?? "cannot normalize a fetch-failed record",
    };
    writeJsonFile(
      join(workspace.root, "normalized", `${fetched.candidateId}.json`),
      ingestNormalizedSchema.parse(failed),
    );
    return failed;
  }

  const bytes = readFileSync(join(workspace.root, "fetched", fetched.bytesPath));
  const extracted = extractForSourceKind(sourceKind, bytes);
  const row: IngestNormalized = {
    contractVersion: ING7_CONTRACT_VERSION,
    candidateId: fetched.candidateId,
    stage: extracted.ok ? "normalized" : "normalize-failed",
    sourceKind,
    inputSha256: fetched.sha256,
    identity: extracted.identity,
    extractedFields: extracted.extractedFields,
    rawQuotes: extracted.rawQuotes,
    error: extracted.error,
  };
  writeJsonFile(
    join(workspace.root, "normalized", `${fetched.candidateId}.json`),
    ingestNormalizedSchema.parse(row),
  );
  return row;
}

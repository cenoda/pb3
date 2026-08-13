import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { IngestCandidate } from "../contract/ing7";
import { ingestCandidateFileSchema } from "../contract/ing7.schema";

export const DEFAULT_CANDIDATES_REL = "scripts/ingest/candidates.json";

export function loadCandidateFile(
  repoRoot: string,
  relPath = DEFAULT_CANDIDATES_REL,
): IngestCandidate[] {
  const raw: unknown = JSON.parse(
    readFileSync(resolve(repoRoot, relPath), "utf8"),
  );
  return ingestCandidateFileSchema.parse(raw).candidates;
}

export function withCreatedAt(
  candidates: IngestCandidate[],
  createdAt: string,
): IngestCandidate[] {
  return candidates.map((row) => ({ ...row, createdAt }));
}

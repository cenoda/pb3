import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { ING7_CONTRACT_VERSION, type IngestCandidate } from "../contract/ing7";
import { ingestCandidateSchema } from "../contract/ing7.schema";
import { stableStringify } from "./stableJson";

export const INGEST_WORKSPACE_DIRS = [
  "candidates",
  "fetched",
  "normalized",
  "matches",
  "rights",
  "packets",
  "reports",
] as const;

export interface IngestWorkspace {
  repoRoot: string;
  root: string;
}

export function resolveIngestWorkspace(
  repoRoot: string,
  workspaceRel = ".ingest",
): IngestWorkspace {
  return {
    repoRoot: resolve(repoRoot),
    root: resolve(repoRoot, workspaceRel),
  };
}

export function ensureIngestWorkspace(workspace: IngestWorkspace): void {
  mkdirSync(workspace.root, { recursive: true });
  for (const dir of INGEST_WORKSPACE_DIRS) {
    mkdirSync(join(workspace.root, dir), { recursive: true });
  }
}

export function workspacePath(
  workspace: IngestWorkspace,
  ...parts: string[]
): string {
  return join(workspace.root, ...parts);
}

export function writeJsonFile(filePath: string, value: unknown): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${stableStringify(value)}\n`, "utf8");
}

export function writeCandidate(
  workspace: IngestWorkspace,
  candidate: IngestCandidate,
): string {
  const parsed = ingestCandidateSchema.parse(candidate);
  if (parsed.contractVersion !== ING7_CONTRACT_VERSION) {
    throw new Error("candidate contractVersion must be ing7");
  }
  const dest = workspacePath(
    workspace,
    "candidates",
    `${parsed.candidateId}.json`,
  );
  writeJsonFile(dest, parsed);
  return dest;
}

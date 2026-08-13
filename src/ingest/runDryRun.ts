import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ING7_ADAPTER_IDS, type OwnerReviewPacket } from "../contract/ing7";
import { skuMatchRecordSchema } from "../contract/ing7.schema";
import { rightsReviewRecordSchema } from "../contract/ing7.schema";
import { buildDryRunReport } from "./buildDryRunReport";
import { buildReviewPacket } from "./buildReviewPacket";
import {
  loadCatalogIdentities,
  loadManifest,
  loadPartDefinition,
} from "./catalogSnapshot";
import { fetchCandidateBytes } from "./fetchBounded";
import { hashShippedCatalogTrees, sha256Buffer } from "./hashTree";
import { matchExactSku } from "./matchExactSku";
import { normalizeFetched } from "./normalize";
import { reviewRights } from "./reviewRights";
import {
  DEFAULT_CANDIDATES_REL,
  loadCandidateFile,
  withCreatedAt,
} from "./loadCandidates";
import { requestUrlForCandidate } from "./resolveFetchUrl";
import { assertNotShipped } from "./stages";
import {
  ensureIngestWorkspace,
  resolveIngestWorkspace,
  writeCandidate,
  writeJsonFile,
} from "./workspace";

export interface RunDryRunOptions {
  repoRoot: string;
  workspaceRel?: string;
  network?: boolean;
  fixturesDir?: string;
  clock?: string;
  candidatesRel?: string;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function runIngestDryRun(options: RunDryRunOptions) {
  const clock = options.clock ?? "2026-08-13";
  const workspace = resolveIngestWorkspace(
    options.repoRoot,
    options.workspaceRel ?? ".ingest",
  );
  const fixturesDir =
    options.fixturesDir ?? join(options.repoRoot, "src/test/fixtures/ing7");
  const shippedHashBefore = hashShippedCatalogTrees(options.repoRoot);

  ensureIngestWorkspace(workspace);
  const catalog = loadCatalogIdentities(options.repoRoot);
  const manifest = loadManifest(options.repoRoot);
  const partPathById = new Map(manifest.parts.map((p) => [p.id, p.path]));

  const packets: OwnerReviewPacket[] = [];
  const candidates = withCreatedAt(
    loadCandidateFile(options.repoRoot, options.candidatesRel ?? DEFAULT_CANDIDATES_REL),
    clock,
  );

  for (const candidate of candidates) {
    writeCandidate(workspace, candidate);
    const fetched = await fetchCandidateBytes(
      workspace,
      candidate.candidateId,
      candidate.canonicalUrl,
      {
        retrievedAt: clock,
        network: options.network === true,
        fixturesDir,
      },
      options.network === true
        ? requestUrlForCandidate(candidate)
        : candidate.canonicalUrl,
    );
    if (fetched.stage !== "fetched") {
      continue;
    }
    const normalized = normalizeFetched(workspace, fetched, candidate.sourceKind);
    if (normalized.stage !== "normalized") {
      continue;
    }
    const match = skuMatchRecordSchema.parse(
      matchExactSku({
        candidateId: candidate.candidateId,
        identity: normalized.identity,
        catalog,
      }),
    );
    writeJsonFile(
      join(workspace.root, "matches", `${candidate.candidateId}.json`),
      match,
    );
    assertNotShipped(match.stage);

    const sourceId =
      asString(normalized.extractedFields.sourceId) ??
      `source.ing7.${candidate.candidateId}`;
    const publisher =
      asString(normalized.extractedFields.publisher) ?? "unknown";
    const author = asString(normalized.extractedFields.author);
    const verbatimTerms =
      normalized.rawQuotes[0] ??
      asString(normalized.extractedFields.licenseShortName) ??
      "terms not extracted";

    const rights = rightsReviewRecordSchema.parse(
      reviewRights({
        candidateId: candidate.candidateId,
        sourceKind: candidate.sourceKind,
        canonicalUrl: candidate.canonicalUrl,
        retrievedAt: clock,
        match,
        normalized,
        verbatimTerms,
        publisher,
        author,
        sourceId,
      }),
    );
    writeJsonFile(
      join(workspace.root, "rights", `${candidate.candidateId}.json`),
      rights,
    );
    assertNotShipped(rights.stage);

    const partId = match.matchedPartId;
    const partPath = partId ? partPathById.get(partId) : undefined;
    const part = partPath
      ? loadPartDefinition(options.repoRoot, partPath)
      : undefined;

    let image: OwnerReviewPacket["image"];
    const stillB64 = asString(normalized.extractedFields.syntheticStillJpegBase64);
    if (stillB64 && candidate.sourceKind === "licensed-still") {
      const stillBytes = Buffer.from(stillB64, "base64");
      const previewRel = `fetched/${candidate.candidateId}.still.jpg`;
      mkdirSync(join(workspace.root, "fetched"), { recursive: true });
      writeFileSync(join(workspace.root, previewRel), stillBytes);
      image = {
        previewPath: previewRel,
        sha256: sha256Buffer(stillBytes),
        bytes: stillBytes.length,
        mimeType: "image/jpeg",
      };
    }

    const packet = buildReviewPacket({
      packetId: `pkt.${candidate.candidateId}`,
      candidateId: candidate.candidateId,
      match,
      rights,
      normalized,
      canonicalUrl: candidate.canonicalUrl,
      retrievedAt: clock,
      sha256: fetched.sha256 ?? "00".repeat(32),
      part,
      image,
    });
    writeJsonFile(join(workspace.root, "packets", `${packet.packetId}.json`), packet);
    const md = [
      `# Owner review packet ${packet.packetId}`,
      "",
      `- SKU verdict: ${packet.sku.verdict}`,
      `- matchedPartId: ${packet.partId ?? "(none)"}`,
      `- rights decision: ${packet.rights.decision} (recommended ${packet.rights.recommendedDecision})`,
      `- citation: ${packet.source.citation}`,
      `- shippedTree: unchanged by dry-run`,
      "",
    ].join("\n");
    writeFileSync(join(workspace.root, "packets", `${packet.packetId}.md`), md, "utf8");
    packets.push(packet);
  }

  const shippedHashAfter = hashShippedCatalogTrees(options.repoRoot);
  if (shippedHashBefore !== shippedHashAfter) {
    throw new Error("dry-run mutated parts/ or benchmarks/cat6/");
  }

  const report = buildDryRunReport({
    reportId: `rep.ing7.${clock}`,
    generatedAt: clock,
    adapterIds: [...ING7_ADAPTER_IDS],
    packets,
  });
  writeJsonFile(join(workspace.root, "reports", `${report.reportId}.json`), report);
  return { workspace, report, packets };
}

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ING7_CONTRACT_VERSION } from "../contract/ing7";
import { dryRunReportSchema, ingestCandidateSchema } from "../contract/ing7.schema";
import { hashDirectoryTree, hashShippedCatalogTrees, sha256Utf8 } from "../ingest/hashTree";
import { normalizeFetched } from "../ingest/normalize";
import { reviewRights } from "../ingest/reviewRights";
import { runIngestDryRun } from "../ingest/runDryRun";
import {
  ensureIngestWorkspace,
  resolveIngestWorkspace,
  writeCandidate,
} from "../ingest/workspace";

const ROOT = resolve(__dirname, "../..");

describe("ing7 integrity — first slice", () => {
  it("writing a candidate does not create files under parts/ or benchmarks/", () => {
    const tmp = mkdtempSync(join(tmpdir(), "ing7-ws-"));
    const beforeParts = hashDirectoryTree(join(ROOT, "parts"));
    const beforeBench = hashDirectoryTree(join(ROOT, "benchmarks"));
    try {
      const workspace = resolveIngestWorkspace(tmp, ".ingest");
      ensureIngestWorkspace(workspace);
      writeCandidate(workspace, ingestCandidateSchema.parse({
        contractVersion: ING7_CONTRACT_VERSION,
        candidateId: "cand.tmp",
        stage: "candidate",
        sourceKind: "licensed-still",
        canonicalUrl: "https://example.invalid/file",
        createdAt: "2026-08-13",
      }));
      expect(hashDirectoryTree(join(ROOT, "parts"))).toBe(beforeParts);
      expect(hashDirectoryTree(join(ROOT, "benchmarks"))).toBe(beforeBench);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it(".gitignore contains .ingest/", () => {
    const gi = readFileSync(join(ROOT, ".gitignore"), "utf8");
    expect(gi).toMatch(/^\.ingest\/$/m);
  });

  it("Vite copy targets remain parts and benchmarks only", () => {
    const vite = readFileSync(join(ROOT, "vite.config.ts"), "utf8");
    expect(vite).toContain('{ src: "parts", dest: "." }');
    expect(vite).toContain('{ src: "benchmarks", dest: "." }');
    expect(vite).not.toContain(".ingest");
  });

  it("fixture dry-run writes only the workspace and leaves shipped trees unchanged", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "ing7-run-"));
    const shippedBefore = hashShippedCatalogTrees(ROOT);
    const frozenProv4 = readFileSync(join(ROOT, "src/contract/prov4.ts"), "utf8");
    const frozenEst1 = readFileSync(join(ROOT, "src/contract/est1.ts"), "utf8");
    try {
      const result = await runIngestDryRun({
        repoRoot: ROOT,
        workspaceRel: join(tmp, ".ingest"),
        network: false,
        fixturesDir: join(ROOT, "src/test/fixtures/ing7"),
        clock: "2026-08-13",
      });
      expect(result.report.shippedTreeDirty).toBe(false);
      expect(dryRunReportSchema.parse(result.report).shippedTreeDirty).toBe(false);
      expect(hashShippedCatalogTrees(ROOT)).toBe(shippedBefore);
      expect(readFileSync(join(ROOT, "src/contract/prov4.ts"), "utf8")).toBe(frozenProv4);
      expect(readFileSync(join(ROOT, "src/contract/est1.ts"), "utf8")).toBe(frozenEst1);

      const gpu = result.packets.find((p) =>
        p.candidateId.includes("asus-dual-rtx4070"),
      );
      expect(gpu).toBeDefined();
      expect(gpu?.sku.verdict).toBe("exact");
      expect(gpu?.rights.rejectRuleIds).toContain("R1");
      expect(gpu?.rights.decision).toBe("rejected");

      const cpuImg = result.packets.find((p) =>
        p.candidateId.includes("ryzen-5-7600") && p.candidateId.includes("wikimedia"),
      );
      expect(cpuImg?.sku.verdict).toBe("exact");
      expect(cpuImg?.rights.decision).toBe("pending");
      expect(cpuImg?.rights.recommendedDecision).toBe("approved");

      const trayPhoto = result.packets.find((p) =>
        p.candidateId.includes("7800x3d"),
      );
      expect(trayPhoto?.sku.verdict).not.toBe("exact");

      const spec = result.packets.find((p) => p.candidateId.includes("amd-spec"));
      expect(spec?.sku.verdict).toBe("exact");
      expect(spec?.rights.decision).toBe("approved-metadata-only");

      for (const packet of result.packets) {
        expect(packet.rights.decision).not.toBe("approved");
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("same fixtures and clock produce byte-identical normalized JSON", async () => {
    const tmpA = mkdtempSync(join(tmpdir(), "ing7-a-"));
    const tmpB = mkdtempSync(join(tmpdir(), "ing7-b-"));
    try {
      const a = await runIngestDryRun({
        repoRoot: ROOT,
        workspaceRel: join(tmpA, ".ingest"),
        network: false,
        fixturesDir: join(ROOT, "src/test/fixtures/ing7"),
        clock: "2026-08-13",
      });
      const b = await runIngestDryRun({
        repoRoot: ROOT,
        workspaceRel: join(tmpB, ".ingest"),
        network: false,
        fixturesDir: join(ROOT, "src/test/fixtures/ing7"),
        clock: "2026-08-13",
      });
      expect(JSON.stringify(a.report)).toBe(JSON.stringify(b.report));
      const normA = readFileSync(
        join(tmpA, ".ingest/normalized/cand.amd-spec.cpu.amd-ryzen-5-7600.json"),
        "utf8",
      );
      const normB = readFileSync(
        join(tmpB, ".ingest/normalized/cand.amd-spec.cpu.amd-ryzen-5-7600.json"),
        "utf8",
      );
      expect(normA).toBe(normB);
      expect(sha256Utf8(normA)).toBe(sha256Utf8(normB));
    } finally {
      rmSync(tmpA, { recursive: true, force: true });
      rmSync(tmpB, { recursive: true, force: true });
    }
  });

  it("unparseable input becomes normalize-failed", () => {
    const tmp = mkdtempSync(join(tmpdir(), "ing7-nf-"));
    try {
      const workspace = resolveIngestWorkspace(tmp, ".ingest");
      ensureIngestWorkspace(workspace);
      const fetchedPath = join(workspace.root, "fetched", "cand.bad.bin");
      mkdirSync(join(workspace.root, "fetched"), { recursive: true });
      mkdirSync(join(workspace.root, "normalized"), { recursive: true });
      writeFileSync(fetchedPath, "not a document");
      const normalized = normalizeFetched(
        workspace,
        {
          contractVersion: ING7_CONTRACT_VERSION,
          candidateId: "cand.bad",
          stage: "fetched",
          canonicalUrl: "https://example.invalid/bad",
          retrievedAt: "2026-08-13",
          sha256: sha256Utf8("not a document"),
          bytesPath: "cand.bad.bin",
        },
        "licensed-still",
      );
      expect(normalized.stage).toBe("normalize-failed");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("rights engine cannot emit approved (runtime guard + schema)", () => {
    const rec = reviewRights({
      candidateId: "x",
      sourceKind: "licensed-still",
      canonicalUrl: "https://example.invalid",
      retrievedAt: "2026-08-13",
      match: {
        contractVersion: ING7_CONTRACT_VERSION,
        candidateId: "x",
        stage: "sku-exact",
        verdict: "exact",
        matchedPartId: "cpu.amd-ryzen-5-7600",
        matchedBy: "partNumber",
        evidence: "pn",
        variantConflicts: [],
        rejectedPartIds: [],
      },
      normalized: {
        contractVersion: ING7_CONTRACT_VERSION,
        candidateId: "x",
        stage: "normalized",
        sourceKind: "licensed-still",
        inputSha256: "ab".repeat(32),
        identity: { partNumbers: ["100-100001015BOX"], variantTokens: [] },
        extractedFields: { storageGrant: true },
        rawQuotes: [],
      },
      verbatimTerms: "CC0 1.0",
      publisher: "Wikimedia Commons",
      author: "Test",
      sourceId: "source.cat6.image.wikimedia.ryzen-5-7600-top-fal",
    });
    expect(rec.decision).not.toEqual("approved");
  });
});

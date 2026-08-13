#!/usr/bin/env node
/**
 * Phase 7.1 ingest CLI. Default: dry-run, no network, no apply.
 */
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { runIngestDryRun } from "../../src/ingest/runDryRun.ts";

const { values } = parseArgs({
  options: {
    workspace: { type: "string", default: ".ingest" },
    apply: { type: "boolean", default: false },
    live: { type: "boolean", default: false },
    network: { type: "boolean", default: false },
    fixtures: { type: "string" },
    candidates: { type: "string" },
    clock: { type: "string", default: "2026-08-13" },
    "repo-root": { type: "string" },
    "no-apply": { type: "boolean", default: true },
    "no-network": { type: "boolean", default: true },
  },
  strict: false,
});

if (values.apply) {
  console.error("ing7 first slice has no apply path (Step 10). Refusing.");
  process.exit(2);
}

const repoRoot = resolve(values["repo-root"] ?? process.cwd());
const network = values.live === true || values.network === true;

const result = await runIngestDryRun({
  repoRoot,
  workspaceRel: values.workspace,
  network,
  fixturesDir: values.fixtures
    ? resolve(repoRoot, values.fixtures)
    : resolve(repoRoot, "src/test/fixtures/ing7"),
  candidatesRel: values.candidates,
  clock: values.clock,
});

console.log(
  JSON.stringify(
    {
      reportId: result.report.reportId,
      shippedTreeDirty: result.report.shippedTreeDirty,
      summary: result.report.summary,
      packets: result.report.packets,
    },
    null,
    2,
  ),
);

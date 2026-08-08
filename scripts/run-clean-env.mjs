#!/usr/bin/env node
/**
 * Run a command with conflicting color env vars removed.
 * Node warns when both NO_COLOR and FORCE_COLOR are set (common in IDE/agent shells).
 */
import { spawnSync } from "node:child_process";

const env = { ...process.env };
delete env.NO_COLOR;
delete env.FORCE_COLOR;

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: run-clean-env.mjs <command> [args...]");
  process.exit(2);
}

const result = spawnSync(args[0], args.slice(1), {
  env,
  stdio: "inherit",
  shell: false,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);

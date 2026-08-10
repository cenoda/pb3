#!/usr/bin/env node
/**
 * Agent browser exploration walkthrough for Phase 0 (Playwright CLI).
 * Not a regression test — interactive-style checks via a11y/DOM for Aria/Lira/Nox.
 *
 * Prerequisites: app reachable at BASE_URL (default http://127.0.0.1:5173).
 * Usage:
 *   pnpm dev   # other terminal
 *   pnpm explore:phase0
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = process.env.BASE_URL ?? "http://127.0.0.1:5173";
const session = process.env.PLAYWRIGHT_CLI_SESSION ?? "pb3-explore";
const outDir = join("docs", "verification", "explore-notes");
const bin = join("node_modules", ".bin", "playwright-cli");

const cleanEnv = { ...process.env };
delete cleanEnv.NO_COLOR;
delete cleanEnv.FORCE_COLOR;

function cli(...args) {
  const r = spawnSync(bin, [`-s=${session}`, ...args], {
    encoding: "utf8",
    env: cleanEnv,
  });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  process.stdout.write(out);
  if (r.status !== 0 && !out.includes("not open")) {
    throw new Error(`playwright-cli failed: ${args.join(" ")}\n${out}`);
  }
  return out;
}

function evalJs(fnSource) {
  return cli("eval", fnSource);
}

mkdirSync(outDir, { recursive: true });
const log = [];
const stamp = new Date().toISOString().slice(0, 10);

function step(title, fn) {
  console.log(`\n=== ${title} ===`);
  log.push(`## ${title}`);
  const result = fn();
  log.push(result);
  return result;
}

try {
  cli("close");
} catch {
  /* session may not exist */
}

step("1 open clean URL", () => cli("open", `${base}/`, "--no-headed"));

// wait for boot (fixtures fetch)
spawnSync("sleep", ["0.8"]);

step("2 default BuildState + ranges", () =>
  evalJs(
    `() => ({
      url: location.href,
      cpu: document.querySelector('[data-testid=cpu-select]')?.value,
      gpu: document.querySelector('[data-testid=gpu-select]')?.value,
      range1080: document.querySelector('[data-testid=perf-range-1080p]')?.textContent,
      range1440: document.querySelector('[data-testid=perf-range-1440p]')?.textContent,
      range4k: document.querySelector('[data-testid=perf-range-4k]')?.textContent,
      gpuId: document.querySelector('[data-testid=build-viewport]')?.getAttribute('data-gpu-id'),
    })`,
  ),
);

step("3 a11y snapshot", () => cli("snapshot"));

step("4 other CPU (ranges update, GPU id unchanged)", () => {
  cli("select", "data-testid=cpu-select", "cpu.amd-ryzen-7-7800x3d");
  spawnSync("sleep", ["0.3"]);
  return evalJs(
    `() => ({
      url: location.href,
      cpu: document.querySelector('[data-testid=cpu-select]')?.value,
      range1440: document.querySelector('[data-testid=perf-range-1440p]')?.textContent,
      gpuId: document.querySelector('[data-testid=build-viewport]')?.getAttribute('data-gpu-id'),
    })`,
  );
});

step("5 other GPU (mesh path + ranges)", () => {
  cli("select", "data-testid=gpu-select", "gpu.asus-proart-rtx4080-o16g");
  spawnSync("sleep", ["0.5"]);
  return evalJs(
    `() => ({
      url: location.href,
      cpu: document.querySelector('[data-testid=cpu-select]')?.value,
      gpu: document.querySelector('[data-testid=gpu-select]')?.value,
      range1440: document.querySelector('[data-testid=perf-range-1440p]')?.textContent,
      gpuId: document.querySelector('[data-testid=build-viewport]')?.getAttribute('data-gpu-id'),
      glb: document.querySelector('[data-testid=build-viewport]')?.getAttribute('data-glb-path'),
    })`,
  );
});

step("6 screenshot", () =>
  cli(
    "screenshot",
    `--filename=${join(outDir, "after-gpu-swap.png")}`,
  ),
);

step("7 reload restore", () => {
  cli("reload");
  spawnSync("sleep", ["0.8"]);
  return evalJs(
    `() => ({
      url: location.href,
      cpu: document.querySelector('[data-testid=cpu-select]')?.value,
      gpu: document.querySelector('[data-testid=gpu-select]')?.value,
      range1440: document.querySelector('[data-testid=perf-range-1440p]')?.textContent,
    })`,
  );
});

step("8 invalid CPU → default fallback", () => {
  cli(
    "open",
    `${base}/?v=vs0&cpu=cpu.not-real&gpu=gpu.asus-proart-rtx4080-o16g`,
    "--no-headed",
  );
  spawnSync("sleep", ["0.8"]);
  return evalJs(
    `() => ({
      url: location.href,
      cpu: document.querySelector('[data-testid=cpu-select]')?.value,
      gpu: document.querySelector('[data-testid=gpu-select]')?.value,
    })`,
  );
});

cli("close");

const reportPath = join(outDir, `cli-walkthrough-${stamp}.md`);
writeFileSync(
  reportPath,
  [
    `# Playwright CLI walkthrough — Phase 0`,
    ``,
    `- Date: ${new Date().toISOString()}`,
    `- Base URL: ${base}`,
    `- Session: ${session}`,
    `- Tool: @playwright/cli (not a regression suite)`,
    ``,
    `## Expected outcomes (from 2026-08-08 live run)`,
    ``,
    `| Step | Expect |`,
    `|------|--------|`,
    `| Clean open | Full query rewrite; cpu=7600 gpu=4070; 1080p 80–95, 1440p 52–64, 4k 28–36 |`,
    `| Other CPU | cpu=7800x3d; 1440p 58–70; data-gpu-id still 4070 |`,
    `| Other GPU | gpu=4080; 1440p 115–138; data-glb-path …/gpu.asus-proart-rtx4080-o16g/model.glb |`,
    `| Reload | Same cpu/gpu/range from URL |`,
    `| Invalid cpu | Fall back to default 7600+4070 full query |`,
    ``,
    `## Raw log excerpts`,
    ``,
    ...log.map((chunk) => "```\n" + String(chunk).slice(0, 4000) + "\n```\n"),
    ``,
  ].join("\n"),
  "utf8",
);

console.log(`\nWrote ${reportPath}`);
console.log("Done. Review screenshot + report under docs/verification/explore-notes/");

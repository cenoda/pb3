import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Legacy fixture ids retired in Phase 6 Step 4.
 * Guard scope: src/**, parts/**, benchmarks/**, e2e/** — docs/** deliberately excluded
 * (phase-0..5 specs describe historical state and must not be rewritten).
 */
const LEGACY_PART_IDS = [
  "case.mid-tower-atx-01",
  "case.micro-atx-mini-01",
  "cooler.air-twin-tower-01",
  "cpu.zen4-7600",
  "cpu.zen4-7800x3d",
  "gpu.rtx4070",
  "gpu.rtx4080",
  "mb.atx-b650-01",
  "mb.micro-b450-01",
  "psu.750w-atx",
  "psu.550w-sfx",
  "ram.ddr5-32gb-6000",
  "ram.ddr5-16gb-7200",
] as const;

const GUARDED_ROOTS = ["src", "parts", "benchmarks", "e2e"] as const;
const REPO_ROOT = join(import.meta.dirname, "../..");

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".json",
  ".mjs",
  ".js",
  ".md",
  ".css",
  ".html",
  ".spec.ts",
]);

function collectFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      collectFiles(full, out);
    } else {
      const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
      if (TEXT_EXTENSIONS.has(ext) || name.endsWith(".spec.ts")) {
        out.push(full);
      }
    }
  }
  return out;
}

function scanGuardedTreeForLegacyIds(): Array<{ file: string; id: string }> {
  const hits: Array<{ file: string; id: string }> = [];
  const selfTest = "src/test/cat6.integrity.test.ts";
  for (const root of GUARDED_ROOTS) {
    const abs = join(REPO_ROOT, root);
    for (const file of collectFiles(abs)) {
      const rel = relative(REPO_ROOT, file);
      if (rel === selfTest) continue;
      const text = readFileSync(file, "utf8");
      for (const id of LEGACY_PART_IDS) {
        if (text.includes(id)) {
          hits.push({ file: relative(REPO_ROOT, file), id });
        }
      }
    }
  }
  return hits;
}

describe("cat6 integrity — legacy id guard", () => {
  it("has no legacy fixture id in guarded paths (docs/** excluded by design)", () => {
    const hits = scanGuardedTreeForLegacyIds();
    expect(hits, JSON.stringify(hits, null, 2)).toEqual([]);
  });
});

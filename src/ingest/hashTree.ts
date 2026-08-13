import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export function sha256Buffer(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function sha256Utf8(text: string): string {
  return sha256Buffer(Buffer.from(text, "utf8"));
}

function walkFiles(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries.sort()) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkFiles(full, out);
    } else if (st.isFile()) {
      out.push(full);
    }
  }
  return out;
}

/** Content-address a directory tree (relative paths + file bytes). */
export function hashDirectoryTree(absDir: string): string {
  const hash = createHash("sha256");
  for (const file of walkFiles(absDir)) {
    const rel = relative(absDir, file).split("\\").join("/");
    hash.update(rel);
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

export function hashShippedCatalogTrees(repoRoot: string): string {
  const hash = createHash("sha256");
  hash.update(hashDirectoryTree(join(repoRoot, "parts")));
  hash.update(hashDirectoryTree(join(repoRoot, "benchmarks", "cat6")));
  return hash.digest("hex");
}

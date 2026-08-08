import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const originalFetch = globalThis.fetch;

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.pathname + input.search
        : input.url;

  if (url.startsWith("/parts/") || url.startsWith("/benchmarks/")) {
    const pathname = url.split("?")[0] ?? url;
    const filePath = path.join(repoRoot, pathname);
    if (!fs.existsSync(filePath)) {
      return new Response(null, { status: 404, statusText: "Not Found" });
    }
    const body = fs.readFileSync(filePath);
    return new Response(body, { status: 200 });
  }

  return originalFetch(input, init);
};

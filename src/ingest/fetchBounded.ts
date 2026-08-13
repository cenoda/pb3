import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { ING7_CONTRACT_VERSION, type IngestFetched } from "../contract/ing7";
import { ingestFetchedSchema } from "../contract/ing7.schema";
import { sha256Buffer } from "./hashTree";
import type { IngestWorkspace } from "./workspace";
import { writeJsonFile } from "./workspace";

export const INGEST_USER_AGENT =
  "pb3-catalog-ingest/ing7 (3D PC Builder; build-time curator; +local)";

export const FETCH_TIMEOUT_MS = 15_000;

export interface FetchOptions {
  retrievedAt: string;
  network: boolean;
  fixturesDir: string;
  timeoutMs?: number;
}

function contentTypeFor(pathOrType: string): string {
  const ext = extname(pathOrType).toLowerCase();
  if (ext === ".json") return "application/json";
  if (ext === ".html" || ext === ".htm") return "text/html";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  return "application/octet-stream";
}

function loadFixtureIndex(fixturesDir: string): Record<string, string> {
  const indexPath = join(fixturesDir, "index.json");
  const raw = JSON.parse(readFileSync(indexPath, "utf8")) as {
    urls?: Record<string, string>;
  };
  return raw.urls ?? {};
}

async function liveGet(
  url: string,
  timeoutMs: number,
): Promise<{ status: number; bytes: Buffer; contentType?: string }> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ac.signal,
      headers: { "User-Agent": INGEST_USER_AGENT, Accept: "*/*" },
    });
    const ab = await res.arrayBuffer();
    return {
      status: res.status,
      bytes: Buffer.from(ab),
      contentType: res.headers.get("content-type") ?? undefined,
    };
  } finally {
    clearTimeout(timer);
  }
}

export interface FetchCandidateInput {
  candidateId: string;
  canonicalUrl: string;
  /** GET target; defaults to canonicalUrl. Fixtures always key on canonicalUrl. */
  requestUrl?: string;
}

export async function fetchCandidateBytes(
  workspace: IngestWorkspace,
  candidateId: string,
  canonicalUrl: string,
  options: FetchOptions,
  requestUrl = canonicalUrl,
): Promise<IngestFetched> {
  const sidecarPath = join(workspace.root, "fetched", `${candidateId}.json`);
  const bytesPathRel = `${candidateId}.bin`;
  const bytesAbs = join(workspace.root, "fetched", bytesPathRel);

  const fail = (error: string, httpStatus?: number): IngestFetched => {
    const row: IngestFetched = {
      contractVersion: ING7_CONTRACT_VERSION,
      candidateId,
      stage: "fetch-failed",
      canonicalUrl,
      retrievedAt: options.retrievedAt,
      httpStatus,
      error,
    };
    writeJsonFile(sidecarPath, ingestFetchedSchema.parse(row));
    return row;
  };

  try {
    let status = 200;
    let bytes: Buffer;
    let contentType: string | undefined;

    if (!options.network) {
      const index = loadFixtureIndex(options.fixturesDir);
      const rel = index[canonicalUrl] ?? index[requestUrl];
      if (!rel) {
        return fail(`no fixture mapping for ${canonicalUrl}`, 404);
      }
      const fixturePath = join(options.fixturesDir, rel);
      bytes = readFileSync(fixturePath);
      contentType = contentTypeFor(fixturePath);
    } else {
      const got = await liveGet(
        requestUrl,
        options.timeoutMs ?? FETCH_TIMEOUT_MS,
      );
      status = got.status;
      bytes = got.bytes;
      contentType = got.contentType;
      if (status < 200 || status >= 300) {
        return fail(`HTTP ${status}`, status);
      }
    }

    mkdirSync(join(workspace.root, "fetched"), { recursive: true });
    writeFileSync(bytesAbs, bytes);
    const row: IngestFetched = {
      contractVersion: ING7_CONTRACT_VERSION,
      candidateId,
      stage: "fetched",
      canonicalUrl,
      retrievedAt: options.retrievedAt,
      httpStatus: status,
      contentType,
      sha256: sha256Buffer(bytes),
      bytesPath: bytesPathRel,
    };
    writeJsonFile(sidecarPath, ingestFetchedSchema.parse(row));
    return row;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return fail(message);
  }
}

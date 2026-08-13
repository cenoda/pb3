import type { IngestCandidate, IngestSourceKind } from "../contract/ing7";

const COMMONS_FILE_PATH = /\/wiki\/(File:[^#?]+)/i;

export function commonsFileTitleFromUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (!/(^|\.)wikimedia\.org$/i.test(parsed.hostname)) return undefined;
    const match = parsed.pathname.match(COMMONS_FILE_PATH);
    if (!match?.[1]) return undefined;
    return decodeURIComponent(match[1].replace(/_/g, " "));
  } catch {
    return undefined;
  }
}

/** File: page → Commons imageinfo API. Other URLs pass through. */
export function resolveFetchUrl(
  canonicalUrl: string,
  sourceKind: IngestSourceKind,
): string {
  if (sourceKind !== "licensed-still") return canonicalUrl;
  const title = commonsFileTitleFromUrl(canonicalUrl);
  if (!title) return canonicalUrl;
  const params = new URLSearchParams({
    action: "query",
    titles: title,
    prop: "imageinfo",
    iiprop: "extmetadata|url|size|mime|sha1",
    format: "json",
  });
  return `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
}

export function requestUrlForCandidate(candidate: IngestCandidate): string {
  if (candidate.fetchUrl) return candidate.fetchUrl;
  return resolveFetchUrl(candidate.canonicalUrl, candidate.sourceKind);
}

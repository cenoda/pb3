import type { IngestSourceKind, NormalizedIdentity } from "../../contract/ing7";
import { sortIdentity, tokensFromText } from "../identityNormalize";

export interface AdapterExtract {
  ok: boolean;
  identity: NormalizedIdentity;
  extractedFields: Record<string, unknown>;
  rawQuotes: string[];
  error?: string;
}

function fail(error: string): AdapterExtract {
  return {
    ok: false,
    identity: { partNumbers: [], variantTokens: [] },
    extractedFields: {},
    rawQuotes: [],
    error,
  };
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}

const AMD_OPN = /\b(100-[0-9]{9}(?:BOX|WOF)?)\b/g;
const ASUS_DUAL_SKU = /\b(DUAL-RTX40[0-9]{2}(?:-SUPER)?-O[0-9]+G)\b/g;

function collectOpns(...blobs: string[]): string[] {
  const found = new Set<string>();
  for (const blob of blobs) {
    for (const m of blob.matchAll(AMD_OPN)) {
      if (m[1]) found.add(m[1]);
    }
  }
  return [...found].sort();
}

/** Prefer a printed CPU marketing name over a Commons filename. */
export function inferAmdCpuModelName(...blobs: string[]): string | undefined {
  for (const blob of blobs) {
    const match = blob.match(/\bRyzen\s+\d+\s+[A-Z0-9]+\b/i);
    if (match) return match[0].replace(/\s+/g, " ");
  }
  return undefined;
}

type ExtMap = Record<string, { value?: string }>;

function extValue(ext: ExtMap, key: string): string {
  return typeof ext[key]?.value === "string" ? ext[key].value : "";
}

function commonsExtFromUnknown(json: Record<string, unknown>): {
  ext: ExtMap;
  title: string;
  canonicalUrl?: string;
  sourceId?: string;
  stillB64?: string;
  imageUrl?: string;
} | undefined {
  if (json.extmetadata && typeof json.extmetadata === "object") {
    return {
      ext: json.extmetadata as ExtMap,
      title: typeof json.title === "string" ? json.title : "",
      canonicalUrl: typeof json.canonicalUrl === "string" ? json.canonicalUrl : undefined,
      sourceId: typeof json.sourceId === "string" ? json.sourceId : undefined,
      stillB64:
        typeof json.syntheticStillJpegBase64 === "string"
          ? json.syntheticStillJpegBase64
          : undefined,
    };
  }

  const query = json.query as { pages?: Record<string, unknown> } | undefined;
  const pages = query?.pages;
  if (!pages || typeof pages !== "object") return undefined;
  const page = Object.values(pages)[0] as
    | {
        title?: string;
        imageinfo?: Array<{
          extmetadata?: ExtMap;
          descriptionurl?: string;
          url?: string;
        }>;
      }
    | undefined;
  const info = page?.imageinfo?.[0];
  if (!info?.extmetadata) return undefined;
  return {
    ext: info.extmetadata,
    title: typeof page?.title === "string" ? page.title : "",
    canonicalUrl: info.descriptionurl,
    imageUrl: info.url,
  };
}

export function extractWikimediaCpuImage(bytes: Buffer): AdapterExtract {
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(bytes.toString("utf8")) as Record<string, unknown>;
  } catch {
    return fail("wikimedia payload is not JSON");
  }
  const unwrapped = commonsExtFromUnknown(json);
  if (!unwrapped) return fail("missing Commons extmetadata");

  const { ext, title } = unwrapped;
  const license = extValue(ext, "LicenseShortName");
  const licenseUrl = extValue(ext, "LicenseUrl");
  const artist = stripTags(extValue(ext, "Artist"));
  const usage = extValue(ext, "UsageTerms") || license;
  const description = stripTags(extValue(ext, "ImageDescription"));
  const objectName = stripTags(extValue(ext, "ObjectName"));
  if (!license) return fail("missing license short name");

  const blob = [title, objectName, description].join("\n");
  const identity = sortIdentity({
    manufacturer: "AMD",
    modelName:
      inferAmdCpuModelName(description, objectName, title) ||
      objectName ||
      title ||
      undefined,
    partNumbers: collectOpns(blob),
    variantTokens: tokensFromText(blob),
  });

  return {
    ok: identity.partNumbers.length > 0 || Boolean(objectName || description),
    identity,
    extractedFields: {
      adapterId: "wikimedia-cpu-image",
      licenseShortName: license,
      licenseUrl,
      author: artist,
      publisher: "Wikimedia Commons",
      storageGrant: /^(CC0|FAL|CC BY)/i.test(license),
      modificationProhibited: false,
      wouldStoreDerivative: false,
      metadataOnly: false,
      wantsImageStorage: true,
      imageKind: "still",
      rightsClass: /CC0/i.test(license) ? "licensed" : "cc-attribution",
      citation: unwrapped.canonicalUrl,
      sourceId: unwrapped.sourceId,
      syntheticStillJpegBase64: unwrapped.stillB64,
      imageUrl: unwrapped.imageUrl,
    },
    rawQuotes: [usage, description, title].filter(Boolean),
  };
}

export function extractManufacturerGpuImage(bytes: Buffer): AdapterExtract {
  const html = bytes.toString("utf8");
  if (!/<html/i.test(html) && !/DUAL-RTX/i.test(html)) {
    return fail("manufacturer GPU page missing expected markup");
  }
  const sku = [...html.matchAll(ASUS_DUAL_SKU)].map((m) => m[1])[0];
  const legal =
    html.match(/<div[^>]*class="legal"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ??
    html.match(/do not grant[\s\S]{0,400}prior written permission[\s\S]{0,200}/i)?.[0] ??
    "";
  const title = html
    .match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    ?.replace(/<[^>]+>/g, "")
    .trim();
  if (!sku && !title) return fail("no SKU or title on manufacturer GPU page");

  const identity = sortIdentity({
    manufacturer: "ASUS",
    modelName: title,
    partNumbers: sku ? [sku] : [],
    variantTokens: tokensFromText([title, sku].filter(Boolean).join(" ")),
  });

  return {
    ok: true,
    identity,
    extractedFields: {
      adapterId: "manufacturer-gpu-image",
      publisher: "ASUSTeK Computer Inc.",
      author: "ASUSTeK Computer Inc.",
      storageGrant: false,
      modificationProhibited: true,
      wouldStoreDerivative: true,
      metadataOnly: false,
      wantsImageStorage: true,
      imageKind: "still",
      rightsClass: "licensed",
      sourceId: "source.cat6.image.asus.dual-rtx4070-o12g.press",
      citation:
        "https://www.asus.com/us/motherboards-components/graphics-cards/dual/dual-rtx4070-o12g/",
    },
    rawQuotes: [stripTags(legal), sku ?? ""].filter(Boolean),
  };
}

function parseGhzToMhz(raw: string): number | undefined {
  const m = raw.match(/(\d+(?:\.\d+)?)\s*GHz/i);
  if (!m) return undefined;
  return Math.round(Number(m[1]) * 1000);
}

function parseWatts(raw: string): number | undefined {
  const m = raw.match(/(\d+)\s*W/i);
  if (!m) return undefined;
  return Number(m[1]);
}

function labelKey(dtHtml: string): string {
  const text = stripTags(dtHtml);
  return text.replace(/\s+/g, " ").trim();
}

function parseAmdDefinitionList(html: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /<dt\b[^>]*>([\s\S]*?)<\/dt>[\s\S]*?<dd\b[^>]*>([\s\S]*?)<\/dd>/gi;
  for (const m of html.matchAll(re)) {
    const key = labelKey(m[1] ?? "");
    const value = stripTags(m[2] ?? "");
    if (key && value) map.set(key, value);
  }
  return map;
}

function findAmdValue(pairs: Map<string, string>, prefix: string): string | undefined {
  const want = prefix.toLowerCase();
  for (const [key, value] of pairs) {
    if (key.toLowerCase().startsWith(want)) return value;
  }
  return undefined;
}

function extractAmdFromPairs(html: string): AdapterExtract | undefined {
  const article =
    html.match(
      /<article\b[^>]*class="[^"]*product-specifications[^"]*"[^>]*>([\s\S]*?)<\/article>/i,
    )?.[1] ?? html;
  const pairs = parseAmdDefinitionList(article);
  if (pairs.size === 0) return undefined;

  const boxed = findAmdValue(pairs, "Product ID Boxed");
  const tray = findAmdValue(pairs, "Product ID Tray");
  const name =
    html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ??
    findAmdValue(pairs, "Model");
  const partNumbers = [boxed, tray].filter((v): v is string => Boolean(v));
  if (partNumbers.length === 0) return undefined;

  const boostRaw = findAmdValue(pairs, "Max. Boost Clock") ?? "";
  const baseRaw = findAmdValue(pairs, "Base Clock") ?? "";
  const tdpRaw = findAmdValue(pairs, "Default TDP") ?? "";

  const identity = sortIdentity({
    manufacturer: "AMD",
    modelName: name,
    partNumbers,
    variantTokens: tokensFromText(`${boxed ?? ""} BOX`),
  });

  return {
    ok: true,
    identity,
    extractedFields: {
      adapterId: "amd-product-spec",
      publisher: "Advanced Micro Devices, Inc.",
      sourceId: "source.cat6.amd.ryzen-5-7600.product",
      citation:
        "https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-5-7600.html",
      storageGrant: false,
      metadataOnly: true,
      wantsImageStorage: false,
      rightsClass: "public-spec",
      baseClockMhz: parseGhzToMhz(baseRaw),
      boostClockMhz: parseGhzToMhz(boostRaw),
      defaultTdpW: parseWatts(tdpRaw),
      productIdBoxed: boxed,
      productIdTray: tray,
    },
    rawQuotes: partNumbers,
  };
}

export function extractAmdProductSpec(bytes: Buffer): AdapterExtract {
  const html = bytes.toString("utf8");
  const jsonMatch = html.match(
    /<script[^>]*type="application\/json"[^>]*id="product-spec"[^>]*>([\s\S]*?)<\/script>/i,
  );
  if (jsonMatch?.[1]) {
    let spec: Record<string, unknown>;
    try {
      spec = JSON.parse(jsonMatch[1]) as Record<string, unknown>;
    } catch {
      return fail("AMD product-spec JSON is unparseable");
    }
    const boxed = typeof spec.productIdBoxed === "string" ? spec.productIdBoxed : undefined;
    const tray = typeof spec.productIdTray === "string" ? spec.productIdTray : undefined;
    const name = typeof spec.name === "string" ? spec.name : undefined;
    const partNumbers = [boxed, tray].filter((v): v is string => Boolean(v));
    if (partNumbers.length === 0) {
      return fail("AMD structured spec missing product IDs");
    }

    const baseGhz = typeof spec.baseClockGhz === "number" ? spec.baseClockGhz : undefined;
    const boostGhz =
      typeof spec.maxBoostClockGhz === "number" ? spec.maxBoostClockGhz : undefined;
    const tdp = typeof spec.defaultTdpW === "number" ? spec.defaultTdpW : undefined;

    const identity = sortIdentity({
      manufacturer: "AMD",
      modelName: name,
      partNumbers,
      variantTokens: ["BOX"],
    });

    return {
      ok: true,
      identity,
      extractedFields: {
        adapterId: "amd-product-spec",
        publisher: "Advanced Micro Devices, Inc.",
        sourceId: "source.cat6.amd.ryzen-5-7600.product",
        citation:
          "https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-5-7600.html",
        storageGrant: false,
        metadataOnly: true,
        wantsImageStorage: false,
        rightsClass: "public-spec",
        baseClockMhz: baseGhz !== undefined ? Math.round(baseGhz * 1000) : undefined,
        boostClockMhz: boostGhz !== undefined ? Math.round(boostGhz * 1000) : undefined,
        defaultTdpW: tdp,
        productIdBoxed: boxed,
        productIdTray: tray,
      },
      rawQuotes: partNumbers,
    };
  }

  const fromPairs = extractAmdFromPairs(html);
  if (fromPairs) return fromPairs;
  return fail("AMD page has no product-spec JSON or dt/dd specification table");
}

export function extractForSourceKind(
  sourceKind: IngestSourceKind,
  bytes: Buffer,
): AdapterExtract {
  switch (sourceKind) {
    case "licensed-still":
      return extractWikimediaCpuImage(bytes);
    case "manufacturer-image-page":
      return extractManufacturerGpuImage(bytes);
    case "manufacturer-spec-page":
      return extractAmdProductSpec(bytes);
    case "domestic-street-price":
      return fail("street-price adapter is Step 9; not in first slice");
    default: {
      const _never: never = sourceKind;
      return fail(`unknown sourceKind ${_never}`);
    }
  }
}

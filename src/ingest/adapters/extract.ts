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

export function extractWikimediaCpuImage(bytes: Buffer): AdapterExtract {
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(bytes.toString("utf8")) as Record<string, unknown>;
  } catch {
    return fail("wikimedia fixture is not JSON");
  }
  const ext = json.extmetadata as Record<string, { value?: string }> | undefined;
  if (!ext) return fail("missing extmetadata");

  const license = ext.LicenseShortName?.value ?? "";
  const licenseUrl = ext.LicenseUrl?.value ?? "";
  const artist = ext.Artist?.value ?? "";
  const usage = ext.UsageTerms?.value ?? ext.LicenseShortName?.value ?? "";
  const description = ext.ImageDescription?.value ?? "";
  const objectName = ext.ObjectName?.value ?? "";
  const stillB64 = typeof json.syntheticStillJpegBase64 === "string"
    ? json.syntheticStillJpegBase64
    : undefined;

  const blob = [objectName, description, JSON.stringify(json)].join("\n");
  const partNumbers: string[] = [];
  for (const m of blob.matchAll(
    /\b(100-[0-9]{9}(?:BOX|WOF)?)\b/g,
  )) {
    if (m[1]) partNumbers.push(m[1]);
  }

  if (!license) return fail("missing license short name");

  const identity = sortIdentity({
    manufacturer: "AMD",
    modelName: objectName || undefined,
    partNumbers: [...new Set(partNumbers)],
    variantTokens: tokensFromText(blob),
  });

  return {
    ok: identity.partNumbers.length > 0 || Boolean(objectName),
    identity,
    extractedFields: {
      adapterId: "wikimedia-cpu-image",
      licenseShortName: license,
      licenseUrl,
      author: artist.replace(/<[^>]+>/g, "").trim(),
      publisher: "Wikimedia Commons",
      storageGrant: /^(CC0|FAL|CC BY)/i.test(license),
      modificationProhibited: false,
      wouldStoreDerivative: false,
      metadataOnly: false,
      wantsImageStorage: true,
      imageKind: "still",
      rightsClass: /CC0/i.test(license) ? "licensed" : "cc-attribution",
      citation: typeof json.canonicalUrl === "string" ? json.canonicalUrl : undefined,
      sourceId: typeof json.sourceId === "string" ? json.sourceId : undefined,
      syntheticStillJpegBase64: stillB64,
    },
    rawQuotes: [usage, description].filter(Boolean),
  };
}

export function extractManufacturerGpuImage(bytes: Buffer): AdapterExtract {
  const html = bytes.toString("utf8");
  if (!/<html/i.test(html) && !/DUAL-RTX4070/i.test(html)) {
    return fail("manufacturer GPU page missing expected markup");
  }
  const sku =
    html.match(/\b(DUAL-RTX4070-O12G)\b/)?.[1] ??
    html.match(/\b(DUAL-RTX4070-O12G-SUPER)\b/)?.[1] ??
    html.match(/\b(DUAL-RTX4060-O8G)\b/)?.[1];
  const legal = html.match(/<div[^>]*class="legal"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "";
  const title = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim();
  if (!sku && !title) return fail("no SKU or title on manufacturer GPU page");

  const identity = sortIdentity({
    manufacturer: "ASUS",
    modelName: title,
    partNumbers: sku ? [sku] : [],
    variantTokens: tokensFromText(html),
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
    rawQuotes: [legal.replace(/\s+/g, " ").trim(), sku ?? ""].filter(Boolean),
  };
}

export function extractAmdProductSpec(bytes: Buffer): AdapterExtract {
  const html = bytes.toString("utf8");
  const jsonMatch = html.match(
    /<script[^>]*type="application\/json"[^>]*id="product-spec"[^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!jsonMatch?.[1]) {
    return fail("AMD page has no product-spec JSON; refusing prose scrape");
  }
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

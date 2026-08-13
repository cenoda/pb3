import type { NormalizedIdentity, VariantAxis } from "../contract/ing7";

export function identityKey(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

/** Marketing-name hint only — never sufficient for sku-exact. */
export function marketingHint(value: string): string {
  return identityKey(value)
    .replace(/[™®]/g, "")
    .replace(/\bamd\b/g, "")
    .replace(/\bnvidia\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function looksLikeSkuToken(value: string): boolean {
  const compact = identityKey(value).replace(/\s+/g, "");
  return /[0-9]/.test(compact) && /[-_.]/.test(compact);
}

export function sortIdentity(identity: NormalizedIdentity): NormalizedIdentity {
  return {
    ...identity,
    partNumbers: [...identity.partNumbers].sort(),
    variantTokens: [...identity.variantTokens].sort(),
  };
}

const BOXED_TRAY = /\b(box|wof|pib|tray|boxed)\b/i;
const REGION = /\b(na|kr|pib|wof)\b/i;
const REVISION = /\brev(?:ision)?\.?\s*([\d.]+)/i;
const CAPACITY = /(\d+)\s*gb/i;
const COLOR = /\b(dark|white|mesh|black tg|tg dark)\b/i;

export function classifyVariantToken(token: string): VariantAxis | undefined {
  const t = identityKey(token);
  if (BOXED_TRAY.test(t) || /box$/.test(t.replace(/-/g, ""))) return "boxed-tray";
  if (REVISION.test(t)) return "revision";
  if (CAPACITY.test(t)) return "capacity";
  if (/\b(g2|v2|super|\bti\b)/.test(t)) return "generation";
  if (COLOR.test(t)) return "color";
  if (REGION.test(t) && (t === "na" || t === "kr" || t === "pib" || t === "wof")) {
    return "region";
  }
  if (/\b(4070|4060|4080|north|focus|nh-d15)\b/.test(t)) return "model";
  return undefined;
}

export function tokensFromText(text: string): string[] {
  const found = new Set<string>();
  const upper = text.toUpperCase();
  const patterns: Array<[RegExp, string]> = [
    [/\bBOX(?:ED)?\b/, "BOX"],
    [/\bWOF\b/, "WOF"],
    [/\bPIB\b/, "PIB"],
    [/\bTRAY\b/, "TRAY"],
    [/\bSUPER\b/, "SUPER"],
    [/\bTI\b/, "TI"],
    [/\bG2\b/, "G2"],
    [/\bV2\b/, "V2"],
    [/REV\.?\s*1\.3/, "REV 1.3"],
    [/REV\.?\s*1\.0/, "REV 1.0"],
    [/REV\.?\s*1\.2/, "REV 1.2"],
    [/REV\.?\s*1\.4/, "REV 1.4"],
    [/\b64\s*GB\b/, "64GB"],
    [/\b32\s*GB\b/, "32GB"],
    [/\bFOCUS G\b/, "FOCUS G"],
    [/\bNH-D15\b/, "NH-D15"],
  ];
  for (const [re, token] of patterns) {
    if (re.test(upper)) found.add(token);
  }
  return [...found].sort();
}

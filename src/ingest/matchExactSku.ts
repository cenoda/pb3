import { ING7_CONTRACT_VERSION, type NormalizedIdentity, type SkuMatchRecord, type SkuMatchedBy, type VariantAxis } from "../contract/ing7";
import type { CatalogIdentitySnapshot } from "./catalogSnapshot";
import {
  classifyVariantToken,
  identityKey,
  looksLikeSkuToken,
  marketingHint,
} from "./identityNormalize";

export interface MatchExactSkuInput {
  candidateId: string;
  identity: NormalizedIdentity;
  catalog: CatalogIdentitySnapshot[];
}

function catalogAxisValues(part: CatalogIdentitySnapshot): Map<VariantAxis, Set<string>> {
  const blob = [part.id, part.modelName, part.displayName, part.partNumber ?? ""].join(" ");
  const map = new Map<VariantAxis, Set<string>>();
  const add = (axis: VariantAxis, value: string) => {
    const set = map.get(axis) ?? new Set<string>();
    set.add(identityKey(value));
    map.set(axis, set);
  };
  const pn = part.partNumber ?? "";
  if (/BOX/i.test(pn) || /\bbox(?:ed)?\b/i.test(blob)) add("boxed-tray", "box");
  if (/WOF/i.test(pn)) add("boxed-tray", "wof");
  if (/00000/.test(pn) && /tray/i.test(blob)) add("boxed-tray", "tray");
  if (/\bg2\b/i.test(blob)) add("generation", "g2");
  if (/\bsuper\b/i.test(blob)) add("generation", "super");
  if (/\brev\.?\s*1\.3\b/i.test(blob)) add("revision", "rev 1.3");
  if (/\b32gb\b/i.test(blob) || /32G/i.test(pn) || /-32gb/i.test(part.id)) {
    add("capacity", "32gb");
  }
  if (/\b64gb\b/i.test(blob) || /64G/i.test(pn) || /-64gb/i.test(part.id)) {
    add("capacity", "64gb");
  }
  if (/\bnorth\b/i.test(blob)) add("model", "north");
  if (/\bfocus g\b/i.test(blob)) add("model", "focus g");
  if (/\b4070\b/i.test(blob) && !/\bsuper\b/i.test(blob)) add("model", "4070");
  if (/\b4060\b/i.test(blob)) add("model", "4060");
  if (/\bnh-d15\b/i.test(blob) && !/\bg2\b/i.test(blob)) add("model", "nh-d15");
  if (/\bnh-d15 g2\b/i.test(blob)) add("model", "nh-d15 g2");
  if (/\bdark\b/i.test(blob)) add("color", "dark");
  return map;
}

function sourceAxisValues(identity: NormalizedIdentity): Map<VariantAxis, Set<string>> {
  const map = new Map<VariantAxis, Set<string>>();
  const add = (axis: VariantAxis, value: string) => {
    const set = map.get(axis) ?? new Set<string>();
    set.add(identityKey(value));
    map.set(axis, set);
  };
  for (const token of identity.variantTokens) {
    const axis = classifyVariantToken(token);
    if (axis) add(axis, token);
  }
  return map;
}

interface Hit {
  part: CatalogIdentitySnapshot;
  matchedBy: SkuMatchedBy;
  key: string;
}

function allowedKeyHits(
  identity: NormalizedIdentity,
  catalog: CatalogIdentitySnapshot[],
): Hit[] {
  const hits: Hit[] = [];
  for (const raw of identity.partNumbers) {
    const key = identityKey(raw);
    for (const part of catalog) {
      if (part.partNumber && identityKey(part.partNumber) === key) {
        hits.push({ part, matchedBy: "partNumber", key: raw });
        continue;
      }
      if (looksLikeSkuToken(raw) && identityKey(part.modelName) === key) {
        hits.push({ part, matchedBy: "modelNumber", key: raw });
        continue;
      }
      if (identityKey(part.id) === key) {
        hits.push({ part, matchedBy: "canonicalSku", key: raw });
      }
    }
  }
  const seen = new Set<string>();
  return hits.filter((h) => {
    const id = `${h.part.id}:${h.matchedBy}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function marketingHits(
  identity: NormalizedIdentity,
  catalog: CatalogIdentitySnapshot[],
): CatalogIdentitySnapshot[] {
  if (!identity.modelName) return [];
  const hint = marketingHint(identity.modelName);
  if (!hint) return [];
  return catalog.filter((part) => {
    return (
      marketingHint(part.modelName) === hint ||
      marketingHint(part.displayName) === hint
    );
  });
}

function variantConflictsFor(
  identity: NormalizedIdentity,
  part: CatalogIdentitySnapshot,
): VariantAxis[] {
  const src = sourceAxisValues(identity);
  const cat = catalogAxisValues(part);
  const conflicts: VariantAxis[] = [];
  const axes: VariantAxis[] = [
    "boxed-tray",
    "region",
    "revision",
    "capacity",
    "color",
    "generation",
    "model",
  ];
  for (const axis of axes) {
    const s = src.get(axis);
    const c = cat.get(axis);
    if (!s || s.size === 0) continue;
    if (axis === "boxed-tray" && s.has("tray") && (c?.has("box") || c?.has("wof"))) {
      conflicts.push(axis);
      continue;
    }
    if (axis === "generation" && s.has("super") && !c?.has("super")) {
      conflicts.push(axis);
      continue;
    }
    if (axis === "generation" && s.has("g2") && !c?.has("g2")) {
      conflicts.push(axis);
      continue;
    }
    if (axis === "model" && s.has("4060") && c?.has("4070")) {
      conflicts.push(axis);
      continue;
    }
    if (axis === "model" && s.has("focus g") && c?.has("north")) {
      conflicts.push(axis);
      continue;
    }
    if (axis === "model" && s.has("nh-d15") && c?.has("nh-d15 g2")) {
      conflicts.push(axis);
      continue;
    }
    if (axis === "capacity" && s.size && c && [...s].some((v) => !c.has(v))) {
      conflicts.push(axis);
      continue;
    }
    if (axis === "revision" && s.size && c && [...s].some((v) => !c.has(v))) {
      conflicts.push(axis);
    }
  }
  return conflicts;
}

export function matchExactSku(input: MatchExactSkuInput): SkuMatchRecord {
  const { candidateId, identity, catalog } = input;
  const hits = allowedKeyHits(identity, catalog);
  const rejectedPartIds: string[] = [];
  const conflictAxes = new Set<VariantAxis>();
  const surviving: Hit[] = [];

  for (const hit of hits) {
    const conflicts = variantConflictsFor(identity, hit.part);
    if (conflicts.length > 0) {
      rejectedPartIds.push(hit.part.id);
      for (const axis of conflicts) conflictAxes.add(axis);
      continue;
    }
    surviving.push(hit);
  }

  const uniqueParts = new Map<string, Hit>();
  for (const hit of surviving) uniqueParts.set(hit.part.id, hit);

  const base = {
    contractVersion: ING7_CONTRACT_VERSION,
    candidateId,
    rejectedPartIds: [...new Set(rejectedPartIds)].sort(),
    variantConflicts: [...conflictAxes].sort(),
  };

  if (uniqueParts.size === 1 && hits.length > 0) {
    const hit = [...uniqueParts.values()][0];
    if (conflictAxes.size === 0) {
      return {
        ...base,
        stage: "sku-exact",
        verdict: "exact",
        matchedPartId: hit.part.id,
        matchedBy: hit.matchedBy,
        evidence: `${hit.matchedBy} ${hit.key}`,
      };
    }
  }

  if (uniqueParts.size > 1 || (hits.length > 0 && conflictAxes.size > 0)) {
    return {
      ...base,
      stage: "review-candidate",
      verdict: "ambiguous",
      evidence:
        uniqueParts.size > 1
          ? `multiple catalog parts: ${[...uniqueParts.keys()].sort().join(", ")}`
          : `variant conflict on ${[...conflictAxes].join(", ")}`,
    };
  }

  const named = marketingHits(identity, catalog);
  if (named.length > 0) {
    return {
      ...base,
      stage: "review-candidate",
      verdict: "ambiguous",
      evidence: `marketing-name-only hit; not an allowed identity key (${named.map((p) => p.id).join(", ")})`,
      rejectedPartIds: [...new Set([...rejectedPartIds, ...named.map((p) => p.id)])].sort(),
    };
  }

  return {
    ...base,
    stage: "review-candidate",
    verdict: "unavailable",
    evidence: "no allowed identity key matched a catalog part",
  };
}

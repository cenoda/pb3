import type { PartDefinitionV3 } from "../contract/cat6";
import type {
  IngestNormalized,
  ProposedFieldChange,
  RightsReviewRecord,
  SkuMatchRecord,
} from "../contract/ing7";
import { sortLex } from "./stableJson";

function withSource(
  sourceId: string,
  retrievedAt: string,
  value: unknown,
): Record<string, unknown> {
  return { sourceId, retrievedAt, value };
}

export function buildProposedDiff(input: {
  match: SkuMatchRecord;
  normalized: IngestNormalized;
  rights: RightsReviewRecord;
  part?: PartDefinitionV3;
  retrievedAt: string;
}): ProposedFieldChange[] {
  const { match, normalized, rights, part, retrievedAt } = input;
  const sourceId = rights.sourceId;
  const changes: ProposedFieldChange[] = [];

  if (!part || match.verdict !== "exact") {
    return changes;
  }

  const fields = normalized.extractedFields;
  if (typeof fields.baseClockMhz === "number") {
    const before = part.performanceSpec?.baseClockMhz;
    const after = withSource(sourceId, retrievedAt, fields.baseClockMhz);
    changes.push({
      target: "part.json",
      path: "/performanceSpec/baseClockMhz",
      op: before === fields.baseClockMhz ? "unchanged" : before === undefined ? "add" : "replace",
      before,
      after,
      reason:
        before === fields.baseClockMhz
          ? "confirm-only; shipped base clock matches extract"
          : "extracted base clock differs from shipped part.json",
    });
  }
  if (typeof fields.boostClockMhz === "number") {
    const before = part.performanceSpec?.boostClockMhz;
    const after = withSource(sourceId, retrievedAt, fields.boostClockMhz);
    changes.push({
      target: "part.json",
      path: "/performanceSpec/boostClockMhz",
      op: before === fields.boostClockMhz ? "unchanged" : before === undefined ? "add" : "replace",
      before,
      after,
      reason:
        before === fields.boostClockMhz
          ? "confirm-only; shipped boost clock matches extract"
          : "extracted boost clock differs from shipped part.json",
    });
  }

  if (normalized.sourceKind === "licensed-still" && part.image) {
    changes.push({
      target: "image-file",
      path: part.image.path,
      op: "unchanged",
      before: part.image,
      after: withSource(sourceId, retrievedAt, part.image.path),
      reason: "O9 confirm-only; dry-run must not overwrite a shipped image",
    });
  }

  return sortProposed(changes);
}

export function sortProposed(changes: ProposedFieldChange[]): ProposedFieldChange[] {
  return [...changes].sort((a, b) => {
    const left = `${a.target}:${a.path}`;
    const right = `${b.target}:${b.path}`;
    return left < right ? -1 : left > right ? 1 : 0;
  });
}

export function collectConflicts(
  changes: ProposedFieldChange[],
  match: SkuMatchRecord,
  rights: RightsReviewRecord,
): string[] {
  const conflicts: string[] = [];
  for (const change of changes) {
    if (change.op === "replace") {
      conflicts.push(`${change.path}: shipped ${JSON.stringify(change.before)} vs extract`);
    }
  }
  if (match.verdict !== "exact") {
    conflicts.push(`sku verdict ${match.verdict}: ship path closed`);
  }
  if (rights.rejectRuleIds.length > 0) {
    conflicts.push(`rights ${rights.rejectRuleIds.join(",")}`);
  }
  return sortLex(conflicts);
}

export function collectUnresolved(
  normalized: IngestNormalized,
  match: SkuMatchRecord,
): string[] {
  const unresolved: string[] = [];
  if (normalized.extractedFields.productIdTray && match.verdict === "exact") {
    unresolved.push("productIdTray listed on page; not the catalog SKU");
  }
  if (match.verdict !== "exact") {
    unresolved.push("exact SKU identity");
  }
  if (
    normalized.sourceKind === "manufacturer-image-page" &&
    normalized.extractedFields.storageGrant === false
  ) {
    unresolved.push("image.storageGrant");
  }
  return sortLex(unresolved);
}

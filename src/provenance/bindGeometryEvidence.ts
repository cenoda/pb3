/**
 * Pure geometry evidence binder (prov4 §7.3).
 * Join key: phys3EvidenceSourceId === physicalSpec.evidence.sourceId
 */
import type { PhysicalSpec } from "../contract/phys3";
import type {
  EvidenceSource,
  EvidenceSourceRegistryFile,
  GeometryEvidenceBinding,
  GeometryEvidenceFile,
  HumanVerificationFile,
  HumanVerificationRecord,
} from "../contract/prov4";
import { classifyFreshness } from "./classifyFreshness";
import { PILOT_PART_IDS } from "./pilotBuild";

export interface BindGeometryEvidenceInput {
  partId: string;
  physicalSpec: PhysicalSpec | undefined;
  evidenceFile: GeometryEvidenceFile;
  registry: EvidenceSourceRegistryFile;
  verifications: HumanVerificationFile;
  nowIso: string;
  /** Restrict to pilot part set when true (default disclosure path). */
  requirePilotPart?: boolean;
}

function unavailable(
  partId: string,
  reason: Extract<GeometryEvidenceBinding, { status: "unavailable" }>["reason"],
  explanation: string,
): GeometryEvidenceBinding {
  return { status: "unavailable", partId, reason, explanation };
}

function resolveSources(
  sourceIds: string[],
  registry: EvidenceSourceRegistryFile,
): { ok: true; sources: EvidenceSource[] } | { ok: false } {
  const sources: EvidenceSource[] = [];
  for (const id of sourceIds) {
    const found = registry.sources.find((s) => s.sourceId === id);
    if (!found) return { ok: false };
    sources.push(found);
  }
  return { ok: true, sources };
}

function gradeCeiling(
  sources: EvidenceSource[],
): "Experimental" | "Community" | "Verified" {
  const classes = new Set(sources.map((s) => s.sourceClass));
  if ([...classes].every((c) => c === "project-synthetic")) {
    return "Experimental";
  }
  if (classes.has("first-party")) {
    return "Verified";
  }
  if (classes.has("manufacturer-spec")) {
    return "Community";
  }
  return "Experimental";
}

const GRADE_RANK = { Experimental: 1, Community: 2, Verified: 3 } as const;

export function bindGeometryEvidence(
  input: BindGeometryEvidenceInput,
): GeometryEvidenceBinding {
  const requirePilot = input.requirePilotPart !== false;
  if (requirePilot && !PILOT_PART_IDS.includes(input.partId as never)) {
    return unavailable(
      input.partId,
      "not_pilot_part",
      `Part ${input.partId} is outside the Phase 4 pilot geometry set`,
    );
  }

  if (!input.physicalSpec) {
    return unavailable(
      input.partId,
      "missing_physical_spec",
      `Part ${input.partId} has no physicalSpec`,
    );
  }

  const phys3SourceId = input.physicalSpec.evidence.sourceId;
  const gdv = input.physicalSpec.evidence.geometryDataVersion;
  const grade = input.physicalSpec.evidence.modelGrade;

  const row = input.evidenceFile.rows.find(
    (r) => r.phys3EvidenceSourceId === phys3SourceId,
  );
  if (!row) {
    return unavailable(
      input.partId,
      "missing_evidence_row",
      `No geometry evidence row with phys3EvidenceSourceId ${phys3SourceId}`,
    );
  }

  if (
    row.partId !== input.partId ||
    row.geometryDataVersion !== gdv ||
    row.modelGrade !== grade
  ) {
    return unavailable(
      input.partId,
      "phys3_ref_mismatch",
      `Geometry evidence ${row.evidenceId} does not match partId/geometryDataVersion/modelGrade for ${input.partId}`,
    );
  }

  const resolved = resolveSources(row.sourceIds, input.registry);
  if (!resolved.ok) {
    return unavailable(
      input.partId,
      "missing_source",
      `Unresolved sourceIds on geometry evidence ${row.evidenceId}`,
    );
  }

  const ceiling = gradeCeiling(resolved.sources);
  if (GRADE_RANK[row.modelGrade] > GRADE_RANK[ceiling]) {
    return unavailable(
      input.partId,
      "grade_ceiling_violation",
      `modelGrade "${row.modelGrade}" exceeds source-class ceiling "${ceiling}"`,
    );
  }

  let verification: HumanVerificationRecord | undefined;
  if (row.modelGrade === "Community" || row.modelGrade === "Verified") {
    if (!row.verificationId) {
      return unavailable(
        input.partId,
        "verification_required",
        `modelGrade "${row.modelGrade}" requires verificationId`,
      );
    }
    verification = input.verifications.records.find(
      (r) => r.verificationId === row.verificationId,
    );
    if (!verification || verification.verdict !== "pass") {
      return unavailable(
        input.partId,
        "verification_required",
        `Missing or non-pass verification for geometry ${row.evidenceId}`,
      );
    }
  } else if (row.verificationId) {
    verification = input.verifications.records.find(
      (r) => r.verificationId === row.verificationId,
    );
  }

  const freshness = classifyFreshness({
    asOf: row.reviewedAt,
    policy: row.freshnessPolicy,
    nowIso: input.nowIso,
  });

  return {
    status: "bound",
    evidence: row,
    freshness,
    sources: resolved.sources,
    verification,
  };
}

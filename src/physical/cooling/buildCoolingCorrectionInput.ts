import type {
  CoolingEvidenceFile,
  CoolingEvidenceRecord,
  CoolingHookResult,
  MountSelection,
  PhysicalValidationReport,
} from "../../contract/phys3";
import { coolingEvidenceFileSchema } from "../../contract/phys3.schema";
import { PHYS3_GEOMETRY_DATA_VERSION } from "../../contract/phys3";

export async function loadCoolingEvidence(
  url = "/benchmarks/phys3/cooling-evidence.json",
): Promise<CoolingEvidenceFile> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to load cooling evidence at ${url}: HTTP ${response.status}`,
    );
  }
  const json: unknown = await response.json();
  const parsed = coolingEvidenceFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Invalid cooling evidence file: ${parsed.error.message}`);
  }
  return parsed.data;
}

function sortedCopy(ids: string[]): string[] {
  return [...ids].sort();
}

function mountKey(m: MountSelection): string {
  return [
    m.movingPartId,
    m.socketId,
    m.targetPartId,
    m.anchorId,
    m.orientationId,
  ].join("|");
}

function sameMountSelections(
  a: MountSelection[],
  b: MountSelection[],
): boolean {
  if (a.length !== b.length) return false;
  const as = [...a].map(mountKey).sort();
  const bs = [...b].map(mountKey).sort();
  return as.every((k, i) => k === bs[i]);
}

/**
 * Exact-match cooling evidence lookup. Never infers nearby rows.
 * Production Phase 3 file has empty rows → always missing_exact_evidence
 * unless an explicit stub-only record set is supplied for unit tests.
 */
export function buildCoolingCorrectionInput(args: {
  buildPartIds: string[];
  mountSelections: MountSelection[];
  geometryDataVersion: string;
  physicalReport: PhysicalValidationReport;
  evidenceFile: CoolingEvidenceFile;
  /**
   * When true, allow `available` results from evidenceFile rows.
   * Production UI must leave this false / use the empty production file.
   */
  allowStubRows?: boolean;
}): CoolingHookResult {
  const {
    buildPartIds,
    mountSelections,
    geometryDataVersion,
    physicalReport,
    evidenceFile,
    allowStubRows = false,
  } = args;

  if (physicalReport.overallStatus === "unavailable") {
    return {
      status: "unavailable",
      reason: "physical_validation_incomplete",
      explanation:
        "Physical validation is incomplete or unavailable; cooling correction inputs are withheld.",
    };
  }

  if (geometryDataVersion !== PHYS3_GEOMETRY_DATA_VERSION) {
    return {
      status: "unavailable",
      reason: "missing_exact_evidence",
      explanation: `Geometry data version ${geometryDataVersion} does not match the Phase 3 cooling dataset ${PHYS3_GEOMETRY_DATA_VERSION}.`,
    };
  }

  if (evidenceFile.rows.length === 0 || !allowStubRows) {
    return {
      status: "unavailable",
      reason: "missing_exact_evidence",
      explanation:
        "Phase 3 production cooling evidence rows are empty; no FPS derate or bucket mapping is applied.",
    };
  }

  const wantedParts = sortedCopy(buildPartIds);
  const matches = evidenceFile.rows.filter((row: CoolingEvidenceRecord) => {
    if (row.geometryDataVersion !== geometryDataVersion) return false;
    const rowParts = sortedCopy(row.buildPartIds);
    if (
      rowParts.length !== wantedParts.length ||
      rowParts.some((id, i) => id !== wantedParts[i])
    ) {
      return false;
    }
    return sameMountSelections(row.mountSelections, mountSelections);
  });

  if (matches.length === 0) {
    return {
      status: "unavailable",
      reason: "missing_exact_evidence",
      explanation:
        "No cooling evidence row matches the exact part set, mounts, and geometry data version.",
    };
  }
  if (matches.length > 1) {
    return {
      status: "unavailable",
      reason: "missing_exact_evidence",
      explanation: "Multiple cooling evidence rows matched; exact match is ambiguous.",
    };
  }

  const row = matches[0]!;
  // Phase 3 does not accept automatic bucket mapping.
  return {
    status: "available",
    correctionInput: {
      coolingHeadroom: row.coolingHeadroom,
      intakeRestrictionSeverity: row.intakeRestrictionSeverity,
      evidenceSourceId: row.evidenceSourceId,
      // coolingBucketId intentionally omitted
    },
  };
}

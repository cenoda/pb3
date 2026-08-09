/**
 * Pure aggregate pilot disclosure report (prov4 §9).
 */
import type { BuildStateV2 } from "../contract/vs2";
import type { PhysicalSpec } from "../contract/phys3";
import type {
  CoolingProvenanceFile,
  EvidenceSourceRegistryFile,
  GeometryEvidenceFile,
  HumanVerificationFile,
  PerformanceEvidenceFile,
  PilotDisclosureReport,
} from "../contract/prov4";
import { PROV4_CONTRACT_VERSION, PROV4_DEFAULT_MAX_AGE_DAYS } from "../contract/prov4";
import { bindGeometryEvidence } from "./bindGeometryEvidence";
import { bindPerformanceEvidence } from "./bindPerformanceEvidence";
import { classifyFreshness } from "./classifyFreshness";
import {
  buildPartIdsFromState,
  isPilotBuild,
  PILOT_RESOLUTIONS,
  pilotBaselineKeyFor,
} from "./pilotBuild";

export interface BuildPilotDisclosureReportInput {
  state: BuildStateV2;
  /**
   * physicalSpec by part id for selected build parts.
   * Missing entry → missing_physical_spec on that geometry binding.
   */
  physicalSpecsByPartId: ReadonlyMap<string, PhysicalSpec | undefined>;
  registry: EvidenceSourceRegistryFile;
  performance: PerformanceEvidenceFile;
  geometry: GeometryEvidenceFile;
  cooling: CoolingProvenanceFile;
  verifications: HumanVerificationFile;
  nowIso: string;
  verifiedArtifactDigests?: ReadonlySet<string>;
}

const DEFAULT_LIMITATIONS = [
  "Non-pilot catalog performance rows remain perf1 stub confidence",
  "Pilot residual resolution cells may be synthetic-stub with MetricUnavailable charter fields",
  "Geometry model grade is Experimental (synthetic fixtures; not manufacturer-verified)",
  "Production cooling evidence rows are empty → structured unavailable",
  "Fixture prices are static / non-live",
  `Default freshness policy maxAgeDays=${PROV4_DEFAULT_MAX_AGE_DAYS} (bound + stale disclosure)`,
] as const;

export function buildPilotDisclosureReport(
  input: BuildPilotDisclosureReportInput,
): PilotDisclosureReport {
  const pilot = isPilotBuild(input.state);
  const buildPartIds = buildPartIdsFromState(input.state);

  if (!pilot) {
    return {
      provenanceContractVersion: PROV4_CONTRACT_VERSION,
      isPilotBuild: false,
      buildPartIds,
      performance: [],
      geometry: [],
      cooling: {
        status: "unavailable",
        reason: "not_pilot_build",
        explanation:
          "Cooling provenance disclosure is pilot-scoped; build is not the exact pilot set",
      },
      limitations: [
        "Pilot evidence overlay inactive (build is not the exact pilot part set)",
        ...DEFAULT_LIMITATIONS,
      ],
    };
  }

  const performance = PILOT_RESOLUTIONS.map((resolution) =>
    bindPerformanceEvidence({
      key: pilotBaselineKeyFor(resolution),
      isPilotBuild: true,
      evidenceFile: input.performance,
      registry: input.registry,
      verifications: input.verifications,
      nowIso: input.nowIso,
      verifiedArtifactDigests: input.verifiedArtifactDigests,
    }),
  );

  const geometry = buildPartIds.map((partId) =>
    bindGeometryEvidence({
      partId,
      physicalSpec: input.physicalSpecsByPartId.get(partId),
      evidenceFile: input.geometry,
      registry: input.registry,
      verifications: input.verifications,
      nowIso: input.nowIso,
      requirePilotPart: true,
    }),
  );

  let cooling: PilotDisclosureReport["cooling"];
  if (input.cooling.rows.length === 0) {
    cooling = {
      status: "unavailable",
      reason: "empty_production_rows",
      explanation:
        "Phase 4 M0 cooling provenance production rows are empty; runtime cooling remains structured unavailable",
    };
  } else {
    // M0 ships empty; if rows appear, expose first with freshness (still no derate).
    const row = input.cooling.rows[0]!;
    cooling = {
      status: "available",
      provenance: row,
      freshness: classifyFreshness({
        asOf: row.capturedAt,
        policy: row.freshnessPolicy,
        nowIso: input.nowIso,
      }),
    };
  }

  const residualStub = performance.filter(
    (b) =>
      b.status === "bound" &&
      b.evidence.measurement.metricKind === "synthetic-stub",
  ).length;

  const limitations = [
    residualStub > 0
      ? `${residualStub} of 3 pilot performance cells are residual synthetic-stub`
      : "All three pilot performance cells are non-stub",
    ...DEFAULT_LIMITATIONS,
  ];

  return {
    provenanceContractVersion: PROV4_CONTRACT_VERSION,
    isPilotBuild: true,
    buildPartIds,
    performance,
    geometry,
    cooling,
    limitations,
  };
}

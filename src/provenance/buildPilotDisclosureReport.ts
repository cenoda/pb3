/**
 * Pure aggregate pilot disclosure report (prov4 §9 + external corrective overlay).
 */
import type { BuildStateV2 } from "../contract/vs2";
import type { PhysicalSpec } from "../contract/phys3";
import type {
  CoolingProvenanceFile,
  EvidenceSourceRegistryFile,
  ExternalPerformanceDisclosure,
  ExternalPerformanceObservationsFile,
  GeometryEvidenceFile,
  HumanVerificationFile,
  PerformanceEvidenceFile,
  PilotDisclosureReport,
  SourceRightsRecordFile,
} from "../contract/prov4";
import {
  PROV4_CONTRACT_VERSION,
  PROV4_DEFAULT_MAX_AGE_DAYS,
} from "../contract/prov4";
import { aggregateComparableObservations } from "./aggregatePerformanceEvidence";
import { bindPerformanceEvidenceDetailed } from "./bindPerformanceEvidence";
import { bindGeometryEvidence } from "./bindGeometryEvidence";
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
  externalObservations?: ExternalPerformanceObservationsFile;
  sourceRights?: SourceRightsRecordFile;
  nowIso: string;
  verifiedArtifactDigests?: ReadonlySet<string>;
}

const DEFAULT_LIMITATIONS = [
  "Non-pilot catalog performance rows remain perf1 stub confidence",
  "External aggregate requires exact comparability; near-miss observations are excluded with reasons",
  "When external aggregate is unavailable, product FPS falls back to perf1 synthetic stub",
  "Residual pilot-performance-evidence synthetic-stub rows are reference-only disclosure",
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

  const externalPerformance: ExternalPerformanceDisclosure[] =
    PILOT_RESOLUTIONS.map((resolution) => {
      const key = pilotBaselineKeyFor(resolution);
      const aggregation =
        input.externalObservations && input.sourceRights
          ? aggregateComparableObservations(
              key,
              input.externalObservations.observations,
              input.sourceRights,
            )
          : {
              status: "unavailable" as const,
              reason: "no_observations" as const,
              explanation:
                input.externalObservations && !input.sourceRights
                  ? "Source-rights record not provided; external aggregation fail-closed"
                  : "External observations fixture not loaded",
              exclusionReasons: [],
            };
      const detailed = bindPerformanceEvidenceDetailed({
        key,
        isPilotBuild: true,
        evidenceFile: input.performance,
        registry: input.registry,
        verifications: input.verifications,
        nowIso: input.nowIso,
        externalObservations: input.externalObservations,
        sourceRights: input.sourceRights,
        verifiedArtifactDigests: input.verifiedArtifactDigests,
      });
      return {
        resolution,
        aggregation,
        syntheticReference: detailed.syntheticReference,
        displayClass: detailed.displayClass,
      };
    });

  const performance = externalPerformance.map((ext) => {
    const detailed = bindPerformanceEvidenceDetailed({
      key: pilotBaselineKeyFor(ext.resolution),
      isPilotBuild: true,
      evidenceFile: input.performance,
      registry: input.registry,
      verifications: input.verifications,
      nowIso: input.nowIso,
      externalObservations: input.externalObservations,
      sourceRights: input.sourceRights,
      verifiedArtifactDigests: input.verifiedArtifactDigests,
    });
    return detailed.binding;
  });

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

  const aggregatedCount = externalPerformance.filter(
    (ext) => ext.displayClass === "aggregated",
  ).length;
  const syntheticFallbackCount = externalPerformance.filter(
    (ext) => ext.displayClass === "synthetic-perf1",
  ).length;

  const limitations = [
    aggregatedCount > 0
      ? `${aggregatedCount} of 3 pilot cells use external-aggregated sidecar`
      : "No pilot cell has a product external aggregate (exact-match evidence insufficient)",
    syntheticFallbackCount > 0
      ? `${syntheticFallbackCount} of 3 pilot cells fall back to perf1 synthetic stub for product FPS`
      : "No perf1 synthetic fallback active",
    ...DEFAULT_LIMITATIONS,
  ];

  return {
    provenanceContractVersion: PROV4_CONTRACT_VERSION,
    isPilotBuild: true,
    buildPartIds,
    performance,
    externalPerformance,
    geometry,
    cooling,
    limitations,
  };
}

/**
 * Run est1 estimator for a pilot resolution using loaded fixtures.
 */
import type { CombinationEstimateResult } from "../contract/est1";
import type { Est1Fixtures } from "./loadEst1Fixtures";
import type { Prov4Fixtures } from "../provenance/loadProv4Fixtures";
import type { EstimatorResolution } from "../contract/est1";
import { estimateCombinationPerformance } from "./estimateCombinationPerformance";
import { estimatorQueryFor } from "./estimatorQuery";

export function estimatePilotResolution(input: {
  resolution: EstimatorResolution;
  est1Fixtures: Est1Fixtures;
  prov4Fixtures: Prov4Fixtures;
}): CombinationEstimateResult {
  const { resolution, est1Fixtures, prov4Fixtures } = input;
  return estimateCombinationPerformance({
    query: estimatorQueryFor(resolution),
    externalObservations: prov4Fixtures.externalObservations.observations,
    sourceRights: prov4Fixtures.sourceRights,
    vendorAnchors: est1Fixtures.vendorAnchors.anchors,
    cpuScaleEdges: est1Fixtures.cpuScaleEdges.edges,
    dataVersion: est1Fixtures.cpuScaleEdges.dataVersion,
  });
}

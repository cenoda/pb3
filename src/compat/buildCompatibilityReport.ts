import type {
  CompatibilityReport,
  CompatibilityStatus,
} from "../contract/compat2";
import type { BuildStateV2 } from "../contract/vs2";
import type { PartCatalog } from "../state/validateBuildState";
import { checkCaseFormFactor } from "./checkCaseFormFactor";
import { checkChipsetBios } from "./checkChipsetBios";
import { checkCpuSocket } from "./checkCpuSocket";
import { checkPsuWattage } from "./checkPsuWattage";
import { checkRamSupport } from "./checkRamSupport";
import { resolveCompatibilityInputs } from "./compatibilityInputs";

const DATA_VERSION = "compat2-fixture-draft";

function aggregateOverallStatus(
  checks: CompatibilityReport["checks"],
): CompatibilityStatus {
  if (checks.some((check) => check.status === "incompatible")) {
    return "incompatible";
  }
  if (checks.some((check) => check.status === "unavailable")) {
    return "unavailable";
  }
  return "compatible";
}

export function buildCompatibilityReport(
  buildState: BuildStateV2,
  catalog: PartCatalog,
): CompatibilityReport {
  const inputs = resolveCompatibilityInputs(buildState, catalog);
  const checks = [
    checkCpuSocket(inputs),
    checkChipsetBios(inputs),
    checkRamSupport(inputs),
    checkPsuWattage(inputs),
    checkCaseFormFactor(inputs),
  ];

  return {
    compatContractVersion: "compat2",
    buildStateVersion: "vs2",
    checks,
    overallStatus: aggregateOverallStatus(checks),
    dataVersion: DATA_VERSION,
  };
}

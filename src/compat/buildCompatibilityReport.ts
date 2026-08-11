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
import { isBlockingUnavailableCheck } from "./unavailablePolicy";

/** Bumped when aggregation semantics change (B4 non-blocking chipset-bios). */
const DATA_VERSION = "compat2-b4-20260812";

/**
 * Precedence:
 * 1. Any incompatible check → incompatible
 * 2. Any blocking unavailable check → unavailable
 * 3. Otherwise → compatible
 *
 * `chipset-bios: unavailable` is non-blocking under O6/B4 (shared policy).
 */
function aggregateOverallStatus(
  checks: CompatibilityReport["checks"],
): CompatibilityStatus {
  if (checks.some((check) => check.status === "incompatible")) {
    return "incompatible";
  }
  if (checks.some(isBlockingUnavailableCheck)) {
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

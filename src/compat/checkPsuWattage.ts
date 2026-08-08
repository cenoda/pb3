import {
  PSU_HEADROOM_MULTIPLIER,
  type CompatibilityCheckResult,
} from "../contract/compat2";
import type { CompatibilityInputs } from "./compatibilityInputs";

export function checkPsuWattage(
  inputs: CompatibilityInputs,
): CompatibilityCheckResult {
  const involved = [inputs.psuId, inputs.cpuId, inputs.gpuId];

  if (
    inputs.psu?.wattage == null ||
    inputs.cpu?.tdpWatts == null ||
    inputs.gpu?.tdpWatts == null
  ) {
    return {
      checkId: "psu-wattage",
      status: "unavailable",
      explanation: "PSU wattage or CPU/GPU TDP spec is missing.",
      involvedPartIds: involved,
    };
  }

  const requiredWatts =
    (inputs.cpu.tdpWatts + inputs.gpu.tdpWatts) * PSU_HEADROOM_MULTIPLIER;

  if (inputs.psu.wattage >= requiredWatts) {
    return {
      checkId: "psu-wattage",
      status: "compatible",
      involvedPartIds: involved,
    };
  }

  return {
    checkId: "psu-wattage",
    status: "incompatible",
    explanation: `PSU ${inputs.psuId} provides ${inputs.psu.wattage} W; estimated need is ${Math.ceil(requiredWatts)} W (CPU ${inputs.cpu.tdpWatts} W + GPU ${inputs.gpu.tdpWatts} W × ${PSU_HEADROOM_MULTIPLIER} stub headroom).`,
    involvedPartIds: involved,
  };
}

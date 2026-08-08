import type { CompatibilityCheckResult } from "../contract/compat2";
import type { CompatibilityInputs } from "./compatibilityInputs";

export function checkRamSupport(
  inputs: CompatibilityInputs,
): CompatibilityCheckResult {
  const involved = [inputs.ramId, inputs.motherboardId];

  if (
    !inputs.ram?.memoryType ||
    inputs.ram.speedMtS == null ||
    !inputs.motherboard?.supportedMemoryType ||
    inputs.motherboard.maxMemorySpeedMtS == null
  ) {
    return {
      checkId: "ram-support",
      status: "unavailable",
      explanation: "RAM or motherboard memory support spec is missing.",
      involvedPartIds: involved,
    };
  }

  if (inputs.ram.memoryType !== inputs.motherboard.supportedMemoryType) {
    return {
      checkId: "ram-support",
      status: "incompatible",
      explanation: `RAM ${inputs.ramId} uses ${inputs.ram.memoryType}; motherboard ${inputs.motherboardId} supports ${inputs.motherboard.supportedMemoryType} only.`,
      involvedPartIds: involved,
    };
  }

  if (inputs.ram.speedMtS > inputs.motherboard.maxMemorySpeedMtS) {
    return {
      checkId: "ram-support",
      status: "incompatible",
      explanation: `RAM ${inputs.ramId} is rated ${inputs.ram.speedMtS} MT/s; motherboard ${inputs.motherboardId} supports up to ${inputs.motherboard.maxMemorySpeedMtS} MT/s.`,
      involvedPartIds: involved,
    };
  }

  return {
    checkId: "ram-support",
    status: "compatible",
    involvedPartIds: involved,
  };
}

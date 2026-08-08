import type { CompatibilityCheckResult } from "../contract/compat2";
import type { CompatibilityInputs } from "./compatibilityInputs";

export function checkCpuSocket(
  inputs: CompatibilityInputs,
): CompatibilityCheckResult {
  const involved = [inputs.cpuId, inputs.motherboardId];

  if (!inputs.cpu?.socket || !inputs.motherboard?.socket) {
    return {
      checkId: "cpu-socket",
      status: "unavailable",
      explanation: "Socket spec is missing for CPU or motherboard.",
      involvedPartIds: involved,
    };
  }

  if (inputs.cpu.socket === inputs.motherboard.socket) {
    return {
      checkId: "cpu-socket",
      status: "compatible",
      involvedPartIds: involved,
    };
  }

  return {
    checkId: "cpu-socket",
    status: "incompatible",
    explanation: `CPU ${inputs.cpuId} uses socket ${inputs.cpu.socket}; motherboard ${inputs.motherboardId} uses socket ${inputs.motherboard.socket}. These parts cannot be paired.`,
    involvedPartIds: involved,
  };
}

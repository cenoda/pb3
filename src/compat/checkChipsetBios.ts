import type { CompatibilityCheckResult } from "../contract/compat2";
import type { CompatibilityInputs } from "./compatibilityInputs";

export function checkChipsetBios(
  inputs: CompatibilityInputs,
): CompatibilityCheckResult {
  const involved = [inputs.cpuId, inputs.motherboardId];

  if (!inputs.motherboard?.chipset) {
    return {
      checkId: "chipset-bios",
      status: "unavailable",
      explanation: "Motherboard chipset spec is missing.",
      involvedPartIds: involved,
    };
  }

  const biosEntry =
    inputs.motherboard.biosMinVersionForCpu?.[inputs.cpuId] ?? null;

  if (!biosEntry) {
    return {
      checkId: "chipset-bios",
      status: "unavailable",
      explanation: `No documented minimum BIOS version for ${inputs.cpuId} on ${inputs.motherboardId}.`,
      involvedPartIds: involved,
    };
  }

  return {
    checkId: "chipset-bios",
    status: "compatible",
    involvedPartIds: involved,
  };
}

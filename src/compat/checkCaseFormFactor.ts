import type { CompatibilityCheckResult } from "../contract/compat2";
import type { CompatibilityInputs } from "./compatibilityInputs";

export function checkCaseFormFactor(
  inputs: CompatibilityInputs,
): CompatibilityCheckResult {
  const involved = [inputs.caseId, inputs.motherboardId];

  if (
    !inputs.caseSpec?.supportedFormFactors?.length ||
    !inputs.motherboard?.formFactor
  ) {
    return {
      checkId: "case-form-factor",
      status: "unavailable",
      explanation: "Case or motherboard form factor spec is missing.",
      involvedPartIds: involved,
    };
  }

  if (inputs.caseSpec.supportedFormFactors.includes(inputs.motherboard.formFactor)) {
    return {
      checkId: "case-form-factor",
      status: "compatible",
      involvedPartIds: involved,
    };
  }

  return {
    checkId: "case-form-factor",
    status: "incompatible",
    explanation: `Motherboard ${inputs.motherboardId} is ${inputs.motherboard.formFactor}; case ${inputs.caseId} supports ${inputs.caseSpec.supportedFormFactors.join(", ")} only.`,
    involvedPartIds: involved,
  };
}

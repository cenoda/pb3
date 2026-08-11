import type {
  CompatibilityCheckId,
  CompatibilityCheckResult,
  CompatibilityReport,
} from "../contract/compat2";
import type {
  PhysicalCheckResult,
  PhysicalValidationReport,
} from "../contract/phys3";
import { isBlockingUnavailableCheck } from "../compat/unavailablePolicy";

export type VerdictLevel = "ok" | "caution" | "blocked";

export interface BuildVerdict {
  level: VerdictLevel;
  /** Short answer to "is this build right?", on the main screen. */
  headline: string;
  /** One plain sentence: what conflicts, and which part to change (spec R2). */
  reason: string | null;
  /**
   * Spec R1 gate: false means no performance number and no price may be
   * presented as a result of this build.
   */
  showResults: boolean;
}

export interface BuildVerdictInput {
  compatibility: CompatibilityReport;
  physical: PhysicalValidationReport;
  /** Product name for a part id; ids never reach the user (spec R2). */
  nameOf: (partId: string) => string;
}

/** What to change, per failing check. */
const COMPAT_ACTION: Record<CompatibilityCheckId, string> = {
  "cpu-socket": "Change the processor or the motherboard.",
  "chipset-bios": "Change the processor or the motherboard.",
  "ram-support": "Change the memory or the motherboard.",
  "psu-wattage": "Choose a power supply with a higher wattage.",
  "case-form-factor": "Change the case or the motherboard.",
};

export function buildVerdict(input: BuildVerdictInput): BuildVerdict {
  const { compatibility, physical, nameOf } = input;

  const badCompat = compatibility.checks.find(
    (check) => check.status === "incompatible",
  );
  if (badCompat) {
    return {
      level: "blocked",
      headline: "These parts do not work together.",
      reason: compatReason(badCompat, nameOf),
      showResults: false,
    };
  }

  const interference = physical.checks.find(
    (check) =>
      check.kind === "clearance-limit" && check.status === "interference",
  );
  if (interference) {
    return {
      level: "blocked",
      headline: "These parts do not physically fit.",
      reason: physicalReason(interference, nameOf),
      showResults: false,
    };
  }

  if (physical.overallStatus === "unavailable") {
    const unresolved = physical.checks.find(
      (check) =>
        check.kind === "clearance-limit" && check.status === "unavailable",
    );
    return {
      level: "blocked",
      headline: "This build cannot be assembled.",
      reason: unresolved
        ? physicalReason(unresolved, nameOf)
        : "We could not work out how these parts fit together. Change a part to try another combination.",
      showResults: false,
    };
  }

  if (physical.overallStatus === "conditional") {
    const conditional = physical.checks.find(
      (check) =>
        check.kind === "clearance-limit" && check.status === "conditional",
    );
    return {
      level: "caution",
      headline: "These parts may fit, depending on configuration.",
      reason: conditional
        ? physicalReason(conditional, nameOf)
        : "Published clearance limits disagree across configurations. The rest of the build checks out.",
      showResults: true,
    };
  }

  // B4 / O6: only blocking unavailable checks demote to caution.
  // chipset-bios: unavailable stays in the detailed report, not the verdict.
  const uncheckable = compatibility.checks.find(isBlockingUnavailableCheck);
  if (uncheckable) {
    return {
      level: "caution",
      headline: "These parts work together, with one thing we could not check.",
      reason: uncheckableReason(uncheckable, nameOf),
      showResults: true,
    };
  }

  return {
    level: "ok",
    headline: "These parts work together.",
    reason: null,
    showResults: true,
  };
}

function compatReason(
  check: CompatibilityCheckResult,
  nameOf: (partId: string) => string,
): string {
  const detail = humanize(check.explanation, check.involvedPartIds, nameOf);
  const action = COMPAT_ACTION[check.checkId];
  return detail ? `${detail} ${action}` : action;
}

function physicalReason(
  check: PhysicalCheckResult,
  nameOf: (partId: string) => string,
): string {
  const detail = humanize(check.explanation, check.involvedPartIds, nameOf);
  const parts = check.involvedPartIds.map(nameOf);
  const action =
    parts.length > 0
      ? `Change ${joinNames(parts)} to try another combination.`
      : "Change a part to try another combination.";
  return detail ? `${detail} ${action}` : action;
}

function uncheckableReason(
  check: CompatibilityCheckResult,
  nameOf: (partId: string) => string,
): string {
  const detail = humanize(check.explanation, check.involvedPartIds, nameOf);
  return detail
    ? `${detail} The rest of the build checks out.`
    : "One check could not be completed. The rest of the build checks out.";
}

/**
 * Engine explanations carry the real values but name parts by id. Swap the ids
 * for product names rather than restating the engine's numbers here, so the
 * sentence cannot drift from what the engine actually decided.
 */
function humanize(
  explanation: string | undefined,
  partIds: readonly string[],
  nameOf: (partId: string) => string,
): string | null {
  if (!explanation) return null;
  let text = explanation;
  // Longest id first: ids can be prefixes of one another.
  for (const partId of [...partIds].sort((a, b) => b.length - a.length)) {
    text = text.split(partId).join(nameOf(partId));
  }
  return text;
}

function joinNames(names: readonly string[]): string {
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}

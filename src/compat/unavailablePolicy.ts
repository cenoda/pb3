import type {
  CompatibilityCheckId,
  CompatibilityCheckResult,
} from "../contract/compat2";

/**
 * Phase 6 B4 / O6 — unavailable checks that must not block aggregate
 * compatibility or demote an otherwise clean UI verdict to `caution`.
 *
 * Policy is by `checkId` only (never explanation text). Under O6, BIOS
 * revision compatibility is intentionally not modeled, so a raw
 * `chipset-bios: unavailable` result stays in the report for transparency
 * but is informational. Every other unavailable check id remains blocking.
 */
const NON_BLOCKING_UNAVAILABLE_CHECK_IDS: ReadonlySet<CompatibilityCheckId> =
  new Set(["chipset-bios"]);

/**
 * True when this check is `unavailable` and must still demote
 * `CompatibilityReport.overallStatus` and the UI verdict.
 */
export function isBlockingUnavailableCheck(
  check: Pick<CompatibilityCheckResult, "checkId" | "status">,
): boolean {
  return (
    check.status === "unavailable" &&
    !NON_BLOCKING_UNAVAILABLE_CHECK_IDS.has(check.checkId)
  );
}

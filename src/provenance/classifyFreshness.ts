/**
 * Pure freshness classifier (prov4 §4).
 * Omitted/invalid asOf → unknown; age vs maxAgeDays → current/stale.
 */
import type {
  FreshnessInput,
  FreshnessResult,
} from "../contract/prov4";

function parseIsoMs(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const ms = Date.parse(trimmed);
  if (!Number.isFinite(ms)) return null;
  return ms;
}

/** Whole days since asOf (floor); negative ages clamp to 0. */
function ageDaysBetween(asOfMs: number, nowMs: number): number {
  const diffMs = nowMs - asOfMs;
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

export function classifyFreshness(input: FreshnessInput): FreshnessResult {
  const asOf = input.asOf;
  if (asOf === undefined || asOf.trim().length === 0) {
    return {
      state: "unknown",
      explanation: "asOf omitted or empty; freshness cannot be classified",
    };
  }

  const asOfMs = parseIsoMs(asOf);
  if (asOfMs === null) {
    return {
      state: "unknown",
      explanation: `asOf is not a valid timestamp: ${asOf}`,
    };
  }

  const nowMs = parseIsoMs(input.nowIso);
  if (nowMs === null) {
    return {
      state: "unknown",
      explanation: `nowIso is not a valid timestamp: ${input.nowIso}`,
    };
  }

  const ageDays = ageDaysBetween(asOfMs, nowMs);
  const maxAgeDays = input.policy.maxAgeDays;

  if (maxAgeDays === undefined) {
    return {
      state: "current",
      ageDays,
      explanation:
        "no automatic freshness window (maxAgeDays omitted); timestamp displayed when present",
    };
  }

  if (ageDays <= maxAgeDays) {
    return {
      state: "current",
      ageDays,
      explanation: `age ${ageDays}d ≤ maxAgeDays ${maxAgeDays}`,
    };
  }

  return {
    state: "stale",
    ageDays,
    explanation: `age ${ageDays}d > maxAgeDays ${maxAgeDays}`,
  };
}

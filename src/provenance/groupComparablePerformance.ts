/**
 * Exact comparability grouping for external performance observations.
 * Authority: corrective plan §3 + ADR-005.
 */
import type {
  ExternalPerformanceObservation,
  ObservationExclusion,
  ObservationExclusionReason,
  PerformanceComparabilityKey,
  PilotBaselineKey,
  SourceRightsRecordFile,
} from "../contract/prov4";

export function rayTracingStateForPreset(
  presetId: string,
): "off" | "on" | "partial" {
  if (presetId === "preset.raster-ultra") return "off";
  return "partial";
}

export function comparabilityKeyFromPilot(
  key: PilotBaselineKey,
): PerformanceComparabilityKey {
  return {
    cpuId: key.cpuId,
    gpuId: key.gpuId,
    gameId: key.gameId,
    presetId: key.presetId,
    resolution: key.resolution,
    upscaleId: key.upscaleId,
    frameGenId: key.frameGenId,
    rayTracingState: rayTracingStateForPreset(key.presetId),
  };
}

export function comparabilityKeyFromObservation(
  observation: ExternalPerformanceObservation,
): PerformanceComparabilityKey {
  return {
    cpuId: observation.cpuId,
    gpuId: observation.gpuId,
    gameId: observation.gameId,
    presetId: observation.presetId,
    resolution: observation.resolution,
    upscaleId: observation.upscaleId,
    frameGenId: observation.frameGenId,
    rayTracingState: observation.rayTracingState,
  };
}

function fieldMismatches(
  target: PerformanceComparabilityKey,
  candidate: PerformanceComparabilityKey,
): ObservationExclusionReason[] {
  const reasons: ObservationExclusionReason[] = [];
  if (candidate.cpuId !== target.cpuId) reasons.push("cpu_mismatch");
  if (candidate.gpuId !== target.gpuId) reasons.push("gpu_mismatch");
  if (candidate.gameId !== target.gameId) reasons.push("game_mismatch");
  if (candidate.presetId !== target.presetId) reasons.push("preset_mismatch");
  if (candidate.resolution !== target.resolution) {
    reasons.push("resolution_mismatch");
  }
  if (candidate.upscaleId !== target.upscaleId)
    reasons.push("upscale_mismatch");
  if (candidate.frameGenId !== target.frameGenId)
    reasons.push("framegen_mismatch");
  if (candidate.rayTracingState !== target.rayTracingState) {
    reasons.push("ray_tracing_mismatch");
  }
  return reasons;
}

/** Material quality class inferred from free-text exactSettings. */
export type MaterialQualityClass =
  "psycho" | "ultra" | "high" | "medium" | "low" | "unspecified";

export function qualityClassFromExactSettings(
  exactSettings: string,
): MaterialQualityClass {
  const t = exactSettings.toLowerCase();
  if (/\bpsycho\b/.test(t)) return "psycho";
  if (/\bultra\b/.test(t)) return "ultra";
  if (/\bhigh\b/.test(t)) return "high";
  if (/\bmedium\b|\bmed\b/.test(t)) return "medium";
  if (/\blow\b/.test(t)) return "low";
  return "unspecified";
}

type Ternary = "on" | "off" | "unknown";

function detectRtHint(exactSettings: string): Ternary {
  const t = exactSettings.toLowerCase();
  if (
    /\b(?:rt|ray\s*trac(?:e|ing))\s*(?:off|disabled)\b/.test(t) ||
    /\b(?:no|without)\s+(?:rt|ray\s*tracing)\b/.test(t) ||
    /\braster(?:ization)?\s*only\b/.test(t)
  ) {
    return "off";
  }
  if (
    /\b(?:rt|ray\s*trac(?:e|ing))\s*(?:on|ultra|psycho|overdrive|enabled)\b/.test(
      t,
    ) ||
    /\bpath\s*tracing\b/.test(t)
  ) {
    return "on";
  }
  return "unknown";
}

function detectUpscaleHint(exactSettings: string): Ternary {
  const t = exactSettings.toLowerCase();
  if (
    /\b(?:dlss|fsr|xess|upscal(?:e|ing))\s*(?:off|disabled|native)\b/.test(t) ||
    /\bnative\s*(?:aa|res|resolution)?\b/.test(t) ||
    /\bno\s+(?:dlss|fsr|xess|upscaling)\b/.test(t)
  ) {
    return "off";
  }
  if (
    /\b(?:dlss|fsr|xess)\s*(?:quality|balanced|performance|ultra\s*performance|on)\b/.test(
      t,
    ) ||
    /\bupscal(?:e|ing)\s*on\b/.test(t)
  ) {
    return "on";
  }
  return "unknown";
}

function detectFrameGenHint(exactSettings: string): Ternary {
  const t = exactSettings.toLowerCase();
  if (
    /\b(?:fg|frame\s*gen(?:eration)?)\s*(?:off|disabled)\b/.test(t) ||
    /\bno\s+(?:fg|frame\s*gen(?:eration)?)\b/.test(t)
  ) {
    return "off";
  }
  if (/\b(?:fg|frame\s*gen(?:eration)?)\s*(?:on|enabled)\b/.test(t)) {
    return "on";
  }
  return "unknown";
}

function isOffId(id: string): boolean {
  return /(?:^|[._-])off(?:$|[._-])/.test(id) || id === "off";
}

/**
 * Material settings check: free-text exactSettings must not contradict structured
 * fields or the pilot material profile. Quality-class conflicts (e.g. Psycho vs
 * Ultra under raster-ultra) exclude the observation.
 */
export function materialSettingsMismatch(
  target: PerformanceComparabilityKey,
  observation: ExternalPerformanceObservation,
): string | null {
  const rtHint = detectRtHint(observation.exactSettings);
  const upHint = detectUpscaleHint(observation.exactSettings);
  const fgHint = detectFrameGenHint(observation.exactSettings);
  const quality = qualityClassFromExactSettings(observation.exactSettings);

  // Internal contradictions: exactSettings vs structured observation fields.
  if (rtHint === "on" && observation.rayTracingState === "off") {
    return "exactSettings claims RT on while rayTracingState is off";
  }
  if (rtHint === "off" && observation.rayTracingState !== "off") {
    return "exactSettings claims RT off while rayTracingState is not off";
  }
  if (upHint === "on" && isOffId(observation.upscaleId)) {
    return "exactSettings claims upscaling on while upscaleId is off";
  }
  if (upHint === "off" && !isOffId(observation.upscaleId)) {
    return "exactSettings claims upscaling off while upscaleId is not off";
  }
  if (fgHint === "on" && isOffId(observation.frameGenId)) {
    return "exactSettings claims frame gen on while frameGenId is off";
  }
  if (fgHint === "off" && !isOffId(observation.frameGenId)) {
    return "exactSettings claims frame gen off while frameGenId is not off";
  }

  // Pilot material profile (raster-ultra native: RT off, upscale off, FG off).
  if (rtHint === "on" && target.rayTracingState === "off") {
    return "exactSettings material RT conflicts with pilot rayTracingState off";
  }
  if (upHint === "on" && isOffId(target.upscaleId)) {
    return "exactSettings material upscaling conflicts with pilot upscale off";
  }
  if (fgHint === "on" && isOffId(target.frameGenId)) {
    return "exactSettings material frame gen conflicts with pilot framegen off";
  }

  // Quality-class material mismatch vs pilot raster-ultra expectation.
  if (target.presetId === "preset.raster-ultra") {
    if (
      quality === "psycho" ||
      quality === "high" ||
      quality === "medium" ||
      quality === "low"
    ) {
      return `exactSettings quality class "${quality}" is material mismatch vs pilot raster-ultra`;
    }
  }

  return null;
}

/**
 * Fail-closed eligibility: observation may contribute product FPS only when
 * source-rights decision is approved AND storeExtractedObservation is true.
 */
export function sourceRightsEligibility(
  observation: ExternalPerformanceObservation,
  sourceRights: SourceRightsRecordFile,
): { eligible: true } | { eligible: false; detail: string } {
  const decision = sourceRights.decisions.find(
    (d) => d.sourceId === observation.sourceId,
  );
  if (!decision) {
    return {
      eligible: false,
      detail: `No source-rights decision for ${observation.sourceId}`,
    };
  }
  if (decision.decision === "excluded") {
    return {
      eligible: false,
      detail: `Source ${observation.sourceId} is excluded by source-rights record`,
    };
  }
  if (
    decision.decision !== "approved" ||
    decision.storeExtractedObservation !== true
  ) {
    return {
      eligible: false,
      detail: `Source ${observation.sourceId} decision=${decision.decision} storeExtractedObservation=${decision.storeExtractedObservation}; FPS extraction not permitted`,
    };
  }
  return { eligible: true };
}

export function isComparableObservation(
  target: PerformanceComparabilityKey,
  observation: ExternalPerformanceObservation,
): {
  comparable: boolean;
  reasons: ObservationExclusionReason[];
  detail?: string;
} {
  const candidate = comparabilityKeyFromObservation(observation);
  const reasons = fieldMismatches(target, candidate);
  if (reasons.length > 0) {
    return { comparable: false, reasons };
  }
  const materialDetail = materialSettingsMismatch(target, observation);
  if (materialDetail) {
    return {
      comparable: false,
      reasons: ["settings_mismatch"],
      detail: materialDetail,
    };
  }
  return { comparable: true, reasons: [] };
}

export interface GroupComparableResult {
  comparable: ExternalPerformanceObservation[];
  exclusions: ObservationExclusion[];
}

export function groupComparableObservations(
  exactKey: PilotBaselineKey,
  observations: readonly ExternalPerformanceObservation[],
  sourceRights: SourceRightsRecordFile,
): GroupComparableResult {
  const target = comparabilityKeyFromPilot(exactKey);
  const comparable: ExternalPerformanceObservation[] = [];
  const exclusions: ObservationExclusion[] = [];
  const seenSourceIds = new Set<string>();

  for (const observation of observations) {
    const rights = sourceRightsEligibility(observation, sourceRights);
    if (!rights.eligible) {
      exclusions.push({
        observationId: observation.observationId,
        reason: "source_rights_denied",
        detail: rights.detail,
      });
      continue;
    }

    const {
      comparable: matches,
      reasons,
      detail,
    } = isComparableObservation(target, observation);
    if (!matches) {
      exclusions.push({
        observationId: observation.observationId,
        reason: reasons[0] ?? "settings_mismatch",
        detail:
          detail ??
          `Excluded from ${exactKey.resolution} aggregation: ${reasons.join(", ")}`,
      });
      continue;
    }

    if (seenSourceIds.has(observation.sourceId)) {
      exclusions.push({
        observationId: observation.observationId,
        reason: "duplicate_source",
        detail: `Second observation from source ${observation.sourceId} excluded for independence`,
      });
      continue;
    }

    seenSourceIds.add(observation.sourceId);
    comparable.push(observation);
  }

  return { comparable, exclusions };
}

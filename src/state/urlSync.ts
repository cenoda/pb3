import type { BuildStateV2 } from "../contract/vs2";
import {
  DEFAULT_BUILD_STATE_V2,
  PHASE0_CPU_IDS,
  PHASE0_GPU_IDS,
  VS2_URL_KEYS,
} from "../contract/vs2";

/** Canonical encoder: always emit every BuildStateV2 field. */
export function buildStateToSearchParams(state: BuildStateV2): URLSearchParams {
  const p = new URLSearchParams();
  p.set(VS2_URL_KEYS.v, state.contractVersion);
  p.set(VS2_URL_KEYS.cpu, state.cpuId);
  p.set(VS2_URL_KEYS.gpu, state.gpuId);
  p.set(VS2_URL_KEYS.case, state.caseId);
  p.set(VS2_URL_KEYS.mb, state.motherboardId);
  p.set(VS2_URL_KEYS.cooler, state.coolerId);
  p.set(VS2_URL_KEYS.ram, state.ramId);
  p.set(VS2_URL_KEYS.psu, state.psuId);
  p.set(VS2_URL_KEYS.game, state.gameId);
  p.set(VS2_URL_KEYS.preset, state.presetId);
  return p;
}

/**
 * Lenient decoder: missing keys use defaults.
 * Accepts legacy v=vs0 links (fills ram/psu from defaults) and normalizes to vs2.
 */
export function buildStateFromSearchParams(
  params: URLSearchParams,
  defaults: BuildStateV2,
  isValid: (state: BuildStateV2) => boolean,
): BuildStateV2 {
  const version = params.get(VS2_URL_KEYS.v);

  if (version && version !== "vs0" && version !== "vs2") {
    return defaults;
  }

  const candidate: BuildStateV2 = {
    contractVersion: "vs2",
    cpuId: params.get(VS2_URL_KEYS.cpu) ?? defaults.cpuId,
    gpuId: params.get(VS2_URL_KEYS.gpu) ?? defaults.gpuId,
    caseId: params.get(VS2_URL_KEYS.case) ?? defaults.caseId,
    motherboardId: params.get(VS2_URL_KEYS.mb) ?? defaults.motherboardId,
    coolerId: params.get(VS2_URL_KEYS.cooler) ?? defaults.coolerId,
    ramId: params.get(VS2_URL_KEYS.ram) ?? defaults.ramId,
    psuId: params.get(VS2_URL_KEYS.psu) ?? defaults.psuId,
    gameId: params.get(VS2_URL_KEYS.game) ?? defaults.gameId,
    presetId: params.get(VS2_URL_KEYS.preset) ?? defaults.presetId,
  };

  return isValid(candidate) ? candidate : defaults;
}

export function replaceUrlWithBuildState(state: BuildStateV2): void {
  const params = buildStateToSearchParams(state);
  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", nextUrl);
}

export {
  VS2_URL_KEYS as URL_KEYS,
  PHASE0_CPU_IDS,
  PHASE0_GPU_IDS,
  DEFAULT_BUILD_STATE_V2,
};

import type { BuildState } from "../contract/vs0";
import { PHASE0_CPU_IDS, PHASE0_GPU_IDS } from "../contract/vs0";

const URL_KEYS = {
  v: "v",
  cpu: "cpu",
  gpu: "gpu",
  case: "case",
  mb: "mb",
  cooler: "cooler",
  game: "game",
  preset: "preset",
} as const;

/** Canonical encoder: always emit every BuildState field. */
export function buildStateToSearchParams(state: BuildState): URLSearchParams {
  const p = new URLSearchParams();
  p.set(URL_KEYS.v, state.contractVersion);
  p.set(URL_KEYS.cpu, state.cpuId);
  p.set(URL_KEYS.gpu, state.gpuId);
  p.set(URL_KEYS.case, state.caseId);
  p.set(URL_KEYS.mb, state.motherboardId);
  p.set(URL_KEYS.cooler, state.coolerId);
  p.set(URL_KEYS.game, state.gameId);
  p.set(URL_KEYS.preset, state.presetId);
  return p;
}

/**
 * Lenient decoder: missing keys use defaults.
 * Partial links (e.g. only cpu+gpu) are accepted as compatibility inputs.
 */
export function buildStateFromSearchParams(
  params: URLSearchParams,
  defaults: BuildState,
  isValid: (state: BuildState) => boolean,
): BuildState {
  const candidate: BuildState = {
    contractVersion:
      (params.get(URL_KEYS.v) as BuildState["contractVersion"]) ??
      defaults.contractVersion,
    cpuId: params.get(URL_KEYS.cpu) ?? defaults.cpuId,
    gpuId: params.get(URL_KEYS.gpu) ?? defaults.gpuId,
    caseId: params.get(URL_KEYS.case) ?? defaults.caseId,
    motherboardId: params.get(URL_KEYS.mb) ?? defaults.motherboardId,
    coolerId: params.get(URL_KEYS.cooler) ?? defaults.coolerId,
    gameId: params.get(URL_KEYS.game) ?? defaults.gameId,
    presetId: params.get(URL_KEYS.preset) ?? defaults.presetId,
  };

  if (candidate.contractVersion !== "vs0") {
    return defaults;
  }
  return isValid(candidate) ? candidate : defaults;
}

export function replaceUrlWithBuildState(state: BuildState): void {
  const params = buildStateToSearchParams(state);
  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", nextUrl);
}

export { URL_KEYS, PHASE0_CPU_IDS, PHASE0_GPU_IDS };

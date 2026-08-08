import type {
  BaselineQuery,
  CorrectionInput,
  CorrectionResult,
  CorrectedEstimate,
  PerformanceEstimate,
  WithheldCorrection,
} from "../contract/perf1";

const ALLOWED_CPU_POWER = new Set(["cpu-power.default", "cpu-power.reduced"]);
const ALLOWED_GPU_POWER = new Set(["gpu-power.default", "gpu-power.reduced"]);
const ALLOWED_COOLING = new Set([
  "cooling.sufficient",
  "cooling.marginal",
  "cooling.insufficient",
]);
const ALLOWED_LOAD = new Set(["load.transient", "load.sustained"]);

function baselineKey(query: BaselineQuery): string {
  return [
    query.cpuId,
    query.gpuId,
    query.gameId,
    query.presetId,
    query.resolution,
    query.upscaleId,
    query.frameGenId,
    query.ramTierId,
    query.powerProfileId,
  ].join("\0");
}

function isEmptyCorrection(correction: CorrectionInput): boolean {
  return (
    correction.cpuPowerId === undefined &&
    correction.gpuPowerId === undefined &&
    correction.coolingBucketId === undefined &&
    correction.loadProfileId === undefined
  );
}

function unsupportedCorrectionReason(field: string, value: string): WithheldCorrection {
  return {
    status: "withheld",
    reason: `Correction input ${field}=${value} is not supported in phase 1.`,
  };
}

function validatePhase1CorrectionIds(
  correction: CorrectionInput,
): CorrectionResult | null {
  if (
    correction.cpuPowerId !== undefined &&
    !ALLOWED_CPU_POWER.has(correction.cpuPowerId)
  ) {
    return unsupportedCorrectionReason("cpuPowerId", correction.cpuPowerId);
  }
  if (
    correction.gpuPowerId !== undefined &&
    !ALLOWED_GPU_POWER.has(correction.gpuPowerId)
  ) {
    return unsupportedCorrectionReason("gpuPowerId", correction.gpuPowerId);
  }
  if (
    correction.coolingBucketId !== undefined &&
    !ALLOWED_COOLING.has(correction.coolingBucketId)
  ) {
    return unsupportedCorrectionReason(
      "coolingBucketId",
      correction.coolingBucketId,
    );
  }
  if (
    correction.loadProfileId !== undefined &&
    !ALLOWED_LOAD.has(correction.loadProfileId)
  ) {
    return unsupportedCorrectionReason("loadProfileId", correction.loadProfileId);
  }
  return null;
}

/**
 * Phase-1 stub correction rules derived from benchmarks/perf1/correction-examples.json.
 * Magnitudes stay confidence:"stub" per contract §4.5 — not measured values.
 * Reserved Phase 3 fields (coolingHeadroom, intakeRestrictionSeverity) are ignored.
 */
const STUB_CORRECTION_RULES: Array<{
  queryKey: string;
  matches: (correction: CorrectionInput) => boolean;
  apply: () => CorrectedEstimate | WithheldCorrection;
}> = [
  {
    queryKey: baselineKey({
      cpuId: "cpu.zen4-7600",
      gpuId: "gpu.rtx4070",
      gameId: "game.cyberpunk-2077",
      presetId: "preset.raster-ultra",
      resolution: "1440p",
      upscaleId: "upscale.off",
      frameGenId: "framegen.off",
      ramTierId: "ram.32gb-ddr5",
      powerProfileId: "power.default",
    }),
    matches: (c) =>
      c.cpuPowerId === "cpu-power.reduced" &&
      c.gpuPowerId === undefined &&
      c.coolingBucketId === undefined &&
      c.loadProfileId === undefined,
    apply: () => ({
      status: "ok",
      fpsMin: 46,
      fpsMax: 57,
      confidence: "stub",
      dataVersion: "perf1",
      basis:
        "phase-1 perf1 correction fixture; not measured; ordinal stub derate from baseline row",
      limitingFactor: {
        category: "power limit",
        explanation:
          "Stub ordinal: reduced CPU power limit tier shifts fixture bottleneck toward power limit under this correction.",
      },
      reason:
        "cpu-power.reduced applied: stub power-limit reduction lowers FPS range versus baseline controlled conditions.",
    }),
  },
  {
    queryKey: baselineKey({
      cpuId: "cpu.zen4-7800x3d",
      gpuId: "gpu.rtx4080",
      gameId: "game.cyberpunk-2077",
      presetId: "preset.raster-ultra",
      resolution: "4k",
      upscaleId: "upscale.off",
      frameGenId: "framegen.off",
      ramTierId: "ram.32gb-ddr5",
      powerProfileId: "power.default",
    }),
    matches: (c) =>
      c.coolingBucketId === "cooling.insufficient" &&
      c.loadProfileId === "load.sustained" &&
      c.evidenceSourceId === "fixture.stub-evidence-sustained-cooling",
    apply: () => ({
      status: "ok",
      fpsMin: 54,
      fpsMax: 68,
      confidence: "stub",
      dataVersion: "perf1",
      basis:
        "phase-1 perf1 correction fixture; not measured; ordinal stub derate with declared stub evidence",
      limitingFactor: {
        category: "GPU-bound",
        explanation:
          "Stub ordinal: sustained 4K load under insufficient cooling fixture bucket; GPU remains primary limiter with thermal headroom penalty applied.",
      },
      reason:
        "cooling.insufficient + load.sustained with stub evidence present: insufficient cooling under sustained load reduces FPS range versus baseline.",
    }),
  },
  {
    queryKey: baselineKey({
      cpuId: "cpu.zen4-7600",
      gpuId: "gpu.rtx4080",
      gameId: "game.cyberpunk-2077",
      presetId: "preset.raster-ultra",
      resolution: "1080p",
      upscaleId: "upscale.dlss-quality",
      frameGenId: "framegen.off",
      ramTierId: "ram.32gb-ddr5",
      powerProfileId: "power.default",
    }),
    matches: (c) =>
      c.loadProfileId === "load.sustained" &&
      c.cpuPowerId === undefined &&
      c.gpuPowerId === undefined &&
      c.coolingBucketId === undefined,
    apply: () => ({
      status: "withheld",
      reason:
        "Sustained-performance correction was not computed: load.sustained supplied without applicable fixture evidence for this combo.",
    }),
  },
  {
    queryKey: baselineKey({
      cpuId: "cpu.zen4-7800x3d",
      gpuId: "gpu.rtx4070",
      gameId: "game.cyberpunk-2077",
      presetId: "preset.raster-ultra",
      resolution: "1080p",
      upscaleId: "upscale.off",
      frameGenId: "framegen.off",
      ramTierId: "ram.32gb-ddr5",
      powerProfileId: "power.default",
    }),
    matches: (c) =>
      c.gpuPowerId === "gpu-power.reduced" &&
      c.cpuPowerId === undefined &&
      c.coolingBucketId === undefined &&
      c.loadProfileId === undefined,
    apply: () => ({
      status: "ok",
      fpsMin: 88,
      fpsMax: 104,
      confidence: "stub",
      dataVersion: "perf1",
      basis:
        "phase-1 perf1 correction fixture; not measured; ordinal stub derate from baseline row",
      limitingFactor: {
        category: "power limit",
        explanation:
          "Stub ordinal: reduced GPU power limit tier is asserted as primary limiter under this correction.",
      },
      reason:
        "gpu-power.reduced applied: stub power-limit reduction lowers FPS range versus baseline controlled conditions.",
    }),
  },
];

/**
 * Apply Phase-1 environment correction to a successful baseline estimate.
 * Returns null when correction input is empty (identity — caller shows baseline only).
 * Reserved Phase 3 fields are accepted but not applied.
 */
export function applyCorrection(
  query: BaselineQuery,
  _baseline: PerformanceEstimate,
  correction: CorrectionInput,
): CorrectionResult | null {
  if (isEmptyCorrection(correction)) {
    return null;
  }

  const validationError = validatePhase1CorrectionIds(correction);
  if (validationError) {
    return validationError;
  }

  const key = baselineKey(query);
  for (const rule of STUB_CORRECTION_RULES) {
    if (rule.queryKey === key && rule.matches(correction)) {
      return rule.apply();
    }
  }

  if (correction.loadProfileId === "load.sustained") {
    const withheld: WithheldCorrection = {
      status: "withheld",
      reason:
        "Sustained-performance correction was not computed: load.sustained supplied without applicable fixture evidence for this combo.",
    };
    return withheld;
  }

  if (
    correction.cpuPowerId === "cpu-power.reduced" ||
    correction.gpuPowerId === "gpu-power.reduced" ||
    correction.coolingBucketId !== undefined
  ) {
    return {
      status: "withheld",
      reason:
        "Environment correction was not computed: no fixture evidence for the supplied correction on this baseline combo.",
    };
  }

  return null;
}

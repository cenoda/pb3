/*
 * Phase 5 product surface.
 *
 * Layout: header / parts rail / dominant 3D stage / result bar.
 * Regions not yet built are placeholders; see
 * docs/phases/phase-5/implementation_plan.md.
 */

import { useEffect, useMemo, useState } from "react";
import { loadPartCatalog } from "./catalog/loadPartCatalog";
import { loadImageSourceRegistry } from "./catalog/loadImageSourceRegistry";
import {
  loadPerf1Fixtures,
  type Perf1Fixtures,
} from "./catalog/loadPerf1Fixtures";
import { buildCompatibilityReport } from "./compat/buildCompatibilityReport";
import type { CatalogPriceFile, ImageSourceRegistryFile } from "./contract/cat6";
import type {
  WorkloadEstimateResult,
  WorkloadId,
  WorkloadMetric,
} from "./contract/perf1";
import type { CoolingEvidenceFile, PhysicalSpec } from "./contract/phys3";
import { estimateWorkload } from "./perf/estimateWorkload";
import { buildCoolingCorrectionInput } from "./physical/cooling/buildCoolingCorrectionInput";
import { loadCoolingEvidence } from "./physical/cooling/loadCoolingEvidence";
import { buildPilotDisclosureReport } from "./provenance/buildPilotDisclosureReport";
import { PHASE0_GAME, PHASE0_PRESET } from "./contract/vs0";
import type { BuildStateV2, PartCategoryV2 } from "./contract/vs2";
import {
  loadEst1Fixtures,
  type Est1Fixtures,
} from "./estimate/loadEst1Fixtures";
import { buildAssemblyState } from "./physical/buildAssemblyState";
import { buildPhysicalValidationReport } from "./physical/buildPhysicalValidationReport";
import type { GlbPhysicalIndex } from "./physical/indexGlbPhysicalNodes";
import { loadGlbPhysicalIndexes } from "./physical/loadGlbPhysicalIndexes";
import { buildPriceSummary } from "./price/buildPriceSummary";
import { loadCatalogPrices } from "./price/loadCatalogPrices";
import { loadProv4Fixtures, type Prov4Fixtures } from "./provenance/loadProv4Fixtures";
import { useAssemblyStore } from "./state/assemblyStore";
import { useBuildStore } from "./state/buildStore";
import {
  buildStateFromSearchParams,
  replaceUrlWithBuildState,
} from "./state/urlSync";
import {
  catalogAllowedIds,
  createBuildStateValidator,
  DEFAULT_BUILD_STATE,
  type PartCatalog,
} from "./state/validateBuildState";
import { BuildActions } from "./ui/BuildActions";
import { buildVerdict } from "./ui/buildVerdict";
import { PartPicker } from "./ui/PartPicker";
import { computePerformanceRows } from "./ui/performanceRows";
import { PerformanceSettings } from "./ui/PerformanceSettings";
import { ResultBar } from "./ui/ResultBar";
import { WhyThisResult } from "./ui/WhyThisResult";
import { BuildViewport } from "./viewport/BuildViewport";
import { usePerfPanelStore } from "./state/perfPanelState";

type BootState =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      catalog: PartCatalog;
      glbIndexes: Map<string, GlbPhysicalIndex>;
      perf1Fixtures: Perf1Fixtures;
      catalogPrices: CatalogPriceFile;
      coolingEvidence: CoolingEvidenceFile;
      prov4Fixtures: Prov4Fixtures;
      est1Fixtures: Est1Fixtures;
      imageRegistry: ImageSourceRegistryFile;
    };

const PART_SLOTS: {
  category: PartCategoryV2;
  label: string;
  testId: string;
}[] = [
  { category: "case", label: "Case", testId: "case-select" },
  { category: "motherboard", label: "Motherboard", testId: "motherboard-select" },
  { category: "cpu", label: "Processor", testId: "cpu-select" },
  { category: "gpu", label: "Graphics card", testId: "gpu-select" },
  { category: "cooler", label: "CPU cooler", testId: "cooler-select" },
  { category: "ram", label: "Memory", testId: "ram-part-select" },
  { category: "psu", label: "Power supply", testId: "psu-select" },
];

export default function App() {
  const [boot, setBoot] = useState<BootState>({ status: "loading" });
  const buildState = useBuildStore((store) => store.buildState);
  const initialized = useBuildStore((store) => store.initialized);
  const init = useBuildStore((store) => store.init);
  const setCase = useBuildStore((store) => store.setCase);
  const setMotherboard = useBuildStore((store) => store.setMotherboard);
  const setCpu = useBuildStore((store) => store.setCpu);
  const setGpu = useBuildStore((store) => store.setGpu);
  const setCooler = useBuildStore((store) => store.setCooler);
  const setRam = useBuildStore((store) => store.setRam);
  const setPsu = useBuildStore((store) => store.setPsu);
  const coolerOrientationId = useAssemblyStore((s) => s.coolerOrientationId);
  const setCoolerOrientation = useAssemblyStore((s) => s.setCoolerOrientation);
  const resetMounts = useAssemblyStore((s) => s.resetToAuto);
  const perfDimensions = usePerfPanelStore((s) => s.dimensions);
  const perfCorrection = usePerfPanelStore((s) => s.correction);
  const setUpscaleId = usePerfPanelStore((s) => s.setUpscaleId);
  const setFrameGenId = usePerfPanelStore((s) => s.setFrameGenId);
  const setCorrection = usePerfPanelStore((s) => s.setCorrection);
  const resetCorrection = usePerfPanelStore((s) => s.resetCorrection);

  const setters: Record<PartCategoryV2, (partId: string) => void> = {
    case: setCase,
    motherboard: setMotherboard,
    cpu: setCpu,
    gpu: setGpu,
    cooler: setCooler,
    ram: setRam,
    psu: setPsu,
  };

  useEffect(() => {
    let cancelled = false;

    async function bootApp() {
      try {
        const [
          catalog,
          perf1Fixtures,
          catalogPrices,
          coolingEvidence,
          prov4Fixtures,
          est1Fixtures,
          imageRegistry,
        ] = await Promise.all([
          loadPartCatalog(),
          loadPerf1Fixtures(),
          loadCatalogPrices(),
          loadCoolingEvidence(),
          loadProv4Fixtures(),
          loadEst1Fixtures(),
          loadImageSourceRegistry(),
        ]);
        const glbIndexes = await loadGlbPhysicalIndexes(catalog);
        if (cancelled) return;

        const isValid = createBuildStateValidator(catalog);
        const decoded = buildStateFromSearchParams(
          new URLSearchParams(window.location.search),
          DEFAULT_BUILD_STATE,
          isValid,
        );

        init(decoded, catalogAllowedIds(catalog));
        usePerfPanelStore.getState().resetCorrection();
        replaceUrlWithBuildState(decoded);
        setBoot({
          status: "ready",
          catalog,
          glbIndexes,
          perf1Fixtures,
          catalogPrices,
          coolingEvidence,
          prov4Fixtures,
          est1Fixtures,
          imageRegistry,
        });
      } catch (error) {
        if (cancelled) return;
        console.error("pb3 boot failed", error);
        setBoot({ status: "error" });
      }
    }

    void bootApp();

    return () => {
      cancelled = true;
    };
  }, [init]);

  // The URL is the share format (spec R6): every change is written back to it.
  useEffect(() => {
    if (!initialized) return;

    return useBuildStore.subscribe((store, previous) => {
      if (!store.buildState || store.buildState === previous.buildState) {
        return;
      }
      replaceUrlWithBuildState(store.buildState);
      // Part changes invalidate free mount choices back to declared defaults.
      useAssemblyStore.getState().resetToAuto();
    });
  }, [initialized]);

  const assembly = useMemo(() => {
    if (boot.status !== "ready" || !buildState) return null;
    return buildAssemblyState(buildState, boot.catalog, boot.glbIndexes, {
      coolerOrientationId,
    });
  }, [boot, buildState, coolerOrientationId]);

  const physicalReport = useMemo(() => {
    if (boot.status !== "ready" || !assembly) return null;
    return buildPhysicalValidationReport({
      assembly,
      partsById: boot.catalog.byId,
      glbIndexes: boot.glbIndexes,
    });
  }, [boot, assembly]);

  const compatibilityReport = useMemo(() => {
    if (boot.status !== "ready" || !buildState) return null;
    return buildCompatibilityReport(buildState, boot.catalog);
  }, [boot, buildState]);

  const verdict = useMemo(() => {
    if (boot.status !== "ready" || !compatibilityReport || !physicalReport) {
      return null;
    }
    const catalog = boot.catalog;
    return buildVerdict({
      compatibility: compatibilityReport,
      physical: physicalReport,
      nameOf: (partId) => catalog.get(partId)?.displayName ?? partId,
    });
  }, [boot, compatibilityReport, physicalReport]);

  /*
   * Spec R1: an impossible build presents no performance and no price. The gate
   * is here, before the numbers are computed, so nothing downstream can leak a
   * result the build cannot achieve.
   */
  const performance = useMemo(() => {
    if (boot.status !== "ready" || !buildState || !verdict?.showResults) {
      return null;
    }
    return {
      gameName: PHASE0_GAME.displayName,
      presetName: PHASE0_PRESET.displayName,
      rows: computePerformanceRows({
        buildState,
        perf1Fixtures: boot.perf1Fixtures,
        dimensions: perfDimensions,
        correction: perfCorrection,
        prov4Fixtures: boot.prov4Fixtures,
        est1Fixtures: boot.est1Fixtures,
      }),
    };
  }, [boot, buildState, verdict, perfDimensions, perfCorrection]);

  const coolingResult = useMemo(() => {
    if (boot.status !== "ready" || !assembly || !physicalReport || !buildState) {
      return null;
    }
    return buildCoolingCorrectionInput({
      buildPartIds: partIdsOf(buildState),
      mountSelections: assembly.assemblyState.mountSelections,
      geometryDataVersion: assembly.geometryDataVersion,
      physicalReport,
      evidenceFile: boot.coolingEvidence,
      allowStubRows: false,
    });
  }, [boot, assembly, physicalReport, buildState]);

  const disclosureReport = useMemo(() => {
    if (boot.status !== "ready" || !buildState) return null;
    const physicalSpecsByPartId = new Map<string, PhysicalSpec | undefined>();
    for (const partId of partIdsOf(buildState)) {
      physicalSpecsByPartId.set(partId, boot.catalog.byId.get(partId)?.physicalSpec);
    }
    return buildPilotDisclosureReport({
      state: buildState,
      physicalSpecsByPartId,
      registry: boot.prov4Fixtures.registry,
      performance: boot.prov4Fixtures.performance,
      geometry: boot.prov4Fixtures.geometry,
      cooling: boot.prov4Fixtures.cooling,
      verifications: boot.prov4Fixtures.verifications,
      externalObservations: boot.prov4Fixtures.externalObservations,
      sourceRights: boot.prov4Fixtures.sourceRights,
      nowIso: new Date().toISOString(),
      verifiedArtifactDigests: boot.prov4Fixtures.verifiedArtifactDigests,
    });
  }, [boot, buildState]);

  const workloads = useMemo(() => {
    if (boot.status !== "ready" || !buildState) return [];
    const rows: Array<{
      workloadId: WorkloadId;
      metric: WorkloadMetric;
      result: WorkloadEstimateResult;
    }> = [];
    for (const workloadId of WORKLOAD_IDS) {
      for (const metric of WORKLOAD_METRICS) {
        rows.push({
          workloadId,
          metric,
          result: estimateWorkload(
            { cpuId: buildState.cpuId as never, workloadId, metric },
            boot.perf1Fixtures.cinebench,
          ),
        });
      }
    }
    return rows;
  }, [boot, buildState]);

  const price = useMemo(() => {
    if (boot.status !== "ready" || !buildState || !verdict?.showResults) {
      return null;
    }
    return buildPriceSummary(buildState, boot.catalogPrices);
  }, [boot, buildState, verdict]);

  const imageSourceMap = useMemo(() => {
    if (boot.status !== "ready") return undefined;
    return new Map(
      boot.imageRegistry.sources.map((source) => [source.sourceId, source]),
    );
  }, [boot]);

  const railContent =
    boot.status === "loading" ? (
      <p className="rail-message" data-testid="rail-loading">
        Getting the parts list ready…
      </p>
    ) : boot.status === "error" ? (
      <p className="rail-message" data-testid="rail-error">
        We could not load the parts list. Reload the page to try again.
      </p>
    ) : !buildState ? (
      <p className="rail-message">Getting the parts list ready…</p>
    ) : (
      PART_SLOTS.map((slot) => (
        <PartPicker
          key={slot.category}
          label={slot.label}
          testId={slot.testId}
          value={selectedPartId(buildState, slot.category)}
          options={boot.catalog.getByCategory(slot.category)}
          onChange={setters[slot.category]}
          imageSources={imageSourceMap}
        />
      ))
    );

  return (
    <div className="app" data-testid="app">
      <header className="app-header" data-testid="app-header">
        <h1 className="app-title">pb3 — PC Builder</h1>
        <BuildActions
          disabled={boot.status !== "ready" || !buildState}
          onReset={() => {
            if (boot.status === "ready") {
              init(DEFAULT_BUILD_STATE, catalogAllowedIds(boot.catalog));
            }
          }}
        />
      </header>

      <div className="app-body">
        <aside className="parts-rail" data-testid="parts-rail">
          <h2 className="rail-heading">Parts</h2>
          {railContent}
        </aside>

        <div className="stage">
          <section className="viewport-area" data-testid="viewport-area">
            {boot.status === "ready" &&
            buildState &&
            assembly &&
            physicalReport ? (
              <BuildViewport
                gpuId={buildState.gpuId}
                catalog={boot.catalog}
                poses={assembly.parts
                  .filter((part) => part.transform)
                  .map((part) => ({
                    partId: part.partId,
                    transform: part.transform!,
                  }))}
                assemblyStatus={physicalReport.overallStatus}
              />
            ) : (
              <div className="viewport-loading" data-testid="viewport-loading">
                {boot.status === "error"
                  ? "The 3D view is unavailable because the parts list did not load."
                  : "Putting your build together…"}
              </div>
            )}
          </section>

          <section className="result-bar" data-testid="result-bar">
            {verdict &&
            boot.status === "ready" &&
            compatibilityReport &&
            physicalReport &&
            coolingResult &&
            disclosureReport ? (
              <ResultBar
                verdict={verdict}
                performance={
                  performance
                    ? {
                        ...performance,
                        settings: (
                          <PerformanceSettings
                            dimensions={perfDimensions}
                            onUpscaleChange={setUpscaleId}
                            onFrameGenChange={setFrameGenId}
                          />
                        ),
                      }
                    : null
                }
                price={price}
                why={
                  <WhyThisResult
                    compatibility={compatibilityReport}
                    physical={physicalReport}
                    cooling={coolingResult}
                    price={price}
                    disclosure={disclosureReport}
                    prov4Fixtures={boot.prov4Fixtures}
                    est1Fixtures={boot.est1Fixtures}
                    workloads={workloads}
                    coolerOrientationId={coolerOrientationId}
                    onCoolerOrientationChange={setCoolerOrientation}
                    onResetMounts={resetMounts}
                    correction={perfCorrection}
                    onCorrectionChange={setCorrection}
                    onResetCorrection={resetCorrection}
                  />
                }
              />
            ) : (
              <p className="rail-message">
                {boot.status === "error"
                  ? "Results are unavailable because the parts list did not load."
                  : "Checking your build…"}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

const WORKLOAD_IDS: WorkloadId[] = ["cinebench.r23", "cinebench.2024"];
const WORKLOAD_METRICS: WorkloadMetric[] = [
  "metric.single-core",
  "metric.multi-core",
];

function partIdsOf(buildState: BuildStateV2): string[] {
  return [
    buildState.caseId,
    buildState.motherboardId,
    buildState.cpuId,
    buildState.gpuId,
    buildState.coolerId,
    buildState.ramId,
    buildState.psuId,
  ];
}

function selectedPartId(
  buildState: BuildStateV2,
  category: PartCategoryV2,
): string {
  switch (category) {
    case "case":
      return buildState.caseId;
    case "motherboard":
      return buildState.motherboardId;
    case "cpu":
      return buildState.cpuId;
    case "gpu":
      return buildState.gpuId;
    case "cooler":
      return buildState.coolerId;
    case "ram":
      return buildState.ramId;
    case "psu":
      return buildState.psuId;
  }
}

import { useEffect, useMemo, useState } from "react";
import { loadCompat2Examples } from "./catalog/loadCompat2Fixtures";
import { loadPartCatalog } from "./catalog/loadPartCatalog";
import {
  loadPerf1Fixtures,
  type Perf1Fixtures,
} from "./catalog/loadPerf1Fixtures";
import { buildCompatibilityReport } from "./compat/buildCompatibilityReport";
import { loadPriceFixtures } from "./price/loadPriceFixtures";
import { buildPriceSummary } from "./price/buildPriceSummary";
import type { PriceFixtureFile } from "./contract/compat2";
import type { CoolingEvidenceFile, PhysicalSpec } from "./contract/phys3";
import { useAssemblyStore } from "./state/assemblyStore";
import { useBuildStore } from "./state/buildStore";
import { usePerfPanelStore } from "./state/perfPanelState";
import {
  buildStateFromSearchParams,
  replaceUrlWithBuildState,
} from "./state/urlSync";
import {
  createBuildStateValidator,
  DEFAULT_BUILD_STATE,
  type PartCatalog,
} from "./state/validateBuildState";
import { buildAssemblyState } from "./physical/buildAssemblyState";
import { buildPhysicalValidationReport } from "./physical/buildPhysicalValidationReport";
import { buildCoolingCorrectionInput } from "./physical/cooling/buildCoolingCorrectionInput";
import { loadCoolingEvidence } from "./physical/cooling/loadCoolingEvidence";
import type { GlbPhysicalIndex } from "./physical/indexGlbPhysicalNodes";
import { loadGlbPhysicalIndexes } from "./physical/loadGlbPhysicalIndexes";
import { buildPilotDisclosureReport } from "./provenance/buildPilotDisclosureReport";
import {
  loadProv4Fixtures,
  type Prov4Fixtures,
} from "./provenance/loadProv4Fixtures";
import { BuildResultSummary } from "./ui/BuildResultSummary";
import { BuildSummary } from "./ui/BuildSummary";
import { buildResultSummaryModel } from "./ui/buildResultSummaryModel";
import { CompatibilityPanel } from "./ui/CompatibilityPanel";
import { computeFpsSummaryChips } from "./ui/computeFpsSummaryChips";
import { CoolingEvidencePanel } from "./ui/CoolingEvidencePanel";
import { EvidenceDisclosurePanel } from "./ui/EvidenceDisclosurePanel";
import { MountControls } from "./ui/MountControls";
import { PartFilterControls } from "./ui/PartFilterControls";
import { PartSelector } from "./ui/PartSelector";
import { DEFAULT_PART_FILTERS, listFilteredParts } from "./ui/partFilters";
import type { PartFilters } from "./ui/partFilters";
import { PerformancePanel } from "./ui/PerformancePanel";
import { PhysicalValidationPanel } from "./ui/PhysicalValidationPanel";
import { PriceSummaryPanel } from "./ui/PriceSummaryPanel";
import { BuildViewport } from "./viewport/BuildViewport";

type BootState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      catalog: PartCatalog;
      perf1Fixtures: Perf1Fixtures;
      priceFixtures: PriceFixtureFile;
      glbIndexes: Map<string, GlbPhysicalIndex>;
      coolingEvidence: CoolingEvidenceFile;
      prov4Fixtures: Prov4Fixtures;
    };

export default function App() {
  const [boot, setBoot] = useState<BootState>({ status: "loading" });
  const [filters, setFilters] = useState<PartFilters>(DEFAULT_PART_FILTERS);
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

  useEffect(() => {
    let cancelled = false;

    async function bootApp() {
      try {
        const [
          catalog,
          perf1Fixtures,
          priceFixtures,
          coolingEvidence,
          prov4Fixtures,
        ] = await Promise.all([
          loadPartCatalog(),
          loadPerf1Fixtures(),
          loadPriceFixtures(),
          loadCoolingEvidence(),
          loadProv4Fixtures(),
        ]);
        await loadCompat2Examples();
        const glbIndexes = await loadGlbPhysicalIndexes(catalog);

        if (cancelled) return;

        const isValid = createBuildStateValidator(catalog);
        const params = new URLSearchParams(window.location.search);
        const decoded = buildStateFromSearchParams(
          params,
          DEFAULT_BUILD_STATE,
          isValid,
        );

        init(decoded);
        usePerfPanelStore.getState().resetCorrection();
        replaceUrlWithBuildState(decoded);
        setBoot({
          status: "ready",
          catalog,
          perf1Fixtures,
          priceFixtures,
          glbIndexes,
          coolingEvidence,
          prov4Fixtures,
        });
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Unknown boot error";
        setBoot({ status: "error", message });
      }
    }

    void bootApp();

    return () => {
      cancelled = true;
    };
  }, [init]);

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

  const compatibilityReport = useMemo(() => {
    if (boot.status !== "ready" || !buildState) return null;
    return buildCompatibilityReport(buildState, boot.catalog);
  }, [boot, buildState]);

  const priceSummary = useMemo(() => {
    if (boot.status !== "ready" || !buildState) return null;
    return buildPriceSummary(buildState, boot.priceFixtures);
  }, [boot, buildState]);

  const assembly = useMemo(() => {
    if (boot.status !== "ready" || !buildState) return null;
    return buildAssemblyState(buildState, boot.catalog, boot.glbIndexes, {
      coolerOrientationId,
    });
  }, [boot, buildState, coolerOrientationId]);

  const physicalReport = useMemo(() => {
    if (boot.status !== "ready" || !assembly || !buildState) return null;
    return buildPhysicalValidationReport({
      assembly,
      partsById: boot.catalog.byId,
      glbIndexes: boot.glbIndexes,
    });
  }, [boot, assembly, buildState]);

  const coolingResult = useMemo(() => {
    if (
      boot.status !== "ready" ||
      !assembly ||
      !physicalReport ||
      !buildState
    ) {
      return null;
    }
    const buildPartIds = [
      buildState.caseId,
      buildState.motherboardId,
      buildState.cpuId,
      buildState.gpuId,
      buildState.coolerId,
      buildState.ramId,
      buildState.psuId,
    ];
    return buildCoolingCorrectionInput({
      buildPartIds,
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
    for (const partId of [
      buildState.caseId,
      buildState.motherboardId,
      buildState.cpuId,
      buildState.gpuId,
      buildState.coolerId,
      buildState.ramId,
      buildState.psuId,
    ]) {
      physicalSpecsByPartId.set(
        partId,
        boot.catalog.byId.get(partId)?.physicalSpec,
      );
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

  const resultSummary = useMemo(() => {
    if (
      boot.status !== "ready" ||
      !buildState ||
      !compatibilityReport ||
      !physicalReport ||
      !priceSummary ||
      !disclosureReport
    ) {
      return null;
    }
    const fpsChips = computeFpsSummaryChips({
      buildState,
      perf1Fixtures: boot.perf1Fixtures,
      dimensions: perfDimensions,
      correction: perfCorrection,
      prov4Fixtures: boot.prov4Fixtures,
    });
    return buildResultSummaryModel({
      compatibility: compatibilityReport,
      physical: physicalReport,
      price: priceSummary,
      fpsChips,
      isPilotBuild: disclosureReport.isPilotBuild,
    });
  }, [
    boot,
    buildState,
    compatibilityReport,
    physicalReport,
    priceSummary,
    disclosureReport,
    perfDimensions,
    perfCorrection,
  ]);

  if (boot.status === "loading") {
    return <main className="app-shell">Loading fixtures…</main>;
  }

  if (boot.status === "error") {
    return (
      <main className="app-shell">
        <h1>pb3 — PC Builder</h1>
        <p style={{ color: "#b91c1c" }}>
          Failed to load fixtures: {boot.message}
        </p>
      </main>
    );
  }

  if (
    !buildState ||
    !compatibilityReport ||
    !priceSummary ||
    !assembly ||
    !physicalReport ||
    !coolingResult ||
    !disclosureReport ||
    !resultSummary
  ) {
    return <main className="app-shell">Initializing build state…</main>;
  }

  const catalog = boot.catalog;
  const poses = assembly.parts
    .filter((p) => p.transform)
    .map((p) => ({ partId: p.partId, transform: p.transform! }));

  const selectorProps = (
    category: "case" | "motherboard" | "cpu" | "gpu" | "cooler" | "ram" | "psu",
    label: string,
    testId: string,
    value: string,
    onChange: (id: string) => void,
  ) => ({
    label,
    testId,
    value,
    options: listFilteredParts(catalog, category, filters).map((part) => ({
      id: part.id,
      displayName: part.displayName,
    })),
    onChange,
  });

  return (
    <main className="app-shell" data-testid="app-shell">
      <header className="app-header">
        <h1>pb3 — PC Builder</h1>
      </header>

      <div className="builder-stage" data-testid="builder-stage">
        <section className="builder-controls" data-testid="builder-controls">
          <details className="panel" data-testid="filters-details">
            <summary style={{ fontWeight: 600, fontSize: "0.95rem" }}>
              Filters
            </summary>
            <PartFilterControls filters={filters} onChange={setFilters} />
          </details>

          <div className="panel">
            <h2 style={{ marginTop: 0, fontSize: "0.95rem" }}>Parts</h2>
            <div className="selector-grid">
              <PartSelector
                {...selectorProps(
                  "case",
                  "Case",
                  "case-select",
                  buildState.caseId,
                  setCase,
                )}
              />
              <PartSelector
                {...selectorProps(
                  "motherboard",
                  "Motherboard",
                  "motherboard-select",
                  buildState.motherboardId,
                  setMotherboard,
                )}
              />
              <PartSelector
                {...selectorProps(
                  "cpu",
                  "CPU",
                  "cpu-select",
                  buildState.cpuId,
                  setCpu,
                )}
              />
              <PartSelector
                {...selectorProps(
                  "gpu",
                  "GPU",
                  "gpu-select",
                  buildState.gpuId,
                  setGpu,
                )}
              />
              <PartSelector
                {...selectorProps(
                  "cooler",
                  "Cooler",
                  "cooler-select",
                  buildState.coolerId,
                  setCooler,
                )}
              />
              <PartSelector
                {...selectorProps(
                  "ram",
                  "RAM",
                  "ram-part-select",
                  buildState.ramId,
                  setRam,
                )}
              />
              <PartSelector
                {...selectorProps(
                  "psu",
                  "PSU",
                  "psu-select",
                  buildState.psuId,
                  setPsu,
                )}
              />
            </div>
          </div>

          <BuildResultSummary model={resultSummary} />

          <div className="details-stack" data-testid="builder-details">
            <details className="panel-details" data-testid="mount-details">
              <summary>Mount controls</summary>
              <MountControls
                coolerOrientationId={coolerOrientationId}
                onCoolerOrientationChange={setCoolerOrientation}
                onReset={resetMounts}
              />
            </details>

            <details
              className="panel-details"
              data-testid="build-parts-details"
            >
              <summary>Build parts list</summary>
              <BuildSummary buildState={buildState} catalog={catalog} />
            </details>

            <details
              className="panel-details domain-details"
              data-testid="compatibility-domain-details"
            >
              <summary>Compatibility details</summary>
              <CompatibilityPanel report={compatibilityReport} />
            </details>
            <details
              className="panel-details domain-details"
              data-testid="evidence-domain-details"
            >
              <summary>Evidence details</summary>
              <EvidenceDisclosurePanel report={disclosureReport} />
            </details>
            <details
              className="panel-details domain-details"
              data-testid="physical-domain-details"
            >
              <summary>Fit details</summary>
              <PhysicalValidationPanel report={physicalReport} />
            </details>
            <details
              className="panel-details domain-details"
              data-testid="cooling-domain-details"
            >
              <summary>Cooling details</summary>
              <CoolingEvidencePanel result={coolingResult} mode="physical" />
            </details>
            <details
              className="panel-details domain-details"
              data-testid="price-domain-details"
            >
              <summary>Price details</summary>
              <PriceSummaryPanel summary={priceSummary} />
            </details>
            <details
              className="panel-details domain-details"
              data-testid="performance-domain-details"
            >
              <summary>Performance details</summary>
              <PerformancePanel
                buildState={buildState}
                perf1Fixtures={boot.perf1Fixtures}
                prov4Fixtures={boot.prov4Fixtures}
              />
            </details>
          </div>
        </section>

        <section
          className="builder-viewport-column"
          data-testid="viewport-section"
        >
          <h2>Assembly</h2>
          <BuildViewport
            gpuId={buildState.gpuId}
            catalog={catalog}
            poses={poses}
            assemblyStatus={physicalReport.overallStatus}
          />
        </section>
      </div>
    </main>
  );
}

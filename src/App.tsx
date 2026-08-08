import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { loadCompat2Examples } from "./catalog/loadCompat2Fixtures";
import { loadPartCatalog } from "./catalog/loadPartCatalog";
import { loadPerf1Fixtures, type Perf1Fixtures } from "./catalog/loadPerf1Fixtures";
import { buildCompatibilityReport } from "./compat/buildCompatibilityReport";
import { loadPriceFixtures } from "./price/loadPriceFixtures";
import { buildPriceSummary } from "./price/buildPriceSummary";
import type { PriceFixtureFile } from "./contract/compat2";
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
import { BuildSummary } from "./ui/BuildSummary";
import { CompatibilityPanel } from "./ui/CompatibilityPanel";
import { PartFilterControls } from "./ui/PartFilterControls";
import { PartSelector } from "./ui/PartSelector";
import { DEFAULT_PART_FILTERS, listFilteredParts } from "./ui/partFilters";
import type { PartFilters } from "./ui/partFilters";
import { PerformancePanel } from "./ui/PerformancePanel";
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

  useEffect(() => {
    let cancelled = false;

    async function bootApp() {
      try {
        const [catalog, perf1Fixtures, priceFixtures] = await Promise.all([
          loadPartCatalog(),
          loadPerf1Fixtures(),
          loadPriceFixtures(),
        ]);
        // Test-only oracle; validate at boot so broken fixtures fail loud in dev.
        await loadCompat2Examples();

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
        setBoot({ status: "ready", catalog, perf1Fixtures, priceFixtures });
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

  if (boot.status === "loading") {
    return <main style={styles.main}>Loading fixtures…</main>;
  }

  if (boot.status === "error") {
    return (
      <main style={styles.main}>
        <h1>pb3 — Phase 2</h1>
        <p style={{ color: "#b91c1c" }}>Failed to load fixtures: {boot.message}</p>
      </main>
    );
  }

  if (!buildState || !compatibilityReport || !priceSummary) {
    return <main style={styles.main}>Initializing build state…</main>;
  }

  const catalog = boot.catalog;
  const selectorProps = (
    category:
      | "case"
      | "motherboard"
      | "cpu"
      | "gpu"
      | "cooler"
      | "ram"
      | "psu",
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
    <main style={styles.main}>
      <h1 style={{ marginTop: 0 }}>pb3 — Phase 2 build</h1>
      <div style={styles.layout}>
        <section style={styles.controls}>
          <PartFilterControls filters={filters} onChange={setFilters} />
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
          <BuildSummary buildState={buildState} catalog={catalog} />
          <CompatibilityPanel report={compatibilityReport} />
          <PriceSummaryPanel summary={priceSummary} />
          <PerformancePanel
            buildState={buildState}
            perf1Fixtures={boot.perf1Fixtures}
          />
        </section>
        <section style={styles.viewport} data-testid="viewport-section">
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>3D viewport</h2>
          <BuildViewport gpuId={buildState.gpuId} catalog={catalog} />
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  main: {
    fontFamily: "system-ui, sans-serif",
    margin: "0 auto",
    maxWidth: "1100px",
    padding: "1.5rem",
  },
  layout: {
    display: "grid",
    gap: "1.5rem",
    gridTemplateColumns: "1fr 1fr",
  },
  controls: {
    minWidth: 0,
  },
  viewport: {
    minWidth: 0,
  },
};

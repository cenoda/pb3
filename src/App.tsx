import { useEffect, useState, type CSSProperties } from "react";
import { loadPartCatalog } from "./catalog/loadPartCatalog";
import { loadPerformanceFixtures } from "./catalog/loadPerformanceFixtures";
import type { PerformanceFixtureFile } from "./contract/vs0";
import { useBuildStore } from "./state/buildStore";
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
import { PartSelector } from "./ui/PartSelector";
import { PerformancePanel } from "./ui/PerformancePanel";
import { BuildViewport } from "./viewport/BuildViewport";

type BootState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      catalog: PartCatalog;
      fixtures: PerformanceFixtureFile;
    };

export default function App() {
  const [boot, setBoot] = useState<BootState>({ status: "loading" });
  const buildState = useBuildStore((store) => store.buildState);
  const initialized = useBuildStore((store) => store.initialized);
  const init = useBuildStore((store) => store.init);
  const setCpu = useBuildStore((store) => store.setCpu);
  const setGpu = useBuildStore((store) => store.setGpu);

  useEffect(() => {
    let cancelled = false;

    async function bootApp() {
      try {
        const [catalog, fixtures] = await Promise.all([
          loadPartCatalog(),
          loadPerformanceFixtures(),
        ]);

        if (cancelled) return;

        const isValid = createBuildStateValidator(catalog);
        const params = new URLSearchParams(window.location.search);
        const decoded = buildStateFromSearchParams(
          params,
          DEFAULT_BUILD_STATE,
          isValid,
        );

        init(decoded);
        replaceUrlWithBuildState(decoded);
        setBoot({ status: "ready", catalog, fixtures });
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

  if (boot.status === "loading") {
    return <main style={styles.main}>Loading fixtures…</main>;
  }

  if (boot.status === "error") {
    return (
      <main style={styles.main}>
        <h1>pb3 — Phase 0</h1>
        <p style={{ color: "#b91c1c" }}>Failed to load fixtures: {boot.message}</p>
      </main>
    );
  }

  if (!buildState) {
    return <main style={styles.main}>Initializing build state…</main>;
  }

  const cpus = boot.catalog.getByCategory("cpu");
  const gpus = boot.catalog.getByCategory("gpu");

  return (
    <main style={styles.main}>
      <h1 style={{ marginTop: 0 }}>pb3 — Phase 0 build</h1>
      <div style={styles.layout}>
        <section style={styles.controls}>
          <PartSelector
            label="CPU"
            testId="cpu-select"
            value={buildState.cpuId}
            options={cpus.map((cpu) => ({
              id: cpu.id,
              displayName: cpu.displayName,
            }))}
            onChange={setCpu}
          />
          <PartSelector
            label="GPU"
            testId="gpu-select"
            value={buildState.gpuId}
            options={gpus.map((gpu) => ({
              id: gpu.id,
              displayName: gpu.displayName,
            }))}
            onChange={setGpu}
          />
          <BuildSummary buildState={buildState} catalog={boot.catalog} />
          <PerformancePanel buildState={buildState} fixtures={boot.fixtures} />
        </section>
        <section style={styles.viewport} data-testid="viewport-section">
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>3D viewport</h2>
          <BuildViewport gpuId={buildState.gpuId} catalog={boot.catalog} />
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  main: {
    fontFamily: "system-ui, sans-serif",
    margin: "0 auto",
    maxWidth: "960px",
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

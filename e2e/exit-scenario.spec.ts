import { expect, test, type Page } from "@playwright/test";

/** Default BuildState ids from vs0 contract §3. */
const DEFAULT_CPU = "cpu.zen4-7600";
const DEFAULT_GPU = "gpu.rtx4070";
const OTHER_CPU = "cpu.zen4-7800x3d";
const OTHER_GPU = "gpu.rtx4080";

/** Stub ranges from benchmarks/vs0/performance-fixtures.json (ordinal stubs only). */
const RANGES = {
  /** cpu.zen4-7600 + gpu.rtx4070 @ 1440p */
  default1440: "52–64 FPS",
  /** cpu.zen4-7800x3d + gpu.rtx4070 @ 1440p */
  otherCpu1440: "58–70 FPS",
  /** cpu.zen4-7600 + gpu.rtx4080 @ 1440p */
  otherGpu1440: "90–108 FPS",
  /** cpu.zen4-7800x3d + gpu.rtx4080 @ 1440p */
  both1440: "115–138 FPS",
} as const;

function fullQuery(cpu: string, gpu: string): string {
  const p = new URLSearchParams({
    v: "vs0",
    cpu,
    gpu,
    case: "case.mid-tower-atx-01",
    mb: "mb.atx-b650-01",
    cooler: "cooler.air-twin-tower-01",
    game: "game.cyberpunk-2077",
    preset: "preset.raster-ultra",
  });
  return `?${p.toString()}`;
}

async function waitForReady(page: Page) {
  await expect(page.getByTestId("cpu-select")).toBeVisible();
  await expect(page.getByTestId("gpu-select")).toBeVisible();
  await expect(page.getByTestId("performance-panel")).toBeVisible();
  await expect(page.getByTestId("build-viewport")).toBeVisible();
}

test.describe("Phase 0 exit scenario (plan Step 8)", () => {
  test("1–5: clean load, CPU change, GPU swap, reload restore, post-reload selection", async ({
    page,
  }) => {
    // --- 1. Clean URL → default BuildState + 3 resolution ranges ---
    await page.goto("/");
    await waitForReady(page);

    await expect(page.getByTestId("cpu-select")).toHaveValue(DEFAULT_CPU);
    await expect(page.getByTestId("gpu-select")).toHaveValue(DEFAULT_GPU);
    await expect(page).toHaveURL(fullQuery(DEFAULT_CPU, DEFAULT_GPU));

    for (const res of ["1080p", "1440p", "4k"] as const) {
      const row = page.getByTestId(`perf-row-${res}`);
      await expect(row).toHaveAttribute("data-status", "ok");
      await expect(page.getByTestId(`perf-range-${res}`)).toBeVisible();
      // unavailable branch must not render FPS placeholders
      await expect(page.getByTestId(`perf-unavailable-${res}`)).toHaveCount(0);
    }
    await expect(page.getByTestId("perf-range-1440p")).toHaveText(RANGES.default1440);
    await expect(page.getByTestId("build-viewport")).toHaveAttribute(
      "data-gpu-id",
      DEFAULT_GPU,
    );
    await expect(page.getByTestId("build-summary")).toBeVisible();

    // --- 2. Other CPU → ranges update, GPU mesh id unchanged ---
    await page.getByTestId("cpu-select").selectOption(OTHER_CPU);
    await expect(page.getByTestId("cpu-select")).toHaveValue(OTHER_CPU);
    await expect(page).toHaveURL(fullQuery(OTHER_CPU, DEFAULT_GPU));
    await expect(page.getByTestId("perf-range-1440p")).toHaveText(
      RANGES.otherCpu1440,
    );
    await expect(page.getByTestId("build-viewport")).toHaveAttribute(
      "data-gpu-id",
      DEFAULT_GPU,
    );

    // --- 3. Other GPU → viewport gpu id + glb path swap, ranges update ---
    // Note: both GPU GLBs may already be useGLTF.preload'd — do not require a network fetch.
    await page.getByTestId("gpu-select").selectOption(OTHER_GPU);
    await expect(page.getByTestId("gpu-select")).toHaveValue(OTHER_GPU);
    await expect(page).toHaveURL(fullQuery(OTHER_CPU, OTHER_GPU));
    await expect(page.getByTestId("build-viewport")).toHaveAttribute(
      "data-gpu-id",
      OTHER_GPU,
    );
    await expect(page.getByTestId("build-viewport")).toHaveAttribute(
      "data-glb-path",
      "parts/gpu/gpu.rtx4080/model.glb",
    );
    await expect(page.getByTestId("perf-range-1440p")).toHaveText(RANGES.both1440);

    // --- 4. Reload → same CPU + GPU + ranges from URL alone ---
    await page.reload();
    await waitForReady(page);
    await expect(page.getByTestId("cpu-select")).toHaveValue(OTHER_CPU);
    await expect(page.getByTestId("gpu-select")).toHaveValue(OTHER_GPU);
    await expect(page).toHaveURL(fullQuery(OTHER_CPU, OTHER_GPU));
    await expect(page.getByTestId("perf-range-1440p")).toHaveText(RANGES.both1440);
    await expect(page.getByTestId("build-viewport")).toHaveAttribute(
      "data-gpu-id",
      OTHER_GPU,
    );

    // --- 5. Change again post-reload ---
    await page.getByTestId("cpu-select").selectOption(DEFAULT_CPU);
    await expect(page).toHaveURL(fullQuery(DEFAULT_CPU, OTHER_GPU));
    await expect(page.getByTestId("perf-range-1440p")).toHaveText(
      RANGES.otherGpu1440,
    );
    await page.getByTestId("gpu-select").selectOption(DEFAULT_GPU);
    await expect(page).toHaveURL(fullQuery(DEFAULT_CPU, DEFAULT_GPU));
    await expect(page.getByTestId("perf-range-1440p")).toHaveText(
      RANGES.default1440,
    );
    await expect(page.getByTestId("build-viewport")).toHaveAttribute(
      "data-gpu-id",
      DEFAULT_GPU,
    );
  });

  test("partial URL rewrites to full canonical query on load", async ({
    page,
  }) => {
    await page.goto(`/?cpu=${OTHER_CPU}&gpu=${OTHER_GPU}`);
    await waitForReady(page);

    await expect(page.getByTestId("cpu-select")).toHaveValue(OTHER_CPU);
    await expect(page.getByTestId("gpu-select")).toHaveValue(OTHER_GPU);
    await expect(page).toHaveURL(fullQuery(OTHER_CPU, OTHER_GPU));
    await expect(page.getByTestId("perf-range-1440p")).toHaveText(RANGES.both1440);
  });

  test("invalid CPU id falls back to default BuildState", async ({ page }) => {
    await page.goto("/?v=vs0&cpu=cpu.not-real&gpu=gpu.rtx4080");
    await waitForReady(page);

    await expect(page.getByTestId("cpu-select")).toHaveValue(DEFAULT_CPU);
    await expect(page.getByTestId("gpu-select")).toHaveValue(DEFAULT_GPU);
    await expect(page).toHaveURL(fullQuery(DEFAULT_CPU, DEFAULT_GPU));
  });
});

test.describe("Fixture HTTP (build output)", () => {
  test("serves part.json and performance fixtures from dist paths", async ({
    request,
  }) => {
    const part = await request.get("/parts/gpu/gpu.rtx4070/part.json");
    expect(part.ok()).toBeTruthy();
    const partJson = await part.json();
    expect(partJson.id).toBe("gpu.rtx4070");
    expect(partJson.contractVersion).toBe("vs0");

    const perf = await request.get(
      "/benchmarks/vs0/performance-fixtures.json",
    );
    expect(perf.ok()).toBeTruthy();
    const perfJson = await perf.json();
    expect(perfJson.rows).toHaveLength(12);
  });
});

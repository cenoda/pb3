import { expect, test, type Page } from "@playwright/test";

const DEFAULT_CPU = "cpu.zen4-7600";
const DEFAULT_GPU = "gpu.rtx4070";
const DEFAULT_RAM = "ram.ddr5-32gb-6000";
const DEFAULT_PSU = "psu.750w-atx";
const OTHER_CPU = "cpu.zen4-7800x3d";
const OTHER_GPU = "gpu.rtx4080";

const RANGES = {
  default1440: "52–64 FPS",
  otherCpu1440: "58–70 FPS",
  otherGpu1440: "90–108 FPS",
  both1440: "115–138 FPS",
} as const;

function fullQuery(cpu: string, gpu: string): string {
  const p = new URLSearchParams({
    v: "vs2",
    cpu,
    gpu,
    case: "case.mid-tower-atx-01",
    mb: "mb.atx-b650-01",
    cooler: "cooler.air-twin-tower-01",
    ram: DEFAULT_RAM,
    psu: DEFAULT_PSU,
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
    await page.goto("/");
    await waitForReady(page);

    await expect(page.getByTestId("cpu-select")).toHaveValue(DEFAULT_CPU);
    await expect(page.getByTestId("gpu-select")).toHaveValue(DEFAULT_GPU);
    await expect(page).toHaveURL(fullQuery(DEFAULT_CPU, DEFAULT_GPU));

    for (const res of ["1080p", "1440p", "4k"] as const) {
      const row = page.getByTestId(`perf-row-${res}`);
      await expect(row).toHaveAttribute("data-status", "ok");
      await expect(page.getByTestId(`perf-range-${res}`)).toBeVisible();
      await expect(page.getByTestId(`perf-unavailable-${res}`)).toHaveCount(0);
    }
    await expect(page.getByTestId("perf-range-1440p")).toHaveText(RANGES.default1440);
    await expect(page.getByTestId("build-viewport")).toHaveAttribute(
      "data-gpu-id",
      DEFAULT_GPU,
    );
    await expect(page.getByTestId("build-summary")).toBeVisible();

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

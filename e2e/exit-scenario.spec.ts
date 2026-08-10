import { expect, test, type Page } from "@playwright/test";

const DEFAULT_CPU = "cpu.amd-ryzen-5-7600";
const DEFAULT_GPU = "gpu.asus-dual-rtx4070-o12g";
const DEFAULT_RAM = "ram.teamgroup-t-create-expert-ddr5-6000-32gb";
const DEFAULT_PSU = "psu.corsair-rm750e";
const OTHER_CPU = "cpu.amd-ryzen-7-7800x3d";
const OTHER_GPU = "gpu.asus-proart-rtx4080-o16g";

const RANGES = {
  default1440: "52–64",
  otherCpu1440: "58–70",
  otherGpu1440: "90–108",
  both1440: "115–138",
} as const;

/** Phase 5: the FPS numbers are on the product surface, not in a panel. */
function fps(page: Page, resolution: string) {
  return page.getByTestId(`fps-${resolution}`);
}

function fullQuery(cpu: string, gpu: string): string {
  const p = new URLSearchParams({
    v: "vs2",
    cpu,
    gpu,
    case: "case.fractal-design-north-tg-dark",
    mb: "motherboard.gigabyte-b650-aorus-elite-ax-v2",
    cooler: "cooler.noctua-nh-d15-g2",
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
  await expect(page.getByTestId("result-performance")).toBeVisible();
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
      const row = fps(page, res);
      await expect(row).toHaveAttribute("data-status", "ok");
      await expect(row).toContainText("fps");
    }
    await expect(fps(page, "1440p")).toContainText(RANGES.default1440);
    await expect(page.getByTestId("build-viewport")).toHaveAttribute(
      "data-gpu-id",
      DEFAULT_GPU,
    );
    // The dropped "Build parts list" panel is replaced by the parts rail: the
    // chosen parts are readable without opening anything.
    await expect(page.getByTestId("parts-rail")).toBeVisible();
    await expect(page.getByTestId("ram-part-select")).toHaveValue(DEFAULT_RAM);
    await expect(page.getByTestId("psu-select")).toHaveValue(DEFAULT_PSU);

    await page.getByTestId("cpu-select").selectOption(OTHER_CPU);
    await expect(page.getByTestId("cpu-select")).toHaveValue(OTHER_CPU);
    await expect(page).toHaveURL(fullQuery(OTHER_CPU, DEFAULT_GPU));
    await expect(fps(page, "1440p")).toContainText(RANGES.otherCpu1440);
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
      "parts/gpu/gpu.asus-proart-rtx4080-o16g/model.glb",
    );
    await expect(fps(page, "1440p")).toContainText(RANGES.both1440);

    await page.reload();
    await waitForReady(page);
    await expect(page.getByTestId("cpu-select")).toHaveValue(OTHER_CPU);
    await expect(page.getByTestId("gpu-select")).toHaveValue(OTHER_GPU);
    await expect(page).toHaveURL(fullQuery(OTHER_CPU, OTHER_GPU));
    await expect(fps(page, "1440p")).toContainText(RANGES.both1440);
    await expect(page.getByTestId("build-viewport")).toHaveAttribute(
      "data-gpu-id",
      OTHER_GPU,
    );

    await page.getByTestId("cpu-select").selectOption(DEFAULT_CPU);
    await expect(page).toHaveURL(fullQuery(DEFAULT_CPU, OTHER_GPU));
    await expect(fps(page, "1440p")).toContainText(RANGES.otherGpu1440);
    await page.getByTestId("gpu-select").selectOption(DEFAULT_GPU);
    await expect(page).toHaveURL(fullQuery(DEFAULT_CPU, DEFAULT_GPU));
    await expect(fps(page, "1440p")).toContainText(RANGES.default1440);
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
    await expect(fps(page, "1440p")).toContainText(RANGES.both1440);
  });

  test("invalid CPU id falls back to default BuildState", async ({ page }) => {
    await page.goto("/?v=vs0&cpu=cpu.not-real&gpu=gpu.asus-proart-rtx4080-o16g");
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
    const part = await request.get("/parts/gpu/gpu.asus-dual-rtx4070-o12g/part.json");
    expect(part.ok()).toBeTruthy();
    const partJson = await part.json();
    expect(partJson.id).toBe("gpu.asus-dual-rtx4070-o12g");
    expect(partJson.contractVersion).toBe("cat6");

    const perf = await request.get(
      "/benchmarks/vs0/performance-fixtures.json",
    );
    expect(perf.ok()).toBeTruthy();
    const perfJson = await perf.json();
    expect(perfJson.rows).toHaveLength(12);
  });
});

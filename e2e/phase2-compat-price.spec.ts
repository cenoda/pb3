import { expect, test, type Page } from "@playwright/test";

const DEFAULT_RAM = "ram.ddr5-32gb-6000";
const DEFAULT_PSU = "psu.750w-atx";

function fullVs2Query(overrides: Record<string, string> = {}): string {
  const p = new URLSearchParams({
    v: "vs2",
    cpu: "cpu.zen4-7600",
    gpu: "gpu.rtx4070",
    case: "case.mid-tower-atx-01",
    mb: "mb.atx-b650-01",
    cooler: "cooler.air-twin-tower-01",
    ram: DEFAULT_RAM,
    psu: DEFAULT_PSU,
    game: "game.cyberpunk-2077",
    preset: "preset.raster-ultra",
    ...overrides,
  });
  return `?${p.toString()}`;
}

async function waitForPhase2Ready(page: Page) {
  await expect(page.getByTestId("case-select")).toBeVisible();
  await expect(page.getByTestId("motherboard-select")).toBeVisible();
  await expect(page.getByTestId("ram-part-select")).toBeVisible();
  await expect(page.getByTestId("psu-select")).toBeVisible();
  await expect(page.getByTestId("result-verdict")).toBeVisible();
  // Phase 5: every diagnostic lives behind the one disclosure.
  await openWhy(page);
  await expect(page.getByTestId("compatibility-panel")).toBeVisible();
}

async function openWhy(page: Page) {
  const why = page.getByTestId("why-this-result");
  // An open <details> reports open="" — check for null, not falsiness.
  if ((await why.getAttribute("open")) === null) {
    await why.locator(":scope > summary").click();
  }
}

test.describe("Phase 2 completion scenario", () => {
  test("catalog pickers, compatibility, price, share URL, vs0 legacy decode", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForPhase2Ready(page);

    await expect(page.getByTestId("compatibility-panel")).toHaveAttribute(
      "data-overall-status",
      "compatible",
    );
    await expect(page.getByTestId("price-partial-label")).toHaveCount(0);
    await expect(page.getByTestId("price-subtotal")).toContainText("USD");
    // The user-facing total is on the surface, not only in the disclosure.
    await expect(page.getByTestId("result-price")).toContainText("$");

    await page.getByTestId("motherboard-select").selectOption("mb.micro-b450-01");
    await openWhy(page);
    await expect(page.getByTestId("compat-check-cpu-socket")).toHaveAttribute(
      "data-status",
      "incompatible",
    );
    await expect(
      page.getByTestId("compat-explanation-cpu-socket"),
    ).not.toBeEmpty();
    // Phase 5 R1/R2: the rejection is stated on the surface and no result is
    // presented for a build that cannot work.
    await expect(page.getByTestId("result-reason")).not.toBeEmpty();
    await expect(page.getByTestId("result-performance")).toHaveCount(0);
    await expect(page.getByTestId("result-price")).toHaveCount(0);

    await page.getByTestId("motherboard-select").selectOption("mb.atx-b650-01");
    await page.getByTestId("cpu-select").selectOption("cpu.zen4-7800x3d");
    await openWhy(page);
    await expect(page.getByTestId("compat-check-chipset-bios")).toHaveAttribute(
      "data-status",
      "unavailable",
    );

    await page.getByTestId("cpu-select").selectOption("cpu.zen4-7600");
    await page.getByTestId("ram-part-select").selectOption("ram.ddr5-16gb-7200");
    await openWhy(page);
    await expect(page.getByTestId("compat-check-ram-support")).toHaveAttribute(
      "data-status",
      "incompatible",
    );

    const urlBeforeReload = page.url();
    await page.reload();
    await waitForPhase2Ready(page);
    expect(page.url()).toBe(urlBeforeReload);
    await expect(page.getByTestId("ram-part-select")).toHaveValue(
      "ram.ddr5-16gb-7200",
    );

    await page.goto(
      "/?v=vs0&cpu=cpu.zen4-7600&gpu=gpu.rtx4070&case=case.mid-tower-atx-01&mb=mb.atx-b650-01&cooler=cooler.air-twin-tower-01&game=game.cyberpunk-2077&preset=preset.raster-ultra",
    );
    await waitForPhase2Ready(page);
    await expect(page.getByTestId("ram-part-select")).toHaveValue(DEFAULT_RAM);
    await expect(page.getByTestId("psu-select")).toHaveValue(DEFAULT_PSU);
    await expect(page).toHaveURL(fullVs2Query());
  });
});

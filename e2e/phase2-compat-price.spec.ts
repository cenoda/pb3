import { expect, test, type Page } from "@playwright/test";

const DEFAULT_RAM = "ram.teamgroup-t-create-expert-ddr5-6000-32gb";
const DEFAULT_PSU = "psu.corsair-rm750e";

function fullVs2Query(overrides: Record<string, string> = {}): string {
  const p = new URLSearchParams({
    v: "vs2",
    cpu: "cpu.amd-ryzen-5-7600",
    gpu: "gpu.asus-dual-rtx4070-o12g",
    case: "case.fractal-design-north-tg-dark",
    mb: "motherboard.gigabyte-b650-aorus-elite-ax-v2",
    cooler: "cooler.noctua-nh-d15-g2",
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

    // B4: raw BIOS coverage stays unavailable under O6, but does not demote
    // an otherwise clean default build's overall status or surface verdict.
    await expect(page.getByTestId("compatibility-panel")).toHaveAttribute(
      "data-overall-status",
      "compatible",
    );
    await expect(page.getByTestId("compat-check-chipset-bios")).toHaveAttribute(
      "data-status",
      "unavailable",
    );
    await expect(page.getByTestId("result")).toHaveAttribute(
      "data-level",
      "ok",
    );
    await expect(page.getByTestId("result-verdict")).toContainText(
      "These parts work together.",
    );
    await expect(page.getByTestId("result-verdict")).not.toContainText(
      "with one thing we could not check",
    );
    // Step 10: real cat6 catalog prices. The default build's CPU and GPU have
    // no sourced price row yet and its PSU has MSRP only (no KR street
    // snapshot), so the total is honestly partial, not the old all-priced
    // USD fixture total.
    await expect(page.getByTestId("price-partial-label")).toHaveCount(1);
    await expect(page.getByTestId("price-subtotal")).toContainText("KRW");
    // The user-facing total is on the surface, not only in the disclosure.
    await expect(page.getByTestId("result-price")).toContainText("₩");

    await page
      .getByTestId("motherboard-select")
      .selectOption("motherboard.asus-tuf-gaming-b860m-plus-wifi");
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

    await page
      .getByTestId("motherboard-select")
      .selectOption("motherboard.gigabyte-b650-aorus-elite-ax-v2");
    await page
      .getByTestId("cpu-select")
      .selectOption("cpu.amd-ryzen-7-7800x3d");
    await openWhy(page);
    await expect(page.getByTestId("compat-check-chipset-bios")).toHaveAttribute(
      "data-status",
      "unavailable",
    );

    await page.getByTestId("cpu-select").selectOption("cpu.amd-ryzen-5-7600");
    await page
      .getByTestId("ram-part-select")
      .selectOption("ram.gskill-trident-z5-rgb-ddr5-8400");
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
      "ram.gskill-trident-z5-rgb-ddr5-8400",
    );

    await page.goto(
      "/?v=vs0&cpu=cpu.amd-ryzen-5-7600&gpu=gpu.asus-dual-rtx4070-o12g&case=case.fractal-design-north-tg-dark&mb=motherboard.gigabyte-b650-aorus-elite-ax-v2&cooler=cooler.noctua-nh-d15-g2&game=game.cyberpunk-2077&preset=preset.raster-ultra",
    );
    await waitForPhase2Ready(page);
    await expect(page.getByTestId("ram-part-select")).toHaveValue(DEFAULT_RAM);
    await expect(page.getByTestId("psu-select")).toHaveValue(DEFAULT_PSU);
    await expect(page).toHaveURL(fullVs2Query());
  });
});

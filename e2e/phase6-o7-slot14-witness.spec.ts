import { expect, test, type Page } from "@playwright/test";

/** O7 reachability witness — compat-clean A3 + slot 14 + NH-D15 G2 interference. */
const O7_WITNESS = {
  v: "vs2",
  cpu: "cpu.amd-ryzen-5-7600",
  gpu: "gpu.asus-dual-rtx4070-o12g",
  case: "case.lian-li-a3-matx-black",
  mb: "motherboard.gigabyte-b650m-aorus-elite-ax-rev-1-3",
  cooler: "cooler.noctua-nh-d15-g2",
  ram: "ram.teamgroup-t-create-expert-ddr5-6000-32gb",
  psu: "psu.corsair-rm750e",
  game: "game.cyberpunk-2077",
  preset: "preset.raster-ultra",
} as const;

function o7Query(): string {
  return `?${new URLSearchParams(O7_WITNESS).toString()}`;
}

async function openWhy(page: Page) {
  const why = page.getByTestId("why-this-result");
  if ((await why.getAttribute("open")) === null) {
    await why.locator(":scope > summary").click();
  }
}

test.describe("Phase 6 O7 — slot 14 running-app reachability", () => {
  test("slot 14 motherboard enables genuine A3/NH-D15 G2 physical interference", async ({
    page,
  }) => {
    await page.goto(o7Query());
    await expect(page.getByTestId("motherboard-select")).toHaveValue(
      O7_WITNESS.mb,
    );

    await openWhy(page);
    await expect(page.getByTestId("physical-validation-panel")).toBeVisible();

    await expect(page.getByTestId("physical-validation-panel")).toHaveAttribute(
      "data-overall-status",
      "interference",
    );
    await expect(
      page.getByTestId("physical-check-clearance-limit:cpu-cooler-height"),
    ).toHaveAttribute("data-status", "interference");

    // BIOS check remains raw unavailable under O6 but is non-blocking (B4);
    // logical overall is compatible and must not hide physical interference.
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
      "blocked",
    );
    await expect(page.getByTestId("result-verdict")).toContainText(
      "do not physically fit",
    );
    await expect(page.getByTestId("result-performance")).toHaveCount(0);
    await expect(page.getByTestId("result-price")).toHaveCount(0);
  });
});

import { expect, test, type Page } from "@playwright/test";

function fullVs2Query(overrides: Record<string, string> = {}): string {
  const p = new URLSearchParams({
    v: "vs2",
    cpu: "cpu.zen4-7600",
    gpu: "gpu.rtx4070",
    case: "case.mid-tower-atx-01",
    mb: "mb.atx-b650-01",
    cooler: "cooler.air-twin-tower-01",
    ram: "ram.ddr5-32gb-6000",
    psu: "psu.750w-atx",
    game: "game.cyberpunk-2077",
    preset: "preset.raster-ultra",
    ...overrides,
  });
  return `?${p.toString()}`;
}

async function waitForPhase41Ready(page: Page) {
  await expect(page.getByTestId("case-select")).toBeVisible();
  for (const testId of [
    "evidence-domain-details",
    "performance-domain-details",
  ]) {
    const details = page.getByTestId(testId);
    if (!(await details.getAttribute("open"))) {
      await details.locator(":scope > summary").click();
    }
  }
  await expect(page.getByTestId("evidence-disclosure-panel")).toBeVisible();
  await expect(page.getByTestId("performance-panel")).toBeVisible();
}

test.describe("Phase 4.1 combination estimator (est1)", () => {
  test("pilot shows est1 unavailable path + draft caveat + synthetic residual", async ({
    page,
  }) => {
    await page.goto(fullVs2Query());
    await waitForPhase41Ready(page);

    await expect(page.getByTestId("est1-draft-caveat")).toBeVisible();
    await expect(page.getByTestId("est1-draft-caveat")).toContainText(
      "Temporary draft estimate",
    );
    await expect(page.getByTestId("est1-draft-caveat")).toHaveAttribute(
      "data-draft-caveat",
      /Motherboard/,
    );

    for (const res of ["1080p", "1440p", "4k"] as const) {
      await expect(page.getByTestId(`perf-row-${res}`)).toHaveAttribute(
        "data-evidence-class",
        "est1-unavailable",
      );
      await expect(page.getByTestId(`perf-evidence-class-${res}`)).toContainText(
        "unavailable (est1)",
      );
      await expect(page.getByTestId(`perf-est1-unavailable-${res}`)).toBeVisible();
      await expect(page.getByTestId(`perf-est1-caveat-${res}`)).toContainText(
        "not modeled",
      );
      await expect(page.getByTestId(`perf-synthetic-label-${res}`)).toContainText(
        "not an est1 estimate",
      );
    }

    // Outer residual still shows perf1 stub range for 1080p
    await expect(page.getByTestId("perf-range-1080p")).toHaveText("80–95 FPS");

    const evidenceDetails = page.getByTestId("evidence-details");
    if (!(await evidenceDetails.getAttribute("open"))) {
      await evidenceDetails.locator(":scope > summary").click();
    }

    await expect(page.getByTestId("evidence-est1-caveat")).toBeVisible();
    for (const res of ["1080p", "1440p", "4k"] as const) {
      await expect(page.getByTestId(`evidence-est1-${res}`)).toHaveAttribute(
        "data-status",
        "unavailable",
      );
    }
  });

  test("non-pilot build does not activate est1 overlay", async ({ page }) => {
    await page.goto(fullVs2Query({ gpu: "gpu.rtx4080" }));
    await waitForPhase41Ready(page);

    await expect(page.getByTestId("est1-draft-caveat")).toHaveCount(0);
    await expect(page.getByTestId("perf-row-1080p")).toHaveAttribute(
      "data-sidecar",
      "off",
    );
  });
});

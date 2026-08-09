import { expect, test } from "@playwright/test";

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

async function waitForPhase3Ready(page: import("@playwright/test").Page) {
  await expect(page.getByTestId("case-select")).toBeVisible();
  for (const testId of [
    "compatibility-domain-details",
    "physical-domain-details",
    "cooling-domain-details",
    "performance-domain-details",
  ]) {
    const details = page.getByTestId(testId);
    if (!(await details.getAttribute("open"))) {
      await details.locator(":scope > summary").click();
    }
  }
  await expect(page.getByTestId("physical-validation-panel")).toBeVisible();
  await expect(page.getByTestId("cooling-evidence-panel")).toBeVisible();
  await expect(page.getByTestId("compatibility-panel")).toBeVisible();
  await expect(page.getByTestId("performance-panel")).toBeVisible();
  const mountDetails = page.getByTestId("mount-details");
  if (!(await mountDetails.getAttribute("open"))) {
    await mountDetails.locator("summary").click();
  }
  await expect(page.getByTestId("mount-controls")).toBeVisible();
}

test.describe("Phase 3 physical validation scenario", () => {
  test("supported assembly, mounts, cooler orientation, interference, visual-only, cooling", async ({
    page,
  }) => {
    await page.goto(fullVs2Query());
    await waitForPhase3Ready(page);

    // Supported default assembly → physical fit
    await expect(page.getByTestId("physical-validation-panel")).toHaveAttribute(
      "data-overall-status",
      "fit",
    );
    await expect(page.getByTestId("physical-validation-panel")).toHaveAttribute(
      "data-geometry-version",
      "phys3-exp-20260808",
    );

    // Deterministic mounted transforms exposed on viewport
    const poses = await page
      .getByTestId("build-viewport")
      .getAttribute("data-assembly-poses");
    expect(poses).toBeTruthy();
    expect(poses!).toContain("mb.atx-b650-01@0.000,20.000,-40.000");
    expect(poses!).toContain("cooler.air-twin-tower-01@");

    // Logical compatibility remains a sibling result
    await expect(page.getByTestId("compatibility-panel")).toHaveAttribute(
      "data-overall-status",
      "compatible",
    );

    // Cooler orientation change → interference
    await page
      .getByTestId("cooler-orientation-select")
      .selectOption("rotated-180");
    await expect(page.getByTestId("physical-validation-panel")).toHaveAttribute(
      "data-overall-status",
      "interference",
    );
    const physicalDetails = page.getByTestId("physical-details");
    if (!(await physicalDetails.getAttribute("open"))) {
      await physicalDetails.locator("summary").click();
    }
    await expect(
      page.locator('[data-testid^="physical-check-clearance:"][data-status="interference"]').first(),
    ).toBeVisible();

    // Reset orientation
    await page.getByTestId("mount-reset").click();
    await expect(page.getByTestId("cooler-orientation-select")).toHaveValue(
      "normal",
    );
    await expect(page.getByTestId("physical-validation-panel")).toHaveAttribute(
      "data-overall-status",
      "fit",
    );

    // Visual-only fallback → physical unavailable (not box-as-truth fit)
    await page.getByTestId("ram-part-select").selectOption("ram.ddr5-16gb-7200");
    await expect(page.getByTestId("physical-validation-panel")).toHaveAttribute(
      "data-overall-status",
      "unavailable",
    );

    // Runtime cooling unavailable; performance panel still present
    await expect(page.getByTestId("cooling-evidence-panel")).toHaveAttribute(
      "data-status",
      "unavailable",
    );
    await expect(page.getByTestId("cooling-reason")).toContainText(
      /missing_exact_evidence|physical_validation_incomplete/,
    );
    await expect(page.getByTestId("performance-panel")).toBeVisible();
    await expect(page.getByTestId("perf-range-1080p")).toBeVisible();

    // Restore supported RAM and confirm fit + cooling unavailable (empty evidence)
    await page.getByTestId("ram-part-select").selectOption("ram.ddr5-32gb-6000");
    await expect(page.getByTestId("physical-validation-panel")).toHaveAttribute(
      "data-overall-status",
      "fit",
    );
    await expect(page.getByTestId("cooling-evidence-panel")).toHaveAttribute(
      "data-status",
      "unavailable",
    );
    await expect(page.getByTestId("cooling-reason")).toHaveText(
      "missing_exact_evidence",
    );
  });
});

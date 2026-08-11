import { expect, test, type Page } from "@playwright/test";

function fullVs2Query(overrides: Record<string, string> = {}): string {
  const p = new URLSearchParams({
    v: "vs2",
    cpu: "cpu.amd-ryzen-5-7600",
    gpu: "gpu.asus-dual-rtx4070-o12g",
    case: "case.fractal-design-north-tg-dark",
    mb: "motherboard.gigabyte-b650-aorus-elite-ax-v2",
    cooler: "cooler.noctua-nh-d15-g2",
    ram: "ram.teamgroup-t-create-expert-ddr5-6000-32gb",
    psu: "psu.corsair-rm750e",
    game: "game.cyberpunk-2077",
    preset: "preset.raster-ultra",
    ...overrides,
  });
  return `?${p.toString()}`;
}

async function openWhy(page: Page) {
  const why = page.getByTestId("why-this-result");
  // An open <details> reports open="" — check for null, not falsiness.
  if ((await why.getAttribute("open")) === null) {
    await why.locator(":scope > summary").click();
  }
}

async function waitForPhase3Ready(page: Page) {
  await expect(page.getByTestId("case-select")).toBeVisible();
  await openWhy(page);
  await expect(page.getByTestId("physical-validation-panel")).toBeVisible();
  await expect(page.getByTestId("cooling-evidence-panel")).toBeVisible();
  await expect(page.getByTestId("compatibility-panel")).toBeVisible();
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
    expect(poses!).toContain(
      "motherboard.gigabyte-b650-aorus-elite-ax-v2@0.000,20.000,-40.000",
    );
    expect(poses!).toContain("cooler.noctua-nh-d15-g2@");

    // Logical compatibility: chipset-bios remains unavailable under O6 (raw
    // evidence), but B4 keeps overall compatible; physical fit is separate.
    await expect(page.getByTestId("compatibility-panel")).toHaveAttribute(
      "data-overall-status",
      "compatible",
    );
    await expect(page.getByTestId("compat-check-chipset-bios")).toHaveAttribute(
      "data-status",
      "unavailable",
    );

    // Baseline numbers on the surface, recorded so a later regression is visible
    const baseline1080p =
      (await page.getByTestId("fps-1080p").textContent()) ?? "";
    expect(baseline1080p).toContain("fps");

    // Cooler orientation change → advisory clearance interference (authoritative stays fit)
    await page
      .getByTestId("cooler-orientation-select")
      .selectOption("rotated-180");
    await openWhy(page);
    await expect(page.getByTestId("physical-validation-panel")).toHaveAttribute(
      "data-overall-status",
      "fit",
    );
    await expect(
      page
        .locator(
          '[data-testid^="physical-check-clearance:"][data-status="interference"]',
        )
        .first(),
    ).toBeVisible();
    await expect(page.getByTestId("result-performance")).toBeVisible();

    // Reset orientation
    await page.getByTestId("mount-reset").click();
    await expect(page.getByTestId("cooler-orientation-select")).toHaveValue(
      "normal",
    );
    await expect(page.getByTestId("physical-validation-panel")).toHaveAttribute(
      "data-overall-status",
      "fit",
    );

    // Visual-only RAM: authoritative clearance-limit checks pass (fit); missing
    // physicalSpec is advisory geometry only and does not change overallStatus.
    await page
      .getByTestId("ram-part-select")
      .selectOption("ram.gskill-trident-z5-rgb-ddr5-8400");
    await openWhy(page);
    await expect(page.getByTestId("physical-validation-panel")).toHaveAttribute(
      "data-overall-status",
      "fit",
    );
    await expect(
      page
        .locator(
          '[data-testid^="physical-check-"][data-kind="collision"][data-status="unavailable"]',
        )
        .first(),
    ).toBeVisible();

    // Same RAM is the RAM-speed negative fixture — compatibility blocks the build.
    await expect(page.getByTestId("compatibility-panel")).toHaveAttribute(
      "data-overall-status",
      "incompatible",
    );
    await expect(page.getByTestId("compat-check-ram-support")).toHaveAttribute(
      "data-status",
      "incompatible",
    );
    await expect(page.getByTestId("result-performance")).toHaveCount(0);
    await expect(page.getByTestId("result-price")).toHaveCount(0);
    await expect(page.getByTestId("result")).toHaveAttribute(
      "data-level",
      "blocked",
    );

    // Cooling: empty evidence only (advisory geometry does not gate cooling).
    await expect(page.getByTestId("cooling-evidence-panel")).toHaveAttribute(
      "data-status",
      "unavailable",
    );
    await expect(page.getByTestId("cooling-reason")).toHaveText(
      "missing_exact_evidence",
    );

    // Restore supported RAM: fit returns, cooling stays unavailable (empty
    // evidence), and the performance numbers come back unchanged — the proof
    // that withholding them was a presentation rule, not an engine failure.
    await page
      .getByTestId("ram-part-select")
      .selectOption("ram.teamgroup-t-create-expert-ddr5-6000-32gb");
    await openWhy(page);
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
    expect(await page.getByTestId("fps-1080p").textContent()).toBe(
      baseline1080p,
    );
  });
});

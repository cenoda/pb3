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

async function waitForShell(page: Page) {
  await expect(page.getByTestId("app-shell")).toBeVisible();
  await expect(page.getByTestId("build-result-summary")).toBeVisible();
  await expect(page.getByTestId("build-viewport")).toBeVisible();
  await expect(page.getByTestId("cpu-select")).toBeVisible();
  await expect(page.getByTestId("gpu-select")).toBeVisible();
}

test.describe("Product UX shell (product-ux-1)", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("T1/T2: owns non-transparent page background", async ({ page }) => {
    await page.goto(fullVs2Query());
    await waitForShell(page);

    const bg = await page.evaluate(() => {
      const body = getComputedStyle(document.body).backgroundColor;
      const html = getComputedStyle(document.documentElement).backgroundColor;
      return { body, html };
    });
    expect(bg.body).not.toBe("rgba(0, 0, 0, 0)");
    expect(bg.html).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("T3: selectors + viewport + summary co-visible without scroll", async ({
    page,
  }) => {
    await page.goto(fullVs2Query());
    await waitForShell(page);

    const visibility = await page.evaluate(() => {
      const ids = [
        "cpu-select",
        "gpu-select",
        "build-viewport",
        "build-result-summary",
      ] as const;
      const vh = window.innerHeight;
      const out: Record<string, boolean> = {};
      for (const id of ids) {
        const el = document.querySelector(`[data-testid="${id}"]`);
        if (!el) {
          out[id] = false;
          continue;
        }
        const r = el.getBoundingClientRect();
        out[id] = r.top >= 0 && r.bottom <= vh && r.height > 0;
      }
      return out;
    });

    expect(visibility["cpu-select"]).toBe(true);
    expect(visibility["gpu-select"]).toBe(true);
    expect(visibility["build-viewport"]).toBe(true);
    expect(visibility["build-result-summary"]).toBe(true);
  });

  test("T4/T9/T10: GPU change updates summary, URL, pilot, and 3D", async ({
    page,
  }) => {
    await page.goto(fullVs2Query());
    await waitForShell(page);

    await expect(page.getByTestId("build-result-summary")).toHaveAttribute(
      "data-pilot",
      "true",
    );
    await expect(page.getByTestId("summary-fps-1080p")).toContainText("80–95");

    await page.getByTestId("gpu-select").selectOption("gpu.rtx4080");

    await expect(page.getByTestId("build-viewport")).toHaveAttribute(
      "data-gpu-id",
      "gpu.rtx4080",
    );
    await expect(page).toHaveURL(/gpu=gpu\.rtx4080/);
    await expect(page).toHaveURL(/v=vs2/);
    await expect(page.getByTestId("build-result-summary")).toHaveAttribute(
      "data-pilot",
      "false",
    );
    await expect(page.getByTestId("summary-fps-1440p")).toContainText("90–108");
    await expect(page.getByTestId("summary-compat-status")).toBeVisible();
    await expect(page.getByTestId("summary-fit-status")).toBeVisible();
    await expect(page.getByTestId("summary-price-total")).toBeVisible();
  });

  test("T5: viewport column is sticky", async ({ page }) => {
    await page.goto(fullVs2Query());
    await waitForShell(page);

    const position = await page
      .getByTestId("viewport-section")
      .evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe("sticky");
  });

  test("T6/T7: domain details are collapsed by default but accessible", async ({
    page,
  }) => {
    await page.goto(fullVs2Query());
    await waitForShell(page);

    const domainIds = [
      "compatibility-domain-details",
      "evidence-domain-details",
      "physical-domain-details",
      "cooling-domain-details",
      "price-domain-details",
      "performance-domain-details",
    ] as const;

    for (const testId of domainIds) {
      await expect(page.getByTestId(testId)).not.toHaveAttribute("open", "");
    }
    await expect(page.getByTestId("compatibility-panel")).not.toBeVisible();
    await expect(page.getByTestId("physical-validation-panel")).not.toBeVisible();
    await expect(page.getByTestId("cooling-evidence-panel")).not.toBeVisible();
    await expect(page.getByTestId("price-summary-panel")).not.toBeVisible();
    await expect(page.getByTestId("performance-panel")).not.toBeVisible();

    const evidenceDomain = page.getByTestId("evidence-domain-details");
    await evidenceDomain.locator(":scope > summary").click();
    const details = page.getByTestId("evidence-details");
    await expect(details).not.toHaveAttribute("open", "");
    await details.locator("summary").click();
    await expect(page.getByTestId("evidence-performance-list")).toBeVisible();
  });
});

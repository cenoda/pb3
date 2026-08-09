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

async function openWhy(page: Page) {
  const why = page.getByTestId("why-this-result");
  // An open <details> reports open="" — check for null, not falsiness.
  if ((await why.getAttribute("open")) === null) {
    await why.locator(":scope > summary").click();
  }
}

async function waitForPhase41Ready(page: Page) {
  await expect(page.getByTestId("case-select")).toBeVisible();
  await openWhy(page);
  await expect(page.getByTestId("evidence-disclosure-panel")).toBeVisible();
}

test.describe("Phase 4.1 combination estimator (est1)", () => {
  test("pilot shows est1 unavailable path + draft caveat + synthetic residual", async ({
    page,
  }) => {
    await page.goto(fullVs2Query());
    await waitForPhase41Ready(page);

    // Phase 5: the draft caveat lives with the est1 evidence it qualifies.
    await expect(page.getByTestId("evidence-est1-caveat")).toBeVisible();
    await expect(page.getByTestId("evidence-est1-caveat")).toContainText(
      "Temporary draft estimate",
    );
    await expect(page.getByTestId("evidence-est1-caveat")).toHaveAttribute(
      "data-draft-caveat",
      /Motherboard/,
    );

    for (const res of ["1080p", "1440p", "4k"] as const) {
      await expect(page.getByTestId(`evidence-est1-${res}`)).toHaveAttribute(
        "data-status",
        "unavailable",
      );
      // The reason is stated, never replaced by a number (Charter §2).
      await expect(
        page.getByTestId(`evidence-est1-unavailable-${res}`),
      ).toContainText("unavailable (");
      await expect(page.getByTestId(`evidence-external-${res}`)).toHaveAttribute(
        "data-display-class",
        "synthetic-perf1",
      );
    }

    // Outer residual still shows the perf1 stub range for 1080p, and the
    // surface labels it as a demo estimate rather than an est1 one (spec R3).
    await expect(page.getByTestId("fps-1080p")).toContainText("80–95");
    await expect(page.getByTestId("result-trust")).toContainText(
      "Demo estimate, not measured",
    );
  });

  test("non-pilot build does not activate est1 overlay", async ({ page }) => {
    await page.goto(fullVs2Query({ gpu: "gpu.rtx4080" }));
    await waitForPhase41Ready(page);

    await expect(page.getByTestId("evidence-est1-caveat")).toHaveCount(0);
    await expect(page.getByTestId("evidence-disclosure-panel")).toHaveAttribute(
      "data-pilot-active",
      "false",
    );
  });
});

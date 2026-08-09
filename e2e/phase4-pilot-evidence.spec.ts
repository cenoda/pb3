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

async function waitForPhase4Ready(page: Page) {
  await expect(page.getByTestId("case-select")).toBeVisible();
  for (const testId of [
    "evidence-domain-details",
    "performance-domain-details",
    "physical-domain-details",
    "cooling-domain-details",
  ]) {
    const details = page.getByTestId(testId);
    if (!(await details.getAttribute("open"))) {
      await details.locator(":scope > summary").click();
    }
  }
  await expect(page.getByTestId("evidence-disclosure-panel")).toBeVisible();
  await expect(page.getByTestId("performance-panel")).toBeVisible();
  await expect(page.getByTestId("physical-validation-panel")).toBeVisible();
  await expect(page.getByTestId("cooling-evidence-panel")).toBeVisible();
}

async function openEvidenceDetails(page: Page) {
  const details = page.getByTestId("evidence-details");
  if (!(await details.getAttribute("open"))) {
    await details.locator("summary").click();
  }
}

test.describe("Phase 4 pilot evidence scenario", () => {
  test("pilot disclosure: 3 perf bindings, measured cell, geometry, cooling unavailable", async ({
    page,
  }) => {
    await page.goto(fullVs2Query());
    await waitForPhase4Ready(page);

    await expect(page.getByTestId("evidence-disclosure-panel")).toHaveAttribute(
      "data-pilot-active",
      "true",
    );
    await expect(page.getByTestId("evidence-pilot-status")).toContainText(
      "active",
    );
    await expect(page.getByTestId("perf-sidecar-active")).toBeVisible();
    await expect(page.getByTestId("build-result-summary")).toHaveAttribute(
      "data-pilot",
      "true",
    );

    // Three performance rows via sidecar
    for (const res of ["1080p", "1440p", "4k"] as const) {
      await expect(page.getByTestId(`perf-row-${res}`)).toHaveAttribute(
        "data-sidecar",
        "bound",
      );
    }

    await openEvidenceDetails(page);

    for (const res of ["1080p", "1440p", "4k"] as const) {
      await expect(page.getByTestId(`evidence-perf-${res}`)).toHaveAttribute(
        "data-status",
        "bound",
      );
    }

    // O1-A: at least one first-party measured cell (1080p)
    await expect(page.getByTestId("perf-row-1080p")).toHaveAttribute(
      "data-metric-kind",
      "first-party-measured",
    );
    await page.getByTestId("perf-detail-1080p").locator("summary").click();
    await expect(page.getByTestId("perf-metric-kind-1080p")).toContainText(
      "first-party-measured",
    );
    await expect(page.getByTestId("perf-capture-1080p")).toBeVisible();
    await expect(page.getByTestId("perf-range-1080p")).toHaveText("84–91 FPS");

    // Residual stubs still disclosed
    await expect(page.getByTestId("perf-row-1440p")).toHaveAttribute(
      "data-metric-kind",
      "synthetic-stub",
    );
    await expect(page.getByTestId("perf-row-4k")).toHaveAttribute(
      "data-metric-kind",
      "synthetic-stub",
    );
    await expect(page.getByTestId("evidence-perf-confidence-1440p")).toContainText(
      "stub",
    );

    // Geometry Experimental join lives under evidence details (deduped)
    await expect(
      page.getByTestId("evidence-geo-grade-cpu.zen4-7600"),
    ).toContainText("Experimental");
    await expect(
      page.getByTestId("evidence-geo-join-gpu.rtx4070"),
    ).toContainText("evidence.phys3.synthetic.gpu.rtx4070");

    // Cooling empty / unavailable — panel + evidence details
    await expect(page.getByTestId("cooling-evidence-panel")).toHaveAttribute(
      "data-status",
      "unavailable",
    );
    await expect(page.getByTestId("evidence-cooling")).toHaveAttribute(
      "data-status",
      "unavailable",
    );
    await expect(page.getByTestId("evidence-cooling-reason")).toContainText(
      "empty_production_rows",
    );

    await expect(page.getByTestId("evidence-limitations")).toBeVisible();
  });

  test("non-pilot GPU does not carry pilot evidence overlay", async ({
    page,
  }) => {
    await page.goto(fullVs2Query({ gpu: "gpu.rtx4080" }));
    await waitForPhase4Ready(page);

    await expect(page.getByTestId("evidence-disclosure-panel")).toHaveAttribute(
      "data-pilot-active",
      "false",
    );
    await expect(page.getByTestId("evidence-non-pilot")).toBeVisible();
    await expect(page.getByTestId("perf-sidecar-active")).toHaveCount(0);
    await expect(page.getByTestId("build-result-summary")).toHaveAttribute(
      "data-pilot",
      "false",
    );

    // Falls back to perf1 stub path
    await expect(page.getByTestId("perf-row-1440p")).toHaveAttribute(
      "data-sidecar",
      "off",
    );
    await expect(page.getByTestId("perf-range-1440p")).toHaveText("90–108 FPS");
  });

  test("dist serves benchmarks/prov4 fixtures", async ({ request }) => {
    const registry = await request.get(
      "/benchmarks/prov4/evidence-source-registry.json",
    );
    expect(registry.ok()).toBeTruthy();
    const registryJson = await registry.json();
    expect(registryJson.provenanceContractVersion).toBe("prov4");

    const perf = await request.get(
      "/benchmarks/prov4/pilot-performance-evidence.json",
    );
    expect(perf.ok()).toBeTruthy();
    const perfJson = await perf.json();
    expect(perfJson.rows).toHaveLength(3);

    const raw = await request.get(
      "/benchmarks/prov4/raw/pilot-1080p-capture.json",
    );
    expect(raw.ok()).toBeTruthy();
  });
});

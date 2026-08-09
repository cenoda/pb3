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
  await openWhy(page);
  await expect(page.getByTestId("evidence-disclosure-panel")).toBeVisible();
  await expect(page.getByTestId("physical-validation-panel")).toBeVisible();
  await expect(page.getByTestId("cooling-evidence-panel")).toBeVisible();
}

async function openWhy(page: Page) {
  const why = page.getByTestId("why-this-result");
  // An open <details> reports open="" — check for null, not falsiness.
  if ((await why.getAttribute("open")) === null) {
    await why.locator(":scope > summary").click();
  }
}

test.describe("Phase 4 pilot evidence scenario", () => {
  test("pilot disclosure: external unavailable fallback to perf1 synthetic", async ({
    page,
  }) => {
    await page.goto(fullVs2Query());
    await waitForPhase4Ready(page);

    await expect(page.getByTestId("evidence-disclosure-panel")).toHaveAttribute(
      "data-pilot-active",
      "true",
    );
    for (const res of ["1080p", "1440p", "4k"] as const) {
      // Phase 4.1: est1 primary path; empty corpus → unavailable + outer
      // synthetic residual. Phase 5 states this inside the disclosure.
      await expect(page.getByTestId(`evidence-est1-${res}`)).toHaveAttribute(
        "data-status",
        "unavailable",
      );
      await expect(
        page.getByTestId(`evidence-est1-unavailable-${res}`),
      ).toBeVisible();
    }

    for (const res of ["1080p", "1440p", "4k"] as const) {
      await expect(page.getByTestId(`evidence-external-${res}`)).toHaveAttribute(
        "data-display-class",
        "synthetic-perf1",
      );
      await expect(
        page.getByTestId(`evidence-external-unavailable-${res}`),
      ).toBeVisible();
      await expect(
        page.getByTestId(`evidence-synthetic-ref-${res}`),
      ).toBeVisible();
    }

    // The number shown to the user is the perf1 synthetic residual, and the
    // surface says so in user language instead of "not an est1 estimate"
    // (spec R3).
    await expect(page.getByTestId("fps-1080p")).toContainText("80–95");
    await expect(page.getByTestId("result-trust")).toContainText(
      "Demo estimate, not measured",
    );

    await expect(page.getByTestId("cooling-evidence-panel")).toHaveAttribute(
      "data-status",
      "unavailable",
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
    await expect(page.getByTestId("evidence-est1-1440p")).toHaveCount(0);
    await expect(page.getByTestId("fps-1440p")).toContainText("90–108");
  });

  test("dist serves benchmarks/prov4 fixtures including external observations", async ({
    request,
  }) => {
    const registry = await request.get(
      "/benchmarks/prov4/evidence-source-registry.json",
    );
    expect(registry.ok()).toBeTruthy();

    const external = await request.get(
      "/benchmarks/prov4/external-performance-observations.json",
    );
    expect(external.ok()).toBeTruthy();
    const externalJson = await external.json();
    expect(externalJson.provenanceContractVersion).toBe("prov4");

    const rights = await request.get(
      "/benchmarks/prov4/source-rights-record.json",
    );
    expect(rights.ok()).toBeTruthy();

    const perf = await request.get(
      "/benchmarks/prov4/pilot-performance-evidence.json",
    );
    expect(perf.ok()).toBeTruthy();
    const perfJson = await perf.json();
    expect(perfJson.rows).toHaveLength(3);

    const removedFalseRaw = await request.get(
      "/benchmarks/prov4/raw/pilot-1080p-capture.json",
    );
    expect(removedFalseRaw.headers()["content-type"]).not.toContain(
      "application/json",
    );
  });
});

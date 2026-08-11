import { expect, test, type Page } from "@playwright/test";

/** Phase 6 Step 7 — default build assembles in the live SPA on real cat6 data. */
const DEFAULT = {
  cpu: "cpu.amd-ryzen-5-7600",
  gpu: "gpu.asus-dual-rtx4070-o12g",
  case: "case.fractal-design-north-tg-dark",
  mb: "motherboard.gigabyte-b650-aorus-elite-ax-v2",
  cooler: "cooler.noctua-nh-d15-g2",
  ram: "ram.teamgroup-t-create-expert-ddr5-6000-32gb",
  psu: "psu.corsair-rm750e",
} as const;

async function openWhy(page: Page) {
  const why = page.getByTestId("why-this-result");
  if ((await why.getAttribute("open")) === null) {
    await why.locator(":scope > summary").click();
  }
}

async function waitForReady(page: Page) {
  await expect(page.getByTestId("cpu-select")).toBeVisible();
  await expect(page.getByTestId("build-viewport")).toBeVisible();
  await expect(page.getByTestId("result-performance")).toBeVisible();
}

test.describe("Phase 6 Step 7 — default build assembly (browser)", () => {
  test("default build loads the cat6 catalog, mounts in 3D, clearance-limits fit", async ({
    page,
    request,
  }) => {
    // Manifest-loaded catalog is the live source of truth (O8). Size grew
    // from 14 (Step 7) to 22 (Step 9); this spec locks default-build
    // behavior, not the catalog size — see cat6.manifest.test.ts for that.
    const manifestRes = await request.get("/parts/catalog-manifest.json");
    expect(manifestRes.ok()).toBeTruthy();
    const manifest = await manifestRes.json();
    expect(manifest.catalogContractVersion).toBe("cat6");
    expect(manifest.parts).toHaveLength(22);

    await page.goto("/");
    await waitForReady(page);

    await expect(page.getByTestId("cpu-select")).toHaveValue(DEFAULT.cpu);
    await expect(page.getByTestId("gpu-select")).toHaveValue(DEFAULT.gpu);
    await expect(page.getByTestId("case-select")).toHaveValue(DEFAULT.case);
    await expect(page.getByTestId("motherboard-select")).toHaveValue(
      DEFAULT.mb,
    );
    await expect(page.getByTestId("cooler-select")).toHaveValue(DEFAULT.cooler);
    await expect(page.getByTestId("ram-part-select")).toHaveValue(DEFAULT.ram);
    await expect(page.getByTestId("psu-select")).toHaveValue(DEFAULT.psu);

    // 3D viewport has assembly poses (mounted) and physical overall fit.
    const viewport = page.getByTestId("build-viewport");
    await expect(viewport).toHaveAttribute("data-assembly-status", "fit");
    const poses = await viewport.getAttribute("data-assembly-poses");
    expect(poses).toBeTruthy();
    expect(poses!).toContain(`${DEFAULT.mb}@`);
    expect(poses!).toContain(`${DEFAULT.cooler}@`);
    expect(poses!).toContain(`${DEFAULT.psu}@`);
    expect(poses!).toContain(`${DEFAULT.gpu}@`);

    // B4: clean default build surface verdict is ok; permanent caution is gone.
    // Detailed compatibility still exposes raw BIOS coverage as unavailable (O6).
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

    await openWhy(page);
    await expect(page.getByTestId("compatibility-panel")).toHaveAttribute(
      "data-overall-status",
      "compatible",
    );
    await expect(page.getByTestId("compat-check-chipset-bios")).toHaveAttribute(
      "data-status",
      "unavailable",
    );
    await expect(page.getByTestId("physical-validation-panel")).toHaveAttribute(
      "data-overall-status",
      "fit",
    );
    await expect(
      page.getByTestId("physical-check-clearance-limit:cpu-cooler-height"),
    ).toHaveAttribute("data-status", "fit");
    await expect(
      page.getByTestId("physical-check-clearance-limit:psu-length"),
    ).toHaveAttribute("data-status", "fit");
    await expect(
      page.getByTestId("physical-check-clearance-limit:gpu-length"),
    ).toHaveAttribute("data-status", "fit");

    // No advisory OBB interference on the default orientation.
    await expect(
      page.locator(
        '[data-testid^="physical-check-"][data-kind="collision"][data-status="interference"]',
      ),
    ).toHaveCount(0);
    await expect(
      page.locator(
        '[data-testid^="physical-check-"][data-kind="clearance"][data-status="interference"]',
      ),
    ).toHaveCount(0);
  });
});

import { expect, test, type Page } from "@playwright/test";

/*
 * Phase 5 exit conditions 1-5 (docs/phases/phase-5/specs/phase-5.md §1).
 *
 * These are the user actions the phase is judged on. The owner still performs
 * them in a browser — this spec only stops them from silently regressing.
 */

async function openWhy(page: Page) {
  const why = page.getByTestId("why-this-result");
  if ((await why.getAttribute("open")) === null) {
    await why.locator(":scope > summary").click();
  }
}

const SLOTS = [
  "case-select",
  "motherboard-select",
  "cpu-select",
  "gpu-select",
  "cooler-select",
  "ram-part-select",
  "psu-select",
] as const;

test.describe("Phase 5 exit conditions", () => {
  test("1: open the app and choose every part without instruction", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("parts-rail")).toBeVisible();
    for (const slot of SLOTS) {
      await expect(page.getByTestId(slot)).toBeVisible();
      await expect(page.getByTestId(slot)).not.toHaveValue("");
    }
    // D4: the app opens on a complete build, so there is something to react to.
    await expect(page.getByTestId("result-verdict")).toBeVisible();
  });

  test("2: a rejection is explained on the main screen, without opening anything", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("result-performance")).toBeVisible();

    await page.getByTestId("case-select").selectOption("case.lian-li-a3-matx-black");

    const reason = page.getByTestId("result-reason");
    await expect(reason).toBeVisible();
    // R2: product names, not part ids, and it says what to change.
    await expect(reason).toContainText("LIAN LI A3-mATX Black");
    await expect(reason).not.toContainText("case.lian-li-a3-matx-black");
    await expect(reason).toContainText("Change the case or the motherboard.");

    // R1: no performance number and no price for a build that cannot work.
    await expect(page.getByTestId("result-performance")).toHaveCount(0);
    await expect(page.getByTestId("result-price")).toHaveCount(0);
    await expect(page.getByTestId("result")).toHaveAttribute(
      "data-level",
      "blocked",
    );

    // The 3D area explains itself in user language too (R4).
    await expect(page.getByTestId("viewport-error")).toContainText(
      "cannot be put together",
    );
  });

  test("3: performance is readable with game, preset and confidence, next to the 3D build", async ({
    page,
  }) => {
    await page.goto("/");
    const performance = page.getByTestId("result-performance");
    await expect(performance).toBeVisible();

    // R3: never a number without its context.
    await expect(performance).toContainText("Cyberpunk 2077");
    await expect(performance).toContainText("Ultra");
    await expect(page.getByTestId("result-trust")).toContainText(
      "Demo estimate, not measured",
    );
    for (const res of ["1080p", "1440p", "4k"] as const) {
      await expect(page.getByTestId(`fps-${res}`)).toContainText("fps");
    }

    // The build is visible in 3D, and the 3D view is the largest element.
    const viewport = page.getByTestId("build-viewport");
    await expect(viewport).toBeVisible();
    const viewportBox = await viewport.boundingBox();
    const railBox = await page.getByTestId("parts-rail").boundingBox();
    const resultBox = await page.getByTestId("result-bar").boundingBox();
    expect(viewportBox!.width * viewportBox!.height).toBeGreaterThan(
      railBox!.width * railBox!.height,
    );
    expect(viewportBox!.width * viewportBox!.height).toBeGreaterThan(
      resultBox!.width * resultBox!.height,
    );
  });

  test("4: the price is readable and truthfully marked as a dated snapshot, not a live quote", async ({
    page,
  }) => {
    // Step 10: cat6 catalog prices (KRW dated street snapshots), not the old
    // USD phase-2 fixture. The default build is partial (no sourced CPU/GPU
    // price yet, PSU has MSRP only), which the surface must also disclose.
    await page.goto("/");
    const price = page.getByTestId("result-price");
    await expect(price).toBeVisible();
    await expect(price).toContainText("₩");
    await expect(price).toContainText("not live quotes");
    await expect(price).not.toContainText("demo");
  });

  test("5: the copied link reopens the identical build", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    await page.getByTestId("gpu-select").selectOption("gpu.asus-proart-rtx4080-o16g");
    await page.getByTestId("cpu-select").selectOption("cpu.amd-ryzen-7-7800x3d");

    await page.getByTestId("copy-link").click();
    await expect(page.getByTestId("copy-status")).toContainText("Link copied");

    const link = await page.evaluate(() => navigator.clipboard.readText());
    const receiver = await context.newPage();
    await receiver.goto(link);

    for (const slot of SLOTS) {
      await expect(receiver.getByTestId(slot)).toHaveValue(
        await page.getByTestId(slot).inputValue(),
      );
    }
    await expect(receiver).toHaveURL(page.url());
    await receiver.close();
  });

  test("provenance is retained in full behind the one disclosure", async ({
    page,
  }) => {
    await page.goto("/");

    // Exactly one disclosure on the product surface (spec §2).
    await expect(page.getByTestId("why-this-result")).toBeVisible();
    const topLevelDetails = await page
      .locator("details:not(details details)")
      .count();
    expect(topLevelDetails).toBe(1);

    await openWhy(page);
    // R5: source ids, digests, freshness, limitations — nothing deleted.
    for (const id of [
      "compatibility-panel",
      "physical-validation-panel",
      "cooling-evidence-panel",
      "price-summary-panel",
      "evidence-disclosure-panel",
      "evidence-limitations",
      "evidence-performance-list",
      "evidence-geometry-list",
      "cinebench-panel",
      "engine-controls",
    ]) {
      await expect(page.getByTestId(id)).toBeVisible();
    }
  });
});

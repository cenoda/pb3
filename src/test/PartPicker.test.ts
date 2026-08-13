import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ImageSourceRegistryEntry } from "../contract/cat6";
import type { PartDefinitionV2 } from "../contract/partV2";
import { ImageAttribution } from "../ui/ImageAttribution";
import { keySpecLines, PartPicker } from "../ui/PartPicker";

const falSource: ImageSourceRegistryEntry = {
  sourceId: "source.cat6.image.wikimedia.ryzen-5-7600-top-fal",
  publisher: "Smial (Rainer Knäpper)",
  canonicalUrl:
    "https://commons.wikimedia.org/wiki/File:AMD_Ryzen_5_7600_top_IMGP6773_smial_wp.jpg",
  citation:
    "https://commons.wikimedia.org/wiki/File:AMD_Ryzen_5_7600_top_IMGP6773_smial_wp.jpg",
  rightsClass: "cc-attribution",
  retrievedAt: "2026-08-13",
  decision: "approved",
  verbatimTerms: "Free Art License (Licence Art Libre) http://artlibre.org/licence/lal/en",
};

const cc0Source: ImageSourceRegistryEntry = {
  sourceId: "source.cat6.image.wikimedia.ryzen-7-7800x3d-package-cc0",
  publisher: "FritzchensFritz",
  canonicalUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
  citation: "https://commons.wikimedia.org/wiki/File:Example.jpg",
  rightsClass: "licensed",
  retrievedAt: "2026-08-13",
  decision: "approved",
  verbatimTerms: "Creative Commons CC0 1.0 Universal Public Domain Dedication",
};

const cpuWithCc: PartDefinitionV2 = {
  contractVersion: "cat6",
  id: "cpu.amd-ryzen-5-7600",
  category: "cpu",
  displayName: "AMD Ryzen 5 7600",
  modelGlbPath: "parts/cpu/cpu.amd-ryzen-5-7600/model.glb",
  compatSpec: { socket: "AM5", tdpWatts: 65 },
  image: {
    path: "parts/cpu/cpu.amd-ryzen-5-7600/image.jpg",
    sourceId: falSource.sourceId,
    rightsClass: "cc-attribution",
    retrievedAt: "2026-08-13",
  },
};

const cpuCc0: PartDefinitionV2 = {
  contractVersion: "cat6",
  id: "cpu.amd-ryzen-7-7800x3d",
  category: "cpu",
  displayName: "AMD Ryzen 7 7800X3D",
  modelGlbPath: "parts/cpu/cpu.amd-ryzen-7-7800x3d/model.glb",
  compatSpec: { socket: "AM5", tdpWatts: 120 },
  image: {
    path: "parts/cpu/cpu.amd-ryzen-7-7800x3d/image.jpg",
    sourceId: cc0Source.sourceId,
    rightsClass: "licensed",
    retrievedAt: "2026-08-13",
  },
};

describe("PartPicker catalog browser", () => {
  it("renders a grid and keeps the native select testId contract", () => {
    const html = renderToStaticMarkup(
      createElement(PartPicker, {
        label: "Processor",
        testId: "cpu-select",
        value: "cpu.amd-ryzen-5-7600",
        options: [cpuWithCc, cpuCc0],
        onChange: () => undefined,
        imageSources: new Map([[falSource.sourceId, falSource]]),
      }),
    );
    expect(html).toContain('data-testid="cpu-select"');
    expect(html).toContain('data-testid="cpu-select-grid"');
    expect(html).toContain("AMD Ryzen 5 7600");
    expect(html).toContain("AM5");
  });

  it("renders attribution for cc-attribution images and not for CC0/licensed", () => {
    const withCredit = renderToStaticMarkup(
      createElement(ImageAttribution, { source: falSource }),
    );
    expect(withCredit).toContain('data-testid="image-attribution"');
    expect(withCredit).toContain("Smial (Rainer Knäpper)");
    expect(withCredit).toContain("FAL");
    expect(withCredit).toContain(falSource.canonicalUrl);

    const withoutCredit = renderToStaticMarkup(
      createElement(ImageAttribution, { source: cc0Source }),
    );
    expect(withoutCredit).toBe("");
  });

  it("lists socket and TDP for CPU key specs", () => {
    expect(keySpecLines(cpuWithCc)).toEqual(["AM5", "65 W TDP"]);
  });
});

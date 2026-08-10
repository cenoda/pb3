import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PSU_HEADROOM_MULTIPLIER } from "../contract/compat2";
import type { PartDefinitionV3 } from "../contract/cat6";
import { partDefinitionV3Schema } from "../contract/cat6.schema";

/**
 * The ID_MIGRATION.md invariants, evaluated against authored catalog data
 * rather than restated. Each figure is read from the part that publishes it, so
 * a correction to a source invalidates the invariant that rests on it instead
 * of silently diverging from it.
 */

const ROOT = resolve(__dirname, "../..");

const SLOT = {
  s5Cpu: "parts/cpu/cpu.amd-ryzen-7-7800x3d/part.json",
  s7Gpu: "parts/gpu/gpu.asus-proart-rtx4080-o16g/part.json",
  s8Board: "parts/motherboard/motherboard.gigabyte-b650-aorus-elite-ax-v2/part.json",
  s9Board: "parts/motherboard/motherboard.asus-tuf-gaming-b860m-plus-wifi/part.json",
  s10Psu: "parts/psu/psu.corsair-rm750e/part.json",
  s11Psu: "parts/psu/psu.cooler-master-v550-sfx-gold/part.json",
  s12Ram: "parts/ram/ram.teamgroup-t-create-expert-ddr5-6000-32gb/part.json",
  s13Ram: "parts/ram/ram.gskill-trident-z5-rgb-ddr5-8400/part.json",
  s14Board:
    "parts/motherboard/motherboard.gigabyte-b650m-aorus-elite-ax-rev-1-3/part.json",
  s3Cooler: "parts/cooler/cooler.noctua-nh-d15-g2/part.json",
  s4Cpu: "parts/cpu/cpu.amd-ryzen-5-7600/part.json",
  s2Case: "parts/case/case.lian-li-a3-matx-black/part.json",
} as const;

function part(rel: string): PartDefinitionV3 {
  return partDefinitionV3Schema.parse(
    JSON.parse(readFileSync(resolve(ROOT, rel), "utf8")),
  );
}

function field<T>(rel: string, key: string): T {
  const compat = part(rel).compatSpec as Record<string, unknown> | undefined;
  expect(compat, `${rel} has no compatSpec`).toBeDefined();
  const value = (compat as Record<string, unknown>)[key];
  expect(value, `${rel} compatSpec has no ${key}`).toBeDefined();
  return value as T;
}

describe("cat6 batch — ID_MIGRATION invariants on authored data", () => {
  it("I3 — the 550 W SFX unit fails the high-TDP pair, the 750 W unit clears it", () => {
    const cpuTdp = field<number>(SLOT.s5Cpu, "tdpWatts");
    const gpuTdp = field<number>(SLOT.s7Gpu, "tdpWatts");
    const required = (cpuTdp + gpuTdp) * PSU_HEADROOM_MULTIPLIER;

    expect(required).toBeCloseTo(572, 5);
    expect(field<number>(SLOT.s11Psu, "wattage")).toBeLessThan(required);
    expect(field<number>(SLOT.s10Psu, "wattage")).toBeGreaterThanOrEqual(
      required,
    );
  });

  it("I4 — the 8400 kit exceeds the default board's published ceiling", () => {
    const ceiling = field<number>(SLOT.s8Board, "maxMemorySpeedMtS");
    const rated = field<number>(SLOT.s13Ram, "speedMtS");
    expect(rated).toBeGreaterThan(ceiling);

    // The default kit must stay under it, or the default build breaks.
    expect(field<number>(SLOT.s12Ram, "speedMtS")).toBeLessThanOrEqual(ceiling);
  });

  it("I6 — the default kit needs no fan raise, so the cooler stays at its published height", () => {
    // Noctua's out-of-box RAM clearance for this cooler, from its FAQ; the
    // cooler part records the figure in its notes because cat6 has no field
    // for a cooler's RAM clearance.
    const NH_D15_G2_RAM_CLEARANCE_MM = 32;

    const moduleHeight = part(SLOT.s12Ram).dimensionsMm?.heightMm;
    expect(moduleHeight).toBe(NH_D15_G2_RAM_CLEARANCE_MM);

    // Zero margin: any upward correction to the module height breaks this.
    expect(moduleHeight as number).toBeLessThanOrEqual(
      NH_D15_G2_RAM_CLEARANCE_MM,
    );
    expect(part(SLOT.s3Cooler).dimensionsMm?.heightMm).toBe(168);
  });

  it("I8 — the O7 witness route is compat-clean on socket, memory and form factor", () => {
    expect(field<string>(SLOT.s14Board, "socket")).toBe(
      field<string>(SLOT.s4Cpu, "socket"),
    );
    expect(field<string>(SLOT.s14Board, "formFactor")).toBe("Micro-ATX");
    expect(field<string>(SLOT.s14Board, "supportedMemoryType")).toBe(
      field<string>(SLOT.s12Ram, "memoryType"),
    );
    expect(field<number>(SLOT.s12Ram, "speedMtS")).toBeLessThanOrEqual(
      field<number>(SLOT.s14Board, "maxMemorySpeedMtS"),
    );

    const caseSpec = part(SLOT.s2Case).compatSpec as
      | { supportedFormFactors?: string[] }
      | undefined;
    expect(caseSpec?.supportedFormFactors).toContain(
      field<string>(SLOT.s14Board, "formFactor"),
    );
  });

  it("O6 — no board carries a BIOS minimum", () => {
    for (const rel of [SLOT.s8Board, SLOT.s14Board]) {
      const compat = part(rel).compatSpec as
        | { biosMinVersionForCpu?: Record<string, string> }
        | undefined;
      expect(Object.keys(compat?.biosMinVersionForCpu ?? {})).toHaveLength(0);
    }
  });

  it("C10 — the RTX 4080's TGP is cited to NVIDIA, not to the board partner", () => {
    const gpu = part(SLOT.s7Gpu);
    expect(gpu.provenance.compatSpec?.sourceId).toBe(
      "source.cat6.nvidia.rtx4080-family.reference-tgp",
    );
    // The board partner's own figures stay cited to the board partner.
    expect(gpu.provenance.dimensions?.sourceId).toBe(
      "source.cat6.asus.proart-rtx4080-o16g.techspec",
    );
    expect(gpu.provenance.performanceSpec?.sourceId).toBe(
      "source.cat6.asus.proart-rtx4080-o16g.techspec",
    );
  });

  it("unsourceable dimensions stay absent rather than being completed", () => {
    // CPUs: package dimensions are not on the product pages (B8).
    expect(part(SLOT.s4Cpu).dimensionsMm).toBeUndefined();
    expect(part(SLOT.s5Cpu).dimensionsMm).toBeUndefined();
    // Boards: published as a two-figure outline with no thickness.
    expect(part(SLOT.s8Board).dimensionsMm).toBeUndefined();
    expect(part(SLOT.s9Board).dimensionsMm).toBeUndefined();
    expect(part(SLOT.s14Board).dimensionsMm).toBeUndefined();
    // G.SKILL: height only, no length or thickness.
    expect(part(SLOT.s13Ram).dimensionsMm).toBeUndefined();
  });

  it("slot 9 carries the C15 negative-fixture designation", () => {
    const roleNote = part(SLOT.s9Board).identity.roleNote;
    expect(roleNote).toBeTruthy();
    expect(roleNote).toContain("cpu-socket: incompatible");
  });
});

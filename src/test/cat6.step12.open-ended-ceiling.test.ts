import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkRamSupport } from "../compat/checkRamSupport";
import type { CompatibilityInputs } from "../compat/compatibilityInputs";
import type { MotherboardCompatSpec } from "../contract/compat2";
import { partDefinitionV3Schema } from "../contract/cat6.schema";

const ROOT = resolve(__dirname, "../..");

function part(rel: string) {
  return partDefinitionV3Schema.parse(
    JSON.parse(readFileSync(resolve(ROOT, rel), "utf8")),
  );
}

function motherboardCompat(partRel: string): MotherboardCompatSpec {
  const compat = part(partRel).compatSpec;
  expect(compat && "chipset" in compat).toBe(true);
  return compat as MotherboardCompatSpec;
}

/**
 * Step 12 regression: open-ended vendor ceilings (`7600+`, `8800+`) must not be
 * encoded as numeric maxMemorySpeedMtS. Absence → ram-support unavailable (C1, C14).
 */
describe("cat6 Step 12 — open-ended memory ceiling encoding", () => {
  const b650Plus =
    "parts/motherboard/motherboard.asus-tuf-gaming-b650-plus-wifi/part.json";
  const b860mPlus =
    "parts/motherboard/motherboard.asus-tuf-gaming-b860m-plus-wifi/part.json";
  const defaultRam =
    "parts/ram/ram.teamgroup-t-create-expert-ddr5-6000-32gb/part.json";
  const defaultCpu = "parts/cpu/cpu.amd-ryzen-5-7600/part.json";

  it("ASUS B650-PLUS WIFI carries no maxMemorySpeedMtS (7600+ is not an exact ceiling)", () => {
    expect(motherboardCompat(b650Plus).maxMemorySpeedMtS).toBeUndefined();
    const notes = part(b650Plus).notes ?? "";
    expect(notes).toContain("7600+(OC)");
    expect(notes).toContain("maxMemorySpeedMtS is absent");
    expect(notes).not.toMatch(/maxMemorySpeedMtS records 7200/);
  });

  it("ASUS B860M-PLUS WIFI still carries no maxMemorySpeedMtS (8800+ control)", () => {
    expect(motherboardCompat(b860mPlus).maxMemorySpeedMtS).toBeUndefined();
  });

  it("B650-PLUS ram-support is unavailable, not a false incompatible/compatible ceiling", () => {
    const inputs: CompatibilityInputs = {
      cpu: part(defaultCpu).compatSpec as CompatibilityInputs["cpu"],
      motherboard: motherboardCompat(b650Plus),
      gpu: null,
      ram: part(defaultRam).compatSpec as CompatibilityInputs["ram"],
      psu: null,
      caseSpec: null,
      cpuId: part(defaultCpu).id,
      motherboardId: part(b650Plus).id,
      gpuId: "",
      ramId: part(defaultRam).id,
      psuId: "",
      caseId: "",
    };
    const result = checkRamSupport(inputs);
    expect(result.status).toBe("unavailable");
    expect(result.status).not.toBe("incompatible");
    expect(result.status).not.toBe("compatible");
  });
});

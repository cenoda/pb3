import { describe, expect, it } from "vitest";
import { DEFAULT_BUILD_STATE_V2 } from "../contract/vs2";
import {
  buildStateV2Schema,
  partDefinitionV2Schema,
} from "../contract/vs2.schema";

describe("vs2.schema", () => {
  it("accepts the default BuildStateV2 fixture shape", () => {
    const parsed = buildStateV2Schema.safeParse(DEFAULT_BUILD_STATE_V2);
    expect(parsed.success).toBe(true);
  });

  it("rejects BuildStateV2 with wrong contract version", () => {
    const parsed = buildStateV2Schema.safeParse({
      ...DEFAULT_BUILD_STATE_V2,
      contractVersion: "vs0",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts cat6-authored part definition with runtime loader schema", () => {
    const parsed = partDefinitionV2Schema.safeParse({
      contractVersion: "cat6",
      id: "cpu.amd-ryzen-5-7600",
      category: "cpu",
      displayName: "AMD Ryzen 5 7600",
      modelGlbPath: "parts/cpu/cpu.amd-ryzen-5-7600/model.glb",
      compatSpec: {
        socket: "AM5",
        tdpWatts: 65,
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts part definition with nested compatSpec (vs0)", () => {
    const parsed = partDefinitionV2Schema.safeParse({
      contractVersion: "vs0",
      id: "cpu.amd-ryzen-5-7600",
      category: "cpu",
      displayName: "Ryzen 5 7600 (fixture)",
      modelGlbPath: "parts/cpu/cpu.amd-ryzen-5-7600/model.glb",
      compatSpec: {
        socket: "AM5",
        tdpWatts: 65,
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects part definition missing required base fields", () => {
    const parsed = partDefinitionV2Schema.safeParse({
      contractVersion: "vs0",
      id: "cpu.amd-ryzen-5-7600",
      category: "cpu",
    });
    expect(parsed.success).toBe(false);
  });
});

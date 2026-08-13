import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { NormalizedIdentity } from "../contract/ing7";
import { loadCatalogIdentities } from "../ingest/catalogSnapshot";
import { matchExactSku } from "../ingest/matchExactSku";

const ROOT = resolve(__dirname, "../..");

function ident(partial: Partial<NormalizedIdentity> = {}): NormalizedIdentity {
  return {
    partNumbers: [],
    variantTokens: [],
    ...partial,
  };
}

describe("ing7 exact-SKU matcher", () => {
  const catalog = loadCatalogIdentities(ROOT);

  it("matches boxed 100-100001015BOX to cpu.amd-ryzen-5-7600", () => {
    const rec = matchExactSku({
      candidateId: "t.box",
      identity: ident({ partNumbers: ["100-100001015BOX"] }),
      catalog,
    });
    expect(rec.verdict).toBe("exact");
    expect(rec.matchedPartId).toBe("cpu.amd-ryzen-5-7600");
    expect(rec.stage).toBe("sku-exact");
  });

  it("never treats tray 100-000001015 as exact on the boxed 7600", () => {
    const rec = matchExactSku({
      candidateId: "t.tray",
      identity: ident({ partNumbers: ["100-000001015"], variantTokens: ["TRAY"] }),
      catalog,
    });
    expect(rec.verdict).not.toBe("exact");
    expect(rec.matchedPartId).not.toBe("cpu.amd-ryzen-5-7600");
  });

  it("matches DUAL-RTX4070-O12G to gpu.asus-dual-rtx4070-o12g", () => {
    const rec = matchExactSku({
      candidateId: "t.gpu",
      identity: ident({ partNumbers: ["DUAL-RTX4070-O12G"] }),
      catalog,
    });
    expect(rec.verdict).toBe("exact");
    expect(rec.matchedPartId).toBe("gpu.asus-dual-rtx4070-o12g");
  });

  it("does not exact-match 4070 SUPER or 4060 onto the 4070 O12G part", () => {
    const superHit = matchExactSku({
      candidateId: "t.super",
      identity: ident({
        modelName: "ASUS Dual 4070 SUPER",
        partNumbers: [],
        variantTokens: ["SUPER"],
      }),
      catalog,
    });
    expect(superHit.verdict).not.toBe("exact");
    expect(superHit.matchedPartId).not.toBe("gpu.asus-dual-rtx4070-o12g");

    const t4060 = matchExactSku({
      candidateId: "t.4060",
      identity: ident({ partNumbers: ["DUAL-RTX4060-O8G"], variantTokens: ["4060"] }),
      catalog,
    });
    expect(t4060.matchedPartId).not.toBe("gpu.asus-dual-rtx4070-o12g");
    if (t4060.verdict === "exact") {
      expect(t4060.matchedPartId).toBe("gpu.asus-dual-rtx4060-o8g");
    }
  });

  it("does not exact-match NH-D15 without G2 onto NH-D15 G2", () => {
    const rec = matchExactSku({
      candidateId: "t.d15",
      identity: ident({ modelName: "NH-D15", partNumbers: [], variantTokens: ["NH-D15"] }),
      catalog,
    });
    expect(rec.verdict).not.toBe("exact");
    expect(rec.matchedPartId).not.toBe("cooler.noctua-nh-d15-g2");
  });

  it("does not exact-match Fractal Design Focus G onto North", () => {
    const rec = matchExactSku({
      candidateId: "t.focus",
      identity: ident({
        manufacturer: "Fractal Design",
        modelName: "Fractal Design Focus G",
        variantTokens: ["FOCUS G"],
      }),
      catalog,
    });
    expect(rec.verdict).not.toBe("exact");
    expect(rec.matchedPartId).not.toBe("case.fractal-design-north-tg-dark");
  });

  it("does not exact-match 64 GB T-Create tokens onto the 32 GB part", () => {
    const rec = matchExactSku({
      candidateId: "t.64",
      identity: ident({
        partNumbers: ["CTCED564G6000HC34BDC01"],
        variantTokens: ["64GB"],
      }),
      catalog,
    });
    expect(rec.matchedPartId).not.toBe(
      "ram.teamgroup-t-create-expert-ddr5-6000-32gb",
    );
    if (rec.verdict === "exact") {
      expect(rec.matchedPartId).toBe(
        "ram.teamgroup-t-create-expert-ddr5-6000-64gb",
      );
    }
  });

  it("treats Ryzen 5 7600 marketing name only as never exact", () => {
    const rec = matchExactSku({
      candidateId: "t.mkt",
      identity: ident({ modelName: "Ryzen 5 7600" }),
      catalog,
    });
    expect(rec.verdict).not.toBe("exact");
    expect(["ambiguous", "unavailable"]).toContain(rec.verdict);
  });

  it("never uses a retired phase-0 cpu id as a match key", () => {
    const legacyId = ["cpu", "zen4", "7600"].join(".");
    expect(catalog.some((p) => p.id === legacyId)).toBe(false);
    const rec = matchExactSku({
      candidateId: "t.legacy",
      identity: ident({ partNumbers: [legacyId] }),
      catalog,
    });
    expect(rec.verdict).toBe("unavailable");
    expect(rec.matchedPartId).toBeUndefined();
  });
});

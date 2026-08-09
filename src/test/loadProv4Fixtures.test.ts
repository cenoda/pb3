import { describe, expect, it } from "vitest";
import { loadCoolingProvenance } from "../provenance/loadCoolingProvenance";
import { loadEvidenceRegistry } from "../provenance/loadEvidenceRegistry";
import { loadGeometryEvidence } from "../provenance/loadGeometryEvidence";
import { loadHumanVerification } from "../provenance/loadHumanVerification";
import { loadPerformanceEvidence } from "../provenance/loadPerformanceEvidence";
import { loadProv4Fixtures } from "../provenance/loadProv4Fixtures";

describe("prov4 loaders", () => {
  it("loads registry", async () => {
    const registry = await loadEvidenceRegistry();
    expect(registry.provenanceContractVersion).toBe("prov4");
    expect(registry.sources.length).toBeGreaterThanOrEqual(2);
  });

  it("loads exactly three performance rows", async () => {
    const file = await loadPerformanceEvidence();
    expect(file.rows).toHaveLength(3);
  });

  it("loads seven geometry rows", async () => {
    const file = await loadGeometryEvidence();
    expect(file.rows).toHaveLength(7);
  });

  it("loads empty cooling provenance", async () => {
    const file = await loadCoolingProvenance();
    expect(file.rows).toHaveLength(0);
  });

  it("loads human verification file", async () => {
    const file = await loadHumanVerification();
    expect(file.provenanceContractVersion).toBe("prov4");
  });

  it("loadProv4Fixtures verifies repo-file digests", async () => {
    const fixtures = await loadProv4Fixtures();
    expect(fixtures.verifiedArtifactDigests.size).toBeGreaterThan(0);
    const measured = fixtures.performance.rows.find(
      (r) => r.measurement.metricKind === "first-party-measured",
    );
    expect(measured?.captureConditions).toBeDefined();
    expect(
      fixtures.verifiedArtifactDigests.has(
        measured!.captureConditions!.rawArtifact.sha256,
      ),
    ).toBe(true);
  });

  it("fails closed on HTTP error", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(null, { status: 404 });
    await expect(loadEvidenceRegistry()).rejects.toThrow(
      /Failed to load evidence registry/,
    );
    globalThis.fetch = originalFetch;
  });

  it("fails closed on schema parse failure", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ provenanceContractVersion: "prov4" }), {
        status: 200,
      });
    await expect(loadPerformanceEvidence()).rejects.toThrow(
      /Invalid performance evidence/,
    );
    globalThis.fetch = originalFetch;
  });
});

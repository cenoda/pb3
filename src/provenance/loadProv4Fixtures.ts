/**
 * Aggregate Phase-4 provenance fixture load + optional repo-file digest verify.
 */
import type {
  CoolingProvenanceFile,
  EvidenceSourceRegistryFile,
  ExternalPerformanceObservationsFile,
  GeometryEvidenceFile,
  HumanVerificationFile,
  PerformanceEvidenceFile,
  RawArtifactReference,
  SourceRightsRecordFile,
} from "../contract/prov4";
import { loadCoolingProvenance } from "./loadCoolingProvenance";
import { loadEvidenceRegistry } from "./loadEvidenceRegistry";
import { loadExternalPerformanceObservations } from "./loadExternalPerformanceObservations";
import { loadGeometryEvidence } from "./loadGeometryEvidence";
import { loadHumanVerification } from "./loadHumanVerification";
import { loadPerformanceEvidence } from "./loadPerformanceEvidence";
import { loadSourceRightsRecord } from "./loadSourceRightsRecord";

export interface Prov4Fixtures {
  registry: EvidenceSourceRegistryFile;
  performance: PerformanceEvidenceFile;
  geometry: GeometryEvidenceFile;
  cooling: CoolingProvenanceFile;
  verifications: HumanVerificationFile;
  externalObservations: ExternalPerformanceObservationsFile;
  sourceRights: SourceRightsRecordFile;
  /** Digests that passed HTTP fetch + SHA-256 / byteLength checks. */
  verifiedArtifactDigests: ReadonlySet<string>;
}

function collectRepoFileArtifacts(
  performance: PerformanceEvidenceFile,
): RawArtifactReference[] {
  const out: RawArtifactReference[] = [];
  for (const row of performance.rows) {
    if (row.captureConditions?.rawArtifact?.kind === "repo-file") {
      out.push(row.captureConditions.rawArtifact);
    }
    const ft = row.measurement.frametime;
    if (
      ft.status === "available" &&
      (ft.representation === "raw-artifact" ||
        ft.representation === "summary-and-raw") &&
      ft.artifact.kind === "repo-file"
    ) {
      out.push(ft.artifact);
    }
  }
  return out;
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Fetch each unique repo-file artifact and verify digest + length.
 * Fail-closed: any mismatch throws.
 */
export async function verifyRepoFileArtifacts(
  performance: PerformanceEvidenceFile,
): Promise<ReadonlySet<string>> {
  const artifacts = collectRepoFileArtifacts(performance);
  const verified = new Set<string>();
  const seen = new Set<string>();

  for (const art of artifacts) {
    if (seen.has(art.sha256)) {
      verified.add(art.sha256);
      continue;
    }
    seen.add(art.sha256);

    const url = `/${art.locator.replace(/^\/+/, "")}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to load raw artifact at ${url}: HTTP ${response.status}`,
      );
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength !== art.byteLength) {
      throw new Error(
        `Raw artifact ${art.locator} byteLength mismatch: got ${buffer.byteLength}, expected ${art.byteLength}`,
      );
    }
    const digest = await sha256Hex(buffer);
    if (digest !== art.sha256) {
      throw new Error(
        `Raw artifact ${art.locator} sha256 mismatch: got ${digest}, expected ${art.sha256}`,
      );
    }
    verified.add(art.sha256);
  }

  return verified;
}

export async function loadProv4Fixtures(): Promise<Prov4Fixtures> {
  const [
    registry,
    performance,
    geometry,
    cooling,
    verifications,
    externalObservations,
    sourceRights,
  ] = await Promise.all([
    loadEvidenceRegistry(),
    loadPerformanceEvidence(),
    loadGeometryEvidence(),
    loadCoolingProvenance(),
    loadHumanVerification(),
    loadExternalPerformanceObservations(),
    loadSourceRightsRecord(),
  ]);

  const verifiedArtifactDigests = await verifyRepoFileArtifacts(performance);

  return {
    registry,
    performance,
    geometry,
    cooling,
    verifications,
    externalObservations,
    sourceRights,
    verifiedArtifactDigests,
  };
}

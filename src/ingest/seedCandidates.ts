import { ING7_CONTRACT_VERSION, type IngestCandidate } from "../contract/ing7";

export const COMMONS_RYZEN_5_7600 =
  "https://commons.wikimedia.org/wiki/File:AMD_Ryzen_5_7600_top_IMGP6773_smial_wp.jpg";

export const COMMONS_RYZEN_7_7800X3D =
  "https://commons.wikimedia.org/wiki/File:AMD@5nmCCD(6nmIOD)@Zen4@Raphael@Ryzen_7_7800X3D@100-000000910_BS_2312PGY_9LW3390030138_DSCx01.jpg";

export const ASUS_DUAL_RTX4070 =
  "https://www.asus.com/us/motherboards-components/graphics-cards/dual/dual-rtx4070-o12g/";

export const AMD_RYZEN_5_7600_SPEC =
  "https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-5-7600.html";

export function firstSliceCandidates(createdAt: string): IngestCandidate[] {
  return [
    {
      contractVersion: ING7_CONTRACT_VERSION,
      candidateId: "cand.wikimedia.cpu.amd-ryzen-5-7600",
      stage: "candidate",
      sourceKind: "licensed-still",
      intendedPartId: "cpu.amd-ryzen-5-7600",
      canonicalUrl: COMMONS_RYZEN_5_7600,
      createdAt,
    },
    {
      contractVersion: ING7_CONTRACT_VERSION,
      candidateId: "cand.wikimedia.cpu.amd-ryzen-7-7800x3d",
      stage: "candidate",
      sourceKind: "licensed-still",
      intendedPartId: "cpu.amd-ryzen-7-7800x3d",
      canonicalUrl: COMMONS_RYZEN_7_7800X3D,
      createdAt,
    },
    {
      contractVersion: ING7_CONTRACT_VERSION,
      candidateId: "cand.manufacturer.gpu.asus-dual-rtx4070-o12g",
      stage: "candidate",
      sourceKind: "manufacturer-image-page",
      intendedPartId: "gpu.asus-dual-rtx4070-o12g",
      canonicalUrl: ASUS_DUAL_RTX4070,
      createdAt,
    },
    {
      contractVersion: ING7_CONTRACT_VERSION,
      candidateId: "cand.amd-spec.cpu.amd-ryzen-5-7600",
      stage: "candidate",
      sourceKind: "manufacturer-spec-page",
      intendedPartId: "cpu.amd-ryzen-5-7600",
      canonicalUrl: AMD_RYZEN_5_7600_SPEC,
      createdAt,
    },
  ];
}

import type { IngestCandidate } from "../contract/ing7";
import { DEFAULT_CANDIDATES_REL, loadCandidateFile, withCreatedAt } from "./loadCandidates";

export const COMMONS_RYZEN_5_7600 =
  "https://commons.wikimedia.org/wiki/File:AMD_Ryzen_5_7600_top_IMGP6773_smial_wp.jpg";

export const COMMONS_RYZEN_7_7800X3D =
  "https://commons.wikimedia.org/wiki/File:AMD@5nmCCD(6nmIOD)@Zen4@Raphael@Ryzen_7_7800X3D@100-000000910_BS_2312PGY_9LW3390030138_DSCx01.jpg";

export const ASUS_DUAL_RTX4070 =
  "https://www.asus.com/us/motherboards-components/graphics-cards/dual/dual-rtx4070-o12g/";

export const AMD_RYZEN_5_7600_SPEC =
  "https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-5-7600.html";

/** @deprecated Use loadCandidateFile. Kept so existing imports resolve. */
export function firstSliceCandidates(
  createdAt: string,
  repoRoot = process.cwd(),
): IngestCandidate[] {
  return withCreatedAt(loadCandidateFile(repoRoot, DEFAULT_CANDIDATES_REL), createdAt);
}

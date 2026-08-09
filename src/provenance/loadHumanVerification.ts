/**
 * Load Phase-4 human verification records (empty valid when no high claims).
 */
import type { HumanVerificationFile } from "../contract/prov4";
import { humanVerificationFileSchema } from "../contract/prov4.schema";

const PATH = "/benchmarks/prov4/human-verification-records.json";

export async function loadHumanVerification(): Promise<HumanVerificationFile> {
  const response = await fetch(PATH);
  if (!response.ok) {
    throw new Error(
      `Failed to load human verification at ${PATH}: HTTP ${response.status}`,
    );
  }
  const json: unknown = await response.json();
  const parsed = humanVerificationFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid human verification at ${PATH}: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

/**
 * Load source rights decisions (fail-closed Zod parse).
 */
import type { SourceRightsRecordFile } from "../contract/prov4";
import { sourceRightsRecordFileSchema } from "../contract/prov4.schema";

const PATH = "/benchmarks/prov4/source-rights-record.json";

export async function loadSourceRightsRecord(): Promise<SourceRightsRecordFile> {
  const response = await fetch(PATH);
  if (!response.ok) {
    throw new Error(
      `Failed to load source rights record at ${PATH}: HTTP ${response.status}`,
    );
  }
  const json: unknown = await response.json();
  const parsed = sourceRightsRecordFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid source rights record at ${PATH}: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

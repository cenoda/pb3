import type { PartDefinitionV2 } from "../contract/partV2";
import type { PhysicalSpec } from "../contract/phys3";
import {
  PHYS3_PHYSICAL_CORE_IDS,
  PHYS3_VISUAL_ONLY_IDS,
} from "../contract/phys3";
import { physicalSpecSchema } from "../contract/phys3.schema";

const physicalCoreSet = new Set<string>(PHYS3_PHYSICAL_CORE_IDS);
const visualOnlySet = new Set<string>(PHYS3_VISUAL_ONLY_IDS);

export function isPhysicalCorePartId(partId: string): boolean {
  return physicalCoreSet.has(partId);
}

export function isVisualOnlyPartId(partId: string): boolean {
  return visualOnlySet.has(partId);
}

/**
 * Parse nested phys3 physicalSpec from a catalog part.
 * Omitted/invalid → null (visual-only or malformed).
 */
export function loadPhysicalSpec(
  part: PartDefinitionV2,
): PhysicalSpec | null {
  if (!part.physicalSpec) {
    return null;
  }
  const parsed = physicalSpecSchema.safeParse(part.physicalSpec);
  if (!parsed.success) {
    throw new Error(
      `Invalid physicalSpec on ${part.id}: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

export function requirePhysicalCoverageOrNull(
  part: PartDefinitionV2,
): PhysicalSpec | null {
  if (isVisualOnlyPartId(part.id)) {
    if (part.physicalSpec) {
      throw new Error(
        `Visual-only fallback ${part.id} must not declare physicalSpec`,
      );
    }
    return null;
  }
  if (isPhysicalCorePartId(part.id)) {
    const spec = loadPhysicalSpec(part);
    if (!spec) {
      throw new Error(`Physical-core part ${part.id} missing physicalSpec`);
    }
    return spec;
  }
  return loadPhysicalSpec(part);
}

import type {
  CaseCompatSpec,
  CpuCompatSpec,
  GpuCompatSpec,
  MotherboardCompatSpec,
  PsuCompatSpec,
  RamCompatSpec,
} from "../contract/compat2";
import type { PartDefinitionV2 } from "../contract/partV2";
import type { BuildStateV2 } from "../contract/vs2";
import type { PartCatalog } from "../state/validateBuildState";

export interface CompatibilityInputs {
  cpu: CpuCompatSpec | null;
  motherboard: MotherboardCompatSpec | null;
  gpu: GpuCompatSpec | null;
  ram: RamCompatSpec | null;
  psu: PsuCompatSpec | null;
  caseSpec: CaseCompatSpec | null;
  cpuId: string;
  motherboardId: string;
  gpuId: string;
  ramId: string;
  psuId: string;
  caseId: string;
}

function asCpuSpec(part: PartDefinitionV2 | undefined): CpuCompatSpec | null {
  if (!part || part.category !== "cpu" || !part.compatSpec) return null;
  return part.compatSpec as CpuCompatSpec;
}

function asMotherboardSpec(
  part: PartDefinitionV2 | undefined,
): MotherboardCompatSpec | null {
  if (!part || part.category !== "motherboard" || !part.compatSpec) return null;
  return part.compatSpec as MotherboardCompatSpec;
}

function asGpuSpec(part: PartDefinitionV2 | undefined): GpuCompatSpec | null {
  if (!part || part.category !== "gpu" || !part.compatSpec) return null;
  return part.compatSpec as GpuCompatSpec;
}

function asRamSpec(part: PartDefinitionV2 | undefined): RamCompatSpec | null {
  if (!part || part.category !== "ram" || !part.compatSpec) return null;
  return part.compatSpec as RamCompatSpec;
}

function asPsuSpec(part: PartDefinitionV2 | undefined): PsuCompatSpec | null {
  if (!part || part.category !== "psu" || !part.compatSpec) return null;
  return part.compatSpec as PsuCompatSpec;
}

function asCaseSpec(
  part: PartDefinitionV2 | undefined,
): CaseCompatSpec | null {
  if (!part || part.category !== "case" || !part.compatSpec) return null;
  return part.compatSpec as CaseCompatSpec;
}

export function resolveCompatibilityInputs(
  buildState: BuildStateV2,
  catalog: PartCatalog,
): CompatibilityInputs {
  const cpuPart = catalog.get(buildState.cpuId);
  const motherboardPart = catalog.get(buildState.motherboardId);
  const gpuPart = catalog.get(buildState.gpuId);
  const ramPart = catalog.get(buildState.ramId);
  const psuPart = catalog.get(buildState.psuId);
  const casePart = catalog.get(buildState.caseId);

  return {
    cpu: asCpuSpec(cpuPart),
    motherboard: asMotherboardSpec(motherboardPart),
    gpu: asGpuSpec(gpuPart),
    ram: asRamSpec(ramPart),
    psu: asPsuSpec(psuPart),
    caseSpec: asCaseSpec(casePart),
    cpuId: buildState.cpuId,
    motherboardId: buildState.motherboardId,
    gpuId: buildState.gpuId,
    ramId: buildState.ramId,
    psuId: buildState.psuId,
    caseId: buildState.caseId,
  };
}

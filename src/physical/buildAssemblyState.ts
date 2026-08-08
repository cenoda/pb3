import { Matrix4 } from "three";
import type { PartDefinitionV2 } from "../contract/partV2";
import type {
  AssemblyState,
  MountResolution,
  MountSelection,
  MountTransform,
} from "../contract/phys3";
import {
  PHYS3_CONTRACT_VERSION,
  PHYS3_GEOMETRY_DATA_VERSION,
} from "../contract/phys3";
import type { BuildStateV2 } from "../contract/vs2";
import type { PartCatalog } from "../state/validateBuildState";
import type { GlbPhysicalIndex } from "./indexGlbPhysicalNodes";
import { isVisualOnlyPartId, loadPhysicalSpec } from "./loadPhysicalSpec";
import {
  mountTransformToMatrix,
  resolveMount,
} from "./resolveMount";
import { assertAcyclicMountGraph } from "./mountGraph";

export interface AssemblyUserChoices {
  /** Cooler orientation variant id; default = declared default. */
  coolerOrientationId?: string;
}

export interface ResolvedAssemblyPart {
  partId: string;
  category: string;
  transform: MountTransform | null;
  resolution: MountResolution | null;
  /** Root case has null resolution and identity transform. */
  isRoot: boolean;
}

export interface ResolvedAssembly {
  assemblyState: AssemblyState;
  parts: ResolvedAssemblyPart[];
  worldMatrices: Map<string, Matrix4>;
  allMounted: boolean;
  unavailableReasons: string[];
  geometryDataVersion: string;
}

type Slot = {
  category:
    | "case"
    | "motherboard"
    | "cpu"
    | "gpu"
    | "cooler"
    | "ram"
    | "psu";
  partId: string;
  /** Who this slot mounts onto. */
  parentCategory: "case" | "motherboard" | null;
};

function slotsForBuild(build: BuildStateV2): Slot[] {
  return [
    { category: "case", partId: build.caseId, parentCategory: null },
    {
      category: "motherboard",
      partId: build.motherboardId,
      parentCategory: "case",
    },
    { category: "cpu", partId: build.cpuId, parentCategory: "motherboard" },
    { category: "gpu", partId: build.gpuId, parentCategory: "motherboard" },
    {
      category: "cooler",
      partId: build.coolerId,
      parentCategory: "motherboard",
    },
    { category: "ram", partId: build.ramId, parentCategory: "motherboard" },
    { category: "psu", partId: build.psuId, parentCategory: "case" },
  ];
}

function partByCategory(
  catalog: PartCatalog,
  partId: string,
): PartDefinitionV2 | undefined {
  return catalog.get(partId);
}

/**
 * Derive AssemblyState and world transforms from BuildStateV2 + optional
 * declared user mount choices. Detects visual-only coverage and mount failures.
 */
export function buildAssemblyState(
  build: BuildStateV2,
  catalog: PartCatalog,
  glbIndexes: Map<string, GlbPhysicalIndex>,
  userChoices: AssemblyUserChoices = {},
): ResolvedAssembly {
  const slots = slotsForBuild(build);
  assertAcyclicMountGraph(
    slots.map((slot) => ({
      nodeId: slot.category,
      parentId: slot.parentCategory,
    })),
  );
  const mountSelections: MountSelection[] = [];
  const parts: ResolvedAssemblyPart[] = [];
  const worldMatrices = new Map<string, Matrix4>();
  const unavailableReasons: string[] = [];
  let allMounted = true;

  for (const slot of slots) {
    const part = partByCategory(catalog, slot.partId);
    if (!part) {
      allMounted = false;
      unavailableReasons.push(`Part ${slot.partId} missing from catalog.`);
      parts.push({
        partId: slot.partId,
        category: slot.category,
        transform: null,
        resolution: null,
        isRoot: slot.parentCategory === null,
      });
      continue;
    }

    if (isVisualOnlyPartId(part.id) || !loadPhysicalSpec(part)) {
      allMounted = false;
      unavailableReasons.push(
        `Part ${part.id} is visual-only; physical assembly unavailable.`,
      );
      parts.push({
        partId: part.id,
        category: slot.category,
        transform: null,
        resolution: {
          status: "unavailable",
          movingPartId: part.id,
          reason: "missing_physical_spec",
          explanation: `Part ${part.id} lacks phys3 physicalSpec (visual-only fallback).`,
          involvedNodeNames: [],
        },
        isRoot: false,
      });
      continue;
    }

    if (slot.parentCategory === null) {
      const identity: MountTransform = {
        positionMm: [0, 0, 0],
        orientationQuaternion: [0, 0, 0, 1],
      };
      worldMatrices.set(part.id, new Matrix4().identity());
      parts.push({
        partId: part.id,
        category: slot.category,
        transform: identity,
        resolution: null,
        isRoot: true,
      });
      continue;
    }

    const parentSlot = slots.find((s) => s.category === slot.parentCategory);
    const parentPart = parentSlot
      ? partByCategory(catalog, parentSlot.partId)
      : undefined;
    const parentMatrix = parentPart
      ? worldMatrices.get(parentPart.id)
      : undefined;

    if (!parentPart || !parentMatrix) {
      allMounted = false;
      const explanation = `Cannot mount ${part.id}: parent ${slot.parentCategory} is not mounted.`;
      unavailableReasons.push(explanation);
      parts.push({
        partId: part.id,
        category: slot.category,
        transform: null,
        resolution: {
          status: "unavailable",
          movingPartId: part.id,
          reason:
            parentPart && isVisualOnlyPartId(parentPart.id)
              ? "missing_physical_spec"
              : "no_candidate",
          explanation,
          involvedNodeNames: [],
        },
        isRoot: false,
      });
      continue;
    }

    const preferredOrientationId =
      slot.category === "cooler"
        ? userChoices.coolerOrientationId
        : undefined;

    const resolution = resolveMount({
      movingPart: part,
      targetPart: parentPart,
      movingIndex: glbIndexes.get(part.id) ?? null,
      targetIndex: glbIndexes.get(parentPart.id) ?? null,
      preferredOrientationId,
      targetWorldMatrix: parentMatrix,
    });

    if (resolution.status === "unavailable") {
      allMounted = false;
      unavailableReasons.push(resolution.explanation);
      parts.push({
        partId: part.id,
        category: slot.category,
        transform: null,
        resolution,
        isRoot: false,
      });
      continue;
    }

    mountSelections.push(resolution.selection);
    worldMatrices.set(
      part.id,
      mountTransformToMatrix(resolution.transform),
    );
    parts.push({
      partId: part.id,
      category: slot.category,
      transform: resolution.transform,
      resolution,
      isRoot: false,
    });
  }

  const assemblyState: AssemblyState = {
    physicalContractVersion: PHYS3_CONTRACT_VERSION,
    buildStateVersion: "vs2",
    mountSelections,
  };

  return {
    assemblyState,
    parts,
    worldMatrices,
    allMounted,
    unavailableReasons,
    geometryDataVersion: PHYS3_GEOMETRY_DATA_VERSION,
  };
}

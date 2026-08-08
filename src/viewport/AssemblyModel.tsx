import { Suspense } from "react";
import type { MountTransform } from "../contract/phys3";
import type { PartCatalog } from "../state/validateBuildState";
import { MountedPartModel } from "./MountedPartModel";

export interface AssemblyPartPose {
  partId: string;
  transform: MountTransform;
}

interface AssemblyModelProps {
  poses: AssemblyPartPose[];
  catalog: PartCatalog;
}

export function AssemblyModel({ poses, catalog }: AssemblyModelProps) {
  return (
    <Suspense
      fallback={
        <mesh>
          <boxGeometry args={[10, 10, 10]} />
          <meshStandardMaterial color="#666" wireframe />
        </mesh>
      }
    >
      {poses.map((pose) => {
        const part = catalog.get(pose.partId);
        if (!part) return null;
        return (
          <MountedPartModel
            key={pose.partId}
            partId={pose.partId}
            modelGlbPath={part.modelGlbPath}
            transform={pose.transform}
          />
        );
      })}
    </Suspense>
  );
}

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { MountTransform } from "../contract/phys3";

interface MountedPartModelProps {
  partId: string;
  modelGlbPath: string;
  transform: MountTransform;
}

/**
 * Renders visual:* meshes only at the resolver-owned world transform.
 * Does not center independently — mount math owns placement.
 */
export function MountedPartModel({
  partId,
  modelGlbPath,
  transform,
}: MountedPartModelProps) {
  const url = `/${modelGlbPath}`;
  const { scene } = useGLTF(url);

  useEffect(() => {
    return () => {
      useGLTF.clear(url);
    };
  }, [url]);

  const prepared = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (!(child instanceof THREE.Object3D)) return;
      const name = child.name ?? "";
      if (
        name.startsWith("collision:") ||
        name.startsWith("clearance:") ||
        name.startsWith("anchor:") ||
        name.startsWith("socket:")
      ) {
        child.visible = false;
      }
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return cloned;
  }, [scene]);

  const [x, y, z] = transform.positionMm;
  const [qx, qy, qz, qw] = transform.orientationQuaternion;

  return (
    <group
      data-part-id={partId}
      position={[x, y, z]}
      quaternion={[qx, qy, qz, qw]}
    >
      <primitive object={prepared} />
    </group>
  );
}

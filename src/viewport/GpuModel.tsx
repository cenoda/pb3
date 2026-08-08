import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

interface GpuModelProps {
  modelGlbPath: string;
}

export function GpuModel({ modelGlbPath }: GpuModelProps) {
  const url = `/${modelGlbPath}`;
  const { scene } = useGLTF(url);

  useEffect(() => {
    return () => {
      useGLTF.clear(url);
    };
  }, [url]);

  const centeredScene = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    cloned.position.sub(center);
    return cloned;
  }, [scene]);

  return <primitive object={centeredScene} />;
}

useGLTF.preload("/parts/gpu/gpu.rtx4070/model.glb");
useGLTF.preload("/parts/gpu/gpu.rtx4080/model.glb");

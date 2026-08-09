import { Component, type ErrorInfo, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { MountTransform } from "../contract/phys3";
import type { PartCatalog } from "../state/validateBuildState";
import { AssemblyModel, type AssemblyPartPose } from "./AssemblyModel";

interface BuildViewportProps {
  /** Primary GPU id kept for Phase 0/2 test hooks. */
  gpuId: string;
  catalog: PartCatalog;
  poses: AssemblyPartPose[];
  assemblyStatus: string;
}

function ViewportError({ message }: { message: string }) {
  return (
    <div
      data-testid="viewport-error"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1a1a1a",
        color: "#e5e7eb",
        padding: "1.5rem",
        textAlign: "center",
        fontSize: "0.95rem",
        lineHeight: 1.5,
      }}
    >
      {message}
    </div>
  );
}

class GlbErrorBoundary extends Component<
  { children: ReactNode; resetKey: string },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Assembly GLB load failed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      // The technical cause is logged in componentDidCatch; the user gets a
      // sentence they can act on (spec R4).
      return (
        <ViewportError message="The 3D view of this build could not be loaded. Reload the page to try again." />
      );
    }
    return this.props.children;
  }
}

function poseAttr(poses: AssemblyPartPose[]): string {
  return poses
    .map((p) => {
      const t = p.transform;
      return `${p.partId}@${fmt(t)}`;
    })
    .join(";");
}

function fmt(t: MountTransform): string {
  const [x, y, z] = t.positionMm;
  const [qx, qy, qz, qw] = t.orientationQuaternion;
  const r = (n: number) => n.toFixed(3);
  return `${r(x)},${r(y)},${r(z)}|${r(qx)},${r(qy)},${r(qz)},${r(qw)}`;
}

export function BuildViewport({
  gpuId,
  catalog,
  poses,
  assemblyStatus,
}: BuildViewportProps) {
  const gpuPart = catalog.get(gpuId);
  const resetKey = poses.map((p) => p.partId).join(",") + assemblyStatus;

  return (
    <div
      data-testid="build-viewport"
      data-gpu-id={gpuId}
      data-glb-path={gpuPart?.modelGlbPath ?? ""}
      data-assembly-status={assemblyStatus}
      data-assembly-poses={poseAttr(poses)}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "0.5rem",
        overflow: "hidden",
        background: "#111",
      }}
    >
      {poses.length === 0 ? (
        <ViewportError message="These parts cannot be put together, so there is nothing to show here yet. Change a part to see the build." />
      ) : (
        <GlbErrorBoundary resetKey={resetKey}>
          {/* Framed for the full-height stage: the old [560,380,680]/42° pose
              was tuned for a 480 px-tall panel and crops the case here. */}
          <Canvas camera={{ position: [820, 560, 980], fov: 38, far: 6000 }}>
            <color attach="background" args={["#1a1a1a"]} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[100, 200, 100]} intensity={1.2} />
            <AssemblyModel poses={poses} catalog={catalog} />
            <OrbitControls makeDefault target={[0, 220, 0]} />
          </Canvas>
        </GlbErrorBoundary>
      )}
    </div>
  );
}

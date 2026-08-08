import { Component, Suspense, type ErrorInfo, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { PartCatalog } from "../state/validateBuildState";
import { GpuModel } from "./GpuModel";

interface BuildViewportProps {
  gpuId: string;
  catalog: PartCatalog;
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
        color: "#f87171",
        padding: "1rem",
        textAlign: "center",
      }}
    >
      {message}
    </div>
  );
}

/** Catches useGLTF / loader failures so a missing GLB is visible, not a silent stale mesh. */
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
    console.error("GPU GLB load failed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ViewportError
          message={`Failed to load GPU model: ${this.state.error.message}`}
        />
      );
    }
    return this.props.children;
  }
}

export function BuildViewport({ gpuId, catalog }: BuildViewportProps) {
  const gpuPart = catalog.get(gpuId);

  if (!gpuPart) {
    return (
      <div
        data-testid="build-viewport"
        data-gpu-id={gpuId}
        style={{ width: "100%", height: "360px", background: "#111" }}
      >
        <ViewportError message={`GPU part not found in catalog: ${gpuId}`} />
      </div>
    );
  }

  return (
    <div
      data-testid="build-viewport"
      data-gpu-id={gpuId}
      data-glb-path={gpuPart.modelGlbPath}
      style={{ width: "100%", height: "360px", background: "#111" }}
    >
      <GlbErrorBoundary resetKey={gpuId}>
        <Canvas camera={{ position: [0, 80, 180], fov: 45 }}>
          <color attach="background" args={["#1a1a1a"]} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[100, 200, 100]} intensity={1.2} />
          {/* Simple placeholder stand-in for the case mesh (phase-0 allows placeholder scene). */}
          <mesh position={[0, -40, 0]} scale={[120, 4, 80]}>
            <boxGeometry />
            <meshStandardMaterial color="#333" />
          </mesh>
          <Suspense
            fallback={
              <mesh>
                <boxGeometry args={[10, 10, 10]} />
                <meshStandardMaterial color="#666" wireframe />
              </mesh>
            }
          >
            <GpuModel key={gpuId} modelGlbPath={gpuPart.modelGlbPath} />
          </Suspense>
          <OrbitControls makeDefault />
        </Canvas>
      </GlbErrorBoundary>
    </div>
  );
}

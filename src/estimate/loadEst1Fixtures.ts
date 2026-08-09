/**
 * Load est1 sidecar fixtures from /benchmarks/est1/*.
 */
import type {
  CpuScaleEdgeFile,
  VendorPerformanceAnchorFile,
} from "../contract/est1";
import {
  cpuScaleEdgeFileSchema,
  vendorPerformanceAnchorFileSchema,
} from "../contract/est1.schema";

const CPU_SCALE_EDGES_PATH = "/benchmarks/est1/cpu-scale-edges.json";
const VENDOR_ANCHORS_PATH =
  "/benchmarks/est1/vendor-performance-anchors.json";

export interface Est1Fixtures {
  cpuScaleEdges: CpuScaleEdgeFile;
  vendorAnchors: VendorPerformanceAnchorFile;
}

export async function loadCpuScaleEdges(): Promise<CpuScaleEdgeFile> {
  const response = await fetch(CPU_SCALE_EDGES_PATH);
  if (!response.ok) {
    throw new Error(
      `Failed to load CPU scale edges at ${CPU_SCALE_EDGES_PATH}: HTTP ${response.status}`,
    );
  }
  const json: unknown = await response.json();
  const parsed = cpuScaleEdgeFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid CPU scale edges at ${CPU_SCALE_EDGES_PATH}: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

export async function loadVendorPerformanceAnchors(): Promise<VendorPerformanceAnchorFile> {
  const response = await fetch(VENDOR_ANCHORS_PATH);
  if (!response.ok) {
    throw new Error(
      `Failed to load vendor anchors at ${VENDOR_ANCHORS_PATH}: HTTP ${response.status}`,
    );
  }
  const json: unknown = await response.json();
  const parsed = vendorPerformanceAnchorFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid vendor anchors at ${VENDOR_ANCHORS_PATH}: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

export async function loadEst1Fixtures(): Promise<Est1Fixtures> {
  const [cpuScaleEdges, vendorAnchors] = await Promise.all([
    loadCpuScaleEdges(),
    loadVendorPerformanceAnchors(),
  ]);
  return { cpuScaleEdges, vendorAnchors };
}

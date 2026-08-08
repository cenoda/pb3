/**
 * Pure mount-dependency graph helpers.
 * Phase 3 production slots form a fixed DAG (case → mb/psu → children).
 * This validator makes that invariant testable without inventing a public
 * `cyclic_dependency` MountUnavailableReason (not in the accepted phys3 contract).
 */

export interface MountGraphEdge {
  nodeId: string;
  parentId: string | null;
}

/**
 * Returns true when the directed parent edges contain a cycle.
 * Self-parent and mutual/indirect loops are cycles. Null parents are roots.
 */
export function hasMountGraphCycle(edges: MountGraphEdge[]): boolean {
  const parentOf = new Map<string, string | null>();
  for (const edge of edges) {
    parentOf.set(edge.nodeId, edge.parentId);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function dfs(nodeId: string): boolean {
    if (visiting.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visiting.add(nodeId);
    const parent = parentOf.get(nodeId);
    if (parent !== undefined && parent !== null) {
      // Unknown parent ids are treated as external roots (no cycle through them).
      if (parentOf.has(parent) && dfs(parent)) return true;
      // Self-parent
      if (parent === nodeId) return true;
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  }

  for (const nodeId of parentOf.keys()) {
    if (dfs(nodeId)) return true;
  }
  return false;
}

/** Throws if the given mount edges are cyclic (programming / fixture error). */
export function assertAcyclicMountGraph(edges: MountGraphEdge[]): void {
  if (hasMountGraphCycle(edges)) {
    throw new Error(
      "Mount dependency graph contains a cycle; Phase 3 assembly slots must remain a DAG.",
    );
  }
}

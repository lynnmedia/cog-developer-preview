import type { CoreIR } from "../types/ir";

export interface WorkflowQualityMetrics {
  cohesion: number;
  coupling: number;
  graphComplexity: number;
  dependencyDepth: number;
  traceability: number;
}

export class WorkflowQualityMetricsService {
  /**
   * Computes descriptive workflow quality indicators.
   */
  computeMetrics(ir: CoreIR): WorkflowQualityMetrics {
    const totalEntities = ir.entities.length;
    const totalEdges = ir.graph.edges.length;
    const totalNodes = ir.graph.nodes.length;

    // 1. Find connected components in the undirected graph of all nodes
    const graphAdj = new Map<string, string[]>();
    for (const node of ir.graph.nodes) {
      graphAdj.set(node.id, []);
    }
    for (const edge of ir.graph.edges) {
      const fromList = graphAdj.get(edge.from) || [];
      fromList.push(edge.to);
      graphAdj.set(edge.from, fromList);

      const toList = graphAdj.get(edge.to) || [];
      toList.push(edge.from);
      graphAdj.set(edge.to, toList);
    }

    const visitedNodes = new Set<string>();
    const components: string[][] = [];

    for (const node of ir.graph.nodes) {
      if (!visitedNodes.has(node.id)) {
        const component: string[] = [];
        const queue: string[] = [node.id];
        visitedNodes.add(node.id);

        while (queue.length > 0) {
          const curr = queue.shift()!;
          component.push(curr);
          const neighbors = graphAdj.get(curr) || [];
          for (const neighbor of neighbors) {
            if (!visitedNodes.has(neighbor)) {
              visitedNodes.add(neighbor);
              queue.push(neighbor);
            }
          }
        }
        components.push(component);
      }
    }

    const numberOfComponents = components.length;

    // Cohesion
    const cohesion = totalEntities <= 1
      ? 1.0
      : Math.max(0, Math.min(1.0, 1 - (numberOfComponents - 1) / totalEntities));

    // Coupling
    const coupling = totalEntities === 0 ? 0.0 : totalEdges / totalEntities;

    // Graph Complexity
    const graphComplexity = totalNodes === 0
      ? 0
      : Math.max(0, totalEdges - totalNodes + 2 * numberOfComponents);

    // 2. Traceability (entities in components with at least one emit node)
    let traceableEntitiesCount = 0;
    const emitIds = new Set(ir.emissions.map(e => e.id));
    
    const emitNodeIds = new Set(
      ir.graph.nodes.filter(n => n.kind === "emit" || emitIds.has(n.id)).map(n => n.id)
    );

    for (const component of components) {
      const hasEmit = component.some(id => emitNodeIds.has(id));
      if (hasEmit) {
        for (const id of component) {
          const node = ir.graph.nodes.find(n => n.id === id);
          if (node && node.kind === "entity") {
            traceableEntitiesCount++;
          }
        }
      }
    }

    const traceability = totalEntities === 0 ? 1.0 : traceableEntitiesCount / totalEntities;

    // 3. Dependency Depth (longest directed path in entity dependency graph)
    const entityAdj = new Map<string, string[]>();
    for (const ent of ir.entities) {
      entityAdj.set(ent.name, []);
    }

    for (const rel of ir.relations) {
      const list = entityAdj.get(rel.sourceRef) || [];
      if (!list.includes(rel.targetRef)) {
        list.push(rel.targetRef);
        entityAdj.set(rel.sourceRef, list);
      }
    }

    for (const res of ir.resolutions) {
      if (res.resolutionRef) {
        const list = entityAdj.get(res.targetRef) || [];
        if (!list.includes(res.resolutionRef)) {
          list.push(res.resolutionRef);
          entityAdj.set(res.targetRef, list);
        }
      }
    }

    const memo = new Map<string, number>();
    const visited = new Set<string>();

    const getLongestPath = (node: string): number => {
      if (memo.has(node)) return memo.get(node)!;
      if (visited.has(node)) return 0; // Break cycle

      visited.add(node);
      let maxLen = 0;
      const neighbors = entityAdj.get(node) || [];
      for (const neighbor of neighbors) {
        maxLen = Math.max(maxLen, 1 + getLongestPath(neighbor));
      }
      visited.delete(node);
      memo.set(node, maxLen);
      return maxLen;
    };

    let dependencyDepth = 0;
    for (const ent of ir.entities) {
      dependencyDepth = Math.max(dependencyDepth, getLongestPath(ent.name));
    }

    return {
      cohesion,
      coupling,
      graphComplexity,
      dependencyDepth,
      traceability,
    };
  }
}

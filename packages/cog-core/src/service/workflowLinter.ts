import type { CoreIR } from "../types/ir";

export interface LintIssue {
  code: string;
  severity: "warning" | "info";
  message: string;
  target?: string;
}

export class WorkflowLinter {
  /**
   * Lints a compiled workflow IR for structural smells like orphaned entities, circular relations, or redundant transforms.
   */
  lint(ir: CoreIR): LintIssue[] {
    const issues: LintIssue[] = [];

    // 1. Orphaned entities (updated to include view references)
    const referencedEntities = new Set<string>();
    for (const rel of ir.relations) {
      referencedEntities.add(rel.sourceRef);
      referencedEntities.add(rel.targetRef);
    }
    for (const res of ir.resolutions) {
      referencedEntities.add(res.targetRef);
    }
    for (const trans of ir.transformations) {
      referencedEntities.add(trans.targetRef);
    }
    for (const cons of ir.constraints) {
      referencedEntities.add(cons.targetRef);
    }
    for (const emit of ir.emissions) {
      referencedEntities.add(emit.targetRef);
    }
    for (const view of ir.views) {
      referencedEntities.add(view.targetRef);
    }

    const orphanedEntityNames = new Set<string>();
    for (const ent of ir.entities) {
      if (!referencedEntities.has(ent.name)) {
        orphanedEntityNames.add(ent.name);
        issues.push({
          code: "orphaned_entity",
          severity: "warning",
          message: `Entity "${ent.name}" is defined but never referenced in any relations, resolutions, transforms, constraints, views, or emissions.`,
          target: ent.name
        });
      }
    }

    // 2. Unused resolutions
    // A resolution is unused if its target entity is not referenced in any other statement
    // (relations, views, transformations, constraints, emissions).
    const entityReferencesExcludingResolutions = new Set<string>();
    for (const rel of ir.relations) {
      entityReferencesExcludingResolutions.add(rel.sourceRef);
      entityReferencesExcludingResolutions.add(rel.targetRef);
    }
    for (const trans of ir.transformations) {
      entityReferencesExcludingResolutions.add(trans.targetRef);
    }
    for (const cons of ir.constraints) {
      entityReferencesExcludingResolutions.add(cons.targetRef);
    }
    for (const emit of ir.emissions) {
      entityReferencesExcludingResolutions.add(emit.targetRef);
    }
    for (const view of ir.views) {
      entityReferencesExcludingResolutions.add(view.targetRef);
    }

    for (const res of ir.resolutions) {
      if (!entityReferencesExcludingResolutions.has(res.targetRef)) {
        issues.push({
          code: "unused_resolution",
          severity: "warning",
          message: `Resolution for entity "${res.targetRef}" is defined, but the entity is never referenced in any relations, transforms, constraints, views, or emissions.`,
          target: res.targetRef
        });
      }
    }

    // 3. Redundant transforms
    const transformedTargets = new Set<string>();
    for (const trans of ir.transformations) {
      if (transformedTargets.has(trans.targetRef)) {
        issues.push({
          code: "redundant_transform",
          severity: "warning",
          message: `Entity "${trans.targetRef}" has multiple transformations applied. This may be redundant.`,
          target: trans.targetRef
        });
      }
      transformedTargets.add(trans.targetRef);
    }

    // 4. Circular relations
    const adj = new Map<string, string[]>();
    for (const rel of ir.relations) {
      const list = adj.get(rel.sourceRef) || [];
      list.push(rel.targetRef);
      adj.set(rel.sourceRef, list);
    }

    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recStack.add(node);

      const neighbors = adj.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) {
            return true;
          }
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }

      recStack.delete(node);
      return false;
    };

    for (const ent of ir.entities) {
      if (!visited.has(ent.name)) {
        if (hasCycle(ent.name)) {
          issues.push({
            code: "circular_relation",
            severity: "warning",
            message: `Circular dependency loop detected starting from entity "${ent.name}".`,
            target: ent.name
          });
        }
      }
    }

    // 5. Disconnected graphs
    // Find connected components in the execution graph.
    // If a component contains no node of kind "emit", report all entities in it as part of a disconnected graph.
    if (ir.emissions.length > 0) {
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

          // Check if this component has any emit node
          const hasEmit = component.some(nodeId => {
            const n = ir.graph.nodes.find(item => item.id === nodeId);
            return n?.kind === "emit";
          });

          if (!hasEmit) {
            for (const nodeId of component) {
              const n = ir.graph.nodes.find(item => item.id === nodeId);
              if (n && n.kind === "entity" && n.ref && !orphanedEntityNames.has(n.ref)) {
                issues.push({
                  code: "disconnected_graph",
                  severity: "warning",
                  message: `Entity "${n.ref}" is part of a disconnected subgraph that does not lead to any emission.`,
                  target: n.ref
                });
              }
            }
          }
        }
      }
    }

    return issues;
  }
}

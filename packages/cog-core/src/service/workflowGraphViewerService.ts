import type { CoreIR } from "../types/ir";

export interface WorkflowNode {
  id: string;
  label: string;
  kind: string;
  level?: string;
  detail?: string;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  label?: string;
}

export interface WorkflowGraphVisualization {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  mermaidFlowchart: string;
}

export class WorkflowGraphViewerService {
  /**
   * Converts a compiled CoreIR workflow structure into an interactive node/edge visualization layout.
   */
  formatWorkflowForVisualization(ir: CoreIR): WorkflowGraphVisualization {
    const nodes: WorkflowNode[] = [];
    const edges: WorkflowEdge[] = [];

    // Map entities to nodes
    for (const ent of ir.entities) {
      nodes.push({
        id: ent.name,
        label: ent.name,
        kind: "entity",
        level: ent.level,
        detail: `kind: ${ent.entityKind}, level: ${ent.level || "none"}`
      });
    }

    // Map relations to edges
    for (const rel of ir.relations) {
      edges.push({
        from: rel.sourceRef,
        to: rel.targetRef,
        label: `relate: ${rel.relationKind}`
      });
    }

    // Map resolutions to edges
    for (const res of ir.resolutions) {
      edges.push({
        from: res.targetRef,
        to: res.resolutionRef || "resolution-point",
        label: `resolve: ${String(res.level ?? res.value ?? "")}`
      });
    }

    // Map emissions to nodes and edges
    for (const emit of ir.emissions) {
      const emitNodeId = `emit-${emit.id}`;
      edges.push({
        from: emit.targetRef,
        to: emitNodeId,
        label: `emit: ${emit.emissionKind}`
      });
      nodes.push({
        id: emitNodeId,
        label: `Emit: ${emit.emissionKind}`,
        kind: "emission"
      });
    }

    // Construct Mermaid flowchart representation of static workflow
    let mermaid = "graph TD\n";
    for (const node of nodes) {
      const label = node.level ? `${node.label} [${node.level}]` : node.label;
      mermaid += `  ${node.id.replace(/[^a-zA-Z0-9]/g, "_")}["${label}"]\n`;
    }
    for (const edge of edges) {
      const edgeLabel = edge.label ? `|"${edge.label}"|` : "";
      mermaid += `  ${edge.from.replace(/[^a-zA-Z0-9]/g, "_")} -->${edgeLabel} ${edge.to.replace(/[^a-zA-Z0-9]/g, "_")}\n`;
    }

    return {
      nodes,
      edges,
      mermaidFlowchart: mermaid
    };
  }
}

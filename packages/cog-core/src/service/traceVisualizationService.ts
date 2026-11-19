import type { CoreExecutionTrace } from "../types/trace";

export interface TraceNode {
  id: string;
  label: string;
  type: string;
  status: string;
  durationMs: number;
}

export interface TraceEdge {
  from: string;
  to: string;
  label?: string;
}

export interface TraceVisualization {
  runId: string;
  nodes: TraceNode[];
  edges: TraceEdge[];
  mermaidFlowchart: string;
}

export class TraceVisualizationService {
  /**
   * Converts an execution trace into a visualization-ready node/edge hierarchy
   * and generating a Mermaid flowchart string.
   */
  formatTraceForVisualization(trace: CoreExecutionTrace): TraceVisualization {
    const nodes: TraceNode[] = [];
    const edges: TraceEdge[] = [];

    trace.steps.forEach((step, index) => {
      const start = new Date(step.startedAt).getTime();
      const end = new Date(step.completedAt).getTime();
      nodes.push({
        id: step.stepId,
        label: `${step.phase}: ${step.message || step.stepId}`,
        type: step.phase,
        status: step.status,
        durationMs: Math.max(0, end - start)
      });

      if (index > 0) {
        const prevStep = trace.steps[index - 1];
        if (prevStep) {
          edges.push({
            from: prevStep.stepId,
            to: step.stepId,
            label: "next"
          });
        }
      }
    });

    let mermaid = "graph TD\n";
    nodes.forEach((node) => {
      const labelEscaped = node.label.replace(/"/g, '\\"');
      mermaid += `  ${node.id}["${labelEscaped} (${node.status})"]\n`;
    });
    edges.forEach((edge) => {
      mermaid += `  ${edge.from} --> ${edge.to}\n`;
    });

    return {
      runId: trace.runId,
      nodes,
      edges,
      mermaidFlowchart: mermaid
    };
  }
}

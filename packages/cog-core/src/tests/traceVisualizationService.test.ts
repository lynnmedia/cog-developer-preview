import assert from "node:assert/strict";
import test from "node:test";
import { TraceVisualizationService } from "../service/traceVisualizationService";
import type { CoreExecutionTrace } from "../types/trace";

test("TraceVisualizationService formats traces into flowchart nodes/edges and mermaid format", () => {
  const service = new TraceVisualizationService();
  const trace: CoreExecutionTrace = {
    runId: "run-abc",
    startedAt: "2026-07-09T03:00:00.000Z",
    completedAt: "2026-07-09T03:00:02.000Z",
    steps: [
      {
        stepId: "step-1",
        phase: "COMPILE",
        status: "success" as const,
        startedAt: "2026-07-09T03:00:00.000Z",
        completedAt: "2026-07-09T03:00:01.000Z",
        message: "Source compiled successfully"
      },
      {
        stepId: "step-2",
        phase: "EXECUTE",
        status: "success" as const,
        startedAt: "2026-07-09T03:00:01.000Z",
        completedAt: "2026-07-09T03:00:02.000Z",
        message: "Execution complete"
      }
    ]
  };

  const vis = service.formatTraceForVisualization(trace);

  assert.equal(vis.runId, "run-abc");
  assert.equal(vis.nodes.length, 2);
  assert.equal(vis.edges.length, 1);
  assert.ok(vis.mermaidFlowchart.includes("step-1"));
  assert.ok(vis.mermaidFlowchart.includes("step-2"));
  assert.ok(vis.mermaidFlowchart.includes("-->"));
});

import assert from "node:assert/strict";
import test from "node:test";
import { compileCog, lex, parseCog } from "../index";
import { WorkflowGraphViewerService } from "../service/workflowGraphViewerService";

test("WorkflowGraphViewerService formats compiled workflow IR into node/edge structures and Mermaid flowchart", () => {
  const source = `
    define entity "sensor-a" {
      kind: observation
      level: L1
      value: "high"
    }

    define entity "severity-a" {
      kind: alert
      level: L2
      value: "critical"
    }

    relate "sensor-a" -> "severity-a" {
      kind: "severity-escalation"
      operation: "evaluate"
    }

    emit {
      target: "severity-a"
      kind: "alert-emission"
    }
  `;

  const ir = compileCog(parseCog(lex(source)));
  const service = new WorkflowGraphViewerService();
  const viz = service.formatWorkflowForVisualization(ir);

  // Check nodes contain entities
  const entityNodeIds = viz.nodes.filter((n) => n.kind === "entity").map((n) => n.id);
  assert.ok(entityNodeIds.includes("sensor-a"));
  assert.ok(entityNodeIds.includes("severity-a"));

  // Check edges represent the relation
  const edge = viz.edges.find((e) => e.from === "sensor-a" && e.to === "severity-a");
  assert.ok(edge);
  assert.equal(edge?.label, "relate: severity-escalation");

  // Check Mermaid structure
  assert.ok(viz.mermaidFlowchart.includes("sensor_a"));
  assert.ok(viz.mermaidFlowchart.includes("severity_a"));
  assert.ok(viz.mermaidFlowchart.includes("-->"));
});

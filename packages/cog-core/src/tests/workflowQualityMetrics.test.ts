import assert from "node:assert/strict";
import test from "node:test";
import { compileCog, lex, parseCog } from "../index";
import { WorkflowQualityMetricsService } from "../service/workflowQualityMetrics";

test("WorkflowQualityMetricsService computes descriptive workflow quality metrics", () => {
  const service = new WorkflowQualityMetricsService();

  // Test case 1: Standard cohesive workflow with emission
  const source1 = `
    define entity "sensor-a" {
      kind: "observation"
      level: L1
      value: "x"
    }

    define entity "finding-b" {
      kind: "alert"
      level: L2
      value: "y"
    }

    relate "sensor-a" -> "finding-b" {
      kind: "links"
      operation: "relate"
    }

    emit {
      target: "finding-b"
      kind: "report"
    }
  `;
  const ir1 = compileCog(parseCog(lex(source1)));
  const metrics1 = service.computeMetrics(ir1);

  assert.ok(metrics1.cohesion > 0.5);
  assert.ok(metrics1.coupling > 0);
  assert.equal(metrics1.traceability, 1.0); // All entities are reachable to/from the emission

  // Test case 2: Partially disconnected workflow
  const source2 = `
    define entity "sensor-a" {
      kind: "observation"
      level: L1
      value: "x"
    }

    define entity "finding-b" {
      kind: "alert"
      level: L2
      value: "y"
    }

    define entity "isolated-c" {
      kind: "observation"
      level: L1
      value: "z"
    }

    relate "sensor-a" -> "finding-b" {
      kind: "links"
      operation: "relate"
    }

    emit {
      target: "finding-b"
      kind: "report"
    }
  `;
  const ir2 = compileCog(parseCog(lex(source2)));
  const metrics2 = service.computeMetrics(ir2);

  // isolated-c is not connected to the emission or to any other node, so traceability should be 2/3
  assert.ok(metrics2.traceability < 1.0);
  assert.ok(metrics2.cohesion < metrics1.cohesion); // should be less cohesive
});

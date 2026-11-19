import assert from "node:assert/strict";
import test from "node:test";
import { compileCog, lex, parseCog } from "../index";
import { WorkflowLinter } from "../service/workflowLinter";

test("WorkflowLinter detects orphaned entities, redundant transforms, and circular dependencies", () => {
  const linter = new WorkflowLinter();

  // 1. Orphaned entity test
  const orphanedSource = `
    define entity "sensor-a" {
      kind: observation
      level: L1
      value: "x"
    }

    define entity "orphaned-b" {
      kind: observation
      level: L1
      value: "y"
    }

    constrain {
      target: "sensor-a"
      operation: "observe"
    }
  `;
  const irOrphaned = compileCog(parseCog(lex(orphanedSource)));
  const issuesOrphaned = linter.lint(irOrphaned);
  assert.ok(issuesOrphaned.some((i) => i.code === "orphaned_entity" && i.target === "orphaned-b"));

  // 2. Circular dependency test
  const circularSource = `
    define entity "node-a" {
      kind: observation
      level: L1
      value: "x"
    }

    define entity "node-b" {
      kind: observation
      level: L1
      value: "y"
    }

    relate "node-a" -> "node-b" {
      kind: "links"
      operation: "relate"
    }

    relate "node-b" -> "node-a" {
      kind: "links"
      operation: "relate"
    }
  `;
  const irCircular = compileCog(parseCog(lex(circularSource)));
  const issuesCircular = linter.lint(irCircular);
  assert.ok(issuesCircular.some((i) => i.code === "circular_relation"));

  // 3. Unused resolution test
  const unusedResolutionSource = `
    define entity "sensor-a" {
      kind: observation
      level: L1
      value: "x"
    }

    define entity "sensor-b" {
      kind: observation
      level: L1
      value: "y"
    }

    resolve "sensor-b" to L2 {
      operation: "resolve"
    }

    constrain {
      target: "sensor-a"
      operation: "observe"
    }
  `;
  const irUnusedRes = compileCog(parseCog(lex(unusedResolutionSource)));
  const issuesUnusedRes = linter.lint(irUnusedRes);
  assert.ok(issuesUnusedRes.some((i) => i.code === "unused_resolution" && i.target === "sensor-b"));

  // 4. Disconnected graph test
  const disconnectedGraphSource = `
    define entity "main-sensor" {
      kind: observation
      level: L1
      value: "100"
    }

    define entity "dangling-sensor" {
      kind: observation
      level: L1
      value: "200"
    }

    define entity "dangling-report" {
      kind: resolution
      level: L2
      value: "resolved"
    }

    relate "dangling-sensor" -> "dangling-report" {
      kind: "resolves"
      operation: "relate"
    }

    emit {
      target: "main-sensor"
      kind: "json"
    }

  `;
  const irDisconnected = compileCog(parseCog(lex(disconnectedGraphSource)));
  const issuesDisconnected = linter.lint(irDisconnected);
  assert.ok(issuesDisconnected.some((i) => i.code === "disconnected_graph" && i.target === "dangling-sensor"));
  assert.ok(issuesDisconnected.some((i) => i.code === "disconnected_graph" && i.target === "dangling-report"));
  assert.ok(!issuesDisconnected.some((i) => i.code === "disconnected_graph" && i.target === "main-sensor"));

  // 5. View references prevent orphaned entity warning
  const viewSource = `
    define entity "sensor-v" {
      kind: observation
      level: L1
      value: "x"
    }

    view "sensor-v" as advisory {
      operation: "view"
    }
  `;
  const irView = compileCog(parseCog(lex(viewSource)));
  const issuesView = linter.lint(irView);
  assert.ok(!issuesView.some((i) => i.code === "orphaned_entity" && i.target === "sensor-v"));
});

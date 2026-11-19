import assert from "node:assert/strict";
import test from "node:test";
import type { CoreExecutionTrace } from "../types/trace";
import { TraceDiffVisualizer } from "../service/traceDiffVisualizer";

test("TraceDiffVisualizer compares two traces and identifies added, removed, modified steps and timing shifts", () => {
  const traceBefore: CoreExecutionTrace = {
    runId: "run-before",
    startedAt: "2026-07-09T00:00:00.000Z",
    completedAt: "2026-07-09T00:00:03.000Z",
    steps: [
      {
        stepId: "step-1",
        phase: "compile",
        status: "success",
        startedAt: "2026-07-09T00:00:00.000Z",
        completedAt: "2026-07-09T00:00:01.000Z",
        message: "Compile OK"
      },
      {
        stepId: "step-2",
        phase: "validate",
        status: "success",
        startedAt: "2026-07-09T00:00:01.000Z",
        completedAt: "2026-07-09T00:00:02.000Z",
        message: "Validate OK"
      }
    ]
  };

  const traceAfter: CoreExecutionTrace = {
    runId: "run-after",
    startedAt: "2026-07-09T00:00:00.000Z",
    completedAt: "2026-07-09T00:00:04.000Z",
    steps: [
      {
        stepId: "step-1",
        phase: "compile",
        status: "success",
        // Took 2 seconds now
        startedAt: "2026-07-09T00:00:00.000Z",
        completedAt: "2026-07-09T00:00:02.000Z",
        message: "Compile OK"
      },
      // step-2 removed
      {
        stepId: "step-3",
        phase: "execute",
        status: "failed",
        startedAt: "2026-07-09T00:00:02.000Z",
        completedAt: "2026-07-09T00:00:03.000Z",
        message: "Execute Fail"
      }
    ]
  };

  const visualizer = new TraceDiffVisualizer();
  const report = visualizer.compareTraces(traceBefore, traceAfter);

  assert.equal(report.hasChanges, true);
  assert.equal(report.runIdBefore, "run-before");
  assert.equal(report.runIdAfter, "run-after");

  // step-1 is modified (timing shift)
  const diff1 = report.stepDiffs.find((d) => d.stepId === "step-1");
  assert.equal(diff1?.changeType, "modified");
  assert.equal(diff1?.durationDiffMs, 1000); // 2s - 1s = 1s

  // step-2 is removed
  const diff2 = report.stepDiffs.find((d) => d.stepId === "step-2");
  assert.equal(diff2?.changeType, "removed");

  // step-3 is added
  const diff3 = report.stepDiffs.find((d) => d.stepId === "step-3");
  assert.equal(diff3?.changeType, "added");

  // Mermaid check
  assert.ok(report.mermaidDiffFlowchart.includes("classDef addedStyle"));
  assert.ok(report.mermaidDiffFlowchart.includes("step_1"));
});

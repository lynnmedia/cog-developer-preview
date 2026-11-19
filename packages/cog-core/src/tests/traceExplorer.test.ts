import assert from "node:assert/strict";
import test from "node:test";
import type { CoreExecutionTrace } from "../types/trace";
import { TraceExplorer } from "../service/traceExplorer";

test("TraceExplorer provides phase stepping, query filtering, and timing overlays", () => {
  const dummyTrace: CoreExecutionTrace = {
    runId: "trace-run-123",
    startedAt: "2026-07-09T00:00:00.000Z",
    completedAt: "2026-07-09T00:00:05.000Z",
    steps: [
      {
        stepId: "step-1",
        phase: "compile",
        status: "success",
        startedAt: "2026-07-09T00:00:00.000Z",
        completedAt: "2026-07-09T00:00:01.000Z",
        message: "Compiled successfully"
      },
      {
        stepId: "step-2",
        phase: "validate",
        status: "success",
        startedAt: "2026-07-09T00:00:01.000Z",
        completedAt: "2026-07-09T00:00:02.000Z",
        message: "Validated successfully"
      },
      {
        stepId: "step-3",
        phase: "execute",
        status: "failed",
        startedAt: "2026-07-09T00:00:02.000Z",
        completedAt: "2026-07-09T00:00:04.000Z",
        message: "Execution encountered warning"
      }
    ]
  };

  const explorer = new TraceExplorer(dummyTrace);

  // 1. Total duration check
  assert.equal(explorer.getTotalDurationMs(), 5000);

  // 2. Phase stepping check
  const validateSteps = explorer.getStepsByPhase("validate");
  assert.equal(validateSteps.length, 1);
  assert.equal(validateSteps[0]?.stepId, "step-2");

  // 3. Filtering & Timing overlay check
  const failedQuery = explorer.querySteps({ status: "failed" });
  assert.equal(failedQuery.steps.length, 1);
  assert.equal(failedQuery.totalDurationMs, 2000); // 02.000 to 04.000 is 2 seconds
  assert.equal(failedQuery.phaseDurations.execute, 2000);

  // Keyword query
  const keywordQuery = explorer.querySteps({ keyword: "successfully" });
  assert.equal(keywordQuery.steps.length, 2);
  assert.equal(keywordQuery.totalDurationMs, 2000);
});

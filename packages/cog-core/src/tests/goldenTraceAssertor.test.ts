import assert from "node:assert/strict";
import test from "node:test";
import type { CoreExecutionTrace } from "../types/trace";
import { GoldenTraceAssertor } from "../service/goldenTraceAssertor";

test("GoldenTraceAssertor compares actual traces against golden baselines and reports deviations", () => {
  const golden: CoreExecutionTrace = {
    runId: "golden-run",
    startedAt: "2026-07-09T00:00:00.000Z",
    completedAt: "2026-07-09T00:00:02.000Z",
    steps: [
      {
        stepId: "step-1",
        phase: "compile",
        status: "success",
        startedAt: "2026-07-09T00:00:00.000Z",
        completedAt: "2026-07-09T00:00:01.000Z"
      },
      {
        stepId: "step-2",
        phase: "execute",
        status: "success",
        startedAt: "2026-07-09T00:00:01.000Z",
        completedAt: "2026-07-09T00:00:02.000Z"
      }
    ]
  };

  const assertor = new GoldenTraceAssertor();

  // 1. Exact match should pass
  assert.doesNotThrow(() => {
    assertor.assertGoldenTrace(golden, golden);
  });

  // 2. Status mismatch should throw
  const statusMismatch: CoreExecutionTrace = {
    ...golden,
    steps: [
      golden.steps[0]!,
      { ...golden.steps[1]!, status: "failed" }
    ]
  };
  assert.throws(() => {
    assertor.assertGoldenTrace(statusMismatch, golden);
  }, /status mismatch/i);

  // 3. Path drift / missing step should throw
  const pathDrift: CoreExecutionTrace = {
    ...golden,
    steps: [golden.steps[0]!]
  };
  assert.throws(() => {
    assertor.assertGoldenTrace(pathDrift, golden);
  }, /step count mismatch/i);

  // 4. Timing deviation should throw if exceeds threshold
  const timingDeviation: CoreExecutionTrace = {
    ...golden,
    steps: [
      golden.steps[0]!,
      {
        ...golden.steps[1]!,
        // Took 3 seconds instead of 1 second
        startedAt: "2026-07-09T00:00:01.000Z",
        completedAt: "2026-07-09T00:00:04.000Z"
      }
    ]
  };
  assert.throws(() => {
    assertor.assertGoldenTrace(timingDeviation, golden, { maxTimingDeviationMs: 500 });
  }, /timing deviation/i);
});

import assert from "node:assert/strict";
import test from "node:test";
import type { CoreExecutionResult } from "../types/execution";
import { TestReporter } from "../service/testReporter";

test("TestReporter passes on success and formats descriptive assertion errors on failure", () => {
  const reporter = new TestReporter();

  // 1. Success case should pass
  const successResult: CoreExecutionResult = {
    success: true,
    validation: { valid: true, issues: [], errorCount: 0, warningCount: 0 },
    plan: { id: "p1", createdAt: "", steps: [] },
    emissions: [],
    trace: { runId: "r1", startedAt: "", completedAt: "", steps: [] },
    bindings: {},
    errors: []
  };

  assert.doesNotThrow(() => {
    reporter.assertExecutionSuccess(successResult);
  });

  // 2. Failure case should throw rich diagnostic details
  const failureResult: CoreExecutionResult = {
    success: false,
    validation: {
      valid: false,
      errorCount: 1,
      warningCount: 0,
      issues: [
        { code: "missing_target", severity: "error", message: "Target entity 'x' is missing." }
      ]
    },
    plan: { id: "p1", createdAt: "", steps: [] },
    emissions: [],
    trace: {
      runId: "r1",
      startedAt: "2026-07-09T00:00:00.000Z",
      completedAt: "2026-07-09T00:00:02.000Z",
      steps: [
        {
          stepId: "step-validate",
          phase: "validate",
          status: "FAILED",
          startedAt: "2026-07-09T00:00:00.000Z",
          completedAt: "2026-07-09T00:00:01.000Z",
          message: "Validation step failed"
        }
      ]
    },
    bindings: {},
    errors: ["Validation failed structure"]
  };

  assert.throws(() => {
    reporter.assertExecutionSuccess(failureResult);
  }, (err: any) => {
    // Assert rich details are in the exception message
    return (
      err.name === "AssertionError" &&
      err.message.includes("Failing Phase:") &&
      err.message.includes("validate") &&
      err.message.includes("Failing Step ID:") &&
      err.message.includes("step-validate") &&
      err.message.includes("missing_target") &&
      err.message.includes("Validation failed structure")
    );
  });
});

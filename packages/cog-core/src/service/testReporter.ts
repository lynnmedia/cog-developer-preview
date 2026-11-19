import assert from "node:assert/strict";
import type { CoreExecutionResult } from "../types/execution";

export class TestReporter {
  /**
   * Asserts that the execution result succeeded. If not, throws a detailed
   * AssertionError containing execution context, failing phase, and trace details.
   */
  assertExecutionSuccess(result: CoreExecutionResult): void {
    if (result.success) {
      return;
    }

    // Find the first failing step in trace
    const failingStep = result.trace.steps.find((s) => s.status === "FAILED");
    const failingPhase = failingStep?.phase ?? "unknown";
    const failingStepId = failingStep?.stepId ?? "unknown";
    const stepMessage = failingStep?.message ?? "No step error message provided";

    // Collect errors and validation issues
    const errorsList = result.errors.length > 0
      ? result.errors.map((e) => `  - ${e}`).join("\n")
      : "  - None";

    const issuesList = result.validation.issues.length > 0
      ? result.validation.issues.map((i) => `  - [${i.code}] ${i.message}`).join("\n")
      : "  - None";

    const message = `
========================================
Execution Failure Diagnostic Report
========================================
Failing Phase:    ${failingPhase}
Failing Step ID:  ${failingStepId}
Step Error Msg:   ${stepMessage}
----------------------------------------
Runtime Errors:
${errorsList}
----------------------------------------
Validation Issues:
${issuesList}
========================================
`;

    throw new assert.AssertionError({
      message: message.trim(),
      actual: result.success,
      expected: true,
      operator: "strictEqual"
    });
  }
}

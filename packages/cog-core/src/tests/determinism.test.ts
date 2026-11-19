import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, executeCog, type CoreExecutionResult } from "../index";

test("Workflow execution is strictly deterministic over repeated runs", async () => {
  const source = `
define entity "user-request" {
  kind: record
}
define entity "user-profile" {
  kind: record
}
define entity "risk-assessment" {
  kind: record
}

relate "user-request" -> "user-profile" {
  kind: "references"
}

resolve "risk-assessment" to L2 {
  // Empty resolve block
}

emit {
  target: "risk-assessment"
  kind: "assessment-event"
}
  `.trim();

  const ir = compileCog(parseCog(lex(source)));
  const runsCount = 50;
  const results: CoreExecutionResult[] = [];

  for (let i = 0; i < runsCount; i++) {
    const context = {
      runId: `run-${i}`,
      mode: "batch" as const,
      startedAt: new Date(0).toISOString()
    };
    const res = await executeCog(ir, context);
    results.push(res);
  }

  const baseline = results[0];
  assert.ok(baseline.success);

  const sanitizeTrace = (trace: any) => {
    return {
      runId: "sanitized",
      steps: trace.steps.map((s: any) => ({
        id: s.id,
        phase: s.phase,
        status: s.status,
        targetKind: s.targetKind,
        targetId: s.targetId,
        targetRef: s.targetRef,
        inputRefs: s.inputRefs,
        dependsOn: s.dependsOn
      }))
    };
  };

  const baselineSanitizedTrace = sanitizeTrace(baseline.trace);

  for (let i = 1; i < runsCount; i++) {
    const current = results[i];
    
    assert.equal(current.success, baseline.success, `Run ${i} success does not match baseline`);
    assert.deepEqual(current.plan.steps, baseline.plan.steps, `Run ${i} plan steps do not match baseline`);
    assert.deepEqual(current.emissions, baseline.emissions, `Run ${i} emissions do not match baseline`);
    assert.deepEqual(current.bindings, baseline.bindings, `Run ${i} bindings do not match baseline`);
    assert.deepEqual(sanitizeTrace(current.trace), baselineSanitizedTrace, `Run ${i} trace steps do not match baseline`);
  }
});

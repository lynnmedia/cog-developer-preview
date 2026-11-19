import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, executeCog, planCog } from "../index";
import { decisionLibrary } from "../domain/decision/decisionLibrary";

const baseContext = {
  runId: "decision-library-test",
  mode: "batch" as const,
  startedAt: new Date(0).toISOString(),
};

test("Decision analysis domain library generates valid, compilable, and executable .cog code", async () => {
  const params = {
    metricId: "my-metric",
    metricValue: 90,
    optionId: "my-option",
    optionValue: "option-x",
    decisionId: "my-decision",
    decisionValue: "option-x-selected",
    threshold: 80,
  };

  const source = decisionLibrary.generate(params);

  // Verify structure is generated
  assert.ok(source.includes('define entity "my-metric"'));
  assert.ok(source.includes('define entity "my-option"'));
  assert.ok(source.includes('relate "my-metric" -> "my-option"'));
  assert.ok(source.includes('threshold: 80'));
  assert.ok(source.includes('resolve "my-option" to L2'));
  assert.ok(source.includes('emit {'));

  // Test compilation, validation, planning, execution, emissions, and tracing
  const ir = compileCog(parseCog(lex(source)));
  const validation = await validateCog(ir, { context: baseContext });
  assert.equal(validation.valid, true);

  const plan = await planCog(ir, { context: baseContext });
  assert.ok(plan.steps.length > 0);

  const executionResult = await executeCog(ir, baseContext);
  assert.equal(executionResult.success, true);
  assert.ok(executionResult.emissions.length > 0);
  assert.ok(executionResult.trace.steps.length > 0);
});

import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, executeCog, planCog } from "../index";
import { editorialLibrary } from "../domain/editorial/editorialLibrary";

const baseContext = {
  runId: "editorial-library-test",
  mode: "batch" as const,
  startedAt: new Date(0).toISOString(),
};

test("Editorial review domain library generates valid, compilable, and executable .cog code", async () => {
  const params = {
    draftId: "my-draft",
    draftValue: "draft-text",
    goldenId: "my-golden",
    goldenValue: "golden-text",
    driftId: "my-drift-report",
    actionId: "my-reconciliation-action",
    explanationId: "my-explanation-summary",
  };

  const source = editorialLibrary.generate(params);

  // Verify structure is generated
  assert.ok(source.includes('define entity "my-draft"'));
  assert.ok(source.includes('define entity "my-golden"'));
  assert.ok(source.includes('relate "my-draft" -> "my-golden"'));
  assert.ok(source.includes('relate "my-draft" -> "my-drift-report"'));
  assert.ok(source.includes('resolve "my-drift-report" to L2'));
  assert.ok(source.includes('relate "my-drift-report" -> "my-reconciliation-action"'));
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

import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, executeCog, planCog } from "../index";
import { auditLibrary } from "../domain/audit/auditLibrary";

const baseContext = {
  runId: "audit-library-test",
  mode: "batch" as const,
  startedAt: new Date(0).toISOString(),
};

test("Audit domain library generates valid, compilable, and executable .cog code", async () => {
  const params = {
    repoRootId: "my-repo",
    repoRootVal: "my-workspace",
    findings: [
      { id: "finding-1", value: "finding-x" },
      { id: "finding-2", value: "finding-y" },
    ],
    severityId: "my-severity",
    severityVal: "high",
  };

  const source = auditLibrary.generate(params);

  // Verify structure is generated
  assert.ok(source.includes('define entity "my-repo"'));
  assert.ok(source.includes('define entity "finding-1"'));
  assert.ok(source.includes('relate "my-repo" -> "finding-1"'));
  assert.ok(source.includes('relate "finding-1" -> "finding-2"'));
  assert.ok(source.includes('resolve "finding-1" to L2'));
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

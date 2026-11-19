import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, executeCog } from "../index";
import { planningLibrary } from "../domain/planning/planningLibrary";

test("Planning domain library generates valid, compilable, and executable .cog code", async () => {
  const source = planningLibrary.generate({
    goalId: "plan-goal",
    goalVal: "Setup cognitive kernel library package",
    riskId: "plan-risk",
    riskVal: "Risk of dependency circular import",
    resolutionId: "res-planning",
    resolutionVal: "Step-by-step decoupling plan formulated"
  });

  // Verify generated code structure
  assert.ok(source.includes('define entity "plan-goal"'));
  assert.ok(source.includes('define entity "plan-risk"'));
  assert.ok(source.includes('define entity "res-planning"'));

  // Run pipeline
  const ir = compileCog(parseCog(lex(source)));
  const validation = await validateCog(ir, {
    context: { runId: "test-plan", mode: "batch", startedAt: new Date(0).toISOString() }
  });
  assert.equal(validation.valid, true);

  const result = await executeCog(ir, {
    runId: "test-plan",
    mode: "batch",
    startedAt: new Date(0).toISOString()
  });
  assert.equal(result.success, true);
  assert.equal(result.emissions[0]?.target, "res-planning");
});

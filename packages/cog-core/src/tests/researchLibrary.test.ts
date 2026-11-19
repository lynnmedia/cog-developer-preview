import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, executeCog, planCog } from "../index";
import { researchLibrary } from "../domain/research/researchLibrary";

const baseContext = {
  runId: "research-library-test",
  mode: "batch" as const,
  startedAt: new Date(0).toISOString(),
};

test("Research synthesis domain library generates valid, compilable, and executable .cog code", async () => {
  const params = {
    sources: [
      { id: "src-1", value: "observation-1" },
      { id: "src-2", value: "observation-2" },
    ],
    claims: [
      { id: "claim-1", sourceId: "src-1", value: "extracted-claim-1" },
      { id: "claim-2", sourceId: "src-2", value: "extracted-claim-2" },
    ],
    clusterId: "synthesis-cluster",
    clusterValue: "grouped-claims",
    resolutionId: "final-resolution",
    resolutionValue: "synthesized-conclusion",
  };

  const source = researchLibrary.generate(params);
  
  // Verify structure is generated
  assert.ok(source.includes('define entity "src-1"'));
  assert.ok(source.includes('define entity "claim-1"'));
  assert.ok(source.includes('relate "src-1" -> "claim-1"'));
  assert.ok(source.includes('relate "claim-1" -> "synthesis-cluster"'));
  assert.ok(source.includes('resolve "synthesis-cluster" to L4'));
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

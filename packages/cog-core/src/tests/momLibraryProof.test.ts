import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, planCog, executeCog } from "../index";
import { momLibraryProof } from "../domain/proofs/momLibraryProof";
import { momAdapter } from "../../../cog-adapter-mom/src/momAdapter";

const baseContext = {
  runId: "mom-library-proof-test",
  mode: "batch" as const,
  startedAt: new Date(0).toISOString(),
};

test("MoM domain library proof compiles, plans, and executes correctly with momAdapter", async () => {
  const params = {
    entityId: "mom-target",
    entityVal: "mom-payload-data",
    resolutionLevel: "L3" as const,
  };

  const source = momLibraryProof.generate(params);

  // Compile
  const ir = compileCog(parseCog(lex(source)));

  // Validate
  const validation = await validateCog(ir, { context: baseContext, adapter: momAdapter });
  assert.equal(validation.valid, true);

  // Plan - verify that the momAdapter successfully enriched the plan with the step-mom-verify step
  const plan = await planCog(ir, { context: baseContext, adapter: momAdapter });
  const hasMomVerifyStep = plan.steps.some((s) => s.id === "step-mom-verify");
  assert.equal(hasMomVerifyStep, true);

  // Execute
  const executionResult = await executeCog(ir, baseContext, momAdapter);
  assert.equal(executionResult.success, true);
});

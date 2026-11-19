import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, planCog, executeCog } from "../index";
import { decisionAdapterLibraryProof } from "../domain/proofs/decisionAdapterLibraryProof";
import { decisionAdapter } from "../../../cog-adapter-decision/src/decisionAdapter";

const baseContext = {
  runId: "decision-adapter-proof-test",
  mode: "batch" as const,
  startedAt: new Date(0).toISOString(),
};

test("Decision domain library proof compiles, plans, and executes correctly with decisionAdapter", async () => {
  const params = {
    metricId: "dec-metric",
    metricValue: 85,
    optionId: "dec-option",
    decisionId: "dec-decision",
    threshold: 80,
  };

  const source = decisionAdapterLibraryProof.generate(params);

  // Compile
  const ir = compileCog(parseCog(lex(source)));

  // Validate
  const validation = await validateCog(ir, { context: baseContext, adapter: decisionAdapter });
  assert.equal(validation.valid, true);

  // Plan - verify that the decisionAdapter successfully enriched the plan with the step-decision-verify step
  const plan = await planCog(ir, { context: baseContext, adapter: decisionAdapter });
  const hasDecisionVerifyStep = plan.steps.some((s) => s.id === "step-decision-verify");
  assert.equal(hasDecisionVerifyStep, true);

  // Execute
  const executionResult = await executeCog(ir, baseContext, decisionAdapter);
  assert.equal(executionResult.success, true);
});

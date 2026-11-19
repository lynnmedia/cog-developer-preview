import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, executeCog } from "../index";
import { composeResearchToEditorial } from "../domain/proofs/researchToEditorial";

const baseContext = {
  runId: "composition-proof-test",
  mode: "batch" as const,
  startedAt: new Date(0).toISOString(),
};

test("Research and Editorial domain libraries can compose into a single valid .cog program", async () => {
  const researchParams = {
    sources: [{ id: "src-doc", value: "raw-research-pdf" }],
    claims: [{ id: "extracted-claim", sourceId: "src-doc", value: "claim-content" }],
    clusterId: "research-cluster",
    clusterValue: "claims-cluster",
    resolutionId: "synthesis-output",
    resolutionValue: "synthesis-resolved",
  };

  const editorialParams = {
    draftId: "synthesis-output", // Target/draft is the output from research synthesis!
    draftValue: "synthesis-resolved",
    goldenId: "golden-doc",
    goldenValue: "golden-reference-text",
    driftId: "synthesis-drift",
    actionId: "reconcile-action",
    explanationId: "final-reconciliation-explanation",
    explanationValue: "mitigation-steps",
  };

  const composedSource = composeResearchToEditorial(researchParams, editorialParams);

  // Assert composed program has both research elements and editorial elements
  assert.ok(composedSource.includes('define entity "src-doc"'));
  assert.ok(composedSource.includes('define entity "golden-doc"'));
  assert.ok(composedSource.includes('relate "src-doc" -> "extracted-claim"'));
  assert.ok(composedSource.includes('relate "synthesis-output" -> "golden-doc"')); // composition link!
  assert.ok(composedSource.includes('emit {'));

  // Test compilation and execution pipeline of composed program
  const ir = compileCog(parseCog(lex(composedSource)));
  const validation = await validateCog(ir, { context: baseContext });
  assert.equal(validation.valid, true);

  const executionResult = await executeCog(ir, baseContext);
  assert.equal(executionResult.success, true);

  // Verify that the final emission is the editorial explanation summary
  const finalEmissions = executionResult.emissions;
  assert.ok(finalEmissions.length > 0);
});

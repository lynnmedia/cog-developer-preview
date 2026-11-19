import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, executeCog } from "../index";
import { CogDomainBuilder } from "../builder/cogDomainBuilder";

test("CogDomainBuilder constructs valid research and planning programs using helpers", async () => {
  const builder = new CogDomainBuilder()
    .researchPattern({
      sources: [{ id: "src-1", value: "Source 1 details" }],
      claims: [{ id: "claim-1", sourceId: "src-1", value: "Claim 1 details" }],
      clusterId: "cluster-1",
      clusterValue: "Cluster details",
      resolutionId: "res-1",
      resolutionValue: "Final conclusion"
    })
    .planningPattern({
      goalId: "goal-1",
      goalValue: "Achieve performance baseline",
      riskId: "risk-1",
      riskValue: "Hardware limitations",
      planId: "plan-1",
      planValue: "Run tests in parallel"
    });

  const source = builder.build();

  // Verify elements are present
  assert.ok(source.includes('define entity "src-1"'));
  assert.ok(source.includes('define entity "claim-1"'));
  assert.ok(source.includes('define entity "goal-1"'));
  assert.ok(source.includes('define entity "plan-1"'));

  const ir = compileCog(parseCog(lex(source)));
  const validation = await validateCog(ir, {
    context: { runId: "test-domain-builder", mode: "batch", startedAt: new Date(0).toISOString() }
  });
  assert.equal(validation.valid, true);

  const result = await executeCog(ir, {
    runId: "test-domain-builder",
    mode: "batch",
    startedAt: new Date(0).toISOString()
  });
  assert.equal(result.success, true);
});

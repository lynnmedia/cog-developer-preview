import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, executeCog } from "../index";
import { composeGraphToResearch } from "../domain/proofs/graphToResearch";

const baseContext = {
  runId: "graph-to-research-proof-test",
  mode: "batch" as const,
  startedAt: new Date(0).toISOString(),
};

test("Knowledge graph outputs can support research synthesis patterns in a single composed .cog program", async () => {
  const graphParams = {
    sensorId: "log-sensor",
    profiles: [{ id: "host-profile", value: "host-ip" }],
    clusterId: "activity-cluster",
    explanationId: "correlated-incident", // Pipes into research!
    explanationVal: "unusual-traffic-detected",
  };

  const researchParams = {
    sources: [{ id: "correlated-incident", value: "unusual-traffic-detected" }], // shared!
    claims: [{ id: "extracted-attacker-profile", sourceId: "correlated-incident", value: "attacker-signature" }],
    clusterId: "threat-cluster",
    resolutionId: "mitigation-strategy",
  };

  const composedSource = composeGraphToResearch(graphParams, researchParams);

  // Verify elements are composed correctly
  assert.ok(composedSource.includes('define entity "log-sensor"'));
  assert.ok(composedSource.includes('define entity "threat-cluster"'));
  assert.ok(composedSource.includes('relate "correlated-incident" -> "extracted-attacker-profile"'));
  assert.ok(composedSource.includes('resolve "threat-cluster" to L4'));
  assert.ok(composedSource.includes('emit {'));

  // Test compilation and execution pipeline of composed program
  const ir = compileCog(parseCog(lex(composedSource)));
  const validation = await validateCog(ir, { context: baseContext });
  assert.equal(validation.valid, true);

  const executionResult = await executeCog(ir, baseContext);
  assert.equal(executionResult.success, true);
});

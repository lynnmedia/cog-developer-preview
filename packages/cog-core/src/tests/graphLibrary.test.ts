import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, executeCog, planCog } from "../index";
import { graphLibrary } from "../domain/graph/graphLibrary";

const baseContext = {
  runId: "graph-library-test",
  mode: "batch" as const,
  startedAt: new Date(0).toISOString(),
};

test("Knowledge graph domain library generates valid, compilable, and executable .cog code", async () => {
  const params = {
    sensorId: "my-sensor",
    sensorVal: "log-data",
    profiles: [
      { id: "my-profile-1", value: "user-a" },
      { id: "my-profile-2", value: "host-b" },
    ],
    clusterId: "my-cluster",
    clusterVal: "group-ab",
    explanationId: "my-explanation",
    explanationVal: "correlation-details",
  };

  const source = graphLibrary.generate(params);

  // Verify structure is generated
  assert.ok(source.includes('define entity "my-sensor"'));
  assert.ok(source.includes('define entity "my-profile-1"'));
  assert.ok(source.includes('relate "my-sensor" -> "my-profile-1"'));
  assert.ok(source.includes('relate "my-profile-1" -> "my-profile-2"'));
  assert.ok(source.includes('relate "my-profile-1" -> "my-cluster"'));
  assert.ok(source.includes('resolve "my-cluster" to L3'));
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

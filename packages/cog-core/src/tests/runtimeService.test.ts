import assert from "node:assert/strict";
import test from "node:test";
import { RuntimeService } from "../service/runtimeService";

test("RuntimeService executes valid source code", async () => {
  const service = new RuntimeService();
  const source = `
    define entity "a" { kind: item }
    emit { target: "a" kind: "out" }
  `;
  const context = { runId: "srv-test-1", mode: "batch" as const, startedAt: new Date(0).toISOString() };
  const result = await service.executeWorkflow(source, context);

  assert.equal(result.success, true);
  assert.equal(result.emissions.length, 1);
  assert.equal(result.emissions[0].target, "a");
});

test("RuntimeService executes domain library with params", async () => {
  const service = new RuntimeService();
  const context = { runId: "srv-test-2", mode: "batch" as const, startedAt: new Date(0).toISOString() };
  
  const result = await service.executeDomainLibrary("cog:domain:research", {
    sources: [{ id: "src-1", value: "contemplation-text" }],
    claims: [{ id: "claim-1", sourceId: "src-1", value: "extracted-claim" }],
    clusterId: "my-cluster",
    clusterValue: "claims-cluster",
    resolutionId: "res-out",
    resolutionValue: "final-res"
  }, context);

  assert.equal(result.success, true);
  assert.equal(result.emissions[0].target, "res-out");
});

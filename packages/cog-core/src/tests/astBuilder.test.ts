import assert from "node:assert/strict";
import test from "node:test";
import { compileCog, validateCog, executeCog } from "../index";
import { CogAstBuilder } from "../builder/cogAstBuilder";

test("CogAstBuilder constructs a valid AST and compiles/executes directly", async () => {
  const ast = new CogAstBuilder()
    .entity("raw-obs", {
      kind: "observation",
      level: "L1",
      value: "pressure-reading-high"
    })
    .entity("classified-risk", {
      kind: "finding",
      level: "L2",
      value: "overpressure-risk"
    })
    .relate("raw-obs", "classified-risk", {
      kind: "classified-as",
      operation: "classify"
    })
    .resolve("classified-risk", "L2", {
      operation: "resolve",
      reason: "high-pressure"
    })
    .constrain("raw-obs", "observe")
    .emit("classified-risk", "audit-report")
    .build();

  // Test compilation directly from the built AST
  const ir = compileCog(ast);
  assert.ok(ir);
  assert.equal(ir.entities.length, 2);

  const validation = await validateCog(ir, {
    context: { runId: "test-ast-builder", mode: "batch", startedAt: new Date(0).toISOString() }
  });
  assert.equal(validation.valid, true);

  const result = await executeCog(ir, {
    runId: "test-ast-builder",
    mode: "batch",
    startedAt: new Date(0).toISOString()
  });

  assert.equal(result.success, true);
  assert.equal(result.emissions[0]?.target, "classified-risk");
});

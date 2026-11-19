import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, executeCog } from "../index";
import { CogProgramBuilder } from "../builder/cogProgramBuilder";

test("CogProgramBuilder constructs a valid program with entities, relations, constraints, resolutions and emissions", async () => {
  const program = new CogProgramBuilder()
    .entity("raw-obs", {
      kind: "observation",
      level: "L1",
      value: "temperature-reading-high"
    })
    .entity("classified-risk", {
      kind: "finding",
      level: "L2",
      value: "overheating-risk"
    })
    .relate("raw-obs", "classified-risk", {
      kind: "classified-as",
      operation: "classify"
    })
    .resolve("classified-risk", "L2", {
      operation: "resolve",
      reason: "high-temperature"
    })
    .constrain("raw-obs", "observe")
    .emit("classified-risk", "audit-report")
    .build();

  // Verify the output string shape
  assert.ok(program.includes('define entity "raw-obs"'));
  assert.ok(program.includes('define entity "classified-risk"'));
  assert.ok(program.includes('relate "raw-obs" -> "classified-risk"'));
  assert.ok(program.includes('resolve "classified-risk" to L2'));
  assert.ok(program.includes('constrain'));
  assert.ok(program.includes('emit'));

  // Test compilation and validation
  const tokens = lex(program);
  const ast = parseCog(tokens);
  const ir = compileCog(ast);
  const validation = await validateCog(ir, {
    context: { runId: "test-builder", mode: "batch", startedAt: new Date(0).toISOString() }
  });

  assert.equal(validation.valid, true);

  const result = await executeCog(ir, {
    runId: "test-builder",
    mode: "batch",
    startedAt: new Date(0).toISOString()
  });

  assert.equal(result.success, true);
  assert.equal(result.emissions[0]?.target, "classified-risk");
});

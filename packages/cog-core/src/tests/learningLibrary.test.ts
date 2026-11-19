import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, executeCog } from "../index";
import { learningLibrary } from "../domain/learning/learningLibrary";

test("Learning domain library generates valid, compilable, and executable .cog code", async () => {
  const source = learningLibrary.generate({
    gapId: "learn-gap",
    gapVal: "Gap in understanding AST node mapping",
    conceptId: "learn-concept",
    conceptVal: "Abstract Syntax Tree structures in compilers",
    resolutionId: "res-learning",
    resolutionVal: "Understanding of AST node shapes verified"
  });

  // Verify generated code structure
  assert.ok(source.includes('define entity "learn-gap"'));
  assert.ok(source.includes('define entity "learn-concept"'));
  assert.ok(source.includes('define entity "res-learning"'));

  // Run pipeline
  const ir = compileCog(parseCog(lex(source)));
  const validation = await validateCog(ir, {
    context: { runId: "test-learn", mode: "batch", startedAt: new Date(0).toISOString() }
  });
  assert.equal(validation.valid, true);

  const result = await executeCog(ir, {
    runId: "test-learn",
    mode: "batch",
    startedAt: new Date(0).toISOString()
  });
  assert.equal(result.success, true);
  assert.equal(result.emissions[0]?.target, "res-learning");
});

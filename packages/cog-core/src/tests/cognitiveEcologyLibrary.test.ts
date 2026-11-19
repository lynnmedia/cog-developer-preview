import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, executeCog } from "../index";
import { cognitiveEcologyLibrary } from "../domain/cognitiveEcology/cognitiveEcologyLibrary";

test("Cognitive Ecology domain library generates valid, compilable, and executable .cog code", async () => {
  const source = cognitiveEcologyLibrary.generate({
    actorId: "actor-agent",
    actorVal: "AI programming assistant",
    constraintId: "constraint-boundary",
    constraintVal: "Strict sandboxing of file system access",
    explanationId: "exp-ecology",
    explanationVal: "Governance loop maintaining safety constraints."
  });

  // Verify generated code structure
  assert.ok(source.includes('define entity "actor-agent"'));
  assert.ok(source.includes('define entity "constraint-boundary"'));
  assert.ok(source.includes('define entity "exp-ecology"'));

  // Run pipeline
  const ir = compileCog(parseCog(lex(source)));
  const validation = await validateCog(ir, {
    context: { runId: "test-eco", mode: "batch", startedAt: new Date(0).toISOString() }
  });
  assert.equal(validation.valid, true);

  const result = await executeCog(ir, {
    runId: "test-eco",
    mode: "batch",
    startedAt: new Date(0).toISOString()
  });
  assert.equal(result.success, true);
  assert.equal(result.emissions[0]?.target, "exp-ecology");
});

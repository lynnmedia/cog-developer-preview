import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, executeCog } from "../index";
import { devotionalIntelligenceLibrary } from "../domain/devotionalIntelligence/devotionalIntelligenceLibrary";

test("Devotional Intelligence domain library generates valid, compilable, and executable .cog code", async () => {
  const source = devotionalIntelligenceLibrary.generate({
    sourceTextId: "text-contemplation",
    sourceTextVal: "Reflecting on patience and community attention.",
    insightId: "insight-patience",
    insightVal: "Patience opens space for listening.",
    reflectionId: "res-reflection",
    reflectionVal: "Reflective contemplation on patient interaction."
  });

  // Verify generated code structure
  assert.ok(source.includes('define entity "text-contemplation"'));
  assert.ok(source.includes('define entity "insight-patience"'));
  assert.ok(source.includes('define entity "res-reflection"'));

  // Run pipeline
  const ir = compileCog(parseCog(lex(source)));
  const validation = await validateCog(ir, {
    context: { runId: "test-di", mode: "batch", startedAt: new Date(0).toISOString() }
  });
  assert.equal(validation.valid, true);

  const result = await executeCog(ir, {
    runId: "test-di",
    mode: "batch",
    startedAt: new Date(0).toISOString()
  });
  assert.equal(result.success, true);
  assert.equal(result.emissions[0]?.target, "res-reflection");
});

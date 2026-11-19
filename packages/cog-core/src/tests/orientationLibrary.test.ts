import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, executeCog } from "../index";
import { orientationLibrary } from "../domain/orientation/orientationLibrary";

test("Orientation domain library generates valid, compilable, and executable .cog code", async () => {
  const source = orientationLibrary.generate({
    observationId: "obs-situation",
    observationVal: "Heavy user workload and timeline constraints.",
    tensionId: "tension-capacity",
    tensionVal: "Tension between speed and quality.",
    resolutionId: "res-orientation",
    resolutionVal: "Guided priority list and clear boundaries."
  });

  // Verify generated code structure
  assert.ok(source.includes('define entity "obs-situation"'));
  assert.ok(source.includes('define entity "tension-capacity"'));
  assert.ok(source.includes('define entity "res-orientation"'));

  // Run pipeline
  const ir = compileCog(parseCog(lex(source)));
  const validation = await validateCog(ir, {
    context: { runId: "test-orient", mode: "batch", startedAt: new Date(0).toISOString() }
  });
  assert.equal(validation.valid, true);

  const result = await executeCog(ir, {
    runId: "test-orient",
    mode: "batch",
    startedAt: new Date(0).toISOString()
  });
  assert.equal(result.success, true);
  assert.equal(result.emissions[0]?.target, "res-orientation");
});

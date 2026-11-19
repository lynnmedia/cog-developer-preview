import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, executeCog } from "../index";
import { governanceLibrary } from "../domain/governance/governanceLibrary";

test("Governance domain library generates valid, compilable, and executable .cog code", async () => {
  const source = governanceLibrary.generate({
    scopeId: "gov-scope",
    scopeVal: "Verification of external system access rules",
    evidenceId: "gov-evidence",
    evidenceVal: "System logs show compliant authorization",
    resolutionId: "res-governance",
    resolutionVal: "Governance criteria evaluated: approved"
  });

  // Verify generated code structure
  assert.ok(source.includes('define entity "gov-scope"'));
  assert.ok(source.includes('define entity "gov-evidence"'));
  assert.ok(source.includes('define entity "res-governance"'));

  // Run pipeline
  const ir = compileCog(parseCog(lex(source)));
  const validation = await validateCog(ir, {
    context: { runId: "test-gov", mode: "batch", startedAt: new Date(0).toISOString() }
  });
  assert.equal(validation.valid, true);

  const result = await executeCog(ir, {
    runId: "test-gov",
    mode: "batch",
    startedAt: new Date(0).toISOString()
  });
  assert.equal(result.success, true);
  assert.equal(result.emissions[0]?.target, "res-governance");
});

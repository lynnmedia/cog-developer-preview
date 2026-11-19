import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, executeCog } from "../index";
import { composeAuditToDecision } from "../domain/proofs/auditToDecision";

const baseContext = {
  runId: "audit-to-decision-proof-test",
  mode: "batch" as const,
  startedAt: new Date(0).toISOString(),
};

test("Audit findings can flow into decision-analysis patterns in a single composed .cog program", async () => {
  const auditParams = {
    repoRootId: "audit-repo",
    repoRootVal: "my-audit-repo",
    findings: [{ id: "finding-critical-vuln", value: "cve-2026-critical" }],
    severityId: "audit-severity-metric", // Pipes into decision!
    severityVal: 95, // severity numeric value
  };

  const decisionParams = {
    metricId: "audit-severity-metric", // shared metric!
    metricValue: 95,
    optionId: "selected-action",
    optionValue: "deploy-blocker",
    decisionId: "deployment-gate-decision",
    decisionValue: "block-deployment",
    threshold: 80,
  };

  const composedSource = composeAuditToDecision(auditParams, decisionParams);

  // Verify elements are composed correctly
  assert.ok(composedSource.includes('define entity "audit-repo"'));
  assert.ok(composedSource.includes('define entity "finding-critical-vuln"'));
  assert.ok(composedSource.includes('define entity "deployment-gate-decision"'));
  assert.ok(composedSource.includes('relate "audit-severity-metric" -> "selected-action"'));
  assert.ok(composedSource.includes('threshold: 80'));
  assert.ok(composedSource.includes('emit {'));

  // Test compilation and execution pipeline of composed program
  const ir = compileCog(parseCog(lex(composedSource)));
  const validation = await validateCog(ir, { context: baseContext });
  assert.equal(validation.valid, true);

  const executionResult = await executeCog(ir, baseContext);
  assert.equal(executionResult.success, true);
});

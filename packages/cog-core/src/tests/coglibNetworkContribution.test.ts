import assert from "node:assert/strict";
import test from "node:test";
import {
  NodeContribution,
  composeMultiNodeContributions,
} from "../index";

test("HDCP-COG-MULTI-NODE-CONTRIBUTION-MODEL-050: Multi-node contribution composition preserves disagreements and authority differences without voting collapse", () => {
  const nodeAContrib: NodeContribution = {
    contributionId: "contrib:node-a:1",
    contributingNodeId: "node:safety-auditor:01",
    authorityLevel: "project",
    payloadSummary: "Static safety checks: PASS on memory safety",
    epistemicConfidence: 0.95,
    sourceAnchors: ["audit/rust-memory-check.log"],
    surfacedTensions: [],
    qualifications: [],
    submittedAt: "2026-08-18T20:30:00Z",
  };

  const nodeBContrib: NodeContribution = {
    contributionId: "contrib:node-b:1",
    contributingNodeId: "node:chaos-tester:02",
    authorityLevel: "project",
    payloadSummary: "Concurrency fuzzing: FAIL with deadlocks detected under load",
    epistemicConfidence: 0.9,
    sourceAnchors: ["audit/thread-fuzzing.log"],
    surfacedTensions: ["Direct conflict: memory safe code experiences lock-order inversion deadlock"],
    qualifications: ["Observed only under >64 core concurrency"],
    submittedAt: "2026-08-18T20:35:00Z",
  };

  const nodeCContrib: NodeContribution = {
    contributionId: "contrib:node-c:1",
    contributingNodeId: "node:canonical-registry:03",
    authorityLevel: "canonical",
    payloadSummary: "Compliance policy requires formal mutex hierarchy",
    epistemicConfidence: 1.0,
    sourceAnchors: ["policy/mutex-order-rfc-009.md"],
    surfacedTensions: [],
    qualifications: [],
    submittedAt: "2026-08-18T20:36:00Z",
  };

  const shared = composeMultiNodeContributions(
    "shared:obj:kernel-concurrency-audit",
    "concurrency_audit_report",
    "kernel:threading",
    [nodeAContrib, nodeBContrib, nodeCContrib],
  );

  // 1. Contributions Remain Individually Reconstructable
  assert.equal(shared.contributions.length, 3);
  assert.equal(shared.contributions[0]!.contributingNodeId, "node:safety-auditor:01");
  assert.equal(shared.contributions[1]!.contributingNodeId, "node:chaos-tester:02");
  assert.equal(shared.contributions[2]!.contributingNodeId, "node:canonical-registry:03");

  // 2. Evidence Conflicts Preserved (Not Voted Down)
  assert.equal(shared.evidenceConflicts.length, 1);
  assert.equal(shared.evidenceConflicts[0]!.dimension, "substantive_claim");
  assert.ok(shared.evidenceConflicts[0]!.description.includes("PASS"));
  assert.ok(shared.evidenceConflicts[0]!.description.includes("FAIL"));

  // 3. Authority Differences Preserved
  assert.equal(shared.authorityDifferences.length, 3);
  const canonicalEntry = shared.authorityDifferences.find((a) => a.nodeId === "node:canonical-registry:03")!;
  assert.equal(canonicalEntry.authorityLevel, "canonical");

  // 4. Complementary Perspectives Recorded
  assert.ok(shared.complementaryFindings.length >= 1);

  // 5. Unresolved Tensions Maintained & Composed Confidence Bounded
  assert.ok(shared.unresolvedTensions.length >= 1);
  assert.ok(shared.composedConfidence <= 0.65); // Bounded due to active conflict
});

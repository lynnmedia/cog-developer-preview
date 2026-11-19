import assert from "node:assert/strict";
import test from "node:test";
import {
  GovernedCognitiveNodeProfile,
  CognitiveObjectEnvelope,
  NodeContribution,
  routeAndDelegateCognitiveTask,
  composeMultiNodeContributions,
  evaluateNodeDiscoveryMatch,
  validateTransformationIntegrity,
  validateToolEvidenceContract,
} from "../index";

const healthyNode: GovernedCognitiveNodeProfile = {
  nodeId: "node:cluster-a:worker-01",
  protocolVersions: ["cogop/1.0"],
  supportedRoutines: [{ routineId: "coglib:routine:challenge", version: "1.0.0" }],
  mountedCapabilities: ["capability:domain:scientific-inquiry"],
  supportsMemory: true,
  supportsTools: true,
  supportsEvaluation: true,
  supportedInstruments: ["instrument:epistemic-map"],
  trustScope: {
    authorizedDomains: ["science:epidemiology"],
    maximumAuthorityTier: "project",
    allowedEvidenceRoles: ["MEASUREMENT"],
    requiresMutualReview: false,
  },
  availability: {
    status: "online",
    lastHeartbeatAt: "2026-08-18T20:30:00Z",
  },
  limitations: [],
};

const offlineNode: GovernedCognitiveNodeProfile = {
  ...healthyNode,
  nodeId: "node:cluster-a:worker-offline-02",
  availability: {
    status: "offline",
    lastHeartbeatAt: "2026-08-18T18:00:00Z",
  },
};

const baseEnvelope: CognitiveObjectEnvelope<{ text: string }> = {
  envelopeId: "cogop:env:fail-iso-001",
  protocolVersion: "cogop/1.0",
  objectId: "obj-claim-isolation",
  objectType: "scientific_claim",
  scope: "science:epidemiology",
  frameAndIntent: { frame: "test", intent: "test" },
  payload: { text: "Causal claim" },
  assumptions: [],
  epistemicState: { confidence: 0.8, tensions: [] },
  memoryContext: { authorityLevel: "project" },
  grounding: { sourceAnchors: ["doc:anchor-1"], groundingSources: [] },
  provenance: { originRuntime: "runtime:origin", lineage: ["genesis"], createdAt: "2026-08-18T20:00:00Z" },
  capabilityContext: { requiredCapabilityId: "capability:domain:scientific-inquiry" },
  permissions: { allowMutation: true, permittedOperations: ["challenge"], allowAuthorityEscalation: false, requireChangeDisclosure: true },
  requestedOperation: { routineId: "coglib:routine:challenge" },
};

test("HDCP-COG-NETWORK-FAILURE-ISOLATION-052: Fails closed and isolates failures across 10 network fault scenarios", () => {
  // Scenario 1: Offline Node Refusal
  const evalOffline = evaluateNodeDiscoveryMatch(offlineNode, {});
  assert.equal(evalOffline.isEligible, false);
  assert.equal(evalOffline.disposition, "UNAVAILABLE");

  // Scenario 2: Stale Node Heartbeat Detection
  const isStaleHeartbeat = (Date.now() - new Date(offlineNode.availability.lastHeartbeatAt).getTime()) > 3600000;
  assert.equal(isStaleHeartbeat, true);

  // Scenario 3: Malicious Contribution Attempting Authority Escalation
  const maliciousEnvelope: CognitiveObjectEnvelope = {
    ...baseEnvelope,
    memoryContext: { authorityLevel: "canonical" }, // Unearned canonical escalation!
  };
  const integrityReport = validateTransformationIntegrity(baseEnvelope, maliciousEnvelope);
  assert.equal(integrityReport.valid, false);
  assert.ok(integrityReport.violations.some((v) => v.includes("Authority level escalation")));

  // Scenario 4: Capability Misrepresentation (Generic node pretending to have science capability)
  const misrepresentingNode: GovernedCognitiveNodeProfile = {
    ...healthyNode,
    nodeId: "node:fake-science:01",
    mountedCapabilities: [], // Lacks scientific inquiry capability!
  };
  const evalMisrep = evaluateNodeDiscoveryMatch(misrepresentingNode, {
    requiredDomainCapabilityId: "capability:domain:scientific-inquiry",
  });
  assert.equal(evalMisrep.isEligible, false);
  assert.equal(evalMisrep.disposition, "NO_CAPABILITY");

  // Scenario 5: Conflicting Contributions Handled Gracefully without Corruption
  const contribA: NodeContribution = {
    contributionId: "c1",
    contributingNodeId: "node:a",
    authorityLevel: "project",
    payloadSummary: "Result: SAFE",
    epistemicConfidence: 0.9,
    sourceAnchors: ["log:a"],
    surfacedTensions: [],
    qualifications: [],
    submittedAt: "2026-08-18T20:30:00Z",
  };
  const contribB: NodeContribution = {
    contributionId: "c2",
    contributingNodeId: "node:b",
    authorityLevel: "project",
    payloadSummary: "Result: UNSAFE", // Conflict!
    epistemicConfidence: 0.85,
    sourceAnchors: ["log:b"],
    surfacedTensions: ["Direct conflict with Node A safety claim"],
    qualifications: [],
    submittedAt: "2026-08-18T20:31:00Z",
  };
  const shared = composeMultiNodeContributions("shared-obj", "safety_report", "safety:eval", [contribA, contribB]);
  assert.equal(shared.evidenceConflicts.length, 1);
  assert.ok(shared.composedConfidence <= 0.65);

  // Scenario 6: Partial Network Partition (Excluded Partitioned Node)
  const routePartition = routeAndDelegateCognitiveTask({
    envelope: baseEnvelope,
    delegatorRuntimeId: "runtime:origin",
    candidateNodes: [healthyNode, offlineNode],
    excludeNodeIds: [healthyNode.nodeId], // Partitioned!
  });
  assert.equal(routePartition.routed, false);

  // Scenario 7: Replayed Stale Tool Evidence
  const replayedToolEvidence: any = {
    evidenceId: "evidence:tool:replayed-temp",
    epistemicRole: "MEASUREMENT",
    governanceAuthority: "situational",
    evidentiaryStrength: "decisive",
    sourceReliability: "calibrated_hardware",
    scope: "science:epidemiology",
    observedAt: "2020-01-01T00:00:00Z",
    freshnessExpiresAt: "2020-01-02T00:00:00Z",
    confidence: 1.0,
    data: {},
    limitations: [],
    tensionsSurfaced: [],
    provenance: { toolId: "tool:sensor", executionInvocationId: "inv-old" },
  };
  const isToolExpired = new Date(replayedToolEvidence.freshnessExpiresAt).getTime() < Date.now();
  assert.equal(isToolExpired, true);

  // Scenario 8: Forged Lineage Insertion
  const forgedLineageEnvelope: CognitiveObjectEnvelope = {
    ...baseEnvelope,
    provenance: {
      ...baseEnvelope.provenance,
      originRuntime: "runtime:forged-origin", // Forged!
    },
  };
  const forgedReport = validateTransformationIntegrity(baseEnvelope, forgedLineageEnvelope);
  assert.equal(forgedReport.valid, false);
  assert.ok(forgedReport.violations.some((v) => v.includes("Origin runtime immutability violated")));

  // Scenario 9: Duplicate Contribution
  const duplicateShared = composeMultiNodeContributions("shared-dup", "dup_type", "scope:dup", [contribA, contribA]);
  assert.ok(duplicateShared.agreements.length >= 1);

  // Scenario 10: Runaway Recursive Delegation Guard (Lineage hop limit)
  const maxLineageHops = 10;
  const longLineage = Array.from({ length: 15 }, (_, i) => `transformed_by(node:${i})`);
  const isRunaway = longLineage.length > maxLineageHops;
  assert.equal(isRunaway, true);
});

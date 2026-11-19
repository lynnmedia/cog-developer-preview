import assert from "node:assert/strict";
import test from "node:test";
import {
  CognitiveObjectEnvelope,
  GovernedCognitiveNodeProfile,
  routeAndDelegateCognitiveTask,
} from "../index";

const scienceNode: GovernedCognitiveNodeProfile = {
  nodeId: "node:science-lab:01",
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
    allowedEvidenceRoles: ["MEASUREMENT", "CALCULATION"],
    requiresMutualReview: false,
  },
  availability: {
    status: "online",
    lastHeartbeatAt: "2026-08-18T20:35:00Z",
  },
  limitations: [],
};

const genericNode: GovernedCognitiveNodeProfile = {
  nodeId: "node:generic:02",
  protocolVersions: ["cogop/1.0"],
  supportedRoutines: [{ routineId: "coglib:routine:shape", version: "1.0.0" }],
  mountedCapabilities: [],
  supportsMemory: true,
  supportsTools: false,
  supportsEvaluation: true,
  supportedInstruments: [],
  trustScope: {
    authorizedDomains: ["*"],
    maximumAuthorityTier: "project",
    allowedEvidenceRoles: ["RETRIEVED_DOCUMENT"],
    requiresMutualReview: false,
  },
  availability: {
    status: "online",
    lastHeartbeatAt: "2026-08-18T20:35:00Z",
  },
  limitations: [],
};

const envelope: CognitiveObjectEnvelope<{ statement: string }> = {
  envelopeId: "cogop:env:task-routing-001",
  protocolVersion: "cogop/1.0",
  objectId: "obj-claim-vaccine",
  objectType: "scientific_claim",
  scope: "science:epidemiology",
  frameAndIntent: { frame: "causal_challenge", intent: "Challenge confounder controls" },
  payload: { statement: "Observational cohort claims vaccine efficacy" },
  assumptions: [],
  epistemicState: { confidence: 0.8, tensions: [] },
  grounding: { sourceAnchors: ["nejm-2024.pdf"], groundingSources: ["doc:nejm"] },
  provenance: { originRuntime: "runtime:origin-node", lineage: ["genesis"], createdAt: "2026-08-18T20:00:00Z" },
  capabilityContext: { requiredCapabilityId: "capability:domain:scientific-inquiry" },
  permissions: { allowMutation: true, permittedOperations: ["challenge"], allowAuthorityEscalation: false, requireChangeDisclosure: true },
  requestedOperation: { routineId: "coglib:routine:challenge" },
};

test("HDCP-COG-NETWORK-ROUTING-AND-DELEGATION-049: Governed routing selects qualified node and issues provenance-bearing delegation ticket", () => {
  const result = routeAndDelegateCognitiveTask({
    envelope,
    delegatorRuntimeId: "runtime:origin-node",
    candidateNodes: [genericNode, scienceNode],
  });

  assert.equal(result.routed, true);
  assert.equal(result.selectedNodeId, "node:science-lab:01");

  const ticket = result.delegationTicket!;
  assert.ok(ticket);
  assert.equal(ticket.targetNodeId, "node:science-lab:01");
  assert.equal(ticket.delegatingRuntime, "runtime:origin-node");
  assert.equal(ticket.delegatedRoutineId, "coglib:routine:challenge");
  assert.equal(ticket.grantedAuthorityTier, "project");
  assert.ok(ticket.delegatedCapabilities.includes("capability:domain:scientific-inquiry"));
  assert.ok(ticket.failureIsolationDomain.includes("isolation:science:epidemiology"));
});

test("HDCP-COG-NETWORK-ROUTING-AND-DELEGATION-049: Refuses unsuitable or excluded nodes", () => {
  // Exclude the science node for failure-isolation or conflict reasons
  const result = routeAndDelegateCognitiveTask({
    envelope,
    delegatorRuntimeId: "runtime:origin-node",
    candidateNodes: [genericNode, scienceNode],
    excludeNodeIds: ["node:science-lab:01"],
  });

  assert.equal(result.routed, false);
  assert.equal(result.selectedNodeId, undefined);
  assert.ok(result.routingRationale.includes("No qualified node found"));
});

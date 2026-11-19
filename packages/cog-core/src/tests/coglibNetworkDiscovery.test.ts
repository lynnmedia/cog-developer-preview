import assert from "node:assert/strict";
import test from "node:test";
import {
  GovernedCognitiveNodeProfile,
  evaluateNodeDiscoveryMatch,
  discoverEligibleNodes,
} from "../index";

const scienceNode: GovernedCognitiveNodeProfile = {
  nodeId: "node:science-lab:01",
  protocolVersions: ["cogop/1.0"],
  supportedRoutines: [
    { routineId: "coglib:routine:shape", version: "1.0.0" },
    { routineId: "coglib:routine:challenge", version: "1.0.0" },
  ],
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

const busyNode: GovernedCognitiveNodeProfile = {
  ...scienceNode,
  nodeId: "node:science-lab:busy-02",
  availability: {
    status: "busy",
    queueDepth: 12,
    lastHeartbeatAt: "2026-08-18T20:35:00Z",
  },
};

const offlineNode: GovernedCognitiveNodeProfile = {
  ...scienceNode,
  nodeId: "node:science-lab:offline-03",
  availability: {
    status: "offline",
    lastHeartbeatAt: "2026-08-18T19:00:00Z",
  },
};

const oldProtocolNode: GovernedCognitiveNodeProfile = {
  ...scienceNode,
  nodeId: "node:legacy:old-04",
  protocolVersions: ["cogop/0.9"],
};

test("HDCP-COG-NETWORK-CAPABILITY-DISCOVERY-048: Evaluates node discovery across all 6 standard dispositions", () => {
  // 1. MATCH: Online science node matches all requirements
  const evalMatch = evaluateNodeDiscoveryMatch(scienceNode, {
    requiredRoutineId: "coglib:routine:challenge",
    requiredDomainCapabilityId: "capability:domain:scientific-inquiry",
    targetScope: "science:epidemiology",
    demandedAuthorityTier: "project",
    requiredEvidenceRole: "MEASUREMENT",
  });
  assert.equal(evalMatch.disposition, "MATCH");
  assert.equal(evalMatch.isEligible, true);

  // 2. MATCH_WITH_QUALIFICATION: Node is busy
  const evalBusy = evaluateNodeDiscoveryMatch(busyNode, {
    requiredRoutineId: "coglib:routine:challenge",
    requiredDomainCapabilityId: "capability:domain:scientific-inquiry",
  });
  assert.equal(evalBusy.disposition, "MATCH_WITH_QUALIFICATION");
  assert.equal(evalBusy.isEligible, true);
  assert.ok(evalBusy.qualifications.some((q) => q.includes("busy")));

  // 3. NO_CAPABILITY: Demanded music capability on science node
  const evalNoCap = evaluateNodeDiscoveryMatch(scienceNode, {
    requiredDomainCapabilityId: "capability:domain:music",
  });
  assert.equal(evalNoCap.disposition, "NO_CAPABILITY");
  assert.equal(evalNoCap.isEligible, false);

  // 4. TRUST_INSUFFICIENT: Demanded canonical authority on project-tier node
  const evalTrust = evaluateNodeDiscoveryMatch(scienceNode, {
    demandedAuthorityTier: "canonical", // Exceeds node's project tier!
  });
  assert.equal(evalTrust.disposition, "TRUST_INSUFFICIENT");
  assert.equal(evalTrust.isEligible, false);

  // 5. VERSION_INCOMPATIBLE: Legacy protocol version
  const evalVersion = evaluateNodeDiscoveryMatch(oldProtocolNode, {
    requiredProtocolVersion: "cogop/1.0",
  });
  assert.equal(evalVersion.disposition, "VERSION_INCOMPATIBLE");
  assert.equal(evalVersion.isEligible, false);

  // 6. UNAVAILABLE: Offline node
  const evalOffline = evaluateNodeDiscoveryMatch(offlineNode, {});
  assert.equal(evalOffline.disposition, "UNAVAILABLE");
  assert.equal(evalOffline.isEligible, false);

  // Pool Discovery
  const pool = [scienceNode, busyNode, offlineNode, oldProtocolNode];
  const results = discoverEligibleNodes(pool, { requiredDomainCapabilityId: "capability:domain:scientific-inquiry" });
  assert.equal(results.filter((r) => r.isEligible).length, 2);
});

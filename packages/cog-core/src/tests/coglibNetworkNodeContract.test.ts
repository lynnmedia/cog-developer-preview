import assert from "node:assert/strict";
import test from "node:test";
import {
  GovernedCognitiveNodeProfile,
  validateGovernedNodeProfile,
} from "../index";

test("HDCP-COG-NODE-IDENTITY-AND-CAPABILITY-047: Governed cognitive node contract cleanly decouples identity, capabilities, trust scopes, and availability", () => {
  // Node Profile 1: Science Specialist Node (Hosts scientific inquiry domain capability)
  const scienceNode: GovernedCognitiveNodeProfile = {
    nodeId: "node:science-consortium:verifier-alpha",
    protocolVersions: ["cogop/1.0"],
    supportedRoutines: [
      { routineId: "coglib:routine:shape", version: "1.0.0" },
      { routineId: "coglib:routine:challenge", version: "1.0.0" },
    ],
    mountedCapabilities: ["capability:domain:scientific-inquiry"], // Distinct from nodeId!
    supportsMemory: true,
    supportsTools: true,
    supportsEvaluation: true,
    supportedInstruments: ["instrument:epistemic-map", "instrument:tension-field"],
    trustScope: {
      authorizedDomains: ["science:epidemiology", "science:genomics"],
      maximumAuthorityTier: "project",
      allowedEvidenceRoles: ["MEASUREMENT", "CALCULATION", "RETRIEVED_DOCUMENT"],
      requiresMutualReview: false,
    },
    availability: {
      status: "online",
      queueDepth: 2,
      concurrencyLimit: 8,
      lastHeartbeatAt: "2026-08-18T20:30:00Z",
    },
    limitations: ["Cannot adjudicate financial or cryptographic assertions"],
  };

  const report1 = validateGovernedNodeProfile(scienceNode);
  assert.equal(report1.valid, true);

  // Node Profile 2: Memory & Archival Storage Node
  const archivalNode: GovernedCognitiveNodeProfile = {
    nodeId: "node:foundation:canonical-vault",
    protocolVersions: ["cogop/1.0"],
    supportedRoutines: [
      { routineId: "coglib:routine:compare", version: "1.0.0" },
      { routineId: "coglib:routine:trace", version: "1.0.0" },
    ],
    mountedCapabilities: [],
    supportsMemory: true,
    supportsTools: false,
    supportsEvaluation: false,
    supportedInstruments: ["instrument:provenance-lineage", "instrument:drift-lens"],
    trustScope: {
      authorizedDomains: ["*"],
      maximumAuthorityTier: "canonical", // Authorized for canonical truth storage
      allowedEvidenceRoles: ["AUTHORITATIVE_RECORD"],
      requiresMutualReview: true,
    },
    availability: {
      status: "online",
      lastHeartbeatAt: "2026-08-18T20:30:00Z",
    },
    limitations: ["Read-only historical perspective"],
  };

  const report2 = validateGovernedNodeProfile(archivalNode);
  assert.equal(report2.valid, true);
});

test("HDCP-COG-NODE-IDENTITY-AND-CAPABILITY-047: Validator enforces node identity != capability identity and rejects malformed nodes", () => {
  // Invariant Violation: Conflating Node ID with Capability ID
  const conflatedNode: GovernedCognitiveNodeProfile = {
    nodeId: "capability:domain:scientific-inquiry" as any, // Invalid prefix + conflation!
    protocolVersions: ["cogop/1.0"],
    supportedRoutines: [{ routineId: "coglib:routine:challenge", version: "1.0.0" }],
    mountedCapabilities: ["capability:domain:scientific-inquiry"],
    supportsMemory: true,
    supportsTools: true,
    supportsEvaluation: true,
    supportedInstruments: [],
    trustScope: {
      authorizedDomains: ["science"],
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

  const report1 = validateGovernedNodeProfile(conflatedNode);
  assert.equal(report1.valid, false);
  assert.ok(report1.defects.some((d) => d.includes("node:")));

  // Node with valid prefix but identical to capability
  const conflatedMountedNode: GovernedCognitiveNodeProfile = {
    ...conflatedNode,
    nodeId: "node:science-cap",
    mountedCapabilities: ["node:science-cap"], // Conflation
  };
  const report2 = validateGovernedNodeProfile(conflatedMountedNode);
  assert.equal(report2.valid, false);
  assert.ok(report2.defects.some((d) => d.includes("CONFLATION: nodeId")));
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  GovernedCognitiveNodeProfile,
  evaluateMultidimensionalTrust,
} from "../index";

const genomicsNode: GovernedCognitiveNodeProfile = {
  nodeId: "node:genomics-institute:sequencer-01",
  protocolVersions: ["cogop/1.0"],
  supportedRoutines: [{ routineId: "coglib:routine:shape", version: "1.0.0" }],
  mountedCapabilities: ["capability:domain:scientific-inquiry"],
  supportsMemory: true,
  supportsTools: true,
  supportsEvaluation: true,
  supportedInstruments: ["instrument:epistemic-map"],
  trustScope: {
    authorizedDomains: ["science:genomics", "science:biology"],
    maximumAuthorityTier: "project",
    allowedEvidenceRoles: ["MEASUREMENT", "CALCULATION"],
    requiresMutualReview: false,
  },
  availability: {
    status: "online",
    lastHeartbeatAt: "2026-08-18T20:30:00Z",
  },
  limitations: [],
};

test("HDCP-COG-NETWORK-TRUST-AND-AUTHORITY-051: Multidimensional trust models domain, evidence, and authority dimensions orthogonally without scalar collapse", () => {
  // Context 1: Valid task matching genomics domain & measurement evidence
  const validReport = evaluateMultidimensionalTrust(genomicsNode, {
    targetDomain: "science:genomics",
    evidenceRole: "MEASUREMENT",
    demandedAuthority: "project",
  });
  assert.equal(validReport.isAdmissible, true);
  assert.equal(validReport.domainCompetence, "authoritative");
  assert.equal(validReport.evidentiaryTrust, "trusted_primary");
  assert.equal(validReport.trustConstraints.length, 0);

  // Context 2: Domain divergence — node presented with cryptography task
  const cryptoReport = evaluateMultidimensionalTrust(genomicsNode, {
    targetDomain: "security:cryptography", // Outside genomics/biology!
  });
  assert.equal(cryptoReport.isAdmissible, false);
  assert.equal(cryptoReport.domainCompetence, "unauthorized");
  assert.ok(cryptoReport.trustConstraints.some((c) => c.includes("not authorized for domain")));

  // Context 3: Evidence role divergence — node presented with disallowed heuristic model inference
  const heuristicReport = evaluateMultidimensionalTrust(genomicsNode, {
    targetDomain: "science:genomics",
    evidenceRole: "HEURISTIC", // Not in allowedEvidenceRoles!
  });
  assert.equal(heuristicReport.isAdmissible, false);
  assert.equal(heuristicReport.evidentiaryTrust, "untrusted");
  assert.ok(heuristicReport.trustConstraints.some((c) => c.includes("untrusted for node")));

  // Context 4: Authority escalation rejection — node asked to assert canonical truth
  const canonicalReport = evaluateMultidimensionalTrust(genomicsNode, {
    targetDomain: "science:genomics",
    demandedAuthority: "canonical", // Exceeds node's project tier!
  });
  assert.equal(canonicalReport.isAdmissible, false);
  assert.ok(canonicalReport.trustConstraints.some((c) => c.includes("exceeds node maximum")));
});

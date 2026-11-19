import assert from "node:assert/strict";
import test from "node:test";
import {
  CognitiveObjectEnvelope,
  CognitiveCapabilityProfile,
  validateCognitiveObjectEnvelope,
  negotiateCognitiveTask,
  validateTransformationIntegrity,
  validateToolEvidenceContract,
  evaluateToolEvidenceInfluence,
} from "../index";

const validBaseEnvelope: CognitiveObjectEnvelope<{ rule: string }> = {
  envelopeId: "cogop:env:security-rule-001",
  protocolVersion: "cogop/1.0",
  objectId: "obj-security-rule",
  objectType: "security_rule",
  scope: "security:access_control",
  frameAndIntent: { frame: "security_policy", intent: "Enforce zero trust" },
  payload: { rule: "Deny all by default" },
  assumptions: ["Network is hostile"],
  epistemicState: {
    confidence: 0.7,
    tensions: ["Legacy protocol does not support mTLS"],
  },
  grounding: {
    sourceAnchors: ["docs/security-rfc-001.md"],
    groundingSources: ["doc:sec-rfc-001"],
  },
  provenance: {
    originRuntime: "runtime:security-node:origin",
    lineage: ["genesis", "policy:v1"],
    createdAt: "2026-08-18T20:00:00Z",
  },
  memoryContext: {
    authorityLevel: "inferred",
  },
  permissions: {
    allowMutation: false,
    permittedOperations: ["challenge"],
    allowAuthorityEscalation: false,
    requireChangeDisclosure: true,
  },
};

test("HDCP-COG-PROTOCOL-FAILURE-AND-ADVERSARIAL-PROOF-038: Fails closed across 10 adversarial and deceptive attack vectors", () => {
  // Vector 1: Stripped Provenance
  const strippedProvenance: CognitiveObjectEnvelope = {
    ...validBaseEnvelope,
    provenance: { originRuntime: "", lineage: [], createdAt: "" },
  };
  const rep1 = validateCognitiveObjectEnvelope(strippedProvenance);
  assert.equal(rep1.valid, false);
  assert.ok(rep1.defects.some((d) => d.includes("provenance.originRuntime")));

  // Vector 2: False Capability Claim (Generic node claiming science capability)
  const genericProfile: CognitiveCapabilityProfile = {
    runtimeId: "runtime:node-generic",
    supportedProtocolVersions: ["cogop/1.0"],
    supportedRoutines: [{ routineId: "coglib:routine:challenge", version: "1.0.0" }],
    mountedCapabilities: [], // No science capability!
    supportedEvidenceRoles: ["MEASUREMENT"],
    supportsMemory: true,
    supportsEvaluation: true,
    allowsMutations: true,
  };
  const negResult = negotiateCognitiveTask(
    {
      ...validBaseEnvelope,
      capabilityContext: { requiredCapabilityId: "capability:domain:scientific-inquiry" },
    },
    genericProfile,
  );
  assert.equal(negResult.canExecute, false);
  assert.equal(negResult.disposition, "REQUIRES_CAPABILITY");

  // Vector 3: Identity Substitution
  const substitutedEnvelope: CognitiveObjectEnvelope = {
    ...validBaseEnvelope,
    objectId: "obj-substituted-malicious-target",
  };
  const rep3 = validateTransformationIntegrity(validBaseEnvelope, substitutedEnvelope);
  assert.equal(rep3.valid, false);
  assert.ok(rep3.violations.some((v) => v.includes("Concept Identity violated")));

  // Vector 4: Confidence Inflation without new anchors
  const inflatedEnvelope: CognitiveObjectEnvelope = {
    ...validBaseEnvelope,
    epistemicState: { confidence: 0.99, tensions: validBaseEnvelope.epistemicState.tensions },
  };
  const rep4 = validateTransformationIntegrity(validBaseEnvelope, inflatedEnvelope);
  assert.equal(rep4.valid, false);
  assert.ok(rep4.violations.some((v) => v.includes("Confidence inflation detected")));

  // Vector 5: Tension Deletion / Suppression
  const tensionDeletedEnvelope: CognitiveObjectEnvelope = {
    ...validBaseEnvelope,
    epistemicState: { confidence: 0.7, tensions: [] }, // Deleted legacy mTLS tension!
  };
  const rep5 = validateTransformationIntegrity(validBaseEnvelope, tensionDeletedEnvelope);
  assert.equal(rep5.valid, false);
  assert.ok(rep5.violations.some((v) => v.includes("Unresolved tension suppressed")));

  // Vector 6: Unsupported Protocol Version
  const badVersionEnvelope: any = {
    ...validBaseEnvelope,
    protocolVersion: "cogop/6.0",
  };
  const rep6 = validateCognitiveObjectEnvelope(badVersionEnvelope);
  assert.equal(rep6.valid, false);
  assert.ok(rep6.defects.some((d) => d.includes("Unsupported protocolVersion")));

  // Vector 7: Forged Tool Evidence
  const forgedToolEvidence: any = {
    evidenceId: "unprefixed-id",
    epistemicRole: "INVALID_ROLE",
    governanceAuthority: "canonical",
    evidentiaryStrength: "decisive",
    sourceReliability: "authoritative_registry",
    scope: "security:access_control",
    observedAt: "2026-08-18T20:00:00Z",
    confidence: 1.0,
    data: {},
    limitations: [],
    tensionsSurfaced: [],
    provenance: {}, // Missing toolId & executionInvocationId
  };
  const rep7 = validateToolEvidenceContract(forgedToolEvidence);
  assert.equal(rep7.valid, false);
  assert.ok(rep7.defects.some((d) => d.includes("evidence:tool:")));
  assert.ok(rep7.defects.some((d) => d.includes("epistemicRole")));

  // Vector 8: Authority Escalation Attempt
  const escalatedEnvelope: CognitiveObjectEnvelope = {
    ...validBaseEnvelope,
    memoryContext: { authorityLevel: "canonical" }, // Attempted escalation from inferred to canonical!
  };
  const rep8 = validateTransformationIntegrity(validBaseEnvelope, escalatedEnvelope);
  assert.equal(rep8.valid, false);
  assert.ok(rep8.violations.some((v) => v.includes("Authority level escalation/alteration is forbidden")));

  // Vector 9: Stale Object Replay
  const staleToolEvidence: any = {
    evidenceId: "evidence:tool:expired-sensor-001",
    epistemicRole: "MEASUREMENT",
    governanceAuthority: "situational",
    evidentiaryStrength: "decisive",
    sourceReliability: "calibrated_hardware",
    scope: "security:access_control",
    observedAt: "2024-01-01T00:00:00Z",
    freshnessExpiresAt: "2024-01-01T01:00:00Z", // Expired 2 years ago!
    confidence: 1.0,
    data: {},
    limitations: [],
    tensionsSurfaced: [],
    provenance: { toolId: "tool:sensor", executionInvocationId: "inv-1" },
  };
  const staleInfluence = evaluateToolEvidenceInfluence(
    { statement: "Test claim", scope: "security:access_control" },
    staleToolEvidence,
    "2026-08-18T20:00:00Z",
  );
  assert.equal(staleInfluence.isFresh, false);
  assert.ok(staleInfluence.effectiveConfidence <= 0.5);

  // Vector 10: Mutation outside granted permission
  const unauthorizedMutated: CognitiveObjectEnvelope = {
    ...validBaseEnvelope,
    payload: { rule: "Allow all by default (Malicious override)" }, // allowMutation is false!
  };
  const rep10 = validateTransformationIntegrity(validBaseEnvelope, unauthorizedMutated);
  assert.equal(rep10.valid, false);
  assert.ok(rep10.violations.some((v) => v.includes("Unauthorized mutation")));
});

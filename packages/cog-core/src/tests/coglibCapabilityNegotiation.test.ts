import assert from "node:assert/strict";
import test from "node:test";
import {
  CognitiveObjectEnvelope,
  CognitiveCapabilityProfile,
  negotiateCognitiveTask,
} from "../index";

const genericNodeProfile: CognitiveCapabilityProfile = {
  runtimeId: "runtime:node-generic-v1",
  supportedProtocolVersions: ["cogop/1.0"],
  supportedRoutines: [
    { routineId: "coglib:routine:shape", version: "1.0.0" },
    { routineId: "coglib:routine:compare", version: "1.0.0" },
    { routineId: "coglib:routine:challenge", version: "1.0.0" },
    { routineId: "coglib:routine:trace", version: "1.0.0" },
  ],
  mountedCapabilities: [], // No domain capabilities mounted
  supportedEvidenceRoles: ["CALCULATION", "MEASUREMENT", "RETRIEVED_DOCUMENT"],
  supportsMemory: true,
  supportsEvaluation: true,
  allowsMutations: true,
};

const scienceNodeProfile: CognitiveCapabilityProfile = {
  runtimeId: "runtime:node-science-v1",
  supportedProtocolVersions: ["cogop/1.0"],
  supportedRoutines: [
    { routineId: "coglib:routine:shape", version: "1.0.0" },
    { routineId: "coglib:routine:compare", version: "1.0.0" },
    { routineId: "coglib:routine:challenge", version: "1.0.0" },
  ],
  mountedCapabilities: ["capability:domain:scientific-inquiry"],
  supportedEvidenceRoles: ["MEASUREMENT", "CALCULATION", "RETRIEVED_DOCUMENT"],
  supportsMemory: true,
  supportsEvaluation: true,
  allowsMutations: true,
};

const baseEnvelope: CognitiveObjectEnvelope = {
  envelopeId: "cogop:env:task-negotiation-001",
  protocolVersion: "cogop/1.0",
  objectId: "obj-claim-test",
  objectType: "scientific_claim",
  scope: "science:epidemiology",
  frameAndIntent: { frame: "causal_inference", intent: "Subject claim to challenge" },
  payload: { statement: "Study shows correlation" },
  assumptions: [],
  epistemicState: { confidence: 0.8, tensions: [] },
  grounding: { sourceAnchors: ["doi:10.1001/study"], groundingSources: [] },
  provenance: { originRuntime: "runtime:client", lineage: ["init"], createdAt: "2026-08-18T20:00:00Z" },
  permissions: { allowMutation: true, permittedOperations: ["challenge"], allowAuthorityEscalation: false, requireChangeDisclosure: true },
  requestedOperation: { routineId: "coglib:routine:challenge" },
};

test("HDCP-COG-PROTOCOL-CAPABILITY-NEGOTIATION-035: Negotiates capability handshake across all 5 standard dispositions", () => {
  // 1. SUPPORTED: Science node negotiates scientific envelope
  const resSupported = negotiateCognitiveTask(
    {
      ...baseEnvelope,
      capabilityContext: { requiredCapabilityId: "capability:domain:scientific-inquiry" },
    },
    scienceNodeProfile,
  );
  assert.equal(resSupported.disposition, "SUPPORTED");
  assert.equal(resSupported.canExecute, true);
  assert.equal(resSupported.missingCapabilities.length, 0);

  // 2. REQUIRES_CAPABILITY: Generic node presented with mandatory domain requirement
  const resRequires = negotiateCognitiveTask(
    {
      ...baseEnvelope,
      capabilityContext: { requiredCapabilityId: "capability:domain:scientific-inquiry" },
    },
    genericNodeProfile,
  );
  assert.equal(resRequires.disposition, "REQUIRES_CAPABILITY");
  assert.equal(resRequires.canExecute, false);
  assert.ok(resRequires.missingCapabilities.includes("capability:domain:scientific-inquiry"));

  // 3. SUPPORTED_WITH_QUALIFICATION: Generic node receives optional mounted capability context
  const resQualified = negotiateCognitiveTask(
    {
      ...baseEnvelope,
      capabilityContext: { mountedCapabilities: ["capability:domain:scientific-inquiry"] },
    },
    genericNodeProfile,
  );
  assert.equal(resQualified.disposition, "SUPPORTED_WITH_QUALIFICATION");
  assert.equal(resQualified.canExecute, true);
  assert.ok(resQualified.qualifications.some((q) => q.includes("generic mode")));

  // 4. UNSUPPORTED: Requesting an unregistered routine
  const resUnsupported = negotiateCognitiveTask(
    {
      ...baseEnvelope,
      requestedOperation: { routineId: "coglib:routine:unknown-quantum-anneal" },
    },
    genericNodeProfile,
  );
  assert.equal(resUnsupported.disposition, "UNSUPPORTED");
  assert.equal(resUnsupported.canExecute, false);

  // 5. VERSION_INCOMPATIBLE: Incompatible protocol version
  const resIncompatible = negotiateCognitiveTask(
    {
      ...baseEnvelope,
      protocolVersion: "cogop/9.9" as any,
    },
    genericNodeProfile,
  );
  assert.equal(resIncompatible.disposition, "VERSION_INCOMPATIBLE");
  assert.equal(resIncompatible.canExecute, false);
});

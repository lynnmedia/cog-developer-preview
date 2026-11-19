import assert from "node:assert/strict";
import test from "node:test";
import {
  CognitiveObjectEnvelope,
  driftLensInstrument,
  validateCognitiveInstrumentContract,
} from "../index";

test("HDCP-COG-DRIFT-LENS-041: Drift Lens projects longitudinal assumption, grounding, tension, and confidence drift", () => {
  assert.equal(validateCognitiveInstrumentContract(driftLensInstrument).valid, true);

  // Snapshot V1 (Original baseline architecture decision)
  const v1State: CognitiveObjectEnvelope = {
    envelopeId: "cogop:env:auth-v1",
    protocolVersion: "cogop/1.0",
    objectId: "obj-auth-subsystem",
    objectType: "architecture_spec",
    scope: "auth:tokens",
    frameAndIntent: { frame: "security_architecture", intent: "Define session token format" },
    payload: { format: "JWT_stateless", expirySeconds: 3600 },
    assumptions: [
      "Token revocation is rarely needed in real-time",
      "Stateless tokens minimize central database load",
    ],
    epistemicState: {
      confidence: 0.9,
      tensions: [],
    },
    grounding: {
      sourceAnchors: ["docs/rfc-7519-jwt.md"],
      groundingSources: ["spec:jwt"],
    },
    provenance: {
      originRuntime: "runtime:node-a",
      lineage: ["genesis"],
      createdAt: "2026-01-01T00:00:00Z",
    },
    permissions: { allowMutation: true, permittedOperations: ["compare"], allowAuthorityEscalation: false, requireChangeDisclosure: true },
  };

  // Snapshot V2 (Multi-month revision following security incident)
  const v2State: CognitiveObjectEnvelope = {
    envelopeId: "cogop:env:auth-v2",
    protocolVersion: "cogop/1.0",
    objectId: "obj-auth-subsystem", // Same Concept Identity
    objectType: "architecture_spec",
    scope: "auth:tokens",
    frameAndIntent: { frame: "security_architecture", intent: "Revise token format with instant revocation" },
    payload: { format: "Opaque_with_Redis_Session", expirySeconds: 1800 },
    assumptions: [
      "Stateless tokens minimize central database load", // Kept
      // Dropped: "Token revocation is rarely needed in real-time"
      "Instant revocation SLA < 50ms required by compliance", // Added
    ],
    epistemicState: {
      confidence: 0.7, // Lowered due to distributed Redis availability concerns
      tensions: [
        "Redis cluster network partition prevents token verification", // Emergent tension!
      ],
    },
    grounding: {
      sourceAnchors: ["docs/rfc-7519-jwt.md", "incident/sec-incident-089.md"], // Added incident anchor
      groundingSources: ["spec:jwt", "incident:089"],
    },
    provenance: {
      originRuntime: "runtime:node-a",
      lineage: ["genesis", "transformed_by(runtime:sec-cluster)"],
      createdAt: "2026-01-01T00:00:00Z",
    },
    permissions: { allowMutation: true, permittedOperations: ["compare"], allowAuthorityEscalation: false, requireChangeDisclosure: true },
  };

  const report = driftLensInstrument.project({ priorState: v1State, currentState: v2State });

  // Verify Structured Projection
  assert.equal(report.structuredProjection.identityContinuity, true);
  assert.equal(report.structuredProjection.driftSeverity, "material");

  // Assumption Drift
  assert.deepEqual(report.structuredProjection.assumptionDrift.dropped, ["Token revocation is rarely needed in real-time"]);
  assert.deepEqual(report.structuredProjection.assumptionDrift.added, ["Instant revocation SLA < 50ms required by compliance"]);

  // Grounding Drift
  assert.deepEqual(report.structuredProjection.groundingDrift.addedAnchors, ["incident/sec-incident-089.md"]);

  // Epistemic Drift
  assert.equal(report.structuredProjection.epistemicDrift.delta, -0.2);
  assert.deepEqual(report.structuredProjection.epistemicDrift.newUnresolvedTensions, [
    "Redis cluster network partition prevents token verification",
  ]);

  // Verify Findings
  assert.ok(report.findings.some((f) => f.dimension === "assumption_drift" && f.severity === "material"));
  assert.ok(report.findings.some((f) => f.dimension === "unresolved_tension_emergence" && f.severity === "material"));
  assert.ok(report.findings.some((f) => f.dimension === "confidence_trajectory"));
});

test("HDCP-COG-DRIFT-LENS-041: Drift Lens catches disjoint identity disconnect with critical severity", () => {
  const v1 = { id: "obj-feature-a", assumptions: [] };
  const v2 = { id: "obj-feature-b", assumptions: [] };

  const report = driftLensInstrument.project({ priorState: v1, currentState: v2 });
  assert.equal(report.structuredProjection.identityContinuity, false);
  assert.equal(report.structuredProjection.driftSeverity, "critical");
  assert.ok(report.findings.some((f) => f.dimension === "identity_continuity" && f.severity === "critical"));
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  GovernedCognitiveNodeProfile,
  CognitiveObjectEnvelope,
  NodeContribution,
  ToolResultEvidence,
  routeAndDelegateCognitiveTask,
  composeMultiNodeContributions,
  driftLensInstrument,
  epistemicMapInstrument,
  provenanceLineageInstrument,
  tensionFieldInstrument,
} from "../index";

test("HDCP-COG-END-TO-END-EXECUTION-057: Solves clinical decision support migration using governed Cog stack", () => {
  // =========================================================================
  // 1. Initial State: Intake Node Shapes Problem Envelope
  // =========================================================================
  const initialEnvelope: CognitiveObjectEnvelope<{ architecture: string }> = {
    envelopeId: "cogop:env:cds-arch-v1",
    protocolVersion: "cogop/1.0",
    objectId: "obj-cds-architecture-decision",
    objectType: "architecture_decision_record",
    scope: "clinical:decision_support",
    frameAndIntent: { frame: "icu_architecture", intent: "Migrate legacy single-cluster DB to edge-cloud hybrid" },
    payload: { architecture: "Legacy Monolith on PostgreSQL" },
    assumptions: [
      "Hospital local area network never experiences WAN partitions",
      "Generic CRDT reconciliation is clinically safe for all medication orders",
    ],
    epistemicState: {
      confidence: 0.85,
      tensions: [],
    },
    grounding: {
      sourceAnchors: ["spec/fda-samd-part11.pdf", "architecture/legacy-system-doc.md"],
      groundingSources: ["doc:fda", "doc:legacy"],
    },
    provenance: {
      originRuntime: "node:hospital-intake:01",
      lineage: ["genesis", "shape:intake"],
      createdAt: "2026-08-18T20:00:00Z",
    },
    permissions: { allowMutation: true, permittedOperations: ["challenge", "compare"], allowAuthorityEscalation: false, requireChangeDisclosure: true },
    requestedOperation: { routineId: "coglib:routine:challenge" },
  };

  // =========================================================================
  // 2. Big Net Routing: Delegate to Clinical Verification Node
  // =========================================================================
  const verifierNode: GovernedCognitiveNodeProfile = {
    nodeId: "node:icu-safety-verifier:02",
    protocolVersions: ["cogop/1.0"],
    supportedRoutines: [{ routineId: "coglib:routine:challenge", version: "1.0.0" }],
    mountedCapabilities: ["capability:domain:scientific-inquiry"],
    supportsMemory: true,
    supportsTools: true,
    supportsEvaluation: true,
    supportedInstruments: ["instrument:epistemic-map", "instrument:tension-field"],
    trustScope: {
      authorizedDomains: ["clinical:decision_support", "science:epidemiology"],
      maximumAuthorityTier: "project",
      allowedEvidenceRoles: ["MEASUREMENT", "CALCULATION", "RETRIEVED_DOCUMENT"],
      requiresMutualReview: false,
    },
    availability: { status: "online", lastHeartbeatAt: "2026-08-18T20:30:00Z" },
    limitations: [],
  };

  const routingResult = routeAndDelegateCognitiveTask({
    envelope: initialEnvelope,
    delegatorRuntimeId: "node:hospital-intake:01",
    candidateNodes: [verifierNode],
  });
  assert.equal(routingResult.routed, true);
  assert.equal(routingResult.selectedNodeId, verifierNode.nodeId);

  // =========================================================================
  // 3. Ingest Governed Canonical Memory & Live Tool Evidence
  // =========================================================================
  const memoryEvidence: ToolResultEvidence = {
    evidenceId: "ev:historical-incident-ir-2023-09",
    epistemicRole: "AUTHORITATIVE_RECORD",
    governanceAuthority: "canonical",
    evidentiaryStrength: "decisive",
    sourceReliability: "authoritative_registry",
    scope: "clinical:decision_support",
    observedAt: "2023-09-15T00:00:00Z",
    confidence: 1.0,
    data: { incident: "Potassium overdose near-miss caused by asynchronous queue drop during network failover" },
    limitations: [],
    tensionsSurfaced: ["Direct contradiction: Unbounded async queues drop critical alerts under network partition"],
    provenance: { toolId: "node:foundation:vault-03", executionInvocationId: "inv-vault-09" },
  };

  const liveLoadEvidence: ToolResultEvidence = {
    evidenceId: "ev:icu-load-test-500-vitals",
    epistemicRole: "MEASUREMENT",
    governanceAuthority: "situational",
    evidentiaryStrength: "decisive",
    sourceReliability: "calibrated_hardware",
    scope: "clinical:decision_support",
    observedAt: "2026-08-18T20:25:00Z",
    confidence: 0.99,
    data: { p99LatencyMs: 14.2, staleReadRateOnPartition: 0.004 },
    limitations: ["Synthetic load simulator"],
    tensionsSurfaced: ["Tension: 0.4% stale read rate during edge network disconnects"],
    provenance: { toolId: "tool:icu:load_sim", executionInvocationId: "inv-load-500" },
  };

  // =========================================================================
  // 4. Transform Envelope to Clinically-Bounded Architecture (ADR)
  // =========================================================================
  const finalGovernedEnvelope: CognitiveObjectEnvelope<{ architecture: string; invariants: string[] }> = {
    envelopeId: "cogop:env:cds-arch-v2",
    protocolVersion: "cogop/1.0",
    objectId: "obj-cds-architecture-decision", // Same Concept Identity
    objectType: "architecture_decision_record",
    scope: "clinical:decision_support",
    frameAndIntent: { frame: "icu_architecture", intent: "Ratify Clinically-Bounded Partition-Resilient Event Log (CB-PREL)" },
    payload: {
      architecture: "Clinically-Bounded Partition-Resilient Event Log (CB-PREL)",
      invariants: [
        "Monotonic superseding for medication orders (no blind mathematical addition)",
        "Strict local audit trail persisted before bedside alert firing (FDA 21 CFR Part 11)",
        "Degraded-mode visual banner displayed to clinicians if edge disconnect exceeds 60 seconds",
      ],
    },
    assumptions: [
      "Edge hardware has battery-backed write cache for local commit durability",
    ],
    epistemicState: {
      confidence: 0.88,
      tensions: [
        "Unresolved Tension: CAP theorem trade-off between bedside alert latency (<50ms) and multi-region consensus (115ms)",
      ],
    },
    grounding: {
      sourceAnchors: [
        "spec/fda-samd-part11.pdf",
        "incident/ir-2023-09-potassium.log",
        "telemetry/load-test-500-vitals.json",
      ],
      groundingSources: ["doc:fda", "incident:potassium", "tool:load_sim"],
    },
    provenance: {
      originRuntime: "node:hospital-intake:01",
      lineage: [
        "genesis",
        "shape:intake",
        `transformed_by(${verifierNode.nodeId})`,
        "science:pharmacology_invariants",
      ],
      createdAt: "2026-08-18T20:00:00Z",
    },
    declaredMutations: [
      {
        timestamp: "2026-08-18T20:45:00Z",
        transformerRuntime: verifierNode.nodeId,
        action: "MODIFIED",
        field: "payload.architecture",
        rationale: "Replaced generic CRDT with CB-PREL enforcing pharmacology invariants and partition alerts",
        previousValueSummary: "Legacy Monolith / Generic CRDT",
        newValueSummary: "CB-PREL with pharmacology invariants",
      },
    ],
    permissions: { allowMutation: true, permittedOperations: ["challenge", "compare"], allowAuthorityEscalation: false, requireChangeDisclosure: true },
  };

  // =========================================================================
  // 5. Inspect via Cognitive Instruments
  // =========================================================================
  const driftReport = driftLensInstrument.project({
    priorState: initialEnvelope,
    currentState: finalGovernedEnvelope,
  });
  assert.equal(driftReport.structuredProjection.identityContinuity, true);
  assert.equal(driftReport.structuredProjection.driftSeverity, "material");
  assert.ok(driftReport.structuredProjection.assumptionDrift.dropped.some((a) => a.includes("never experiences WAN partitions")));

  const epistemicReport = epistemicMapInstrument.project({
    envelope: finalGovernedEnvelope,
    attachedEvidence: [memoryEvidence, liveLoadEvidence],
  });
  assert.ok(epistemicReport.structuredProjection.categoryCounts.MEASURED >= 1);
  assert.ok(epistemicReport.structuredProjection.categoryCounts.REMEMBERED >= 1);
  assert.ok(epistemicReport.structuredProjection.categoryCounts.UNRESOLVED >= 1);

  const lineageReport = provenanceLineageInstrument.project({
    envelope: finalGovernedEnvelope,
    attachedEvidence: [memoryEvidence, liveLoadEvidence],
  });
  assert.equal(lineageReport.structuredProjection.runtimesInvolved.length, 2);
  assert.ok(lineageReport.structuredProjection.timeline.some((e) => e.stepKind === "declared_mutation"));

  const tensionReport = tensionFieldInstrument.project({
    envelope: finalGovernedEnvelope,
  });
  assert.ok(tensionReport.structuredProjection.tensionVectors.length >= 1);
  assert.ok(tensionReport.structuredProjection.tensionVectors[0]!.description.includes("CAP theorem"));
});

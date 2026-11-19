import assert from "node:assert/strict";
import test from "node:test";
import {
  CognitiveObjectEnvelope,
  CognitiveCapabilityProfile,
  validateCognitiveObjectEnvelope,
  negotiateCognitiveTask,
  applyGovernedEnvelopeTransformation,
  validateTransformationIntegrity,
  challengeRoutine,
  executeRoutineWithGuards,
  computeCognitiveMetrics,
} from "../index";

test("HDCP-COG-PROTOCOL-ROUNDTRIP-PROOF-036: Multi-runtime roundtrip preserves identity, provenance, tensions, and traceable mutations", async () => {
  // =========================================================================
  // RUNTIME A: Genesis & Envelope Creation
  // =========================================================================
  const originalEnvelope: CognitiveObjectEnvelope<{ cachePolicy: string; ttlSeconds: number }> = {
    envelopeId: "cogop:env:cache-policy-001",
    protocolVersion: "cogop/1.0",
    objectId: "obj-distributed-cache-arch",
    objectType: "architecture_component",
    scope: "caching:edge_layer",
    frameAndIntent: {
      frame: "distributed_caching",
      intent: "Verify resilience of edge cache eviction under high concurrency",
    },
    payload: { cachePolicy: "LRU_with_TTL", ttlSeconds: 300 },
    assumptions: ["Key distribution is uniformly random"],
    epistemicState: {
      confidence: 0.9,
      tensions: ["Non-uniform hot keys might cause cache stampede"],
    },
    grounding: {
      sourceAnchors: ["docs/caching-spec.md"],
      groundingSources: ["doc:caching-spec"],
    },
    provenance: {
      originRuntime: "runtime:node-a:primary",
      lineage: ["genesis", "shape:v1"],
      createdAt: "2026-08-18T20:00:00Z",
    },
    permissions: {
      allowMutation: true,
      permittedOperations: ["challenge"],
      allowAuthorityEscalation: false,
      requireChangeDisclosure: true,
    },
    requestedOperation: {
      routineId: "coglib:routine:challenge",
    },
  };

  assert.equal(validateCognitiveObjectEnvelope(originalEnvelope).valid, true);

  // Wire Serialization (Runtime A -> Network/Wire)
  const wireTransmission = JSON.stringify(originalEnvelope);

  // =========================================================================
  // RUNTIME B: Remote Ingestion, Negotiation, Routine Execution & Governed Mutation
  // =========================================================================
  const runtimeBProfile: CognitiveCapabilityProfile = {
    runtimeId: "runtime:node-b:adversarial-verifier",
    supportedProtocolVersions: ["cogop/1.0"],
    supportedRoutines: [{ routineId: "coglib:routine:challenge", version: "1.0.0" }],
    mountedCapabilities: [],
    supportedEvidenceRoles: ["CALCULATION", "MEASUREMENT", "SIMULATION"],
    supportsMemory: true,
    supportsEvaluation: true,
    allowsMutations: true,
  };

  const receivedEnvelope: CognitiveObjectEnvelope = JSON.parse(wireTransmission);
  assert.equal(validateCognitiveObjectEnvelope(receivedEnvelope).valid, true);

  // 1. Negotiate Capability
  const negotiation = negotiateCognitiveTask(receivedEnvelope, runtimeBProfile);
  assert.equal(negotiation.disposition, "SUPPORTED");
  assert.equal(negotiation.canExecute, true);

  // 2. Execute CHALLENGE routine on Runtime B
  const challengeResult = await executeRoutineWithGuards(challengeRoutine, {
    target: {
      id: receivedEnvelope.objectId,
      statement: `Cache policy: ${receivedEnvelope.payload.cachePolicy}`,
      dependencies: [
        { id: "uniform-distribution", redundancy: false, isVerified: false }, // Disputed assumption
      ],
      groundingSources: receivedEnvelope.grounding.groundingSources,
    },
    counterEvidencePool: [
      {
        id: "hot-key-stampede-proof",
        dimension: "incompatible_evidence",
        severity: "severe",
        description: "Zipfian key distribution causes thundering herd cache stampede on TTL expiry",
        sourceRef: "benchmarks/stampede-load.json",
      },
    ],
  });

  assert.equal(challengeResult.status, "qualified");

  // 3. Apply Governed Transformation on Runtime B
  const transformedEnvelope = applyGovernedEnvelopeTransformation(receivedEnvelope, {
    transformerRuntime: runtimeBProfile.runtimeId,
    newConfidence: 0.75, // Bounded due to stampede vulnerability
    addedTensions: ["Zipfian key distribution causes thundering herd cache stampede"],
    addedSourceAnchors: ["benchmarks/stampede-load.json"],
    addedGroundingSources: ["tool:bench:zipfian-load"],
    mutationRecords: [
      {
        timestamp: "2026-08-18T20:05:00Z",
        transformerRuntime: runtimeBProfile.runtimeId,
        action: "CHALLENGED",
        field: "epistemicState.confidence",
        rationale: "Adversarial zipfian load test exposed thundering herd stampede vulnerability",
        previousValueSummary: "0.9",
        newValueSummary: "0.75",
      },
    ],
  });

  // Wire Return Serialization (Runtime B -> Network/Wire)
  const wireReturn = JSON.stringify(transformedEnvelope);

  // =========================================================================
  // RUNTIME A: Verification of Returned Cognitive State
  // =========================================================================
  const returnedEnvelope: CognitiveObjectEnvelope = JSON.parse(wireReturn);

  // 1. Verify semantic integrity
  const integrityReport = validateTransformationIntegrity(originalEnvelope, returnedEnvelope);
  assert.equal(integrityReport.valid, true);

  // 2. Verify Concept Identity & Provenance Continuity
  assert.equal(returnedEnvelope.objectId, originalEnvelope.objectId);
  assert.equal(returnedEnvelope.provenance.originRuntime, "runtime:node-a:primary");
  assert.ok(returnedEnvelope.provenance.lineage.includes("transformed_by(runtime:node-b:adversarial-verifier)"));

  // 3. Verify Monotonic Anchors & Tensions
  assert.ok(returnedEnvelope.grounding.sourceAnchors.includes("docs/caching-spec.md"));
  assert.ok(returnedEnvelope.grounding.sourceAnchors.includes("benchmarks/stampede-load.json"));
  assert.ok(returnedEnvelope.epistemicState.tensions.includes("Zipfian key distribution causes thundering herd cache stampede"));

  // 4. Verify Disclosed Mutations
  assert.equal(returnedEnvelope.declaredMutations?.length, 1);
  assert.equal(returnedEnvelope.declaredMutations[0]!.action, "CHALLENGED");

  // 5. Evaluate Multidimensional Metrics
  const profile = computeCognitiveMetrics(challengeResult, { id: "baseline:unverified_cache" });
  const falseCertainty = profile.dimensions.find((d) => d.dimensionId === "false_certainty_avoidance")!;
  assert.equal((falseCertainty.metricValue as any).pass, 1);
});

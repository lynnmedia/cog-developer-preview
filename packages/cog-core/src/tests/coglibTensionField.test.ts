import assert from "node:assert/strict";
import test from "node:test";
import {
  CognitiveObjectEnvelope,
  tensionFieldInstrument,
  validateCognitiveInstrumentContract,
} from "../index";

test("HDCP-COG-TENSION-FIELD-044: Tension Field projects unresolved conflicts and downstream impact topologies", () => {
  assert.equal(validateCognitiveInstrumentContract(tensionFieldInstrument).valid, true);

  const distributedDbEnvelope: CognitiveObjectEnvelope<{ engine: string }> = {
    envelopeId: "cogop:env:dist-db-001",
    protocolVersion: "cogop/1.0",
    objectId: "obj-core-distributed-database",
    objectType: "database_architecture",
    scope: "storage:consistency_layer",
    frameAndIntent: { frame: "distributed_systems", intent: "Model consistency trade-offs" },
    payload: { engine: "Spanner-like Multi-Paxos" },
    assumptions: ["TrueTime GPS/Atomic clocks remain within 7ms drift bound"],
    epistemicState: {
      confidence: 0.8,
      tensions: [
        "Direct conflict between strict serializability throughput and cross-datacenter WAN latency",
        "Qualified dependency: Bounded staleness acceptable for read replicas",
        "Superficial terminology difference between primary-replica and leader-follower naming",
      ],
    },
    grounding: {
      sourceAnchors: ["corbett-spanner-2012.pdf"],
      groundingSources: ["spec:spanner"],
    },
    provenance: {
      originRuntime: "runtime:storage-team",
      lineage: ["genesis", "shape:spanner"],
      createdAt: "2026-08-18T20:00:00Z",
    },
    permissions: { allowMutation: true, permittedOperations: ["compare"], allowAuthorityEscalation: false, requireChangeDisclosure: true },
  };

  const dependentObjectManifest = [
    { objectId: "service-checkout-ledger", dependsOn: "obj-core-distributed-database" },
    { objectId: "service-inventory-lock", dependsOn: "obj-core-distributed-database" },
    { objectId: "service-analytics-pipeline", dependsOn: "obj-core-distributed-database" },
  ];

  const report = tensionFieldInstrument.project({
    envelope: distributedDbEnvelope,
    dependentObjectManifest,
  });

  const proj = report.structuredProjection;

  // Verify Tension Vector Topography
  assert.equal(proj.totalTensions, 3);
  assert.equal(proj.activeUnresolvedCount, 1); // Only the direct conflict is critical/unresolved
  assert.equal(proj.impactedDownstreamCount, 3); // 3 dependent downstream microservices exposed

  // Vector Breakdown
  const criticalVec = proj.tensionVectors.find((v) => v.severity === "critical")!;
  assert.ok(criticalVec);
  assert.equal(criticalVec.epistemicStatus, "UNRESOLVED");
  assert.equal(criticalVec.downstreamDependentObjects.length, 3);

  const qualifiedVec = proj.tensionVectors.find((v) => v.epistemicStatus === "QUALIFIED")!;
  assert.ok(qualifiedVec);
  assert.equal(qualifiedVec.severity, "minor");

  const superficialVec = proj.tensionVectors.find((v) => v.epistemicStatus === "SUPERFICIAL")!;
  assert.ok(superficialVec);
  assert.equal(superficialVec.severity, "minor");

  // Hotspots
  assert.ok(proj.tensionHotspots.some((h) => h.includes("downstream dependent objects exposed")));

  // Verify Findings
  assert.ok(report.findings.some((f) => f.severity === "critical"));
  assert.ok(report.findings.every((f) => f.epistemicStatus === "TENSION"));
});

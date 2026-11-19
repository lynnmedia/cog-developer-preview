import assert from "node:assert/strict";
import test from "node:test";
import {
  InMemoryCognitiveMemoryProvider,
  shapeRoutine,
  compareRoutine,
  traceRoutine,
  challengeRoutine,
  executeRoutineWithGuards,
  computeCognitiveMetrics,
} from "../index";

test("HDCP-COG-MEMORY-CONTINUITY-PROOF-026: Longitudinal cognitive continuation across sessions vs stateless baseline", async () => {
  const memoryProvider = new InMemoryCognitiveMemoryProvider("memory:provider:continuity-store");

  // ==========================================
  // SESSION 1 (Initial Cognition at T=0)
  // ==========================================
  const session1Shape = await executeRoutineWithGuards(shapeRoutine, {
    objectId: "arch-storage-subsystem",
    rawElements: [
      { id: "e1", statement: "Single-master PostgreSQL relational database", sourceAnchor: "arch-decision-record-001" },
    ],
    expectedDimensions: ["statement"],
    assumptionsDeclared: ["Strict ACID serializability", "Single-region deployment"],
  });

  assert.equal(session1Shape.status, "success");

  // Persist Session 1 object into governed memory (Version 1)
  await memoryProvider.persist({
    id: "arch-storage-subsystem",
    objectType: "architecture_decision",
    content: {
      storageEngine: "postgresql-single-master",
      assumptions: ["Strict ACID serializability", "Single-region deployment"],
      status: "active_v1",
    },
    authorityLevel: "project",
    scope: "core-architecture",
    perspectives: ["backend-engineering"],
    recordedAt: "2026-01-01T00:00:00Z",
    provenance: { sourceAnchors: ["arch-decision-record-001"], lineage: ["session-1-shape"] },
    epistemicState: { confidence: 0.95, tensions: [] },
    tags: ["storage", "database", "v1"],
  });

  // ==========================================
  // SESSION 2 (Cognitive Continuation at T=+6mo)
  // ==========================================
  // Later requirement changes architecture to distributed multi-master
  const session2V2Object = {
    id: "arch-storage-subsystem",
    identityRoot: "arch-storage-subsystem",
    storageEngine: "dynamo-multi-master",
    assumptions: ["Eventual consistency", "Multi-region active-active"],
    status: "active_v2",
    epistemicConfidence: 0.85,
  };

  // 1. Retrieve prior state (v1) from governed memory
  const priorStateV1 = await memoryProvider.getPriorState("arch-storage-subsystem", 1);
  assert.ok(priorStateV1 !== null);
  assert.equal(priorStateV1.version, 1);
  assert.equal(priorStateV1.content.storageEngine, "postgresql-single-master");

  // 2. COMPARE: Compare prior state (v1) against revised state (v2)
  const compareV1V2 = await executeRoutineWithGuards(compareRoutine, {
    targetA: {
      id: "arch-storage-v1",
      identityRoot: "arch-storage-subsystem",
      assumptions: priorStateV1.content.assumptions,
      scope: priorStateV1.scope,
      epistemicConfidence: priorStateV1.epistemicState.confidence,
    },
    targetB: {
      id: "arch-storage-v2",
      identityRoot: session2V2Object.identityRoot,
      assumptions: session2V2Object.assumptions,
      scope: priorStateV1.scope,
      epistemicConfidence: session2V2Object.epistemicConfidence,
    },
  });

  assert.equal(compareV1V2.status, "success");
  assert.equal(compareV1V2.output?.identityContinuous, true); // Shared identity continuous across versions!
  assert.ok(compareV1V2.output?.materialDifferences.some((d) => d.dimension === "assumptions"));

  // 3. TRACE: Trace longitudinal migration lineage from V1 to V2
  const traceLineage = await executeRoutineWithGuards(traceRoutine, {
    targetObjectId: "res-storage-v2",
    records: [
      { id: "src-v1", stage: "source", sourceAnchor: "arch-decision-record-001", description: "V1 single-master Postgres", isRecorded: true },
      { id: "tx-migration", stage: "transformation", parentId: "src-v1", description: "ADR-042 multi-region migration decision", isRecorded: true },
      { id: "res-storage-v2", stage: "result", parentId: "tx-migration", description: "V2 distributed Dynamo multi-master", isRecorded: true },
    ],
  });

  assert.equal(traceLineage.status, "success");
  assert.equal(traceLineage.output?.integrity, "complete");

  // 4. CHALLENGE: Subject V2 to adversarial challenge using insights discovered from V1 comparison
  const challengeV2 = await executeRoutineWithGuards(challengeRoutine, {
    target: {
      id: "claim-v2-migration-safety",
      statement: "V2 storage migration maintains all consistency guarantees expected by legacy callers",
      dependencies: [
        { id: "legacy-acid-assumption", redundancy: false, isVerified: false }, // Discovered from V1 comparison!
      ],
      groundingSources: ["ADR-042"],
    },
    counterEvidencePool: [
      {
        id: "stale-read-anomaly",
        dimension: "incompatible_evidence",
        severity: "severe",
        description: "Legacy financial ledger requires serializability and breaks under eventual consistency",
        sourceRef: "audit-incident-902",
      },
    ],
  });

  assert.equal(challengeV2.status, "qualified");
  assert.equal(challengeV2.output?.challengeStatus, "vulnerable");

  // 5. Persist Session 2 revised object as Version 2 with superseded link
  await memoryProvider.persist({
    id: "arch-storage-subsystem",
    objectType: "architecture_decision",
    content: session2V2Object,
    authorityLevel: "project",
    scope: "core-architecture",
    perspectives: ["backend-engineering"],
    recordedAt: "2026-06-01T00:00:00Z",
    provenance: { sourceAnchors: ["ADR-042"], lineage: ["session-1-shape", "session-2-migration"] },
    epistemicState: { confidence: 0.7, tensions: ["Legacy ledger breaks under eventual consistency"] },
    tags: ["storage", "database", "v2"],
    supersededById: "arch-storage-subsystem-v2",
  });

  // Verify that provider now holds 2 discrete historical versions
  const finalV1 = await memoryProvider.getPriorState("arch-storage-subsystem", 1);
  const finalV2 = await memoryProvider.getPriorState("arch-storage-subsystem", 2);
  assert.equal(finalV1?.version, 1);
  assert.equal(finalV2?.version, 2);

  // 6. Multidimensional Metric Evaluation of Memory Continuity vs Stateless Baseline
  const profile = computeCognitiveMetrics(challengeV2, { id: "baseline:stateless_session" });

  const delta = profile.dimensions.find((d) => d.dimensionId === "useful_cognitive_delta")!;
  assert.ok((delta.metricValue as any).structuralDeltaCount > 0);

  const tensionPreservation = profile.dimensions.find((d) => d.dimensionId === "tension_preservation")!;
  assert.ok((tensionPreservation.metricValue as any).activeTensions > 0);
});

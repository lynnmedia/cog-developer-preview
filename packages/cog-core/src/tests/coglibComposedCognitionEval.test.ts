import assert from "node:assert/strict";
import test from "node:test";
import {
  shapeRoutine,
  compareRoutine,
  traceRoutine,
  challengeRoutine,
  executeRoutineWithGuards,
  computeCognitiveMetrics,
} from "../index";

test("HDCP-COG-COMPOSED-COGNITION-EVAL-021: Composed sequence produces compounding cognitive value vs isolated execution", async () => {
  // --- Baseline: Isolated Routine Execution ---
  // In isolated execution, CHALLENGE runs without knowing the upstream provenance gaps discovered by TRACE
  const isolatedChallenge = await executeRoutineWithGuards(challengeRoutine, {
    target: {
      id: "claim-distributed-eventual-consistency",
      statement: "System achieves strict linearizable consistency across multi-region partition",
      sampleSize: 1000,
      groundingSources: ["spec-v1"],
    },
  });
  // Isolated challenge thinks claim is resilient because it has sample size and grounding source!
  assert.equal(isolatedChallenge.status, "success");

  // --- Composed Refinement Pipeline: SHAPE -> COMPARE -> TRACE -> CHALLENGE ---
  // Stage 1: SHAPE
  const stage1Shape = await executeRoutineWithGuards(shapeRoutine, {
    objectId: "arch-consistency-v1",
    rawElements: [
      { id: "e1", statement: "Multi-region asynchronous replication", sourceAnchor: "arch-doc-1" },
    ],
    expectedDimensions: ["statement", "partitionToleranceModel"],
  });
  assert.equal(stage1Shape.status, "qualified"); // Missing partition model exposed!

  // Stage 2: COMPARE
  const stage2Comp = await executeRoutineWithGuards(compareRoutine, {
    targetA: { id: "paxos-sync", assumptions: ["Synchronous majority quorum"] },
    targetB: { id: "async-gossip", assumptions: ["Asynchronous gossip broadcast"] },
  });
  assert.equal(stage2Comp.status, "success");

  // Stage 3: TRACE
  const stage3Trace = await executeRoutineWithGuards(traceRoutine, {
    targetObjectId: "res-consistency-claim",
    records: [
      {
        id: "tx-gossip-transform",
        stage: "transformation",
        parentId: "missing-linearizability-proof", // Lineage gap discovered!
        description: "Switched consensus protocol from Raft to Dynamo gossip",
        isRecorded: true,
      },
      {
        id: "res-consistency-claim",
        stage: "result",
        parentId: "tx-gossip-transform",
        description: "Claimed linearizable consistency",
        isRecorded: true,
      },
    ],
  });
  assert.equal(stage3Trace.status, "qualified"); // Provenance gap discovered!

  // Stage 4: Composed CHALLENGE (Armed with upstream TRACE gap and SHAPE missing dimension)
  const composedChallenge = await executeRoutineWithGuards(challengeRoutine, {
    target: {
      id: "claim-distributed-eventual-consistency",
      statement: "System achieves strict linearizable consistency across multi-region partition",
      dependencies: [
        { id: stage3Trace.output!.gaps[0]!.fromId, redundancy: false, isVerified: false }, // Direct feed from Stage 3!
      ],
      groundingSources: ["spec-v1"],
    },
    counterEvidencePool: [
      {
        id: "cap-theorem-counterevidence",
        dimension: "incompatible_evidence",
        severity: "severe",
        description: "CAP theorem precludes linearizability under asynchronous network partition",
        sourceRef: "gilbert-lynch-2002",
      },
    ],
  });

  // Composed challenge catches what isolated challenge missed!
  assert.equal(composedChallenge.status, "qualified");
  assert.equal(composedChallenge.output?.challengeStatus, "vulnerable");

  // Multidimensional Evaluation of Composition
  const profile = computeCognitiveMetrics(composedChallenge, isolatedChallenge.output);

  const delta = profile.dimensions.find((d) => d.dimensionId === "useful_cognitive_delta")!;
  assert.ok((delta.metricValue as any).structuralDeltaCount > 0);

  const falseCertainty = profile.dimensions.find((d) => d.dimensionId === "false_certainty_avoidance")!;
  assert.equal((falseCertainty.metricValue as any).pass, 1);
});

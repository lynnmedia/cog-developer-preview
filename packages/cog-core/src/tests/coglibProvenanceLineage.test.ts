import assert from "node:assert/strict";
import test from "node:test";
import {
  CognitiveObjectEnvelope,
  ToolResultEvidence,
  provenanceLineageInstrument,
  validateCognitiveInstrumentContract,
} from "../index";

test("HDCP-COG-PROVENANCE-LINEAGE-INSTRUMENT-043: Provenance Lineage Instrument projects multi-runtime transformation graph", () => {
  assert.equal(validateCognitiveInstrumentContract(provenanceLineageInstrument).valid, true);

  // Cross-runtime envelope that traversed Node A -> Verification Cluster -> Node B
  const multiRuntimeEnvelope: CognitiveObjectEnvelope<{ plan: string }> = {
    envelopeId: "cogop:env:multi-hop-001",
    protocolVersion: "cogop/1.0",
    objectId: "obj-consensus-protocol-v2",
    objectType: "consensus_specification",
    scope: "distributed_systems:consensus",
    frameAndIntent: { frame: "distributed_consensus", intent: "Specify Raft leader election" },
    payload: { plan: "Raft with pre-vote optimization" },
    assumptions: ["Network is partially synchronous"],
    epistemicState: {
      confidence: 0.9,
      tensions: [],
    },
    grounding: {
      sourceAnchors: ["ongaro-raft-paper-2014.pdf", "benchmarks/jepsen-raft.log"],
      groundingSources: ["spec:raft", "tool:jepsen"],
    },
    provenance: {
      originRuntime: "runtime:node-a:genesis",
      lineage: [
        "genesis",
        "shape:v1",
        "transformed_by(runtime:verification-cluster)",
        "science:causal_model",
        "transformed_by(runtime:node-b:deployer)",
      ],
      createdAt: "2026-08-18T20:00:00Z",
    },
    declaredMutations: [
      {
        timestamp: "2026-08-18T20:10:00Z",
        transformerRuntime: "runtime:verification-cluster",
        action: "MODIFIED",
        field: "payload.plan",
        rationale: "Added pre-vote phase to prevent disruptive election loops",
        previousValueSummary: "Basic Raft",
        newValueSummary: "Raft with pre-vote",
      },
    ],
    permissions: { allowMutation: true, permittedOperations: ["compare"], allowAuthorityEscalation: false, requireChangeDisclosure: true },
  };

  const attachedEvidence: ToolResultEvidence[] = [
    {
      evidenceId: "evidence:tool:jepsen-net-split",
      epistemicRole: "SIMULATION",
      governanceAuthority: "canonical",
      evidentiaryStrength: "decisive",
      sourceReliability: "authoritative_registry",
      scope: "distributed_systems:consensus",
      observedAt: "2026-08-18T20:12:00Z",
      confidence: 0.98,
      data: { splitHealed: true, splitBrainDetected: false },
      limitations: [],
      tensionsSurfaced: [],
      provenance: { toolId: "tool:jepsen:chaos", executionInvocationId: "inv-chaos-99" },
    },
  ];

  const report = provenanceLineageInstrument.project({
    envelope: multiRuntimeEnvelope,
    attachedEvidence,
  });

  const proj = report.structuredProjection;

  // Verify Structured Projections
  assert.equal(proj.originRuntime, "runtime:node-a:genesis");
  assert.equal(proj.runtimesInvolved.length, 3);
  assert.ok(proj.runtimesInvolved.includes("runtime:node-a:genesis"));
  assert.ok(proj.runtimesInvolved.includes("runtime:verification-cluster"));
  assert.ok(proj.runtimesInvolved.includes("runtime:node-b:deployer"));

  // Verify Graph Nodes and Edges
  assert.ok(proj.lineageGraph.nodes.length >= 6);
  assert.ok(proj.lineageGraph.edges.some((e) => e.stepKind === "cogop_cross_runtime"));
  assert.ok(proj.lineageGraph.edges.some((e) => e.stepKind === "declared_mutation"));
  assert.ok(proj.lineageGraph.edges.some((e) => e.stepKind === "tool_evidence_ingestion"));

  // Verify Findings
  assert.ok(report.findings.some((f) => f.dimension === "cross_boundary_transfers"));
  assert.ok(report.findings.some((f) => f.dimension === "mutation_attributability"));
});

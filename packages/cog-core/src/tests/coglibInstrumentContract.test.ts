import assert from "node:assert/strict";
import test from "node:test";
import {
  CognitiveInstrument,
  InstrumentObservationReport,
  validateCognitiveInstrumentContract,
} from "../index";

test("HDCP-COG-INSTRUMENT-CONTRACT-040: Standard cognitive instrument contract supports diverse observational projections without mutation", async () => {
  // Sample Instrument 1: Structural Complexity Lens
  const structuralLens: CognitiveInstrument<{ nodes: Array<{ id: string; edges: string[] }> }, { totalNodes: number; maxDegree: number }> = {
    instrumentId: "instrument:structural-complexity-lens",
    version: "1.0.0",
    purpose: "Reveal structural connectivity and graph bottleneck hot-spots",
    projectionType: "graph",
    acceptedObjectTypes: ["workflow_graph", "cognitive_dag"],
    requiredEvidence: ["node_manifest"],
    observedDimensions: ["node_density", "bottleneck_centrality"],
    limitations: ["Does not evaluate semantic meaning of individual node contents"],
    failureModes: [
      {
        code: "DISCONNECTED_COMPONENTS",
        description: "Target graph contains disconnected components",
        mitigation: "Report partitioned components in observation findings",
      },
    ],
    project(input) {
      const totalNodes = input.nodes.length;
      const maxDegree = Math.max(...input.nodes.map((n) => n.edges.length), 0);
      return {
        instrumentId: "instrument:structural-complexity-lens",
        instrumentVersion: "1.0.0",
        projectedAt: "2026-08-18T20:20:00Z",
        sourceObjectId: "obj-workflow-sample",
        projectionType: "graph",
        findings: [
          {
            findingId: "finding:structural:dense-hub",
            dimension: "bottleneck_centrality",
            severity: "material",
            summary: `Discovered hub node with ${maxDegree} edges`,
            details: { maxDegree },
            sourceEvidence: ["node-manifest-v1"],
            epistemicStatus: "OBSERVED",
          },
        ],
        structuredProjection: { totalNodes, maxDegree },
        limitationsSurfaced: ["Observational projection only; does not alter node linkages"],
        provenanceChain: ["workflow:v1"],
      };
    },
  };

  const validationReport1 = validateCognitiveInstrumentContract(structuralLens);
  assert.equal(validationReport1.valid, true);

  const report1 = await structuralLens.project({
    nodes: [
      { id: "n1", edges: ["n2", "n3", "n4"] },
      { id: "n2", edges: [] },
      { id: "n3", edges: [] },
      { id: "n4", edges: [] },
    ],
  });

  assert.equal(report1.findings.length, 1);
  assert.equal(report1.findings[0]!.severity, "material");
  assert.equal(report1.structuredProjection.maxDegree, 3);
  assert.ok(report1.findings[0]!.sourceEvidence.includes("node-manifest-v1"));

  // Sample Instrument 2: Epistemic Vulnerability Matrix
  const epistemicMatrixLens: CognitiveInstrument<{ claims: Array<{ id: string; confidence: number; tensions: string[] }> }, { averageConfidence: number }> = {
    instrumentId: "instrument:epistemic-vulnerability-matrix",
    version: "1.0.0",
    purpose: "Map and project epistemic confidence distributions and unresolved tension clusters",
    projectionType: "epistemic_matrix",
    acceptedObjectTypes: ["epistemic_artifact", "evaluation_report"],
    requiredEvidence: ["epistemic_state"],
    observedDimensions: ["confidence_distribution", "tension_density"],
    limitations: ["Does not re-verify external truth of claims; reflects declared epistemic states"],
    failureModes: [
      {
        code: "EMPTY_CLAIMS_SET",
        description: "Input artifact contains no declared claims",
        mitigation: "Emit warning finding reporting absence of evaluable epistemic elements",
      },
    ],
    project(input) {
      const avg = input.claims.reduce((acc, c) => acc + c.confidence, 0) / (input.claims.length || 1);
      return {
        instrumentId: "instrument:epistemic-vulnerability-matrix",
        instrumentVersion: "1.0.0",
        projectedAt: "2026-08-18T20:25:00Z",
        sourceObjectId: "obj-epistemic-bundle",
        projectionType: "epistemic_matrix",
        findings: [
          {
            findingId: "finding:epistemic:avg-confidence",
            dimension: "confidence_distribution",
            severity: "info",
            summary: `Average claim confidence is ${avg.toFixed(2)}`,
            details: { averageConfidence: avg },
            sourceEvidence: ["epistemic-bundle-v1"],
            epistemicStatus: "DERIVED",
          },
        ],
        structuredProjection: { averageConfidence: avg },
        limitationsSurfaced: ["Reflects declared claims without executing external validation queries"],
        provenanceChain: ["bundle:v1"],
      };
    },
  };

  const validationReport2 = validateCognitiveInstrumentContract(epistemicMatrixLens);
  assert.equal(validationReport2.valid, true);

  const report2 = await epistemicMatrixLens.project({
    claims: [
      { id: "c1", confidence: 0.9, tensions: [] },
      { id: "c2", confidence: 0.5, tensions: ["Unverified assumption"] },
    ],
  });

  assert.equal(report2.findings[0]!.details.averageConfidence, 0.7);
});

test("HDCP-COG-INSTRUMENT-CONTRACT-040: Validator rejects malformed instruments", () => {
  const badInstrument: any = {
    instrumentId: "bad-id-missing-prefix",
    version: "1.0.0",
    purpose: "Testing",
    projectionType: "graph",
    acceptedObjectTypes: [], // Empty
    observedDimensions: [],
    limitations: [],
    failureModes: [],
    project: "not a function",
  };

  const report = validateCognitiveInstrumentContract(badInstrument);
  assert.equal(report.valid, false);
  assert.ok(report.defects.some((d) => d.includes("instrument:")));
  assert.ok(report.defects.some((d) => d.includes("acceptedObjectTypes")));
  assert.ok(report.defects.some((d) => d.includes("project must be an observational function")));
});

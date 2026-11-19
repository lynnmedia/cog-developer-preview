import assert from "node:assert/strict";
import test from "node:test";
import {
  computeCognitiveMetrics,
  shapeRoutine,
  challengeRoutine,
  executeRoutineWithGuards,
  executeRoutineWithCapability,
} from "../index";

test("HDCP-COG-EVALUATION-METRICS-019: Operationalizes all 8 standard cognitive evaluation metric dimensions", async () => {
  // Candidate: SHAPE execution that surfaces missing dimensions and bounds confidence
  const subjectResult = await executeRoutineWithGuards(shapeRoutine, {
    rawElements: [
      { id: "e1", statement: "Observed telemetry", sourceAnchor: "sensor-1" },
    ],
    expectedDimensions: ["statement", "missing_time_series"],
  });

  const profile = computeCognitiveMetrics(subjectResult, {
    id: "baseline:naive_transform",
    missingDimensions: [],
  });

  assert.equal(profile.dimensions.length, 8);
  const dimIds = profile.dimensions.map((d) => d.dimensionId);
  assert.ok(dimIds.includes("epistemic_honesty"));
  assert.ok(dimIds.includes("missingness_exposure"));
  assert.ok(dimIds.includes("provenance_integrity"));
  assert.ok(dimIds.includes("tension_preservation"));
  assert.ok(dimIds.includes("scope_discipline"));
  assert.ok(dimIds.includes("false_certainty_avoidance"));
  assert.ok(dimIds.includes("domain_significant_issue_detection"));
  assert.ok(dimIds.includes("useful_cognitive_delta"));

  // Check that missingness was detected
  const missingDim = profile.dimensions.find((d) => d.dimensionId === "missingness_exposure")!;
  assert.equal((missingDim.metricValue as any).missingCount, 1);

  // Check that epistemic honesty is recognized
  const honestyDim = profile.dimensions.find((d) => d.dimensionId === "epistemic_honesty")!;
  assert.ok((honestyDim.metricValue as any).boundedConfidence < 1.0);
});

test("HDCP-COG-EVALUATION-METRICS-019: Evaluates negative case with false certainty and ungrounded claims", () => {
  // Negative Candidate: Fabricated certainty with unaddressed defects
  const flawedResult = {
    status: "success" as const,
    output: {
      missingDimensions: ["unaddressed_gap"],
      challengesSurfaced: [{ dimension: "invalid_generalization", severity: "severe" }],
    },
    epistemicState: {
      confidence: 1.0, // Flawed: claimed 1.0 confidence despite severe challenges!
      tensions: [], // Flawed: dropped tensions!
    },
    provenance: {
      routineId: "flawed-routine",
      lineage: [],
    },
  };

  const profile = computeCognitiveMetrics(flawedResult as any);

  const honestyDim = profile.dimensions.find((d) => d.dimensionId === "epistemic_honesty")!;
  assert.equal((honestyDim.metricValue as any).honestyRatio, 0.2); // Penalized for dishonesty

  const falseCertDim = profile.dimensions.find((d) => d.dimensionId === "false_certainty_avoidance")!;
  assert.equal((falseCertDim.metricValue as any).pass, 0); // Failed false certainty check
});

test("HDCP-COG-EVALUATION-METRICS-019: Tradeoff preservation and governed domain metric extension", async () => {
  // Tradeoff Case: Adversarial challenge reveals 2 domain vulnerabilities
  const challengeResult = await executeRoutineWithGuards(challengeRoutine, {
    target: {
      id: "claim-vulnerable",
      statement: "Universal claim with small sample",
      sampleSize: 10,
    },
  });

  const profile = computeCognitiveMetrics(challengeResult, undefined, {
    domainExtensionHooks: [
      {
        metricId: "custom_domain_falsification_depth",
        name: "Custom Falsification Depth",
        compute: (sub) => ({
          metricValue: { depth: 3 },
          assessment: "Evaluated across 3 adversarial boundary vectors",
        }),
      },
    ],
  });

  // Profile contains 8 standard + 1 domain extension = 9 dimensions
  assert.equal(profile.dimensions.length, 9);
  assert.ok(profile.dimensions.some((d) => d.dimensionId === "custom_domain_falsification_depth"));

  // Tradeoff summary explicitly synthesized without hiding tensions behind a scalar score
  assert.ok(profile.tradeoffSummary.length > 0);
});

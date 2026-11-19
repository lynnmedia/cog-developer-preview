import assert from "node:assert/strict";
import test from "node:test";
import {
  ToolResultEvidence,
  evaluateToolEvidenceInfluence,
  shapeRoutine,
  challengeRoutine,
  executeRoutineWithGuards,
  computeCognitiveMetrics,
} from "../index";

test("HDCP-COG-TOOL-VS-UNTYPED-DATA-PROOF-030: Epistemically typed tool evidence prevents false certainty vs raw untyped context", async () => {
  // --- Baseline: Raw Untyped Context Injection ---
  // In untyped context, raw text from an uncalibrated LLM tool is injected as fact
  const rawUntypedContext = {
    statement: "Recommended pediatric antibiotic dosage is 250mg twice daily",
    source: "tool-llm-search",
  };

  const untypedChallenge = await executeRoutineWithGuards(challengeRoutine, {
    target: {
      id: "clinical-dosage-claim",
      statement: rawUntypedContext.statement,
      sampleSize: 100,
      groundingSources: [rawUntypedContext.source],
    },
  });

  // Untyped baseline treats tool string as fact and declares success with false certainty!
  assert.equal(untypedChallenge.status, "success");

  // --- Governed Condition: Epistemically Typed Tool Result ---
  const typedEvidence: ToolResultEvidence<{ recommendedDosageMg: number }> = {
    evidenceId: "evidence:tool:clinical-llm-synthesis",
    epistemicRole: "MODEL_INFERENCE",
    governanceAuthority: "advisory",
    evidentiaryStrength: "speculative",
    sourceReliability: "stochastic_model",
    scope: "clinical:pediatrics:dosage",
    observedAt: "2026-08-18T19:30:00Z",
    confidence: 0.6,
    data: { recommendedDosageMg: 250 },
    limitations: [
      "Stochastic generation not calibrated against patient renal clearance or weight",
      "Unverified contraindication check",
    ],
    tensionsSurfaced: ["Diverges from standard weight-based pediatric dosing formula (10mg/kg)"],
    provenance: {
      toolId: "tool:model:clinical-llm-v2",
      executionInvocationId: "inv-clin-772",
    },
  };

  // 1. Tool Influence Governance
  const influenceReport = evaluateToolEvidenceInfluence(
    {
      statement: rawUntypedContext.statement,
      scope: "clinical:pediatrics:dosage",
      confidence: 1.0,
      authorityLevel: "project",
    },
    typedEvidence,
  );

  assert.equal(influenceReport.action, "QUALIFIES");
  assert.equal(influenceReport.humanReviewRequired, true);
  assert.ok(influenceReport.effectiveConfidence <= 0.75);

  // 2. Downstream CHALLENGE armed with explicit epistemic limitations & tensions
  const governedChallenge = await executeRoutineWithGuards(challengeRoutine, {
    target: {
      id: "clinical-dosage-claim",
      statement: rawUntypedContext.statement,
      dependencies: [
        { id: "weight-calibration", redundancy: false, isVerified: false }, // Explicitly unverified!
      ],
      groundingSources: [typedEvidence.evidenceId],
    },
    counterEvidencePool: [
      {
        id: "contraindication-risk",
        dimension: "incompatible_evidence",
        severity: "severe",
        description: typedEvidence.tensionsSurfaced[0]!,
        sourceRef: typedEvidence.evidenceId,
      },
    ],
  });

  // Governed execution flags vulnerability and qualifies status!
  assert.equal(governedChallenge.status, "qualified");
  assert.equal(governedChallenge.output?.challengeStatus, "vulnerable");

  // 3. Multidimensional Evaluation of Typed Evidence vs Untyped Baseline
  const profile = computeCognitiveMetrics(governedChallenge, untypedChallenge.output);

  const falseCertainty = profile.dimensions.find((d) => d.dimensionId === "false_certainty_avoidance")!;
  assert.equal((falseCertainty.metricValue as any).pass, 1);

  const honesty = profile.dimensions.find((d) => d.dimensionId === "epistemic_honesty")!;
  assert.ok((honesty.metricValue as any).boundedConfidence < 1.0);

  const delta = profile.dimensions.find((d) => d.dimensionId === "useful_cognitive_delta")!;
  assert.ok((delta.metricValue as any).structuralDeltaCount > 0);
});

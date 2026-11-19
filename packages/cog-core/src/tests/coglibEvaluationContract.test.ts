import assert from "node:assert/strict";
import test from "node:test";
import {
  CognitiveEvaluationReport,
  validateEvaluationContract,
} from "../index";

test("HDCP-COG-EVALUATION-CONTRACT-018: Evaluates generic CogLib, Music specialization, Science specialization, and Composed routines under single contract", () => {
  // 1. Generic CogLib Evaluation Report
  const genericShapeEval: CognitiveEvaluationReport = {
    evaluationId: "eval:generic:shape-001",
    evaluatedAt: "2026-08-18T18:24:00Z",
    subject: {
      subjectId: "coglib:routine:shape",
      subjectType: "routine",
      version: "1.0.0",
    },
    context: {
      taskId: "task-structure-unfamiliar-input",
      domain: "generic",
      intent: "Partition raw observations into known, missing, and uncertain categories without fabricating certainty",
    },
    comparator: {
      comparatorId: "baseline:naive_transform",
      comparatorType: "naive_baseline",
      description: "Naive transformation that silently sets confidence=1.0 and ignores missing dimensions",
    },
    dimensions: [
      {
        dimensionId: "epistemic_honesty",
        name: "Epistemic Honesty",
        qualitativeAssessment: "Faithfully flags missing dimensions and bounds confidence to 0.7 instead of 1.0",
        metricValue: { missingnessDetected: 2, confidenceHonesty: 1.0 },
        confidence: 0.95,
      },
      {
        dimensionId: "provenance_integrity",
        name: "Provenance Integrity",
        qualitativeAssessment: "Preserves exact source anchors for all known elements",
        metricValue: { anchorPreservationRatio: 1.0 },
        confidence: 0.98,
      },
    ],
    qualificationsAndUncertainty: ["Evaluated over synthetic unstructured input dataset"],
    reproducibility: {
      deterministic: true,
      runtimeEnvironment: "Node.js v20 / @cog/core 0.3.0",
    },
  };

  assert.equal(validateEvaluationContract(genericShapeEval).valid, true);

  // 2. Music-Specialized Evaluation Report
  const musicSpecializedEval: CognitiveEvaluationReport = {
    evaluationId: "eval:specialized:music-shape-001",
    evaluatedAt: "2026-08-18T18:24:00Z",
    subject: {
      subjectId: "coglib:routine:shape",
      subjectType: "specialized_routine",
      version: "1.0.0",
      mountedCapabilityId: "capability:domain:music",
    },
    context: {
      taskId: "task-bach-chorale-harmonic-analysis",
      domain: "music",
      intent: "Extract cadential gestures and voice leading structures from Bach chorale BWV 244",
    },
    comparator: {
      comparatorId: "comparator:generic_shape",
      comparatorType: "generic_routine",
      description: "Generic CogLib SHAPE routine without mounted domain capability",
    },
    dimensions: [
      {
        dimensionId: "domain_issue_detection",
        name: "Domain Significant Issue Detection",
        qualitativeAssessment: "Recognizes cadential gesture and melodic phrases with domain-specific accuracy",
        metricValue: { recognizedDomainClasses: 2 },
        confidence: 0.96,
      },
      {
        dimensionId: "useful_cognitive_delta",
        name: "Useful Cognitive Delta",
        qualitativeAssessment: "Provides harmonic classification without leaking domain ontology into generic routine",
        confidence: 0.92,
        tradeoffNotes: "Requires mounted Mandala of Music capability provider",
      },
    ],
    qualificationsAndUncertainty: [],
    reproducibility: {
      deterministic: true,
      runtimeEnvironment: "Node.js v20 / @cog/core 0.3.0",
    },
  };

  assert.equal(validateEvaluationContract(musicSpecializedEval).valid, true);

  // 3. Science-Specialized Evaluation Report
  const scienceSpecializedEval: CognitiveEvaluationReport = {
    evaluationId: "eval:specialized:science-challenge-001",
    evaluatedAt: "2026-08-18T18:24:00Z",
    subject: {
      subjectId: "coglib:routine:challenge",
      subjectType: "specialized_routine",
      version: "1.0.0",
      mountedCapabilityId: "capability:domain:scientific-inquiry",
    },
    context: {
      taskId: "task-observational-causal-assessment",
      domain: "scientific-inquiry",
      intent: "Subject observational health claim to causal inference and confounding inspection",
    },
    comparator: {
      comparatorId: "comparator:generic_challenge",
      comparatorType: "generic_routine",
      description: "Generic CogLib CHALLENGE routine without domain capability",
    },
    dimensions: [
      {
        dimensionId: "false_certainty_avoidance",
        name: "False Certainty Avoidance",
        qualitativeAssessment: "Prevents observational correlation from being accepted as proven causal effect",
        confidence: 0.95,
      },
      {
        dimensionId: "tension_preservation",
        name: "Tension Preservation",
        qualitativeAssessment: "Explicitly registers unadjusted confounding tension in epistemic state",
        confidence: 0.94,
      },
    ],
    qualificationsAndUncertainty: ["Confounding inspection relies on DAG heuristic"],
    reproducibility: {
      deterministic: true,
      runtimeEnvironment: "Node.js v20 / @cog/core 0.3.0",
    },
  };

  assert.equal(validateEvaluationContract(scienceSpecializedEval).valid, true);

  // 4. Composed Pipeline Evaluation Report
  const composedPipelineEval: CognitiveEvaluationReport = {
    evaluationId: "eval:composition:full-pipeline-001",
    evaluatedAt: "2026-08-18T18:24:00Z",
    subject: {
      subjectId: "composition:pipeline:shape-compare-trace-challenge",
      subjectType: "composition",
      version: "1.0.0",
    },
    context: {
      taskId: "task-architectural-evolution-assessment",
      domain: "software-architecture",
      intent: "Evaluate end-to-end cognitive refinement across 4 sequential stages",
    },
    comparator: {
      comparatorId: "comparator:uncomposed_isolated_stages",
      comparatorType: "uncomposed_baseline",
      description: "Running SHAPE, COMPARE, TRACE, and CHALLENGE as disconnected isolated calls",
    },
    dimensions: [
      {
        dimensionId: "useful_cognitive_delta",
        name: "Useful Cognitive Delta",
        qualitativeAssessment: "Lineage and tensions monotonically accumulate across stages without information loss",
        confidence: 0.97,
      },
      {
        dimensionId: "scope_discipline",
        name: "Scope Discipline",
        qualitativeAssessment: "Maintains clear distinction between architecture notes and kernel constitutional invariants",
        confidence: 0.95,
      },
    ],
    qualificationsAndUncertainty: [],
    reproducibility: {
      deterministic: true,
      runtimeEnvironment: "Node.js v20 / @cog/core 0.3.0",
    },
  };

  assert.equal(validateEvaluationContract(composedPipelineEval).valid, true);
});

test("HDCP-COG-EVALUATION-CONTRACT-018: Validator rejects malformed reports and single-score aggregation attempts", () => {
  // Malformed report: missing comparator and only 1 dimension
  const malformedReport: any = {
    evaluationId: "eval:bad",
    evaluatedAt: "2026-08-18T18:24:00Z",
    subject: { subjectId: "s1", subjectType: "routine", version: "1.0.0" },
    context: { taskId: "t1", domain: "generic", intent: "test" },
    dimensions: [{ dimensionId: "d1", name: "dim", qualitativeAssessment: "good", confidence: 0.9 }],
    reproducibility: { deterministic: true, runtimeEnvironment: "Node.js" },
  };

  const report = validateEvaluationContract(malformedReport);
  assert.equal(report.valid, false);
  assert.ok(report.defects.some((d) => d.includes("comparator")));
  assert.ok(report.defects.some((d) => d.includes("at least 2 distinct cognitive dimensions")));

  // Single-score leaderboard attempt: FORBIDDEN
  const singleScoreReport: any = {
    ...malformedReport,
    comparator: { comparatorId: "b1", comparatorType: "naive_baseline", description: "desc" },
    dimensions: [
      { dimensionId: "d1", name: "dim1", qualitativeAssessment: "good", confidence: 0.9 },
      { dimensionId: "d2", name: "dim2", qualitativeAssessment: "good", confidence: 0.9 },
    ],
    aggregateScore: 98.5, // FORBIDDEN!
  };

  const singleScoreResult = validateEvaluationContract(singleScoreReport);
  assert.equal(singleScoreResult.valid, false);
  assert.ok(singleScoreResult.defects.some((d) => d.includes("Single aggregate intelligence score")));
});

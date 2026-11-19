import assert from "node:assert/strict";
import test from "node:test";
import {
  shapeRoutine,
  compareRoutine,
  challengeRoutine,
  executeRoutineWithGuards,
  executeRoutineWithCapability,
  computeCognitiveMetrics,
} from "../index";
import { mandalaOfMusicCapabilityProvider } from "./coglibMusicCapabilityProof.test";
import { scientificInquiryCapabilityProvider } from "./coglibScienceCapabilityProof.test";

test("HDCP-COG-GENERIC-VS-SPECIALIZED-EVAL-020: Evaluates cognitive delta between generic CogLib and Music capability", async () => {
  // Matched Task: Harmonic cadence structuring and modal comparison
  const inputTask = {
    objectId: "task-music-harmonic-eval",
    rawElements: [
      { id: "cadence-1", statement: "Authentic cadence V-I resolving to tonic", sourceAnchor: "score-chorale-bach" },
      { id: "melody-1", statement: "Soprano melodic contour", sourceAnchor: "score-chorale-bach" },
    ],
    expectedDimensions: ["statement"],
  };

  // 1. Generic CogLib execution
  const genericShape = await executeRoutineWithGuards(shapeRoutine, inputTask);
  assert.equal(genericShape.status, "success");

  // 2. Specialized CogLib + Music capability execution
  const specializedShape = await executeRoutineWithCapability(shapeRoutine, inputTask, {
    provider: mandalaOfMusicCapabilityProvider,
  });
  assert.equal(specializedShape.status, "success");

  // 3. Multidimensional Cognitive Delta Computation
  const profile = computeCognitiveMetrics(specializedShape, genericShape.output);

  // Assertions on the 8 dimensions
  const domainDetection = profile.dimensions.find((d) => d.dimensionId === "domain_significant_issue_detection")!;
  assert.ok((domainDetection.metricValue as any).detectedDomainItems > 0);

  const honesty = profile.dimensions.find((d) => d.dimensionId === "epistemic_honesty")!;
  assert.equal((honesty.metricValue as any).honestyRatio, 1.0);

  const provenance = profile.dimensions.find((d) => d.dimensionId === "provenance_integrity")!;
  assert.equal((provenance.metricValue as any).provenanceRatio, 1.0);
  assert.ok(specializedShape.provenance.lineage.includes("mounted(capability:domain:music)"));

  const delta = profile.dimensions.find((d) => d.dimensionId === "useful_cognitive_delta")!;
  assert.ok((delta.metricValue as any).structuralDeltaCount > 0);
});

test("HDCP-COG-GENERIC-VS-SPECIALIZED-EVAL-020: Evaluates cognitive delta between generic CogLib and Scientific Inquiry capability", async () => {
  // Matched Task: Evaluating observational causal claim with counterevidence
  const scientificTask = {
    target: {
      id: "claim-observational-health",
      statement: "Daily coffee intake directly causes 25% decrease in mortality rate",
      studyDesign: "observational_cohort",
      hasConfounderControl: false, // Uncontrolled healthy lifestyle confounders
      sampleSize: 1000,
      groundingSources: ["cohort-study-2022"],
    },
  };

  // 1. Generic CogLib CHALLENGE
  const genericChallenge = await executeRoutineWithGuards(challengeRoutine, scientificTask);
  // Generic challenge only checks universal quantifiers and sample size (1000 is considered large for generic)
  assert.equal(genericChallenge.status, "success");

  // 2. Specialized CogLib + Scientific Inquiry CHALLENGE
  const specializedChallenge = await executeRoutineWithCapability(challengeRoutine, scientificTask, {
    provider: scientificInquiryCapabilityProvider,
  });
  // Specialized challenge correctly catches observational causality defect without confounder control!
  assert.equal(specializedChallenge.status, "qualified");

  // 3. Multidimensional Cognitive Delta Computation
  const profile = computeCognitiveMetrics(specializedChallenge, genericChallenge.output);

  const domainDetection = profile.dimensions.find((d) => d.dimensionId === "domain_significant_issue_detection")!;
  assert.ok((domainDetection.metricValue as any).detectedDomainItems > 0);

  const falseCertainty = profile.dimensions.find((d) => d.dimensionId === "false_certainty_avoidance")!;
  assert.equal((falseCertainty.metricValue as any).pass, 1);

  // Tradeoff recorded: domain sensitivity increased tension count to avoid false certainty
  assert.ok(profile.tradeoffSummary.some((t) => t.includes("increased domain sensitivity")));
});

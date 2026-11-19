import assert from "node:assert/strict";
import test from "node:test";
import {
  shapeRoutine,
  ShapeInput,
  ShapedCognitiveObject,
} from "../coglib/routines/shape";
import {
  executeRoutineWithGuards,
  CognitiveProofHarness,
  evaluateCandidateForAdmission,
} from "../coglib";

// Generic transformation baseline (anti-pattern that silently fabricates missing fields)
function naiveGenericTransform(input: any): any {
  return {
    id: input.id ?? "default-id",
    data: input.rawElements?.map((e: any) => ({
      statement: e.statement ?? "Default Statement",
      confidence: 1.0, // Blindly fabricates 1.0 certainty
      valid: true, // Ignores conflicts!
    })) ?? [],
    status: "COMPLETE", // Fabricates completeness!
  };
}

test("HDCP-COGLIB-SHAPE-006: SHAPE routine differentiates known, inferred, uncertain, missing, and conflicting elements", async () => {
  const testInput: ShapeInput = {
    objectId: "science-claim-universe",
    rawElements: [
      { id: "obs-1", statement: "Cosmic microwave background observed", sourceAnchor: "doi:10.1086/148301" },
      { id: "inf-1", statement: "Universe expanded from hot dense state", isInferred: true },
      { id: "unc-1", statement: "Inflation epoch lasted 10^-32 seconds", confidence: 0.65 },
      { id: "conf-1", statement: "Hubble constant H0 = 67.4 km/s/Mpc", sourceAnchor: "planck-2018", isContradictoryWith: ["conf-2"] },
      { id: "conf-2", statement: "Hubble constant H0 = 73.0 km/s/Mpc", sourceAnchor: "riess-2022", isContradictoryWith: ["conf-1"] },
    ],
    expectedDimensions: ["statement", "baryonDensity", "darkEnergyRatio"],
    assumptionsDeclared: ["FLRW metric homogeneity"],
  };

  const result = await executeRoutineWithGuards(shapeRoutine, testInput);

  assert.equal(result.status, "qualified"); // Correctly qualified due to conflicts, missing dimensions, and uncertainty
  const out = result.output as ShapedCognitiveObject;

  // Known: has source anchor, no conflict, confident
  assert.equal(out.known.length, 1);
  assert.equal(out.known[0]?.id, "obs-1");
  assert.equal(out.known[0]?.sourceAnchor, "doi:10.1086/148301");

  // Inferred: derived
  assert.equal(out.inferred.length, 1);
  assert.equal(out.inferred[0]?.id, "inf-1");

  // Uncertain: lower confidence preserved without fabricating certainty
  assert.equal(out.uncertain.length, 1);
  assert.equal(out.uncertain[0]?.id, "unc-1");
  assert.equal(out.uncertain[0]?.confidence, 0.65);

  // Missing: no silent hallucination
  assert.ok(out.missingDimensions.includes("baryonDensity"));
  assert.ok(out.missingDimensions.includes("darkEnergyRatio"));

  // Conflicting: explicit conflict tracking
  assert.equal(out.conflicts.length, 2);

  // Assumptions exposed
  assert.ok(out.introducedAssumptions.includes("FLRW metric homogeneity"));

  // Epistemic tensions preserved
  assert.ok(result.epistemicState.tensions.some((t) => t.includes("Missing expected dimension: 'baryonDensity'")));
  assert.ok(result.epistemicState.tensions.some((t) => t.includes("Conflict on element 'conf-1'")));
});

test("HDCP-COGLIB-SHAPE-006: SHAPE superior to generic transformation baseline (no fabricated certainty or completeness)", () => {
  const underspecifiedInput = {
    rawElements: [
      { id: "e1", statement: "Ambiguous preliminary measurement", confidence: 0.4 },
    ],
    expectedDimensions: ["statement", "sampleSize", "pVal"],
  };

  // 1. Naive baseline produces false certainty
  const baselineOutput = naiveGenericTransform(underspecifiedInput);
  assert.equal(baselineOutput.data[0].confidence, 1.0); // Falsely elevated!
  assert.equal(baselineOutput.status, "COMPLETE"); // Falsely complete!

  // 2. SHAPE routine honestly exposes uncertainty and missingness
  const shapeResult = shapeRoutine.execute(underspecifiedInput);
  assert.equal(shapeResult.status, "qualified");
  assert.equal(shapeResult.output?.uncertain.length, 1);
  assert.equal(shapeResult.output?.uncertain[0]?.confidence, 0.4);
  assert.ok(shapeResult.output?.missingDimensions.includes("sampleSize"));
  assert.ok(shapeResult.output?.missingDimensions.includes("pVal"));
  assert.ok(shapeResult.epistemicState.confidence < 1.0);
});

test("HDCP-COGLIB-SHAPE-006: Cross-domain proof across 3 materially distinct domains (Music, Science, Software Arch)", async () => {
  const harness = new CognitiveProofHarness();

  // Domain 1: Music (Harmonic sketch with missing bass, uncertain chord assignment)
  harness.registerTestCase({
    testId: "SHAPE-MUSIC-001",
    domain: "music",
    description: "Shapes raw melodic sketch into harmonic cognitive object without fabricating bass line",
    routine: shapeRoutine,
    input: {
      rawElements: [
        { id: "note-c5", statement: "Melodic peak C5", sourceAnchor: "measure-1", attributes: { pitch: "C5" } },
        { id: "note-e4", statement: "Inner harmony E4", isInferred: true, attributes: { pitch: "E4" } },
        { id: "lead-g4", statement: "Passing tone G4", confidence: 0.7, attributes: { pitch: "G4" } },
      ],
      expectedDimensions: ["pitch", "bassFundamental", "tempoBpm"],
    },
    expectedStatus: "qualified",
    expectedTensionSubstring: "Missing expected dimension: 'bassFundamental'",
  });

  // Domain 2: Science (Empirical observation with conflicting instrument readings)
  harness.registerTestCase({
    testId: "SHAPE-SCIENCE-001",
    domain: "science",
    description: "Shapes astronomical observation dataset preserving spectrometer conflict",
    routine: shapeRoutine,
    input: {
      rawElements: [
        { id: "spec-a", statement: "Emission line at 656.3 nm", sourceAnchor: "spec-primary", isContradictoryWith: ["spec-b"] },
        { id: "spec-b", statement: "Emission line at 658.1 nm", sourceAnchor: "spec-secondary", isContradictoryWith: ["spec-a"] },
      ],
      expectedDimensions: ["statement", "calibrationStandard"],
    },
    expectedStatus: "qualified",
    expectedTensionSubstring: "Conflict on element 'spec-a'",
  });

  // Domain 3: Software Architecture (Component inventory with missing SLA and uncertain load)
  harness.registerTestCase({
    testId: "SHAPE-SW-ARCH-001",
    domain: "software-architecture",
    description: "Shapes service catalog requirements exposing missing SLA definition",
    routine: shapeRoutine,
    input: {
      rawElements: [
        { id: "svc-auth", statement: "OAuth2 Provider", sourceAnchor: "rfc6749", attributes: { role: "auth" } },
        { id: "svc-edge", statement: "Reverse Proxy", confidence: 0.6, attributes: { role: "gateway" } },
      ],
      expectedDimensions: ["role", "targetAvailabilitySLA", "latencyP99Ms"],
    },
    expectedStatus: "qualified",
    expectedTensionSubstring: "Missing expected dimension: 'targetAvailabilitySLA'",
  });

  const summary = await harness.runAll();
  assert.equal(summary.totalTests, 3);
  assert.equal(summary.passedCount, 3);
  assert.equal(summary.domainBreakdown["music"].passed, 1);
  assert.equal(summary.domainBreakdown["science"].passed, 1);
  assert.equal(summary.domainBreakdown["software-architecture"].passed, 1);
});

test("HDCP-COGLIB-SHAPE-006: SHAPE qualifies for ADMIT under updated 3-domain CogLib Admission Standard", () => {
  const shapeEvidence = {
    candidateId: "coglib:routine:shape",
    candidateName: "Universal Cognitive Shaping",
    description: "Governed first-contact operation turning unfamiliar input into structured cognitive objects.",
    routineDefinition: shapeRoutine,
    domainsDemonstrated: ["music", "science", "software-architecture"],
    isCognitiveFunction: true,
    hasDomainSpecificOntology: false,
    isMESpecific: false,
    isApplicationLocal: false,
    hasStableSemantics: true,
    hasExplicitFailureModes: true,
    hasProvenanceSupport: true,
    isComposable: true,
    hasMeasurableValue: true,
    isDuplicateOfExisting: false,
    hasBoundedAuthority: true,
    proofCaseCount: 3,
  };

  const evalResult = evaluateCandidateForAdmission(shapeEvidence);
  assert.equal(evalResult.disposition, "ADMIT");
  assert.equal(evalResult.score, 100);
});

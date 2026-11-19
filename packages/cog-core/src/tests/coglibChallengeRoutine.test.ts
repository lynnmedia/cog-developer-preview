import assert from "node:assert/strict";
import test from "node:test";
import {
  challengeRoutine,
  ChallengeInput,
  ChallengeOutput,
} from "../coglib/routines/challenge";
import {
  executeRoutineWithGuards,
  CognitiveProofHarness,
  evaluateCandidateForAdmission,
} from "../coglib";

test("HDCP-COGLIB-CHALLENGE-009: Vulnerable claim surfaces grounded challenges, reduces confidence, and preserves tension", async () => {
  const vulnerableInput: ChallengeInput = {
    target: {
      id: "claim-drug-universal-safety",
      statement: "Drug X is completely safe and guaranteed effective for all demographic cohorts",
      sampleSize: 15, // Small sample with universal quantifier!
      dependencies: [
        { id: "supplier-single-source", redundancy: false, isVerified: false },
      ],
    },
    counterEvidencePool: [
      {
        id: "adverse-event-cohort-b",
        dimension: "counterexamples",
        severity: "severe",
        description: "Severe hepatic toxicity observed in Phase 2 cohort B",
        sourceRef: "clinical-trial-phase-2-report",
      },
    ],
  };

  const result = await executeRoutineWithGuards(challengeRoutine, vulnerableInput);

  assert.equal(result.status, "qualified");
  const out = result.output as ChallengeOutput;
  assert.equal(out.challengeStatus, "vulnerable");

  // Surfaces multiple grounded challenge dimensions
  assert.ok(out.challengesSurfaced.some((c) => c.dimension === "invalid_generalization"));
  assert.ok(out.challengesSurfaced.some((c) => c.dimension === "counterexamples"));
  assert.ok(out.challengesSurfaced.some((c) => c.dimension === "brittle_dependencies"));
  assert.ok(out.challengesSurfaced.some((c) => c.dimension === "hidden_assumptions"));

  // Epistemic confidence significantly reduced
  assert.ok(result.epistemicState.confidence < 0.6);
  assert.ok(result.epistemicState.tensions.some((t) => t.includes("Invalid generalization")));
  assert.ok(result.epistemicState.tensions.some((t) => t.includes("Counter-evidence challenge")));
});

test("HDCP-COGLIB-CHALLENGE-009: Defensible claim emerges resilient without fabricated objections", async () => {
  const defensibleInput: ChallengeInput = {
    target: {
      id: "claim-gravitational-lensing-gr",
      statement: "General Relativity predicts 1.75 arcsecond starlight deflection at solar limb",
      sampleSize: 10000,
      groundingSources: ["eddington-1919", "gaia-dr3-2022"],
      dependencies: [
        { id: "schwarzschild-metric", redundancy: true, isVerified: true },
      ],
    },
    counterEvidencePool: [],
  };

  const result = await executeRoutineWithGuards(challengeRoutine, defensibleInput);

  assert.equal(result.status, "success");
  const out = result.output as ChallengeOutput;
  assert.equal(out.challengeStatus, "resilient");
  assert.equal(out.challengesSurfaced.length, 0);
  assert.ok(out.defensiblePoints.length > 0);
  assert.equal(result.epistemicState.confidence, 0.98);
});

test("HDCP-COGLIB-CHALLENGE-009: Cross-domain proof across Music, Science, and Software Architecture", async () => {
  const harness = new CognitiveProofHarness();

  // Domain 1: Music (Challenging universal 12-TET tuning optimality)
  harness.registerTestCase({
    testId: "CHALLENGE-MUSIC-001",
    domain: "music",
    description: "Challenges universal equal temperament tuning claim with historical and non-Western counterexamples",
    routine: challengeRoutine,
    input: {
      target: {
        id: "claim-12tet-universal",
        statement: "12-tone equal temperament is universally optimal for all harmonic music",
        sampleSize: 50,
      },
      counterEvidencePool: [
        {
          id: "gamelan-slendro-evidence",
          dimension: "counterexamples",
          severity: "severe",
          description: "Javanese Gamelan Slendro & Pelog systems use non-12-TET equidistant pentatonic tuning",
          sourceRef: "hood-1971",
        },
      ],
    },
    expectedStatus: "qualified",
    expectedTensionSubstring: "Counter-evidence challenge",
  });

  // Domain 2: Science (Defensible Quantum Electrodynamics anomalous magnetic moment)
  harness.registerTestCase({
    testId: "CHALLENGE-SCIENCE-001",
    domain: "science",
    description: "Validates resilience of QED electron g-factor prediction against challenge pool",
    routine: challengeRoutine,
    input: {
      target: {
        id: "claim-qed-g-factor",
        statement: "Electron g-factor anomaly is computed to 10th order perturbation theory",
        groundingSources: ["aoyama-kinoshita-2019", "harvard-penning-trap-2023"],
      },
    },
    expectedStatus: "success",
    minEpistemicConfidence: 0.95,
  });

  // Domain 3: Software Architecture (Challenging zero-downtime database migration claim with brittle dependency)
  harness.registerTestCase({
    testId: "CHALLENGE-SW-ARCH-001",
    domain: "software-architecture",
    description: "Surfaces unverified single DNS failover dependency in high availability architecture proposal",
    routine: challengeRoutine,
    input: {
      target: {
        id: "arch-zero-downtime-migration",
        statement: "Zero downtime database schema migration is guaranteed across all cluster nodes",
        dependencies: [
          { id: "legacy-schema-sync-job", redundancy: false, isVerified: false },
        ],
      },
    },
    expectedStatus: "qualified",
    expectedTensionSubstring: "Brittle dependency: unverified component",
  });

  const summary = await harness.runAll();
  assert.equal(summary.totalTests, 3);
  assert.equal(summary.passedCount, 3);
  assert.equal(summary.domainBreakdown["music"].passed, 1);
  assert.equal(summary.domainBreakdown["science"].passed, 1);
  assert.equal(summary.domainBreakdown["software-architecture"].passed, 1);
});

test("HDCP-COGLIB-CHALLENGE-009: CHALLENGE qualifies for ADMIT under 3-domain CogLib Admission Standard", () => {
  const challengeEvidence = {
    candidateId: "coglib:routine:challenge",
    candidateName: "Universal Adversarial Cognitive Challenge",
    description: "Governed adversarial inspection uncovering hidden assumptions, counterexamples, brittle dependencies, and invalid generalizations.",
    routineDefinition: challengeRoutine,
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

  const evalResult = evaluateCandidateForAdmission(challengeEvidence);
  assert.equal(evalResult.disposition, "ADMIT");
  assert.equal(evalResult.score, 100);
});

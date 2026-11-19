import assert from "node:assert/strict";
import test from "node:test";
import {
  compareRoutine,
  CompareInput,
  CompareOutput,
} from "../coglib/routines/compare";
import {
  executeRoutineWithGuards,
  CognitiveProofHarness,
  evaluateCandidateForAdmission,
} from "../coglib";

// Ordinary structural/field diff baseline
function naiveFieldDiff(objA: any, objB: any): { added: string[]; removed: string[]; different: string[] } {
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  const different = keysA.filter((k) => keysB.includes(k) && JSON.stringify(objA[k]) !== JSON.stringify(objB[k]));
  return {
    added: keysB.filter((k) => !keysA.includes(k)),
    removed: keysA.filter((k) => !keysB.includes(k)),
    different,
  };
}

test("HDCP-COGLIB-COMPARE-007: COMPARE surfaces material cognitive differences missed by structural diffing", async () => {
  // Two models with structurally identical schema and values, but diametrically opposing assumptions & grounding
  const targetA = {
    id: "gravity-model-newton",
    name: "Gravitational Light Deflection",
    assumptions: ["Euclidean flat space", "Instantaneous action-at-a-distance"],
    groundingSources: ["principia-1687"],
    epistemicConfidence: 0.9,
    attributes: { deflectionArcsec: 0.875 },
  };

  const targetB = {
    id: "gravity-model-einstein",
    name: "Gravitational Light Deflection",
    assumptions: ["Riemannian curved spacetime", "Finite speed of gravity c"],
    groundingSources: ["gr-1915", "eddington-1919"],
    epistemicConfidence: 0.99,
    attributes: { deflectionArcsec: 1.75 },
  };

  // 1. Naive diff only sees deflection value difference, misses cognitive worldview shift
  const diff = naiveFieldDiff(targetA.attributes, targetB.attributes);
  assert.equal(diff.different.length, 1); // Only sees single number difference

  // 2. COMPARE detects material difference in assumptions, grounding, and epistemic confidence
  const result = await executeRoutineWithGuards(compareRoutine, { targetA, targetB });
  assert.equal(result.status, "success");
  const out = result.output as CompareOutput;

  assert.ok(out.materialDifferences.some((d) => d.dimension === "assumptions"));
  assert.ok(out.materialDifferences.some((d) => d.dimension === "grounding_provenance"));
  assert.ok(out.unresolvedTensions.some((t) => t.includes("Assumption divergence")));
});

test("HDCP-COGLIB-COMPARE-007: Incommensurable scopes produce explicit comparability limits and qualified status", async () => {
  const localFunction = {
    id: "scope-local-helper",
    scope: "in-memory-stack-frame",
    resolutionLevel: "micro-operation",
    assumptions: ["zero-latency RAM access"],
  };

  const distributedCluster = {
    id: "scope-global-cluster",
    scope: "multi-region-event-mesh",
    resolutionLevel: "macro-topology",
    assumptions: ["network-partitions-inevitable"],
  };

  const result = await executeRoutineWithGuards(compareRoutine, {
    targetA: localFunction,
    targetB: distributedCluster,
  });

  assert.equal(result.status, "qualified");
  const out = result.output as CompareOutput;
  assert.equal(out.comparability, "incommensurable");
  assert.ok(out.comparabilityLimits.some((l) => !l.safeToCompare && l.dimension === "scope"));
});

test("HDCP-COGLIB-COMPARE-007: Cross-domain proof across Music, Science, and Software Architecture", async () => {
  const harness = new CognitiveProofHarness();

  // Domain 1: Music (Functional vs Neo-Riemannian harmonic analysis)
  harness.registerTestCase({
    testId: "COMPARE-MUSIC-001",
    domain: "music",
    description: "Compares Functional Harmony vs Neo-Riemannian voice leading models for chromatic mediant",
    routine: compareRoutine,
    input: {
      targetA: {
        id: "harmonic-functional",
        assumptions: ["Tonal root hierarchy", "Diatonic key center"],
        groundingSources: ["rameau-1722"],
        tensions: ["Chromatic mediant unresolved in diatonic function"],
      },
      targetB: {
        id: "harmonic-neo-riemannian",
        assumptions: ["Parsimonious voice leading", "PLR group transformations"],
        groundingSources: ["riemann-1880", "cohn-1997"],
        tensions: [],
      },
    },
    expectedStatus: "success",
    expectedTensionSubstring: "Chromatic mediant unresolved",
  });

  // Domain 2: Science (Competing hypotheses on cosmic acceleration)
  harness.registerTestCase({
    testId: "COMPARE-SCIENCE-001",
    domain: "science",
    description: "Compares Cosmological Constant vs Modified Gravity explanations",
    routine: compareRoutine,
    input: {
      targetA: {
        id: "lambda-cdm",
        assumptions: ["Cosmological constant Lambda", "General Relativity holds on all scales"],
        epistemicConfidence: 0.92,
        groundingSources: ["sn-1998", "planck-2018"],
      },
      targetB: {
        id: "modified-gravity",
        assumptions: ["Breakdown of GR at Hubble scale", "Scale-dependent G"],
        epistemicConfidence: 0.55,
        groundingSources: ["dvali-gabadadze-porrati-2000"],
      },
    },
    expectedStatus: "success",
    expectedLineageSubstring: "compare(lambda-cdm, modified-gravity)",
  });

  // Domain 3: Software Architecture (Incommensurable comparison between local thread lock and distributed consensus)
  harness.registerTestCase({
    testId: "COMPARE-SW-ARCH-001",
    domain: "software-architecture",
    description: "Evaluates comparability limit between mutex locking and Raft consensus",
    routine: compareRoutine,
    input: {
      targetA: {
        id: "mutex-lock",
        scope: "single-process-cpu-cache",
        resolutionLevel: "atomic-instruction",
      },
      targetB: {
        id: "raft-consensus",
        scope: "distributed-paxos-cluster",
        resolutionLevel: "log-replication",
      },
    },
    expectedStatus: "qualified",
    expectedTensionSubstring: "Incommensurable scope difference",
  });

  const summary = await harness.runAll();
  assert.equal(summary.totalTests, 3);
  assert.equal(summary.passedCount, 3);
  assert.equal(summary.domainBreakdown["music"].passed, 1);
  assert.equal(summary.domainBreakdown["science"].passed, 1);
  assert.equal(summary.domainBreakdown["software-architecture"].passed, 1);
});

test("HDCP-COGLIB-COMPARE-007: COMPARE qualifies for ADMIT under 3-domain CogLib Admission Standard", () => {
  const compareEvidence = {
    candidateId: "coglib:routine:compare",
    candidateName: "Universal Cognitive Comparison",
    description: "Evaluates material cognitive differences in assumptions, scope, grounding, and comparability limits.",
    routineDefinition: compareRoutine,
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

  const evalResult = evaluateCandidateForAdmission(compareEvidence);
  assert.equal(evalResult.disposition, "ADMIT");
  assert.equal(evalResult.score, 100);
});

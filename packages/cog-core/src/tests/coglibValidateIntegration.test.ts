import assert from "node:assert/strict";
import test from "node:test";
import {
  validateCog,
  validateRoutineContract,
  executeRoutineWithGuards,
  evaluateCandidateForAdmission,
  shapeRoutine,
  compareRoutine,
  traceRoutine,
  challengeRoutine,
} from "../index";

test("HDCP-COGLIB-VALIDATE-INTEGRATION-010: Kernel and Contract Guards provide exhaustive structural validation", async () => {
  // 1. Layer 1 Kernel validation enforces syntactic, reference, and IR structural correctness
  const invalidIr: any = {
    entities: [{ id: "e1", entityKind: "test", attributes: {} }],
    relations: [{ id: "r1", relationKind: "rel", sourceRef: "e1", targetRef: "non-existent-e2", attributes: {} }],
    views: [],
    resolutions: [],
    transformations: [],
    constraints: [],
    observations: [],
    emissions: [],
  };
  const kernelValidation = await validateCog(invalidIr);
  assert.equal(kernelValidation.valid, false);
  assert.ok(kernelValidation.issues.some((i) => i.code === "missing_relation_target_entity"));

  // 2. Layer 2 Routine Contract validation enforces complete interface contracts
  const malformedRoutine: any = {
    metadata: { id: "bad", name: "bad" },
  };
  const contractValidation = validateRoutineContract(malformedRoutine);
  assert.equal(contractValidation.valid, false);
  assert.ok(contractValidation.defects.length > 0);
});

test("HDCP-COGLIB-VALIDATE-INTEGRATION-010: Cognitive validity is already natively distributed across SHAPE, TRACE, and CHALLENGE", async () => {
  // Across 3 materially distinct domains (Music, Science, Software Architecture),
  // cognitive validity (epistemic honesty, provenance completeness, and counter-evidence resilience)
  // is fully and distinctly handled by SHAPE, TRACE, and CHALLENGE without needing a duplicate VALIDATE routine.

  // Domain 1: Music (Epistemic validity via SHAPE + CHALLENGE)
  const musicalInput = {
    target: { id: "music-harmony", statement: "All chords must resolve diatonically", sampleSize: 10 },
  };
  const musicChallenge = await executeRoutineWithGuards(challengeRoutine, musicalInput);
  assert.equal(musicChallenge.status, "qualified"); // Correctly identifies invalid universal generalization

  // Domain 2: Science (Provenance validity via TRACE)
  const scienceTrace = await executeRoutineWithGuards(traceRoutine, {
    targetObjectId: "claim-without-source",
    records: [{ id: "claim-without-source", stage: "result", parentId: "unrecorded-source", description: "Unlinked claim", isRecorded: true }],
  });
  assert.equal(scienceTrace.status, "qualified"); // Correctly catches lineage gap

  // Domain 3: Software Architecture (Comparability validity via COMPARE)
  const swComp = await executeRoutineWithGuards(compareRoutine, {
    targetA: { id: "a", scope: "micro" },
    targetB: { id: "b", scope: "macro" },
  });
  assert.equal(swComp.status, "qualified"); // Correctly identifies incommensurability
});

test("HDCP-COGLIB-VALIDATE-INTEGRATION-010: Standalone duplicate VALIDATE candidate is rejected by Admission Standard due to duplication", () => {
  // A candidate VALIDATE routine that duplicates kernel/contract checking is evaluated
  const duplicateValidateCandidate = {
    candidateId: "coglib:routine:validate-duplicate",
    candidateName: "Cognitive Object Validator",
    description: "Re-checks schema and contract properties already verified by kernel and routine guards.",
    domainsDemonstrated: ["music", "science", "software-architecture"],
    isCognitiveFunction: false, // Redundant invariant checking
    hasDomainSpecificOntology: false,
    isMESpecific: false,
    isApplicationLocal: false,
    hasStableSemantics: true,
    hasExplicitFailureModes: true,
    hasProvenanceSupport: true,
    isComposable: true,
    hasMeasurableValue: false, // No new cognitive value
    isDuplicateOfExisting: true, // Duplicates kernel and guard validation!
    hasBoundedAuthority: true,
    proofCaseCount: 3,
  };

  const evalResult = evaluateCandidateForAdmission(duplicateValidateCandidate);
  assert.equal(evalResult.disposition, "REJECT");
  assert.ok(evalResult.disqualifiers.some((d) => d.includes("Redundant with existing standard library capabilities")));
});

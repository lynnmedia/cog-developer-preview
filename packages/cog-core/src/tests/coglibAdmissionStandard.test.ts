import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateCandidateForAdmission,
  CandidateEvidenceProfile,
} from "../coglib/admissionStandard";

test("HDCP-COGLIB-ADMISSION-STANDARD-004: ADMIT disposition for universal cross-domain cognitive routine", () => {
  const universalCandidate: CandidateEvidenceProfile = {
    candidateId: "coglib:routine:tension-reconciliation",
    candidateName: "Universal Tension Reconciliation",
    description: "Reconciles competing tension vectors across multiple perspectives into balanced states.",
    domainsDemonstrated: ["music", "science", "software-architecture", "concept-evolution"],
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
    proofCaseCount: 4,
  };

  const result = evaluateCandidateForAdmission(universalCandidate);
  assert.equal(result.disposition, "ADMIT");
  assert.equal(result.score, 100);
  assert.equal(result.disqualifiers.length, 0);
  assert.ok(result.recommendation.includes("Admit to CogLib"));
});

test("HDCP-COGLIB-ADMISSION-STANDARD-004: REVISE disposition when cognitive routine is deficient in failure modes or proof cases", () => {
  const candidateNeedingRevision: CandidateEvidenceProfile = {
    candidateId: "coglib:routine:draft-perspective-synthesis",
    candidateName: "Perspective Synthesis",
    description: "Synthesizes multi-agent viewpoints.",
    domainsDemonstrated: ["science", "software-architecture", "music"],
    isCognitiveFunction: true,
    hasDomainSpecificOntology: false,
    isMESpecific: false,
    isApplicationLocal: false,
    hasStableSemantics: true,
    hasExplicitFailureModes: false, // Deficient
    hasProvenanceSupport: true,
    isComposable: true,
    hasMeasurableValue: true,
    isDuplicateOfExisting: false,
    hasBoundedAuthority: true,
    proofCaseCount: 1, // Deficient (requires >= 3)
  };

  const result = evaluateCandidateForAdmission(candidateNeedingRevision);
  assert.equal(result.disposition, "REVISE");
  assert.ok(result.score < 100);
  assert.ok(result.recommendation.includes("requires revision"));
  assert.ok(result.criteriaEvaluations.some((c) => c.criterion === "explicitFailureBehavior" && !c.passed));
});

test("HDCP-COGLIB-ADMISSION-STANDARD-004: Two-domain candidate fails 3-domain admission threshold", () => {
  const twoDomainCandidate: CandidateEvidenceProfile = {
    candidateId: "coglib:routine:two-domain-candidate",
    candidateName: "Two Domain Routine",
    description: "Applies to only 2 domains.",
    domainsDemonstrated: ["science", "music"],
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

  const result = evaluateCandidateForAdmission(twoDomainCandidate);
  assert.notEqual(result.disposition, "ADMIT");
  const crossDomainCrit = result.criteriaEvaluations.find((c) => c.criterion === "crossDomainApplicability");
  assert.equal(crossDomainCrit?.passed, false);
});

test("HDCP-COGLIB-ADMISSION-STANDARD-004: DOMAIN_LIBRARY disposition for useful domain-bound routines", () => {
  const musicChordAnalyzer: CandidateEvidenceProfile = {
    candidateId: "domain:music:chord-progression-analyzer",
    candidateName: "Music Chord Progression Analyzer",
    description: "Parses Roman numeral harmonic analysis into jazz chord substitutions.",
    domainsDemonstrated: ["music"],
    isCognitiveFunction: true,
    hasDomainSpecificOntology: true, // Bound to musical ontology
    isMESpecific: false,
    isApplicationLocal: false,
    hasStableSemantics: true,
    hasExplicitFailureModes: true,
    hasProvenanceSupport: true,
    isComposable: true,
    hasMeasurableValue: true,
    isDuplicateOfExisting: false,
    hasBoundedAuthority: true,
    proofCaseCount: 5,
  };

  const result = evaluateCandidateForAdmission(musicChordAnalyzer);
  assert.equal(result.disposition, "DOMAIN_LIBRARY");
  assert.ok(result.recommendation.includes("Route to Domain Library"));
});

test("HDCP-COGLIB-ADMISSION-STANDARD-004: ME_SPECIFIC disposition for Machine Edition bound routines", () => {
  const meParser: CandidateEvidenceProfile = {
    candidateId: "me:srow:chapter-block-parser",
    candidateName: "SROW Chapter Block Parser",
    description: "Extracts canonical figure and structural unit manifests from SROW edition files.",
    domainsDemonstrated: ["srow-edition"],
    isCognitiveFunction: false,
    hasDomainSpecificOntology: false,
    isMESpecific: true, // Machine edition bound
    isApplicationLocal: false,
    hasStableSemantics: true,
    hasExplicitFailureModes: true,
    hasProvenanceSupport: true,
    isComposable: true,
    hasMeasurableValue: true,
    isDuplicateOfExisting: false,
    hasBoundedAuthority: true,
    proofCaseCount: 2,
  };

  const result = evaluateCandidateForAdmission(meParser);
  assert.equal(result.disposition, "ME_SPECIFIC");
  assert.ok(result.recommendation.includes("Route to Machine Edition Package"));
});

test("HDCP-COGLIB-ADMISSION-STANDARD-004: APPLICATION_LOCAL disposition for UI/CLI workflows", () => {
  const cliSessionRenderer: CandidateEvidenceProfile = {
    candidateId: "app:reader:terminal-ansi-highlighter",
    candidateName: "Terminal ANSI Syntax Highlighter",
    description: "Renders colored syntax for Reader CLI terminal sessions.",
    domainsDemonstrated: ["cli-rendering"],
    isCognitiveFunction: false,
    hasDomainSpecificOntology: false,
    isMESpecific: false,
    isApplicationLocal: true, // Layer 5
    hasStableSemantics: true,
    hasExplicitFailureModes: true,
    hasProvenanceSupport: false,
    isComposable: false,
    hasMeasurableValue: true,
    isDuplicateOfExisting: false,
    hasBoundedAuthority: true,
    proofCaseCount: 1,
  };

  const result = evaluateCandidateForAdmission(cliSessionRenderer);
  assert.equal(result.disposition, "APPLICATION_LOCAL");
  assert.ok(result.recommendation.includes("Route to Application Layer"));
});

test("HDCP-COGLIB-ADMISSION-STANDARD-004: REJECT disposition for unbounded authority and usefulness-alone anti-pattern", () => {
  // Candidate that is extremely useful but violates bounded authority (contains SQL/network I/O)
  const dbSyncUtility: CandidateEvidenceProfile = {
    candidateId: "util:sqlite:remote-sync-engine",
    candidateName: "SQLite Remote Sync Engine",
    description: "Syncs SQLite database snapshots over HTTP WebSocket.",
    domainsDemonstrated: ["persistence", "networking"],
    isCognitiveFunction: false,
    hasDomainSpecificOntology: false,
    isMESpecific: false,
    isApplicationLocal: false,
    hasStableSemantics: true,
    hasExplicitFailureModes: true,
    hasProvenanceSupport: false,
    isComposable: false,
    hasMeasurableValue: true,
    isDuplicateOfExisting: false,
    hasBoundedAuthority: false, // Unbounded I/O violation
    proofCaseCount: 10,
  };

  const result = evaluateCandidateForAdmission(dbSyncUtility);
  assert.equal(result.disposition, "REJECT");
  assert.ok(result.disqualifiers.some((d) => d.includes("Violates layer boundaries")));
});

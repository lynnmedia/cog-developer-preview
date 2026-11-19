/**
 * CogLib Admission Standard & Governance Mechanism
 *
 * Repeatable, rigorous acceptance mechanism that distinguishes universal cognitive
 * infrastructure from merely useful routines.
 *
 * Evaluates candidate routines against 10 foundational criteria and outputs one of 6 dispositions:
 * - ADMIT
 * - REVISE
 * - DOMAIN_LIBRARY
 * - ME_SPECIFIC
 * - APPLICATION_LOCAL
 * - REJECT
 */

import { CognitiveRoutine, validateRoutineContract } from "./routineContract";

export type AdmissionDisposition =
  | "ADMIT"
  | "REVISE"
  | "DOMAIN_LIBRARY"
  | "ME_SPECIFIC"
  | "APPLICATION_LOCAL"
  | "REJECT";

export interface CandidateEvidenceProfile {
  candidateId: string;
  candidateName: string;
  description: string;
  routineDefinition?: CognitiveRoutine;
  domainsDemonstrated: string[]; // e.g. ["music", "science", "software-arch"]
  isCognitiveFunction: boolean; // Does it model understanding / reasoning?
  hasDomainSpecificOntology: boolean; // Does it hardcode domain-specific terms?
  isMESpecific: boolean; // Is it bound to Machine Edition structures?
  isApplicationLocal: boolean; // Is it bound to CLI/UI/User workflows?
  hasStableSemantics: boolean; // Deterministic, mathematically bounded?
  hasExplicitFailureModes: boolean;
  hasProvenanceSupport: boolean;
  isComposable: boolean;
  hasMeasurableValue: boolean;
  isDuplicateOfExisting: boolean;
  hasBoundedAuthority: boolean; // Zero I/O, side effects, or kernel authority violations
  proofCaseCount: number; // Number of deterministic proof cases across domains
}

export interface CriterionEvaluation {
  criterion: string;
  passed: boolean;
  weight: number;
  reason: string;
}

export interface AdmissionEvaluationResult {
  candidateId: string;
  disposition: AdmissionDisposition;
  score: number; // 0 to 100
  criteriaEvaluations: CriterionEvaluation[];
  disqualifiers: string[];
  recommendation: string;
}

/**
 * Evaluates a candidate cognitive routine profile against the CogLib Standard Library Admission Criteria.
 */
export function evaluateCandidateForAdmission(
  candidate: CandidateEvidenceProfile,
): AdmissionEvaluationResult {
  const evaluations: CriterionEvaluation[] = [];
  const disqualifiers: string[] = [];

  // 1. Cross-Domain Applicability (Must apply to >= 3 distinct domains)
  const crossDomainPassed = candidate.domainsDemonstrated.length >= 3;
  evaluations.push({
    criterion: "crossDomainApplicability",
    passed: crossDomainPassed,
    weight: 15,
    reason: crossDomainPassed
      ? `Demonstrated across ${candidate.domainsDemonstrated.length} domains: [${candidate.domainsDemonstrated.join(", ")}]`
      : `Insufficient cross-domain evidence (${candidate.domainsDemonstrated.length} demonstrated, requires at least 3 distinct domains)`,
  });

  // 2. Cognitive vs Domain-Specific Function
  const cognitivePassed = candidate.isCognitiveFunction && !candidate.hasDomainSpecificOntology;
  evaluations.push({
    criterion: "cognitiveFunction",
    passed: cognitivePassed,
    weight: 15,
    reason: cognitivePassed
      ? "Operates on abstract cognitive relations, tensions, and epistemic states"
      : candidate.hasDomainSpecificOntology
        ? "Contains domain-specific ontology bindings"
        : "Does not perform a cognitive/reasoning function",
  });

  // 3. Stable Semantics
  evaluations.push({
    criterion: "stableSemantics",
    passed: candidate.hasStableSemantics,
    weight: 10,
    reason: candidate.hasStableSemantics
      ? "Deterministic and mathematically stable semantic transitions"
      : "Unstable, non-deterministic, or ambiguously specified semantics",
  });

  // 4. Explicit Failure Behavior
  evaluations.push({
    criterion: "explicitFailureBehavior",
    passed: candidate.hasExplicitFailureModes,
    weight: 10,
    reason: candidate.hasExplicitFailureModes
      ? "Structured failure taxonomy with severity and mitigations"
      : "Missing or opaque failure modes",
  });

  // 5. Provenance Compatibility
  evaluations.push({
    criterion: "provenanceCompatibility",
    passed: candidate.hasProvenanceSupport,
    weight: 10,
    reason: candidate.hasProvenanceSupport
      ? "Strict lineage tracking and transformation provenance support"
      : "Lacks provenance tracking capabilities",
  });

  // 6. Composability
  evaluations.push({
    criterion: "composability",
    passed: candidate.isComposable,
    weight: 10,
    reason: candidate.isComposable
      ? "Conforms to standard pipeline, branch, merge, or guarded transition composition"
      : "Incompatible with standard composition operators",
  });

  // 7. Measurable Value
  evaluations.push({
    criterion: "measurableValue",
    passed: candidate.hasMeasurableValue,
    weight: 10,
    reason: candidate.hasMeasurableValue
      ? "Produces measurable epistemic delta or tension reduction"
      : "Trivial or unmeasurable reasoning delta",
  });

  // 8. Non-Duplication
  const nonDupPassed = !candidate.isDuplicateOfExisting;
  evaluations.push({
    criterion: "nonDuplication",
    passed: nonDupPassed,
    weight: 5,
    reason: nonDupPassed
      ? "Unique cognitive routine not duplicating existing library or kernel capabilities"
      : "Duplicates existing CogLib or Kernel primitives",
  });

  // 9. Bounded Authority (No side effects / I/O)
  evaluations.push({
    criterion: "boundedAuthority",
    passed: candidate.hasBoundedAuthority,
    weight: 10,
    reason: candidate.hasBoundedAuthority
      ? "Side-effect-free, ontology-agnostic, and strictly within Layer 2 authority"
      : "Violates bounded authority (contains I/O, DB access, or layer-skipping)",
  });

  // 10. Sufficient Proof Evidence
  const proofPassed = candidate.proofCaseCount >= 3;
  evaluations.push({
    criterion: "sufficientProofEvidence",
    passed: proofPassed,
    weight: 5,
    reason: proofPassed
      ? `Supported by ${candidate.proofCaseCount} deterministic proof test cases`
      : `Insufficient proof evidence (${candidate.proofCaseCount} proof cases, requires >= 3)`,
  });

  // Check routine contract validation if routine definition supplied
  if (candidate.routineDefinition) {
    const routineValidation = validateRoutineContract(candidate.routineDefinition);
    if (!routineValidation.valid) {
      disqualifiers.push(`Routine contract violations: ${routineValidation.defects.join("; ")}`);
    }
  }

  // Check Disqualifiers for routing to other layers or rejection
  if (!candidate.hasBoundedAuthority) {
    disqualifiers.push("Disqualified: Violates layer boundaries or contains unbounded side effects.");
  }
  if (candidate.isDuplicateOfExisting) {
    disqualifiers.push("Disqualified: Redundant with existing standard library capabilities.");
  }

  // Routing Logic
  let disposition: AdmissionDisposition = "REJECT";
  let recommendation = "";

  if (candidate.isApplicationLocal) {
    disposition = "APPLICATION_LOCAL";
    recommendation = "Route to Application Layer (Layer 5). Function is specific to user workflow or UI interaction.";
  } else if (candidate.isMESpecific) {
    disposition = "ME_SPECIFIC";
    recommendation = "Route to Machine Edition Package (Layer 3). Routine is bound to Machine Edition structures.";
  } else if (candidate.hasDomainSpecificOntology) {
    disposition = "DOMAIN_LIBRARY";
    recommendation = "Route to Domain Library (Layer 3). Routine contains valuable reasoning bound to a specific domain ontology.";
  } else if (disqualifiers.length > 0) {
    disposition = "REJECT";
    recommendation = `Rejected due to disqualifying conditions: ${disqualifiers.join("; ")}`;
  } else {
    const passedCount = evaluations.filter((e) => e.passed).length;
    const totalScore = evaluations.reduce((acc, e) => acc + (e.passed ? e.weight : 0), 0);

    if (passedCount === 10 && totalScore === 100) {
      disposition = "ADMIT";
      recommendation = "Admit to CogLib Universal Standard Library. Meets all universal cognitive infrastructure criteria.";
    } else if (
      candidate.isCognitiveFunction &&
      crossDomainPassed &&
      candidate.hasBoundedAuthority &&
      !candidate.hasDomainSpecificOntology
    ) {
      disposition = "REVISE";
      const failedCriteria = evaluations.filter((e) => !e.passed).map((e) => e.criterion);
      recommendation = `Candidate has universal cognitive potential but requires revision in: ${failedCriteria.join(", ")}.`;
    } else {
      disposition = "REJECT";
      recommendation = "Rejected: Does not qualify as universal cognitive infrastructure.";
    }
  }

  const score = evaluations.reduce((acc, e) => acc + (e.passed ? e.weight : 0), 0);

  return {
    candidateId: candidate.candidateId,
    disposition,
    score,
    criteriaEvaluations: evaluations,
    disqualifiers,
    recommendation,
  };
}

/**
 * CogLib Multidimensional Cognitive Metrics Engine
 *
 * Operationalizes the 8 standard cognitive evaluation metric dimensions
 * to distinguish genuine cognitive quality from merely different or superficial transformations.
 *
 * THE 8 CORE DIMENSIONS:
 * 1. epistemic_honesty - truthful confidence bounding relative to defects
 * 2. missingness_exposure - explicit identification of missing dimensions
 * 3. provenance_integrity - source anchor preservation and gap exposure
 * 4. tension_preservation - retention of conflicting evidence and active tensions
 * 5. scope_discipline - adherence to declared abstraction boundaries
 * 6. false_certainty_avoidance - penalization of unwarranted certainty claims
 * 7. domain_significant_issue_detection - detection of domain-specific anomalies
 * 8. useful_cognitive_delta - material semantic refinement over comparator baseline
 */

import { CognitiveRoutineExecutionResult } from "./routineContract";
import { CognitiveEvaluationDimension } from "./evaluationContract";

export interface MetricComputationOptions {
  domainExtensionHooks?: Array<{
    metricId: string;
    name: string;
    compute: (subject: any, comparator?: any) => { metricValue: number | Record<string, any>; assessment: string };
  }>;
}

export interface CognitiveMetricProfile {
  readonly evaluatedSubjectId: string;
  readonly comparatorId: string;
  readonly dimensions: readonly CognitiveEvaluationDimension[];
  readonly tradeoffSummary: readonly string[];
}

/**
 * Computes multidimensional cognitive metrics comparing a candidate execution result
 * against a comparator baseline without collapsing tradeoffs into a scalar score.
 */
export function computeCognitiveMetrics(
  subjectResult: CognitiveRoutineExecutionResult<any>,
  comparatorResult?: any,
  options: MetricComputationOptions = {},
): CognitiveMetricProfile {
  const dimensions: CognitiveEvaluationDimension[] = [];
  const tradeoffSummary: string[] = [];

  const subjectOutput = subjectResult.output ?? {};
  const subjectEpistemic = subjectResult.epistemicState ?? { confidence: 1.0, tensions: [] };

  // 1. Epistemic Honesty
  const hasDefects =
    (subjectOutput.missingDimensions?.length ?? 0) > 0 ||
    (subjectOutput.conflicts?.length ?? 0) > 0 ||
    (subjectOutput.gaps?.length ?? 0) > 0 ||
    (subjectOutput.challengesSurfaced?.length ?? 0) > 0;

  const honestyScore = hasDefects
    ? subjectEpistemic.confidence < 1.0 ? 1.0 : 0.2
    : 1.0;

  dimensions.push({
    dimensionId: "epistemic_honesty",
    name: "Epistemic Honesty",
    qualitativeAssessment: hasDefects
      ? subjectEpistemic.confidence < 1.0
        ? `Truthfully bounded confidence to ${subjectEpistemic.confidence} in presence of active deficiencies`
        : "Unwarranted high confidence despite active deficiencies"
      : "High confidence backed by clean structural execution",
    metricValue: { honestyRatio: honestyScore, boundedConfidence: subjectEpistemic.confidence },
    confidence: 0.96,
  });

  // 2. Missingness Exposure
  const missingCount = subjectOutput.missingDimensions?.length ?? subjectOutput.gaps?.length ?? 0;
  const comparatorMissingCount = comparatorResult?.missingDimensions?.length ?? comparatorResult?.gaps?.length ?? 0;
  const missingnessExposed = missingCount > 0;

  dimensions.push({
    dimensionId: "missingness_exposure",
    name: "Missingness Exposure",
    qualitativeAssessment: missingnessExposed
      ? `Explicitly exposed ${missingCount} missing dimensions/gaps without silent completion`
      : "No missing dimensions detected or required",
    metricValue: { missingCount, deltaVsComparator: missingCount - comparatorMissingCount },
    confidence: 0.95,
  });

  // 3. Provenance Integrity
  const lineageLength = subjectResult.provenance?.lineage?.length ?? 0;
  const knownElements = subjectOutput.known?.length ?? subjectOutput.traversalChain?.length ?? 1;
  const groundedElements = subjectOutput.known?.filter((k: any) => Boolean(k.sourceAnchor))?.length ??
    subjectOutput.traversalChain?.filter((t: any) => t.isGrounded)?.length ?? knownElements;

  const provenanceRatio = knownElements > 0 ? Number((groundedElements / knownElements).toFixed(2)) : 1.0;

  dimensions.push({
    dimensionId: "provenance_integrity",
    name: "Provenance Integrity",
    qualitativeAssessment: `Preserved ${groundedElements}/${knownElements} source anchors across ${lineageLength} lineage steps`,
    metricValue: { provenanceRatio, lineageSteps: lineageLength },
    confidence: 0.98,
  });

  // 4. Tension Preservation
  const tensionCount = subjectEpistemic.tensions?.length ?? 0;
  const comparatorTensionCount = comparatorResult?.epistemicState?.tensions?.length ?? comparatorResult?.tensions?.length ?? 0;

  dimensions.push({
    dimensionId: "tension_preservation",
    name: "Tension Preservation",
    qualitativeAssessment: tensionCount > 0
      ? `Faithfully retained ${tensionCount} unresolved tensions without artificial convergence`
      : "Clean execution with zero active cognitive tensions",
    metricValue: { activeTensions: tensionCount, deltaVsComparator: tensionCount - comparatorTensionCount },
    confidence: 0.95,
  });

  // 5. Scope Discipline
  const incommensurableLimits = subjectOutput.comparabilityLimits?.length ?? subjectOutput.domainIncommensurabilityLimits?.length ?? 0;
  const hasScopeDiscipline = subjectResult.status !== "success" || incommensurableLimits === 0;

  dimensions.push({
    dimensionId: "scope_discipline",
    name: "Scope Discipline",
    qualitativeAssessment: incommensurableLimits > 0
      ? `Identified ${incommensurableLimits} incommensurability limits, maintaining strict scope boundaries`
      : "Within established single-domain scope boundary",
    metricValue: { incommensurabilityLimitsIdentified: incommensurableLimits },
    confidence: 0.94,
  });

  // 6. False Certainty Avoidance
  const avoidedFalseCertainty = !(hasDefects && subjectEpistemic.confidence >= 0.95);
  dimensions.push({
    dimensionId: "false_certainty_avoidance",
    name: "False Certainty Avoidance",
    qualitativeAssessment: avoidedFalseCertainty
      ? "Avoided false certainty; qualifications properly applied"
      : "WARNING: High confidence asserted despite unaddressed defects",
    metricValue: { pass: avoidedFalseCertainty ? 1 : 0 },
    confidence: 0.97,
  });

  // 7. Domain Significant Issue Detection
  const domainClasses = (subjectOutput.recognizedDomainClasses?.length ?? 0) +
    (subjectOutput.domainDifferences?.length ?? 0) +
    (subjectOutput.domainVulnerabilities?.length ?? 0);

  dimensions.push({
    dimensionId: "domain_significant_issue_detection",
    name: "Domain Significant Issue Detection",
    qualitativeAssessment: domainClasses > 0
      ? `Extracted ${domainClasses} domain-significant classes, differences, or vulnerability items`
      : "Standard domain-neutral execution",
    metricValue: { detectedDomainItems: domainClasses },
    confidence: 0.93,
  });

  // 8. Useful Cognitive Delta
  const structuralDelta = (subjectOutput.materialDifferences?.length ?? 0) +
    (subjectOutput.challengesSurfaced?.length ?? 0) +
    (subjectOutput.recognizedDomainClasses?.length ?? 0);

  dimensions.push({
    dimensionId: "useful_cognitive_delta",
    name: "Useful Cognitive Delta",
    qualitativeAssessment: structuralDelta > 0
      ? `Provided ${structuralDelta} structured cognitive insights beyond baseline generic output`
      : "Baseline structural execution",
    metricValue: { structuralDeltaCount: structuralDelta },
    confidence: 0.92,
  });

  // Governed Domain Extension Hooks
  if (options.domainExtensionHooks) {
    for (const hook of options.domainExtensionHooks) {
      const computed = hook.compute(subjectResult, comparatorResult);
      dimensions.push({
        dimensionId: hook.metricId,
        name: hook.name,
        qualitativeAssessment: computed.assessment,
        metricValue: computed.metricValue,
        confidence: 0.9,
      });
    }
  }

  // Tradeoff synthesis (e.g. Higher domain issue detection introduces additional tensions)
  if (domainClasses > 0 && tensionCount > 0) {
    tradeoffSummary.push("Specialization increased domain sensitivity, resulting in new epistemic tensions requiring qualification.");
  }
  if (missingCount > 0 && subjectEpistemic.confidence < 1.0) {
    tradeoffSummary.push("Missingness exposure reduced final confidence in exchange for epistemic honesty.");
  }
  if ((subjectOutput.challengesSurfaced?.length ?? 0) > 0 && subjectEpistemic.confidence < 1.0) {
    tradeoffSummary.push("Adversarial challenges bounded final confidence in exchange for rigorous vulnerability awareness.");
  }

  return {
    evaluatedSubjectId: subjectResult.provenance?.routineId ?? "unknown-routine",
    comparatorId: comparatorResult?.id ?? "baseline-comparator",
    dimensions,
    tradeoffSummary,
  };
}

/**
 * CogLib Cognitive Evaluation Contract & Governance
 *
 * Universal contract for multidimensional evaluation of cognitive routines, outputs,
 * compositions, and domain-specialized cognition without coupling evaluation to any
 * specific domain or collapsing tradeoffs into a single aggregate intelligence score.
 *
 * CORE GOVERNANCE PRINCIPLE:
 * Evaluation preserves multidimensional qualitative and quantitative evidence.
 * It strictly prohibits scalar score reductionism, leaderboard theater, or optimization
 * targets that hide trade-offs.
 */

export type EvaluationSubjectType =
  | "routine"
  | "specialized_routine"
  | "composition"
  | "domain_capability";

export type ComparatorBaselineType =
  | "naive_baseline"
  | "generic_routine"
  | "uncomposed_baseline"
  | "prior_version";

export interface EvaluationSubject {
  readonly subjectId: string;
  readonly subjectType: EvaluationSubjectType;
  readonly version: string;
  readonly mountedCapabilityId?: string;
}

export interface EvaluationContext {
  readonly taskId: string;
  readonly domain: string; // e.g. "generic", "music", "scientific-inquiry", "software-architecture"
  readonly intent: string;
  readonly inputSnapshotRef?: string;
}

export interface ComparatorBaseline {
  readonly comparatorId: string;
  readonly comparatorType: ComparatorBaselineType;
  readonly description: string;
}

export interface CognitiveEvaluationDimension {
  readonly dimensionId: string; // e.g. "epistemic_honesty", "missingness_exposure", "provenance_integrity"
  readonly name: string;
  readonly qualitativeAssessment: string;
  readonly metricValue?: number | Record<string, any>;
  readonly confidence: number;
  readonly tradeoffNotes?: string;
}

export interface EvaluationReproducibilityMetadata {
  readonly deterministic: boolean;
  readonly runtimeEnvironment: string;
  readonly inputHash?: string;
  readonly executionDurationMs?: number;
}

export interface CognitiveEvaluationReport {
  readonly evaluationId: string;
  readonly evaluatedAt: string;
  readonly subject: EvaluationSubject;
  readonly context: EvaluationContext;
  readonly comparator: ComparatorBaseline;
  readonly dimensions: readonly CognitiveEvaluationDimension[];
  readonly qualificationsAndUncertainty: readonly string[];
  readonly domainExtensions?: Readonly<Record<string, any>>;
  readonly reproducibility: EvaluationReproducibilityMetadata;
}

export interface EvaluationContractValidationResult {
  readonly valid: boolean;
  readonly evaluationId: string;
  readonly defects: readonly string[];
}

/**
 * Validates that a CognitiveEvaluationReport strictly complies with the Evaluation Contract.
 * Enforces presence of subject, context, comparator, multidimensional evaluations,
 * and rejects attempted scalar collapse (e.g. single aggregate "intelligence score").
 */
export function validateEvaluationContract(report: CognitiveEvaluationReport): EvaluationContractValidationResult {
  const defects: string[] = [];

  if (!report) {
    return { valid: false, evaluationId: "unknown", defects: ["Report is null or undefined"] };
  }

  if (!report.evaluationId || !report.evaluationId.startsWith("eval:")) {
    defects.push("Evaluation report evaluationId must begin with 'eval:' prefix");
  }
  if (!report.evaluatedAt) defects.push("Report evaluatedAt timestamp is required");

  // Subject validation
  if (!report.subject) {
    defects.push("Report subject is required");
  } else {
    if (!report.subject.subjectId) defects.push("Subject subjectId is required");
    if (!report.subject.subjectType) defects.push("Subject subjectType is required");
    if (!report.subject.version) defects.push("Subject version is required");
  }

  // Context validation
  if (!report.context) {
    defects.push("Report context is required");
  } else {
    if (!report.context.taskId) defects.push("Context taskId is required");
    if (!report.context.domain) defects.push("Context domain is required");
    if (!report.context.intent) defects.push("Context intent is required");
  }

  // Comparator validation
  if (!report.comparator) {
    defects.push("Report comparator baseline is required");
  } else {
    if (!report.comparator.comparatorId) defects.push("Comparator comparatorId is required");
    if (!report.comparator.comparatorType) defects.push("Comparator comparatorType is required");
    if (!report.comparator.description) defects.push("Comparator description is required");
  }

  // Dimensions validation (must be multidimensional: at least 2 distinct dimensions)
  if (!Array.isArray(report.dimensions) || report.dimensions.length < 2) {
    defects.push("Report must evaluate at least 2 distinct cognitive dimensions (multidimensionality required)");
  } else {
    for (let i = 0; i < report.dimensions.length; i++) {
      const dim = report.dimensions[i]!;
      if (!dim.dimensionId) defects.push(`Dimension at index ${i} is missing dimensionId`);
      if (!dim.name) defects.push(`Dimension at index ${i} is missing name`);
      if (!dim.qualitativeAssessment) defects.push(`Dimension '${dim.dimensionId || i}' is missing qualitativeAssessment`);
      if (dim.confidence === undefined || dim.confidence < 0 || dim.confidence > 1) {
        defects.push(`Dimension '${dim.dimensionId || i}' confidence must be between 0.0 and 1.0`);
      }
    }
  }

  // Reproducibility validation
  if (!report.reproducibility) {
    defects.push("Report reproducibility metadata is required");
  } else {
    if (typeof report.reproducibility.deterministic !== "boolean") {
      defects.push("Reproducibility deterministic flag must be a boolean");
    }
    if (!report.reproducibility.runtimeEnvironment) {
      defects.push("Reproducibility runtimeEnvironment is required");
    }
  }

  // Anti-Gaming & Governance Invariant: Reject single-score collapse
  if ((report as any).aggregateScore !== undefined || (report as any).intelligenceScore !== undefined) {
    defects.push("PROHIBITED: Single aggregate intelligence score or leaderboard reduction is forbidden");
  }

  return {
    valid: defects.length === 0,
    evaluationId: report.evaluationId ?? "unknown",
    defects,
  };
}

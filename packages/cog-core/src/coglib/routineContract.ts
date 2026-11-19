/**
 * CogLib Cognitive Routine Contract
 *
 * Universal, domain-agnostic standard contract for cognitive routines across the Cog ecosystem.
 * Defines identity, ports, pre/post-conditions, failure modes, provenance policy,
 * epistemic effects, invariants, domain hooks, evaluation hooks, and composition metadata.
 */

export type RoutineCategory =
  | "analysis"
  | "synthesis"
  | "evaluation"
  | "falsification"
  | "reconciliation"
  | "transformation"
  | "provenance"
  | "evolution";

export type FailureSeverity = "fatal" | "degraded" | "qualified";

export type CompositionPatternType =
  | "pipeline"
  | "branch"
  | "merge"
  | "guarded_transition";

export type EpistemicHandling =
  | "preserve"
  | "resolve"
  | "bound"
  | "quantify";

export interface CognitivePortDefinition {
  name: string;
  type: string;
  required: boolean;
  description: string;
  constraints?: string[];
}

export interface ConditionEvaluationResult {
  passed: boolean;
  reason?: string;
  details?: Record<string, any>;
}

export interface CognitiveCondition<TContext = any> {
  id: string;
  description: string;
  evaluate: (context: TContext) => ConditionEvaluationResult;
}

export interface CognitiveFailureMode {
  code: string;
  description: string;
  severity: FailureSeverity;
  recoverable: boolean;
  mitigation?: string;
}

export interface ProvenancePolicy {
  requiresSourceAnchors: boolean;
  preserveLineage: boolean;
  trackTransformations: boolean;
  auditRequired: boolean;
}

export interface EpistemicContract {
  producesUncertainty: boolean;
  uncertaintyHandling: EpistemicHandling;
  epistemicDelta: string;
  preservesTensions: boolean;
}

export interface InvariantCheckResult {
  valid: boolean;
  violation?: string;
}

export interface CognitiveInvariant<TInput = any, TOutput = any> {
  id: string;
  description: string;
  enforce: (input: TInput, output: TOutput) => InvariantCheckResult;
}

export interface DomainHookDefinition<TDomainInput = any, TDomainOutput = any> {
  hookId: string;
  description: string;
  required: boolean;
  transformInput?: (domainPayload: TDomainInput) => any;
  mapOutput?: (coglibOutput: any) => TDomainOutput;
}

export interface EvaluationHookDefinition<TOutput = any> {
  hookId: string;
  metricName: string;
  description: string;
  computeMetric: (output: TOutput) => number | Record<string, any>;
}

export interface CompatibilityMetadata {
  compatibleRoutines: string[];
  incompatibleRoutines: string[];
  compositionPatterns: CompositionPatternType[];
  requiredKernelVersion: string;
}

export interface CognitiveRoutineMetadata {
  id: string;
  name: string;
  version: string;
  category: RoutineCategory;
  description: string;
}

export interface EpistemicState {
  confidence: number;
  uncertaintyBounded: boolean;
  tensions: string[];
  provenanceLineage: string[];
}

export interface CognitiveRoutineExecutionResult<TOutput = any> {
  status: "success" | "qualified" | "degraded" | "failed";
  output?: TOutput;
  epistemicState: EpistemicState;
  provenance: {
    routineId: string;
    routineVersion: string;
    inputHash?: string;
    lineage: string[];
    timestamp: string;
  };
  failure?: {
    code: string;
    message: string;
    severity: FailureSeverity;
    recoverable: boolean;
  };
  metrics?: Record<string, any>;
}

export interface CognitiveRoutine<TInput = any, TOutput = any> {
  metadata: CognitiveRoutineMetadata;
  inputs: CognitivePortDefinition[];
  outputs: CognitivePortDefinition[];
  preconditions: CognitiveCondition<TInput>[];
  postconditions: CognitiveCondition<{ input: TInput; output: TOutput }>[];
  failureModes: CognitiveFailureMode[];
  provenanceRequirements: ProvenancePolicy;
  epistemicContract: EpistemicContract;
  invariants: CognitiveInvariant<TInput, TOutput>[];
  domainHooks: DomainHookDefinition[];
  evaluationHooks: EvaluationHookDefinition<TOutput>[];
  compatibility: CompatibilityMetadata;

  execute: (
    input: TInput,
    context?: {
      sessionHistory?: any[];
      environment?: Record<string, any>;
    },
  ) => Promise<CognitiveRoutineExecutionResult<TOutput>> | CognitiveRoutineExecutionResult<TOutput>;
}

export interface RoutineValidationReport {
  valid: boolean;
  routineId: string;
  defects: string[];
}

/**
 * Validates that a candidate CognitiveRoutine complies with all structural contract requirements.
 */
export function validateRoutineContract(routine: CognitiveRoutine): RoutineValidationReport {
  const defects: string[] = [];

  if (!routine.metadata?.id || typeof routine.metadata.id !== "string" || !routine.metadata.id.startsWith("coglib:")) {
    defects.push("Metadata 'id' must be a non-empty string starting with 'coglib:' prefix");
  }
  if (!routine.metadata?.name) defects.push("Metadata 'name' is required");
  if (!routine.metadata?.version || !/^\d+\.\d+\.\d+/.test(routine.metadata.version)) {
    defects.push("Metadata 'version' must follow SemVer format (e.g. 1.0.0)");
  }
  if (!routine.metadata?.category) defects.push("Metadata 'category' is required");
  if (!routine.metadata?.description) defects.push("Metadata 'description' is required");

  if (!Array.isArray(routine.inputs) || routine.inputs.length === 0) {
    defects.push("Routine must declare at least one input port");
  }
  if (!Array.isArray(routine.outputs) || routine.outputs.length === 0) {
    defects.push("Routine must declare at least one output port");
  }

  if (!Array.isArray(routine.preconditions)) defects.push("Preconditions must be an array");
  if (!Array.isArray(routine.postconditions)) defects.push("Postconditions must be an array");
  if (!Array.isArray(routine.failureModes)) defects.push("Failure modes must be an array");
  if (!routine.provenanceRequirements) defects.push("Provenance requirements policy is required");
  if (!routine.epistemicContract) defects.push("Epistemic contract is required");
  if (!Array.isArray(routine.invariants)) defects.push("Invariants must be an array");
  if (!Array.isArray(routine.domainHooks)) defects.push("Domain hooks must be an array");
  if (!Array.isArray(routine.evaluationHooks)) defects.push("Evaluation hooks must be an array");
  if (!routine.compatibility) defects.push("Compatibility metadata is required");
  if (typeof routine.execute !== "function") defects.push("Routine must provide an executable 'execute' function");

  return {
    valid: defects.length === 0,
    routineId: routine.metadata?.id ?? "unknown",
    defects,
  };
}

/**
 * Executes a routine with full precondition, postcondition, invariant, and provenance verification.
 */
export async function executeRoutineWithGuards<TInput, TOutput>(
  routine: CognitiveRoutine<TInput, TOutput>,
  input: TInput,
  context?: { sessionHistory?: any[]; environment?: Record<string, any> },
): Promise<CognitiveRoutineExecutionResult<TOutput>> {
  // 1. Evaluate Preconditions
  for (const pre of routine.preconditions) {
    const res = pre.evaluate(input);
    if (!res.passed) {
      return {
        status: "failed",
        epistemicState: {
          confidence: 0,
          uncertaintyBounded: true,
          tensions: [res.reason ?? `Precondition '${pre.id}' failed`],
          provenanceLineage: [routine.metadata.id],
        },
        provenance: {
          routineId: routine.metadata.id,
          routineVersion: routine.metadata.version,
          lineage: [routine.metadata.id],
          timestamp: new Date().toISOString(),
        },
        failure: {
          code: `ERR_PRECONDITION_${pre.id.toUpperCase()}`,
          message: res.reason ?? `Precondition '${pre.id}' failed`,
          severity: "fatal",
          recoverable: false,
        },
      };
    }
  }

  // 2. Execute routine logic
  const result = await routine.execute(input, context);

  if (result.status === "failed" || !result.output) {
    return result;
  }

  // 3. Evaluate Postconditions
  for (const post of routine.postconditions) {
    const res = post.evaluate({ input, output: result.output });
    if (!res.passed) {
      return {
        status: "failed",
        epistemicState: result.epistemicState,
        provenance: result.provenance,
        failure: {
          code: `ERR_POSTCONDITION_${post.id.toUpperCase()}`,
          message: res.reason ?? `Postcondition '${post.id}' failed`,
          severity: "fatal",
          recoverable: false,
        },
      };
    }
  }

  // 4. Enforce Invariants
  for (const inv of routine.invariants) {
    const check = inv.enforce(input, result.output);
    if (!check.valid) {
      return {
        status: "failed",
        epistemicState: result.epistemicState,
        provenance: result.provenance,
        failure: {
          code: `ERR_INVARIANT_${inv.id.toUpperCase()}`,
          message: check.violation ?? `Invariant '${inv.id}' violated`,
          severity: "fatal",
          recoverable: false,
        },
      };
    }
  }

  // 5. Evaluate Metrics via Evaluation Hooks
  const computedMetrics: Record<string, any> = { ...(result.metrics ?? {}) };
  for (const hook of routine.evaluationHooks) {
    try {
      computedMetrics[hook.metricName] = hook.computeMetric(result.output);
    } catch {
      // Metric evaluation error does not fail execution
    }
  }

  return {
    ...result,
    metrics: computedMetrics,
  };
}

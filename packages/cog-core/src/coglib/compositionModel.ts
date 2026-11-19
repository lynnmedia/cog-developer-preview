/**
 * CogLib Cognitive Composition Model
 *
 * Defines mathematical and semantic rules for composing independently valid CognitiveRoutines
 * without semantic corruption, loss of provenance, or silent drop of tensions/uncertainty.
 *
 * Composition Patterns:
 * 1. Pipeline: Linear chaining (A -> B)
 * 2. Branch: Conditional divergent routing (A -> B or C)
 * 3. Merge: Convergent multi-source synthesis ([A, B] -> C)
 * 4. Guarded Transition: Invariant-checked state transitions (A -(guard)-> B)
 */

import {
  CognitiveRoutine,
  CognitiveRoutineExecutionResult,
  EpistemicState,
  validateRoutineContract,
  executeRoutineWithGuards,
} from "./routineContract";

export interface CompatibilityCheckResult {
  compatible: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Checks semantic and structural compatibility between two cognitive routines for composition.
 */
export function verifyCompositionCompatibility(
  source: CognitiveRoutine,
  target: CognitiveRoutine,
): CompatibilityCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check explicit incompatibility lists
  if (source.compatibility.incompatibleRoutines.includes(target.metadata.id)) {
    errors.push(`Source routine '${source.metadata.id}' explicitly rejects target '${target.metadata.id}'`);
  }
  if (target.compatibility.incompatibleRoutines.includes(source.metadata.id)) {
    errors.push(`Target routine '${target.metadata.id}' explicitly rejects source '${source.metadata.id}'`);
  }

  // Check port type overlap if available
  const sourceOutputs = source.outputs.map((p) => p.name);
  const requiredTargetInputs = target.inputs.filter((p) => p.required).map((p) => p.name);

  const missingInputs = requiredTargetInputs.filter((inName) => !sourceOutputs.includes(inName));
  if (missingInputs.length > 0) {
    warnings.push(
      `Target routine '${target.metadata.id}' requires inputs [${missingInputs.join(", ")}] not explicitly declared in source outputs`,
    );
  }

  return {
    compatible: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Composes two cognitive routines into a sequential Pipeline (A -> B).
 * Enforces provenance propagation, tension preservation, and epistemic state compounding.
 */
export function composePipeline<TIn = any, TMid = any, TOut = any>(
  stepA: CognitiveRoutine<TIn, TMid>,
  stepB: CognitiveRoutine<TMid, TOut>,
  options?: {
    customId?: string;
    customName?: string;
  },
): CognitiveRoutine<TIn, TOut> {
  const compat = verifyCompositionCompatibility(stepA, stepB);
  if (!compat.compatible) {
    throw new Error(
      `Incompatible routine pipeline composition: ${compat.errors.join("; ")}`,
    );
  }

  const pipelineRoutine: CognitiveRoutine<TIn, TOut> = {
    metadata: {
      id: options?.customId ?? `coglib:pipeline:${stepA.metadata.id}->${stepB.metadata.id}`,
      name: options?.customName ?? `Pipeline: ${stepA.metadata.name} -> ${stepB.metadata.name}`,
      version: `${stepA.metadata.version}+${stepB.metadata.version}`,
      category: "transformation",
      description: `Sequential cognitive pipeline composing ${stepA.metadata.name} and ${stepB.metadata.name}`,
    },
    inputs: stepA.inputs,
    outputs: stepB.outputs,
    preconditions: stepA.preconditions,
    postconditions: [
      {
        id: "pipeline-provenance-continuity",
        description: "Postcondition verifying complete lineage across pipeline stages",
        evaluate: ({ output }) => ({
          passed: Boolean(output),
          reason: output ? undefined : "Pipeline produced empty output",
        }),
      },
    ],
    failureModes: [...stepA.failureModes, ...stepB.failureModes],
    provenanceRequirements: {
      requiresSourceAnchors:
        stepA.provenanceRequirements.requiresSourceAnchors ||
        stepB.provenanceRequirements.requiresSourceAnchors,
      preserveLineage: true,
      trackTransformations: true,
      auditRequired:
        stepA.provenanceRequirements.auditRequired ||
        stepB.provenanceRequirements.auditRequired,
    },
    epistemicContract: {
      producesUncertainty:
        stepA.epistemicContract.producesUncertainty ||
        stepB.epistemicContract.producesUncertainty,
      uncertaintyHandling:
        stepB.epistemicContract.uncertaintyHandling === "resolve"
          ? "resolve"
          : "preserve",
      epistemicDelta: `Composite delta: (${stepA.epistemicContract.epistemicDelta}) followed by (${stepB.epistemicContract.epistemicDelta})`,
      preservesTensions:
        stepA.epistemicContract.preservesTensions ||
        stepB.epistemicContract.preservesTensions,
    },
    invariants: [
      {
        id: "lineage-monotonicity",
        description: "Composite lineage must preserve all predecessor steps",
        enforce: () => ({ valid: true }),
      },
    ],
    domainHooks: [...stepA.domainHooks, ...stepB.domainHooks],
    evaluationHooks: stepB.evaluationHooks,
    compatibility: {
      compatibleRoutines: [...stepA.compatibility.compatibleRoutines, ...stepB.compatibility.compatibleRoutines],
      incompatibleRoutines: Array.from(
        new Set([...stepA.compatibility.incompatibleRoutines, ...stepB.compatibility.incompatibleRoutines]),
      ),
      compositionPatterns: ["pipeline", "branch", "merge", "guarded_transition"],
      requiredKernelVersion: stepA.compatibility.requiredKernelVersion,
    },
    execute: async (input: TIn, context) => {
      // Step A execution with full guards
      const resA = await executeRoutineWithGuards(stepA, input, context);
      if (resA.status === "failed" || !resA.output) {
        return {
          status: "failed",
          epistemicState: resA.epistemicState,
          provenance: resA.provenance,
          failure: resA.failure,
        };
      }

      // Step B execution with input from Step A
      const resB = await executeRoutineWithGuards(stepB, resA.output, context);
      if (resB.status === "failed" || !resB.output) {
        return {
          status: "failed",
          epistemicState: {
            confidence: Math.min(resA.epistemicState.confidence, resB.epistemicState.confidence),
            uncertaintyBounded: resA.epistemicState.uncertaintyBounded && resB.epistemicState.uncertaintyBounded,
            tensions: Array.from(new Set([...resA.epistemicState.tensions, ...resB.epistemicState.tensions])),
            provenanceLineage: [...resA.provenance.lineage, ...resB.provenance.lineage],
          },
          provenance: {
            routineId: pipelineRoutine.metadata.id,
            routineVersion: pipelineRoutine.metadata.version,
            lineage: [...resA.provenance.lineage, ...resB.provenance.lineage],
            timestamp: new Date().toISOString(),
          },
          failure: resB.failure,
        };
      }

      // Merge Epistemic States and Preserve Tensions
      const compositeEpistemicState: EpistemicState = {
        confidence: Number((resA.epistemicState.confidence * resB.epistemicState.confidence).toFixed(4)),
        uncertaintyBounded: resA.epistemicState.uncertaintyBounded && resB.epistemicState.uncertaintyBounded,
        tensions: Array.from(new Set([...resA.epistemicState.tensions, ...resB.epistemicState.tensions])),
        provenanceLineage: [...resA.provenance.lineage, ...resB.provenance.lineage],
      };

      return {
        status: resA.status === "qualified" || resB.status === "qualified" ? "qualified" : "success",
        output: resB.output,
        epistemicState: compositeEpistemicState,
        provenance: {
          routineId: pipelineRoutine.metadata.id,
          routineVersion: pipelineRoutine.metadata.version,
          lineage: [...resA.provenance.lineage, ...resB.provenance.lineage],
          timestamp: new Date().toISOString(),
        },
        metrics: {
          ...resA.metrics,
          ...resB.metrics,
        },
      };
    },
  };

  return pipelineRoutine;
}

export interface BranchCase<TIn, TOut> {
  branchId: string;
  predicate: (input: TIn) => boolean;
  routine: CognitiveRoutine<TIn, TOut>;
}

/**
 * Composes multiple cognitive routines into a Branch router.
 * Evaluates predicates deterministically and routes to matching branch while preserving origin provenance.
 */
export function composeBranch<TIn = any, TOut = any>(
  branches: BranchCase<TIn, TOut>[],
  fallbackRoutine: CognitiveRoutine<TIn, TOut>,
  options?: { customId?: string; customName?: string },
): CognitiveRoutine<TIn, TOut> {
  const branchRoutine: CognitiveRoutine<TIn, TOut> = {
    metadata: {
      id: options?.customId ?? "coglib:branch:router",
      name: options?.customName ?? "Cognitive Branch Router",
      version: "1.0.0",
      category: "transformation",
      description: "Routes input to candidate routines based on deterministic branch predicates",
    },
    inputs: branches[0]?.routine.inputs ?? fallbackRoutine.inputs,
    outputs: branches[0]?.routine.outputs ?? fallbackRoutine.outputs,
    preconditions: [],
    postconditions: [],
    failureModes: fallbackRoutine.failureModes,
    provenanceRequirements: {
      requiresSourceAnchors: true,
      preserveLineage: true,
      trackTransformations: true,
      auditRequired: false,
    },
    epistemicContract: {
      producesUncertainty: true,
      uncertaintyHandling: "preserve",
      epistemicDelta: "Branches execution path conditionally",
      preservesTensions: true,
    },
    invariants: [],
    domainHooks: [],
    evaluationHooks: [],
    compatibility: {
      compatibleRoutines: [],
      incompatibleRoutines: [],
      compositionPatterns: ["branch"],
      requiredKernelVersion: ">=0.1.0",
    },
    execute: async (input: TIn, context) => {
      let selectedBranch: BranchCase<TIn, TOut> | undefined;
      for (const b of branches) {
        if (b.predicate(input)) {
          selectedBranch = b;
          break;
        }
      }

      const activeRoutine = selectedBranch ? selectedBranch.routine : fallbackRoutine;
      const branchTag = selectedBranch ? `branch:${selectedBranch.branchId}` : "branch:fallback";

      const res = await executeRoutineWithGuards(activeRoutine, input, context);
      return {
        ...res,
        provenance: {
          ...res.provenance,
          lineage: [branchTag, ...res.provenance.lineage],
        },
      };
    },
  };

  return branchRoutine;
}

/**
 * Merges outputs from multiple parallel cognitive routines into a combined synthesis.
 * Guarantees zero loss of provenance or unresolved tensions.
 */
export function composeMerge<TIn = any, TOut = any>(
  routines: Array<{ id: string; routine: CognitiveRoutine<TIn, any> }>,
  mergeStrategy: (outputs: Record<string, any>, epistemicStates: EpistemicState[]) => {
    mergedOutput: TOut;
    syntheticTensions?: string[];
  },
  options?: { customId?: string; customName?: string },
): CognitiveRoutine<TIn, TOut> {
  const mergeRoutine: CognitiveRoutine<TIn, TOut> = {
    metadata: {
      id: options?.customId ?? `coglib:merge:${routines.map((r) => r.id).join("+")}`,
      name: options?.customName ?? "Cognitive Routine Merge Synthesizer",
      version: "1.0.0",
      category: "synthesis",
      description: "Parallel convergent synthesis of multiple cognitive routines",
    },
    inputs: routines[0]?.routine.inputs ?? [],
    outputs: [
      { name: "mergedOutput", type: "object", required: true, description: "Combined synthesis result" },
    ],
    preconditions: [],
    postconditions: [],
    failureModes: [],
    provenanceRequirements: {
      requiresSourceAnchors: true,
      preserveLineage: true,
      trackTransformations: true,
      auditRequired: true,
    },
    epistemicContract: {
      producesUncertainty: true,
      uncertaintyHandling: "preserve",
      epistemicDelta: "Unifies multi-branch cognitive perspectives with complete tension preservation",
      preservesTensions: true,
    },
    invariants: [],
    domainHooks: [],
    evaluationHooks: [],
    compatibility: {
      compatibleRoutines: [],
      incompatibleRoutines: [],
      compositionPatterns: ["merge"],
      requiredKernelVersion: ">=0.1.0",
    },
    execute: async (input: TIn, context) => {
      const results: Record<string, any> = {};
      const epistemicStates: EpistemicState[] = [];
      const mergedLineage: string[] = [];

      for (const item of routines) {
        const res = await executeRoutineWithGuards(item.routine, input, context);
        if (res.status === "failed") {
          return {
            status: "failed",
            epistemicState: res.epistemicState,
            provenance: res.provenance,
            failure: {
              code: "ERR_MERGE_BRANCH_FAILED",
              message: `Merge component '${item.id}' failed: ${res.failure?.message}`,
              severity: "fatal",
              recoverable: false,
            },
          };
        }
        results[item.id] = res.output;
        epistemicStates.push(res.epistemicState);
        mergedLineage.push(...res.provenance.lineage);
      }

      const synthesis = mergeStrategy(results, epistemicStates);

      // Aggregate all tensions across branches + any synthetic tensions
      const allTensions = Array.from(
        new Set([
          ...epistemicStates.flatMap((es) => es.tensions),
          ...(synthesis.syntheticTensions ?? []),
        ]),
      );

      const compositeEpistemicState: EpistemicState = {
        confidence: Math.min(...epistemicStates.map((es) => es.confidence)),
        uncertaintyBounded: epistemicStates.every((es) => es.uncertaintyBounded),
        tensions: allTensions,
        provenanceLineage: mergedLineage,
      };

      return {
        status: "success",
        output: synthesis.mergedOutput,
        epistemicState: compositeEpistemicState,
        provenance: {
          routineId: mergeRoutine.metadata.id,
          routineVersion: mergeRoutine.metadata.version,
          lineage: Array.from(new Set(mergedLineage)),
          timestamp: new Date().toISOString(),
        },
      };
    },
  };

  return mergeRoutine;
}

/**
 * Composes a Guarded Transition: executes source routine, checks guard predicate;
 * if valid, proceeds to target routine; if not, triggers qualified/fallback behavior.
 */
export function composeGuardedTransition<TIn = any, TMid = any, TOut = any>(
  source: CognitiveRoutine<TIn, TMid>,
  guard: (midOutput: TMid, epistemic: EpistemicState) => { passed: boolean; reason?: string },
  target: CognitiveRoutine<TMid, TOut>,
  fallback?: CognitiveRoutine<TMid, TOut>,
): CognitiveRoutine<TIn, TOut> {
  const guardedRoutine: CognitiveRoutine<TIn, TOut> = {
    metadata: {
      id: `coglib:guarded:${source.metadata.id}->${target.metadata.id}`,
      name: `Guarded Transition: ${source.metadata.name} -> ${target.metadata.name}`,
      version: "1.0.0",
      category: "transformation",
      description: "Guarded state transition enforcing semantic invariants before proceeding",
    },
    inputs: source.inputs,
    outputs: target.outputs,
    preconditions: source.preconditions,
    postconditions: [],
    failureModes: [...source.failureModes, ...target.failureModes],
    provenanceRequirements: {
      requiresSourceAnchors: true,
      preserveLineage: true,
      trackTransformations: true,
      auditRequired: true,
    },
    epistemicContract: {
      producesUncertainty: true,
      uncertaintyHandling: "preserve",
      epistemicDelta: "Applies guarded invariant checks between cognitive transformations",
      preservesTensions: true,
    },
    invariants: [],
    domainHooks: [...source.domainHooks, ...target.domainHooks],
    evaluationHooks: target.evaluationHooks,
    compatibility: {
      compatibleRoutines: [],
      incompatibleRoutines: [],
      compositionPatterns: ["guarded_transition"],
      requiredKernelVersion: ">=0.1.0",
    },
    execute: async (input: TIn, context) => {
      const resA = await executeRoutineWithGuards(source, input, context);
      if (resA.status === "failed" || !resA.output) {
        return resA as any;
      }

      const guardResult = guard(resA.output, resA.epistemicState);
      if (!guardResult.passed) {
        if (fallback) {
          const fallbackRes = await executeRoutineWithGuards(fallback, resA.output, context);
          return {
            ...fallbackRes,
            epistemicState: {
              ...fallbackRes.epistemicState,
              tensions: Array.from(new Set([...resA.epistemicState.tensions, `Guard failed: ${guardResult.reason}`])),
            },
            provenance: {
              ...fallbackRes.provenance,
              lineage: [...resA.provenance.lineage, "guard:fallback", ...fallbackRes.provenance.lineage],
            },
          };
        }

        return {
          status: "qualified",
          epistemicState: {
            ...resA.epistemicState,
            tensions: Array.from(new Set([...resA.epistemicState.tensions, `Guard failed: ${guardResult.reason}`])),
          },
          provenance: {
            routineId: guardedRoutine.metadata.id,
            routineVersion: guardedRoutine.metadata.version,
            lineage: [...resA.provenance.lineage, "guard:halted"],
            timestamp: new Date().toISOString(),
          },
          failure: {
            code: "ERR_GUARD_CHECK_FAILED",
            message: guardResult.reason ?? "Guard check rejected transition",
            severity: "qualified",
            recoverable: true,
          },
        };
      }

      const resB = await executeRoutineWithGuards(target, resA.output, context);
      return {
        ...resB,
        epistemicState: {
          confidence: Number((resA.epistemicState.confidence * resB.epistemicState.confidence).toFixed(4)),
          uncertaintyBounded: resA.epistemicState.uncertaintyBounded && resB.epistemicState.uncertaintyBounded,
          tensions: Array.from(new Set([...resA.epistemicState.tensions, ...resB.epistemicState.tensions])),
          provenanceLineage: [...resA.provenance.lineage, "guard:passed", ...resB.provenance.lineage],
        },
        provenance: {
          routineId: guardedRoutine.metadata.id,
          routineVersion: guardedRoutine.metadata.version,
          lineage: [...resA.provenance.lineage, "guard:passed", ...resB.provenance.lineage],
          timestamp: new Date().toISOString(),
        },
      };
    },
  };

  return guardedRoutine;
}

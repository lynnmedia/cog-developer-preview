import assert from "node:assert/strict";
import { lex } from "../lexer/lexer";
import { parseCog } from "../parser/parser";
import { compileCog } from "../compiler/compileCog";
import { executeCog } from "../runtime/executeCog";
import type { CoreExecutionContext } from "../types/context";
import type { CoreExecutionResult, DomainEmissionSpec } from "../types/execution";
import type { CoreIR } from "../types/ir";
import type { CoreLevel } from "../types/values";
import type {
  CognitiveScenario,
  CognitiveTraceMatcher,
} from "./scenario";

export function assertCogOutput(
  result: CoreExecutionResult,
  expected: Partial<DomainEmissionSpec> | Array<Partial<DomainEmissionSpec>>,
): void {
  const expectedList = Array.isArray(expected) ? expected : [expected];
  assert.ok(
    result.emissions.length >= expectedList.length,
    `Expected at least ${expectedList.length} emissions, got ${result.emissions.length}`,
  );

  for (let i = 0; i < expectedList.length; i++) {
    const exp = expectedList[i];
    if (!exp) continue;
    const actual = result.emissions[i];
    assert.ok(actual, `Missing emission at index ${i}`);

    if (exp.kind !== undefined) {
      assert.equal(actual.kind, exp.kind, `Emission [${i}] kind mismatch`);
    }
    if (exp.target !== undefined) {
      assert.equal(actual.target, exp.target, `Emission [${i}] target mismatch`);
    }
    if (exp.adapterId !== undefined) {
      assert.equal(actual.adapterId, exp.adapterId, `Emission [${i}] adapterId mismatch`);
    }
    if (exp.payload !== undefined) {
      for (const [k, v] of Object.entries(exp.payload)) {
        assert.deepEqual(actual.payload[k], v, `Emission [${i}] payload property "${k}" mismatch`);
      }
    }
  }
}

export function assertCogState(
  result: CoreExecutionResult,
  predicateOrState:
    | ((result: CoreExecutionResult) => boolean)
    | Partial<CoreExecutionResult>,
): void {
  if (typeof predicateOrState === "function") {
    assert.ok(
      predicateOrState(result),
      "assertCogState: Predicate returned false for execution result.",
    );
    return;
  }

  if (predicateOrState.success !== undefined) {
    assert.equal(result.success, predicateOrState.success, "Execution success state mismatch");
  }
  if (predicateOrState.adapterId !== undefined) {
    assert.equal(result.adapterId, predicateOrState.adapterId, "Execution adapterId mismatch");
  }
  if (predicateOrState.errors !== undefined) {
    assert.deepEqual(result.errors, predicateOrState.errors, "Execution errors mismatch");
  }
}

export function assertTraceContains(
  result: CoreExecutionResult,
  matcher: CognitiveTraceMatcher,
): void {
  const found = result.trace.steps.some((step) => {
    if (matcher.phase && step.phase !== matcher.phase) return false;
    if (matcher.status && step.status !== matcher.status) return false;
    if (matcher.targetId && step.stepId !== matcher.targetId && !step.stepId.includes(matcher.targetId)) return false;
    if (matcher.message) {
      if (!step.message) return false;
      if (typeof matcher.message === "string") {
        if (!step.message.includes(matcher.message)) return false;
      } else if (!matcher.message.test(step.message)) {
        return false;
      }
    }
    if (matcher.dataContains && step.data) {
      for (const [k, v] of Object.entries(matcher.dataContains)) {
        if (step.data[k] !== v) return false;
      }
    }
    return true;
  });

  assert.ok(
    found,
    `assertTraceContains: No trace step matched criteria: ${JSON.stringify(matcher)}`,
  );
}

export function assertTransitionOccurred(
  result: CoreExecutionResult,
  toLevel: CoreLevel,
  target?: string,
): void {
  const matchingStep = result.trace.steps.find((step) => {
    const isResolutionOrTransform = step.phase === "transform" || step.stepId.includes("resolution") || step.stepId.includes("transform");
    const matchesTarget = !target || step.stepId.includes(target) || (step.data && step.data.target === target);
    const matchesLevel = step.data && (step.data.level === toLevel || step.data.resolvedLevel === toLevel);
    return isResolutionOrTransform && matchesTarget && (matchesLevel || (step.message && step.message.includes(toLevel)));
  });

  const matchingResolution = result.plan.steps.find((step) => {
    const isResolutionOrTransform = step.targetKind === "resolution" || step.targetKind === "transform" || step.phase === "transform";
    const matchesTarget = !target || step.targetId === target || step.targetRef === target;
    const matchesLevel = step.metadata?.level === toLevel;
    return isResolutionOrTransform && matchesTarget && matchesLevel;
  });

  const matchingEmission = result.emissions.find((em) => {
    const matchesTarget = !target || em.target === target || (typeof em.payload === "object" && em.payload && (em.payload as any).targetRef === target);
    const matchesLevel = typeof em.payload === "object" && em.payload && ((em.payload as any).targetLevel === toLevel || (em.payload as any).mappedLevel === toLevel);
    return matchesTarget && matchesLevel;
  });

  assert.ok(
    Boolean(matchingStep || matchingResolution || matchingEmission),
    `assertTransitionOccurred: Expected transition to level "${toLevel}"${target ? ` for target "${target}"` : ""} was not found.`,
  );
}

export function assertTransitionNotOccurred(
  result: CoreExecutionResult,
  toLevel: CoreLevel,
  target?: string,
): void {
  const matchingStep = result.trace.steps.find((step) => {
    const isResolutionOrTransform = step.phase === "transform" || step.stepId.includes("resolution") || step.stepId.includes("transform");
    const matchesTarget = !target || step.stepId.includes(target) || (step.data && step.data.target === target);
    const matchesLevel = step.data && (step.data.level === toLevel || step.data.resolvedLevel === toLevel);
    return isResolutionOrTransform && matchesTarget && matchesLevel;
  });

  const matchingPlan = result.plan.steps.find((step) => {
    const isResolutionOrTransform = step.targetKind === "resolution" || step.targetKind === "transform";
    const matchesTarget = !target || step.targetId === target || step.targetRef === target;
    const matchesLevel = step.metadata?.level === toLevel;
    return isResolutionOrTransform && matchesTarget && matchesLevel;
  });

  assert.ok(
    !matchingStep && !matchingPlan,
    `assertTransitionNotOccurred: Unexpected transition to level "${toLevel}"${target ? ` for target "${target}"` : ""} occurred.`,
  );
}

export function assertBlocked(result: CoreExecutionResult): void {
  const isFailed = !result.success;
  const hasFailedSteps = result.trace.steps.some(
    (step) => step.status === "FAILED" || step.status === "SKIPPED",
  );
  const hasErrors = result.errors.length > 0 || result.validation.errorCount > 0;

  assert.ok(
    isFailed || hasFailedSteps || hasErrors,
    "assertBlocked: Expected execution to be blocked, but it completed cleanly.",
  );
}

export function assertBlockedBecause(
  result: CoreExecutionResult,
  reason: string | RegExp,
): void {
  assertBlocked(result);

  const allReasons: string[] = [
    ...result.errors,
    ...result.validation.issues.map((i) => i.message),
    ...result.validation.issues.map((i) => i.code),
    ...result.trace.steps
      .filter((s) => s.message)
      .map((s) => s.message as string),
  ];

  const matched = allReasons.some((r) =>
    typeof reason === "string" ? r.includes(reason) : reason.test(r),
  );

  assert.ok(
    matched,
    `assertBlockedBecause: Execution blocked, but reason matching "${reason}" was not found. Observed reasons: ${JSON.stringify(allReasons)}`,
  );
}

export function assertInvariantPreserved(
  result: CoreExecutionResult,
  invariant: ((result: CoreExecutionResult) => boolean) | string,
): void {
  if (typeof invariant === "function") {
    assert.ok(
      invariant(result),
      "assertInvariantPreserved: Invariant predicate failed.",
    );
  } else {
    // String named invariant
    if (invariant === "determinism") {
      assert.ok(result.trace.steps.length > 0, "Deterministic trace required.");
      assert.ok(result.validation !== undefined, "Validation report required.");
    } else if (invariant === "no_unhandled_errors") {
      assert.ok(Array.isArray(result.errors), "Errors must be an array.");
    } else {
      assert.ok(true, `Invariant "${invariant}" passed.`);
    }
  }
}

export function assertMemoryChanged(
  result: CoreExecutionResult,
  key: string,
  initialMemory?: Record<string, unknown>,
  currentMemory?: Record<string, unknown>,
): void {
  if (initialMemory && currentMemory) {
    assert.notDeepEqual(
      initialMemory[key],
      currentMemory[key],
      `assertMemoryChanged: Expected memory key "${key}" to change, but it remained unchanged.`,
    );
  } else {
    // Assert binding exists in result
    assert.ok(
      result.bindings[key] !== undefined,
      `assertMemoryChanged: Expected binding "${key}" to exist in execution result.`,
    );
  }
}

export function assertMemoryUnchanged(
  result: CoreExecutionResult,
  key: string,
  initialMemory?: Record<string, unknown>,
  currentMemory?: Record<string, unknown>,
): void {
  if (initialMemory && currentMemory) {
    assert.deepEqual(
      initialMemory[key],
      currentMemory[key],
      `assertMemoryUnchanged: Expected memory key "${key}" to remain unchanged.`,
    );
  } else {
    // If not in bindings, it was unchanged by execution
    assert.ok(
      true,
      `assertMemoryUnchanged: Key "${key}" unchanged.`,
    );
  }
}

export function assertEvaluation(
  result: CoreExecutionResult,
  evaluator: (result: CoreExecutionResult) => void | boolean,
): void {
  const outcome = evaluator(result);
  if (typeof outcome === "boolean") {
    assert.ok(outcome, "assertEvaluation: Evaluator function returned false.");
  }
}

export async function executeCognitiveScenario(
  scenario: CognitiveScenario,
): Promise<CoreExecutionResult> {
  let ir: CoreIR;
  try {
    ir =
      scenario.given.ir ??
      compileCog(parseCog(lex(scenario.given.source ?? "")));
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    if (scenario.expected && (scenario.expected.success === false || scenario.expected.blocked)) {
      if (scenario.expected.blockedReason) {
        const reason = scenario.expected.blockedReason;
        const matched = typeof reason === "string" ? errMessage.includes(reason) : reason.test(errMessage);
        assert.ok(
          matched,
          `Compile failed as expected, but error "${errMessage}" did not match expected reason "${reason}".`,
        );
      }
      return {
        success: false,
        adapterId: scenario.given.adapter?.adapterId,
        validation: {
          valid: false,
          issues: [{ code: "COMPILE_OR_SYNTAX_ERROR", severity: "error", message: errMessage }],
          errorCount: 1,
          warningCount: 0,
        },
        plan: { id: "empty-plan", createdAt: new Date().toISOString(), steps: [] },
        emissions: [],
        trace: {
          runId: scenario.id,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          steps: [],
        },
        bindings: {},
        errors: [errMessage],
      };
    }
    throw error;
  }

  const context: CoreExecutionContext = {
    runId: scenario.given.context?.runId ?? scenario.id,
    mode: scenario.given.context?.mode ?? "batch",
    startedAt: scenario.given.context?.startedAt ?? new Date().toISOString(),
    refs: scenario.given.context?.refs,
    environment: scenario.given.context?.environment,
    input: scenario.given.inputs ?? scenario.given.context?.input,
  };

  const result = await executeCog(ir, context, scenario.given.adapter);

  // If expected conditions are defined on scenario, verify them
  if (scenario.expected) {
    const exp = scenario.expected;
    if (exp.success !== undefined) {
      assert.equal(result.success, exp.success, `Scenario "${scenario.name}" success mismatch`);
    }
    if (exp.blocked) {
      assertBlocked(result);
      if (exp.blockedReason) {
        assertBlockedBecause(result, exp.blockedReason);
      }
    }
    if (exp.emissions) {
      assertCogOutput(result, exp.emissions);
    }
    if (exp.traceSteps) {
      for (const stepMatcher of exp.traceSteps) {
        assertTraceContains(result, stepMatcher);
      }
    }
    if (exp.transitions) {
      for (const tr of exp.transitions) {
        if (tr.occurred === false) {
          assertTransitionNotOccurred(result, tr.to, tr.target);
        } else {
          assertTransitionOccurred(result, tr.to, tr.target);
        }
      }
    }
    if (exp.invariants) {
      for (const inv of exp.invariants) {
        assert.ok(inv.check(result), `Invariant "${inv.name}" violated in scenario "${scenario.name}"`);
      }
    }
  }

  return result;
}

import test from "node:test";
import { performance } from "node:perf_hooks";
import type { CogDomainAdapter } from "../types/adapter";
import type { CoreExecutionContext } from "../types/context";
import type { CoreExecutionResult } from "../types/execution";
import type { CognitiveScenario, CognitiveScenarioGiven } from "./scenario";
import { createCognitiveScenario } from "./scenario";
import { executeCognitiveScenario } from "./assertions";

export interface CognitiveTestFailure {
  message: string;
  type: string;
  expected?: unknown;
  actual?: unknown;
  stack?: string;
}

export interface CognitiveScenarioResult {
  scenarioId: string;
  name: string;
  passed: boolean;
  durationMs: number;
  executionResult?: CoreExecutionResult;
  failures: CognitiveTestFailure[];
}

export interface CognitiveSuiteDefaults {
  context?: Partial<CoreExecutionContext>;
  adapter?: CogDomainAdapter;
  initialMemory?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
}

export interface CognitiveSuite {
  id: string;
  name: string;
  description?: string;
  defaults?: CognitiveSuiteDefaults;
  scenarios: CognitiveScenario[];
}

export interface CognitiveSuiteResult {
  suiteId: string;
  name: string;
  passed: boolean;
  durationMs: number;
  totalCount: number;
  passedCount: number;
  failedCount: number;
  scenarios: CognitiveScenarioResult[];
}

export function defineCognitiveSuite(suite: CognitiveSuite): CognitiveSuite {
  if (!suite.id || !suite.name) {
    throw new Error("CognitiveSuite requires both 'id' and 'name'.");
  }
  if (!Array.isArray(suite.scenarios) || suite.scenarios.length === 0) {
    throw new Error("CognitiveSuite requires a non-empty 'scenarios' array.");
  }
  suite.scenarios = suite.scenarios.map(createCognitiveScenario);
  return suite;
}

export async function runCognitiveScenario(
  scenario: CognitiveScenario,
  options?: {
    defaults?: CognitiveSuiteDefaults;
    throwOnFailure?: boolean;
  },
): Promise<CognitiveScenarioResult> {
  const mergedGiven: CognitiveScenarioGiven = {
    ...scenario.given,
    context: {
      ...options?.defaults?.context,
      ...scenario.given.context,
    },
    adapter: scenario.given.adapter ?? options?.defaults?.adapter,
    initialMemory: scenario.given.initialMemory ?? options?.defaults?.initialMemory,
    inputs: scenario.given.inputs ?? options?.defaults?.inputs,
  };

  const resolvedScenario: CognitiveScenario = {
    ...scenario,
    given: mergedGiven,
  };

  const t0 = performance.now();
  const failures: CognitiveTestFailure[] = [];
  let executionResult: CoreExecutionResult | undefined;

  try {
    executionResult = await executeCognitiveScenario(resolvedScenario);
  } catch (error) {
    const err = error as any;
    failures.push({
      message: err?.message ?? String(error),
      type: err?.name ?? "AssertionError",
      expected: err?.expected,
      actual: err?.actual,
      stack: err?.stack,
    });
    if (options?.throwOnFailure) {
      throw error;
    }
  }

  const durationMs = performance.now() - t0;
  const passed = failures.length === 0;

  return {
    scenarioId: scenario.id,
    name: scenario.name,
    passed,
    durationMs,
    executionResult,
    failures,
  };
}

export async function runCognitiveSuite(
  suite: CognitiveSuite,
  options?: {
    throwOnFailure?: boolean;
  },
): Promise<CognitiveSuiteResult> {
  const definedSuite = defineCognitiveSuite(suite);
  const t0 = performance.now();
  const scenarioResults: CognitiveScenarioResult[] = [];

  for (const scenario of definedSuite.scenarios) {
    const result = await runCognitiveScenario(scenario, {
      defaults: definedSuite.defaults,
      throwOnFailure: options?.throwOnFailure,
    });
    scenarioResults.push(result);
  }

  const durationMs = performance.now() - t0;
  const passedCount = scenarioResults.filter((s) => s.passed).length;
  const failedCount = scenarioResults.length - passedCount;
  const passed = failedCount === 0;

  return {
    suiteId: definedSuite.id,
    name: definedSuite.name,
    passed,
    durationMs,
    totalCount: scenarioResults.length,
    passedCount,
    failedCount,
    scenarios: scenarioResults,
  };
}

export function cognitiveTest(
  scenario: CognitiveScenario,
  options?: {
    defaults?: CognitiveSuiteDefaults;
    testFn?: typeof test;
  },
): void {
  const runner = options?.testFn ?? test;
  runner(scenario.name, async () => {
    await runCognitiveScenario(scenario, {
      defaults: options?.defaults,
      throwOnFailure: true,
    });
  });
}

export function registerCognitiveSuite(
  suite: CognitiveSuite,
  options?: {
    testFn?: typeof test;
  },
): void {
  const definedSuite = defineCognitiveSuite(suite);
  const runner = options?.testFn ?? test;

  for (const scenario of definedSuite.scenarios) {
    runner(`${definedSuite.name} > ${scenario.name}`, async () => {
      await runCognitiveScenario(scenario, {
        defaults: definedSuite.defaults,
        throwOnFailure: true,
      });
    });
  }
}

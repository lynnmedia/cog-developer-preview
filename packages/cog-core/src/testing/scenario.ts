import type { CogDomainAdapter } from "../types/adapter";
import type { CoreExecutionContext } from "../types/context";
import type { CoreExecutionResult, DomainEmissionSpec } from "../types/execution";
import type { CoreIR } from "../types/ir";
import type { CoreLevel } from "../types/values";

export interface CognitiveScenarioGiven {
  source?: string;
  ir?: CoreIR;
  context?: Partial<CoreExecutionContext>;
  adapter?: CogDomainAdapter;
  initialMemory?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
}

export interface CognitiveTransitionAssertion {
  to: CoreLevel;
  target?: string;
  occurred?: boolean;
}

export interface CognitiveTraceMatcher {
  phase?: string;
  status?: string;
  targetId?: string;
  message?: string | RegExp;
  dataContains?: Record<string, unknown>;
}

export interface CognitiveScenarioExpected {
  success?: boolean;
  emissions?: Array<Partial<DomainEmissionSpec>>;
  validationIssues?: Array<{ code?: string; severity?: string; message?: string | RegExp }>;
  blocked?: boolean;
  blockedReason?: string | RegExp;
  traceSteps?: CognitiveTraceMatcher[];
  transitions?: CognitiveTransitionAssertion[];
  invariants?: Array<{ name: string; check: (result: CoreExecutionResult) => boolean }>;
  memoryChanges?: Array<{
    key: string;
    expectedValue?: unknown;
    changed?: boolean;
  }>;
}

export interface CognitiveScenario {
  id: string;
  name: string;
  description?: string;
  given: CognitiveScenarioGiven;
  expected?: CognitiveScenarioExpected;
}

export function createCognitiveScenario(scenario: CognitiveScenario): CognitiveScenario {
  if (!scenario.id || !scenario.name) {
    throw new Error("CognitiveScenario requires both 'id' and 'name'.");
  }
  if (!scenario.given.source && !scenario.given.ir) {
    throw new Error("CognitiveScenario requires either 'given.source' or 'given.ir'.");
  }
  return scenario;
}

import { lex } from "../lexer/lexer";
import { parseCog } from "../parser/parser";
import { compileCog } from "../compiler/compileCog";
import { executeCog } from "../runtime/executeCog";
import type { CoreExecutionContext } from "../types/context";
import type { CoreExecutionResult, DomainEmissionSpec } from "../types/execution";
import type { CoreExecutionTrace, CoreExecutionTraceStep } from "../types/trace";
import type { CognitiveScenario, CognitiveTraceMatcher } from "./scenario";
import { executeCognitiveScenario } from "./assertions";

export type CognitiveDiagnosticCategory =
  | "OUTPUT_MISMATCH"
  | "STATE_MISMATCH"
  | "TRACE_MISMATCH"
  | "TRANSITION_MISMATCH"
  | "UNEXPECTED_BLOCK"
  | "EXPECTED_BLOCK_MISSING"
  | "BLOCK_REASON_MISMATCH"
  | "INVARIANT_VIOLATION"
  | "MEMORY_MISMATCH"
  | "METAMORPHIC_RELATION_VIOLATION"
  | "VALIDATION_MISMATCH";

export interface CognitiveTraceReference {
  stepIndex: number;
  stepId: string;
  phase: string;
  targetId?: string;
  status: string;
  message?: string;
}

export interface CognitiveStateReference {
  key: string;
  expected?: unknown;
  observed?: unknown;
  origin?: string;
}

export interface CognitiveDiagnostic {
  scenarioId: string;
  scenarioName?: string;
  category: CognitiveDiagnosticCategory;
  message: string;
  expected?: unknown;
  observed?: unknown;
  traceRefs?: CognitiveTraceReference[];
  stateRefs?: CognitiveStateReference[];
  invariantName?: string;
  relationName?: string;
}

export interface CognitiveDiagnosticReport {
  scenarioId: string;
  scenarioName: string;
  passed: boolean;
  diagnostics: CognitiveDiagnostic[];
  executionResult?: CoreExecutionResult;
  formattedText: string;
}

export function extractTraceReferences(
  trace?: CoreExecutionTrace,
  maxSteps = 10,
): CognitiveTraceReference[] {
  if (!trace || !Array.isArray(trace.steps)) return [];
  return trace.steps.slice(0, maxSteps).map((step, index) => ({
    stepIndex: index + 1,
    stepId: step.stepId,
    phase: step.phase,
    targetId: typeof step.data?.target === "string" ? step.data.target : undefined,
    status: step.status,
    message: step.message,
  }));
}

export function generateScenarioDiagnostics(
  scenario: CognitiveScenario,
  result?: CoreExecutionResult,
  error?: Error,
): CognitiveDiagnostic[] {
  const diagnostics: CognitiveDiagnostic[] = [];
  const traceRefs = extractTraceReferences(result?.trace);

  // 1. Error / Failure Analysis
  if (error) {
    const message = error.message;
    if (message.includes("success mismatch")) {
      if (scenario.expected?.success === false || scenario.expected?.blocked) {
        diagnostics.push({
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          category: "EXPECTED_BLOCK_MISSING",
          message: `Expected scenario to be blocked or rejected (success: false), but execution succeeded.`,
          expected: "success: false",
          observed: "success: true",
          traceRefs,
        });
      } else {
        diagnostics.push({
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          category: "UNEXPECTED_BLOCK",
          message: `Expected scenario to succeed (success: true), but execution failed.`,
          expected: "success: true",
          observed: "success: false",
          traceRefs,
        });
      }
    } else if (message.includes("assertBlocked") && !message.includes("Because")) {
      diagnostics.push({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        category: "EXPECTED_BLOCK_MISSING",
        message: `Expected execution to be blocked, but it completed cleanly.`,
        expected: "blocked: true",
        observed: "blocked: false",
        traceRefs,
      });
    } else if (message.includes("Compile failed as expected") || message.includes("COMPILE_OR_SYNTAX_ERROR")) {
      diagnostics.push({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        category: "VALIDATION_MISMATCH",
        message: `Compile or syntax rejection: ${message}`,
        observed: message,
        traceRefs,
      });
    } else if (message.includes("Emission") && message.includes("mismatch")) {
      diagnostics.push({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        category: "OUTPUT_MISMATCH",
        message,
        expected: scenario.expected?.emissions,
        observed: result?.emissions,
        traceRefs,
      });
    } else if (message.includes("assertBlockedBecause") || message.includes("reason matching")) {
      diagnostics.push({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        category: "BLOCK_REASON_MISMATCH",
        message,
        expected: scenario.expected?.blockedReason,
        observed: result?.errors,
        traceRefs,
      });
    } else if (message.includes("Transition") || message.includes("transition") || message.includes("Expected transition")) {
      diagnostics.push({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        category: "TRANSITION_MISMATCH",
        message,
        expected: scenario.expected?.transitions,
        traceRefs,
      });
    } else if (message.includes("Invariant") || message.includes("invariant")) {
      diagnostics.push({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        category: "INVARIANT_VIOLATION",
        message,
        traceRefs,
      });
    } else {
      diagnostics.push({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        category: "STATE_MISMATCH",
        message,
        traceRefs,
      });
    }
    return diagnostics;
  }

  // 2. Result Expectations Analysis
  if (result && scenario.expected) {
    const exp = scenario.expected;

    if (exp.success === true && !result.success) {
      diagnostics.push({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        category: "UNEXPECTED_BLOCK",
        message: `Execution blocked unexpectedly with ${result.errors.length} error(s) and ${result.validation.issues.length} validation issue(s).`,
        expected: "success: true",
        observed: `success: false, errors: ${JSON.stringify(result.errors)}`,
        traceRefs,
      });
    }

    if (exp.success === false && result.success) {
      diagnostics.push({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        category: "EXPECTED_BLOCK_MISSING",
        message: `Expected scenario to be blocked or rejected, but execution succeeded cleanly.`,
        expected: "success: false (blocked)",
        observed: "success: true",
        traceRefs,
      });
    }

    if (exp.blocked && result.success) {
      diagnostics.push({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        category: "EXPECTED_BLOCK_MISSING",
        message: `Expected execution to be blocked, but it completed with success: true.`,
        expected: "blocked: true",
        observed: "blocked: false",
        traceRefs,
      });
    }
  }

  return diagnostics;
}

export function formatCognitiveDiagnostic(diag: CognitiveDiagnostic): string {
  const lines: string[] = [];
  lines.push("============================================================");
  lines.push("COG COGNITIVE TEST DIAGNOSTIC");
  lines.push("============================================================");
  lines.push(`Scenario: ${diag.scenarioId}${diag.scenarioName ? ` — ${diag.scenarioName}` : ""}`);
  lines.push(`Category: ${diag.category}`);
  lines.push(`Message:  ${diag.message}`);

  if (diag.invariantName) {
    lines.push(`Invariant: ${diag.invariantName}`);
  }
  if (diag.relationName) {
    lines.push(`Relation:  ${diag.relationName}`);
  }

  if (diag.expected !== undefined) {
    lines.push(`Expected:  ${typeof diag.expected === "object" ? JSON.stringify(diag.expected, null, 2) : String(diag.expected)}`);
  }
  if (diag.observed !== undefined) {
    lines.push(`Observed:  ${typeof diag.observed === "object" ? JSON.stringify(diag.observed, null, 2) : String(diag.observed)}`);
  }

  if (diag.stateRefs && diag.stateRefs.length > 0) {
    lines.push("\nState References:");
    for (const ref of diag.stateRefs) {
      lines.push(`  - [${ref.key}] expected=${JSON.stringify(ref.expected)} observed=${JSON.stringify(ref.observed)} (origin: ${ref.origin ?? "unknown"})`);
    }
  }

  if (diag.traceRefs && diag.traceRefs.length > 0) {
    lines.push("\nRelevant Execution Trace:");
    for (const step of diag.traceRefs) {
      lines.push(`  ${String(step.stepIndex).padStart(2, "0")} [${step.phase}] ${step.stepId} -> ${step.status}${step.message ? ` (${step.message})` : ""}`);
    }
  }
  lines.push("============================================================");

  return lines.join("\n");
}

export function formatMetamorphicDiagnostic(
  relationName: string,
  baseline: unknown,
  transformed: unknown,
  violation: string,
): string {
  const lines: string[] = [];
  lines.push("============================================================");
  lines.push("COG METAMORPHIC RELATION VIOLATION");
  lines.push("============================================================");
  lines.push(`Relation:    ${relationName}`);
  lines.push(`Baseline:    ${typeof baseline === "object" ? JSON.stringify(baseline, null, 2) : String(baseline)}`);
  lines.push(`Transformed: ${typeof transformed === "object" ? JSON.stringify(transformed, null, 2) : String(transformed)}`);
  lines.push(`Violation:   ${violation}`);
  lines.push("============================================================");
  return lines.join("\n");
}

export function formatCognitiveDiagnosticReport(report: CognitiveDiagnosticReport): string {
  if (report.passed) {
    return `PASS: Scenario "${report.scenarioId}" (${report.scenarioName}) completed successfully with 0 diagnostics.`;
  }
  return report.diagnostics.map(formatCognitiveDiagnostic).join("\n\n");
}

export async function diagnoseCognitiveScenario(
  scenario: CognitiveScenario,
): Promise<CognitiveDiagnosticReport> {
  let executionResult: CoreExecutionResult | undefined;
  let caughtError: Error | undefined;

  try {
    const ir = scenario.given.ir ?? compileCog(parseCog(lex(scenario.given.source ?? "")));
    const context: CoreExecutionContext = {
      runId: scenario.given.context?.runId ?? scenario.id,
      mode: scenario.given.context?.mode ?? "batch",
      startedAt: scenario.given.context?.startedAt ?? new Date().toISOString(),
      refs: scenario.given.context?.refs,
      environment: scenario.given.context?.environment,
      input: scenario.given.inputs ?? scenario.given.context?.input,
    };
    executionResult = await executeCog(ir, context, scenario.given.adapter);
  } catch (err) {
    // If compile or execution threw
    caughtError = err instanceof Error ? err : new Error(String(err));
  }

  try {
    const res = await executeCognitiveScenario(scenario);
    if (!executionResult) {
      executionResult = res;
    }
  } catch (err) {
    if (!caughtError) {
      caughtError = err instanceof Error ? err : new Error(String(err));
    }
  }

  const diagnostics = generateScenarioDiagnostics(scenario, executionResult, caughtError);
  const passed = diagnostics.length === 0;

  const report: CognitiveDiagnosticReport = {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    passed,
    diagnostics,
    executionResult,
    formattedText: "",
  };

  report.formattedText = formatCognitiveDiagnosticReport(report);
  return report;
}

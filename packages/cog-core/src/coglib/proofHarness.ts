/**
 * CogLib Cross-Domain Cognitive Proof Harness
 *
 * Deterministic evaluation harness validating CognitiveRoutine execution, failure behavior,
 * provenance propagation, epistemic effects, and composition across four diverse domains:
 * 1. Music (Harmonic Tension & Voice Leading)
 * 2. Scientific Claims (Empirical Falsification & Hypothesis Revision)
 * 3. Software Architecture (Quality Attribute Tradeoffs & Decision Impasse)
 * 4. Concept Evolution (Semantic Drift & Lineage Continuity)
 */

import {
  CognitiveRoutine,
  executeRoutineWithGuards,
} from "./routineContract";

export type DomainProofStatus = "success" | "qualified" | "degraded" | "incompatible" | "failed";

export interface TestCaseProof<TInput = any, TOutput = any> {
  testId: string;
  domain: "music" | "science" | "software-architecture" | "concept-evolution";
  description: string;
  routine: CognitiveRoutine<TInput, TOutput>;
  input: TInput;
  expectedStatus: DomainProofStatus;
  expectedTensionSubstring?: string;
  expectedLineageSubstring?: string;
  minEpistemicConfidence?: number;
  maxEpistemicConfidence?: number;
}

export interface DomainProofResult {
  testId: string;
  domain: string;
  passed: boolean;
  actualStatus: DomainProofStatus;
  epistemicConfidence: number;
  tensionsRecorded: string[];
  lineage: string[];
  diagnostics: string[];
}

export interface HarnessExecutionSummary {
  totalTests: number;
  passedCount: number;
  failedCount: number;
  domainBreakdown: Record<string, { total: number; passed: number }>;
  results: DomainProofResult[];
}

/**
 * Cross-Domain Proof Harness Engine
 */
export class CognitiveProofHarness {
  private testCases: TestCaseProof[] = [];

  registerTestCase(testCase: TestCaseProof): void {
    this.testCases.push(testCase);
  }

  async runAll(): Promise<HarnessExecutionSummary> {
    const results: DomainProofResult[] = [];
    const domainBreakdown: Record<string, { total: number; passed: number }> = {};

    for (const tc of this.testCases) {
      if (!domainBreakdown[tc.domain]) {
        domainBreakdown[tc.domain] = { total: 0, passed: 0 };
      }
      const domainStat = domainBreakdown[tc.domain]!;
      domainStat.total += 1;

      const diagnostics: string[] = [];
      let actualStatus: DomainProofStatus = "failed";
      let confidence = 0;
      let tensions: string[] = [];
      let lineage: string[] = [];

      try {
        const execution = await executeRoutineWithGuards(tc.routine, tc.input);
        actualStatus = execution.status;
        confidence = execution.epistemicState.confidence;
        tensions = execution.epistemicState.tensions;
        lineage = execution.provenance.lineage;

        let testPassed = actualStatus === tc.expectedStatus;
        if (!testPassed) {
          diagnostics.push(`Status mismatch: expected '${tc.expectedStatus}', got '${actualStatus}'`);
        }

        if (tc.expectedTensionSubstring) {
          const hasTension = tensions.some((t) => t.includes(tc.expectedTensionSubstring!));
          if (!hasTension) {
            testPassed = false;
            diagnostics.push(`Missing expected tension matching '${tc.expectedTensionSubstring}'`);
          }
        }

        if (tc.expectedLineageSubstring) {
          const hasLineage = lineage.some((l) => l.includes(tc.expectedLineageSubstring!));
          if (!hasLineage) {
            testPassed = false;
            diagnostics.push(`Missing expected lineage matching '${tc.expectedLineageSubstring}'`);
          }
        }

        if (tc.minEpistemicConfidence !== undefined && confidence < tc.minEpistemicConfidence) {
          testPassed = false;
          diagnostics.push(`Confidence ${confidence} below minimum ${tc.minEpistemicConfidence}`);
        }

        if (tc.maxEpistemicConfidence !== undefined && confidence > tc.maxEpistemicConfidence) {
          testPassed = false;
          diagnostics.push(`Confidence ${confidence} exceeds maximum ${tc.maxEpistemicConfidence}`);
        }

        if (testPassed) {
          domainStat.passed += 1;
        }

        results.push({
          testId: tc.testId,
          domain: tc.domain,
          passed: testPassed,
          actualStatus,
          epistemicConfidence: confidence,
          tensionsRecorded: tensions,
          lineage,
          diagnostics,
        });
      } catch (err: any) {
        results.push({
          testId: tc.testId,
          domain: tc.domain,
          passed: tc.expectedStatus === "failed",
          actualStatus: "failed",
          epistemicConfidence: 0,
          tensionsRecorded: [],
          lineage: [],
          diagnostics: [`Threw exception: ${err.message}`],
        });
        if (tc.expectedStatus === "failed") {
          domainStat.passed += 1;
        }
      }
    }

    const passedCount = results.filter((r) => r.passed).length;
    return {
      totalTests: results.length,
      passedCount,
      failedCount: results.length - passedCount,
      domainBreakdown,
      results,
    };
  }
}

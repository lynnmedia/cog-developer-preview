import type { CoreExecutionTrace, CoreExecutionTraceStep } from "../types/trace";

export interface GoldenTraceAssertOptions {
  maxTimingDeviationMs?: number; // threshold in ms, defaults to 1000
}

export class GoldenTraceAssertor {
  /**
   * Asserts that an actual execution trace matches a pre-recorded golden baseline.
   * Throws detailed errors if structural, status, or timing drift occurs.
   */
  assertGoldenTrace(
    actual: CoreExecutionTrace,
    golden: CoreExecutionTrace,
    options?: GoldenTraceAssertOptions
  ): void {
    const maxDeviation = options?.maxTimingDeviationMs ?? 1000;

    if (actual.steps.length !== golden.steps.length) {
      throw new Error(
        `Step count mismatch. Actual trace contains ${actual.steps.length} steps, but golden trace contains ${golden.steps.length} steps.`
      );
    }

    const getDuration = (step: CoreExecutionTraceStep): number => {
      return Math.max(0, new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime());
    };

    for (let i = 0; i < actual.steps.length; i++) {
      const aStep = actual.steps[i]!;
      const gStep = golden.steps[i]!;

      if (aStep.stepId !== gStep.stepId) {
        throw new Error(
          `Step ID mismatch at index ${i}. Expected "${gStep.stepId}", but found "${aStep.stepId}".`
        );
      }

      if (aStep.phase !== gStep.phase) {
        throw new Error(
          `Phase mismatch for step "${gStep.stepId}". Expected "${gStep.phase}", but found "${aStep.phase}".`
        );
      }

      if (aStep.status !== gStep.status) {
        throw new Error(
          `Status mismatch for step "${gStep.stepId}". Expected "${gStep.status}", but found "${aStep.status}".`
        );
      }

      const aDur = getDuration(aStep);
      const gDur = getDuration(gStep);
      const deviation = aDur - gDur;

      if (deviation > maxDeviation) {
        throw new Error(
          `Timing deviation for step "${gStep.stepId}". Actual duration was ${aDur}ms, exceeding golden duration of ${gDur}ms by ${deviation}ms (limit is ${maxDeviation}ms).`
        );
      }
    }
  }
}

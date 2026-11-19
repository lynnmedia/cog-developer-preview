import type { CoreExecutionTrace, CoreExecutionTraceStep } from "../types/trace";

export interface TraceQueryResult {
  steps: CoreExecutionTraceStep[];
  totalDurationMs: number;
  phaseDurations: Record<string, number>;
}

export class TraceExplorer {
  constructor(private trace: CoreExecutionTrace) {}

  /**
   * Returns steps grouped or sliced by phase (phase stepping).
   */
  getStepsByPhase(phase: string): CoreExecutionTraceStep[] {
    return this.trace.steps.filter((s) => s.phase === phase);
  }

  /**
   * Filters steps based on queries (e.g. status, phase, keyword, or custom predicate)
   * and overlays timing calculations.
   */
  querySteps(filters: {
    phase?: string;
    status?: string;
    keyword?: string;
    customFilter?: (step: CoreExecutionTraceStep) => boolean;
  }): TraceQueryResult {
    let filtered = [...this.trace.steps];

    if (filters.phase) {
      filtered = filtered.filter((s) => s.phase === filters.phase);
    }
    if (filters.status) {
      filtered = filtered.filter((s) => s.status === filters.status);
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      filtered = filtered.filter((s) =>
        s.stepId.toLowerCase().includes(kw) ||
        (s.message && s.message.toLowerCase().includes(kw))
      );
    }
    if (filters.customFilter) {
      filtered = filtered.filter(filters.customFilter);
    }

    // Compute timings (timing overlays)
    let totalDurationMs = 0;
    const phaseDurations: Record<string, number> = {};

    for (const step of filtered) {
      const dur = Math.max(0, new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime());
      totalDurationMs += dur;
      phaseDurations[step.phase] = (phaseDurations[step.phase] || 0) + dur;
    }

    return {
      steps: filtered,
      totalDurationMs,
      phaseDurations
    };
  }

  /**
   * Get total duration of the trace in milliseconds.
   */
  getTotalDurationMs(): number {
    return Math.max(0, new Date(this.trace.completedAt).getTime() - new Date(this.trace.startedAt).getTime());
  }
}

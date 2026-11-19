import type { CoreExecutionTrace, CoreExecutionTraceStep } from "../types/trace";

export interface StepDiff {
  stepId: string;
  changeType: "added" | "removed" | "modified" | "unchanged";
  statusShift?: {
    before: string;
    after: string;
  };
  durationDiffMs?: number;
  messageDiff?: {
    before?: string;
    after?: string;
  };
}

export interface TraceDiffReport {
  runIdBefore: string;
  runIdAfter: string;
  stepDiffs: StepDiff[];
  hasChanges: boolean;
  durationShiftMs: number;
  mermaidDiffFlowchart: string;
}

export class TraceDiffVisualizer {
  /**
   * Compares two execution traces, identifying pathway shifts, status changes, and timing deviations.
   */
  compareTraces(before: CoreExecutionTrace, after: CoreExecutionTrace): TraceDiffReport {
    const stepDiffs: StepDiff[] = [];
    const beforeStepsMap = new Map<string, CoreExecutionTraceStep>(before.steps.map((s) => [s.stepId, s]));
    const afterStepsMap = new Map<string, CoreExecutionTraceStep>(after.steps.map((s) => [s.stepId, s]));

    const allStepIds = new Set([...beforeStepsMap.keys(), ...afterStepsMap.keys()]);

    let totalBeforeDuration = 0;
    let totalAfterDuration = 0;

    const getStepDuration = (step: CoreExecutionTraceStep): number => {
      return Math.max(0, new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime());
    };

    for (const stepId of allStepIds) {
      const bStep = beforeStepsMap.get(stepId);
      const aStep = afterStepsMap.get(stepId);

      if (bStep) {
        totalBeforeDuration += getStepDuration(bStep);
      }
      if (aStep) {
        totalAfterDuration += getStepDuration(aStep);
      }

      if (bStep && !aStep) {
        stepDiffs.push({
          stepId,
          changeType: "removed",
          durationDiffMs: -getStepDuration(bStep),
          messageDiff: { before: bStep.message }
        });
      } else if (!bStep && aStep) {
        stepDiffs.push({
          stepId,
          changeType: "added",
          durationDiffMs: getStepDuration(aStep),
          messageDiff: { after: aStep.message }
        });
      } else if (bStep && aStep) {
        const bDur = getStepDuration(bStep);
        const aDur = getStepDuration(aStep);
        const durationDiffMs = aDur - bDur;
        const statusChanged = bStep.status !== aStep.status;
        const messageChanged = bStep.message !== aStep.message;

        if (statusChanged || messageChanged || durationDiffMs !== 0) {
          stepDiffs.push({
            stepId,
            changeType: "modified",
            statusShift: statusChanged ? { before: bStep.status, after: aStep.status } : undefined,
            durationDiffMs,
            messageDiff: messageChanged ? { before: bStep.message, after: aStep.message } : undefined
          });
        } else {
          stepDiffs.push({
            stepId,
            changeType: "unchanged"
          });
        }
      }
    }

    const hasChanges = stepDiffs.some((d) => d.changeType !== "unchanged");
    const durationShiftMs = totalAfterDuration - totalBeforeDuration;

    // Generate Mermaid Diff Flowchart
    let mermaid = "graph TD\n";
    for (const diff of stepDiffs) {
      const bStep = beforeStepsMap.get(diff.stepId);
      const aStep = afterStepsMap.get(diff.stepId);
      const label = aStep ? `${aStep.phase}: ${diff.stepId}` : `${bStep?.phase}: ${diff.stepId}`;

      let styleStr = "";
      if (diff.changeType === "added") {
        styleStr = `:::addedStyle`;
      } else if (diff.changeType === "removed") {
        styleStr = `:::removedStyle`;
      } else if (diff.changeType === "modified") {
        styleStr = `:::modifiedStyle`;
      }

      mermaid += `  ${diff.stepId.replace(/[^a-zA-Z0-9]/g, "_")}["${label}"]${styleStr}\n`;
    }

    mermaid += "  classDef addedStyle fill:#d4edda,stroke:#28a745,stroke-width:2px;\n";
    mermaid += "  classDef removedStyle fill:#f8d7da,stroke:#dc3545,stroke-width:2px;\n";
    mermaid += "  classDef modifiedStyle fill:#fff3cd,stroke:#ffc107,stroke-width:2px;\n";

    const traceForEdges = after.steps.length > 0 ? after : before;
    traceForEdges.steps.forEach((step, index) => {
      if (index > 0) {
        const prev = traceForEdges.steps[index - 1];
        if (prev) {
          mermaid += `  ${prev.stepId.replace(/[^a-zA-Z0-9]/g, "_")} --> ${step.stepId.replace(/[^a-zA-Z0-9]/g, "_")}\n`;
        }
      }
    });

    return {
      runIdBefore: before.runId,
      runIdAfter: after.runId,
      stepDiffs,
      hasChanges,
      durationShiftMs,
      mermaidDiffFlowchart: mermaid
    };
  }
}

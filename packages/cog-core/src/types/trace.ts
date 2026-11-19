import type { DomainTrace } from "./adapter";
import type { CoreStepStatus } from "./values";

export interface CoreExecutionTraceStep {
  stepId: string;
  phase: string;
  status: CoreStepStatus;
  startedAt: string;
  completedAt: string;
  message?: string;
  data?: Record<string, unknown>;
  domainTrace?: DomainTrace[];
}

export interface CoreExecutionTrace {
  runId: string;
  adapterId?: string;
  startedAt: string;
  completedAt: string;
  steps: CoreExecutionTraceStep[];
}

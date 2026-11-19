import type { ObjectRef } from "./context";
import type { CoreExecutionTrace } from "./trace";
import type { CoreValidationReport } from "./validation";
import type { CoreStepStatus } from "./values";

export interface CoreExecutionStep {
  id: string;
  phase: "bind" | "transform" | "validate" | "emit";
  targetKind: string;
  targetId?: string;
  targetRef?: string;
  inputRefs?: string[];
  dependsOn?: string[];
  status: CoreStepStatus;
  metadata?: Record<string, unknown>;
}

export interface CoreExecutionPlan {
  id: string;
  createdAt: string;
  adapterId?: string;
  steps: CoreExecutionStep[];
}

export interface DomainEmissionSpec {
  emissionId: string;
  adapterId?: string;
  target: string;
  kind: string;
  payload: Record<string, unknown>;
}

export interface CoreExecutionResult {
  success: boolean;
  adapterId?: string;
  validation: CoreValidationReport;
  plan: CoreExecutionPlan;
  emissions: DomainEmissionSpec[];
  trace: CoreExecutionTrace;
  bindings: Record<string, ObjectRef>;
  errors: string[];
}

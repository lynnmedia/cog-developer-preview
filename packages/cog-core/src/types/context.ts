import type { CoreExecutionMode } from "./values";

export interface ObjectRef {
  ref: string;
  kind?: string;
  adapterId?: string;
  origin?: "context" | "compiled" | "adapter";
}

export interface CoreExecutionContext {
  runId: string;
  mode: CoreExecutionMode;
  startedAt: string;
  refs?: Record<string, ObjectRef>;
  environment?: Record<string, string>;
  input?: Record<string, unknown>;
}

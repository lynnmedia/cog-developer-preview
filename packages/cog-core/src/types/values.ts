export type CoreScalarValue = string | number | boolean | null;

export type CoreLevel = "L1" | "L2" | "L3" | "L4" | "L5";

export type CoreExecutionMode = "human" | "ai" | "hybrid" | "batch";

export type CoreEnforcementMode = "ADVISORY" | "GUARDED" | "STRICT";

export type CoreIssueSeverity = "info" | "warning" | "error";

export type CoreStepStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCEEDED"
  | "SKIPPED"
  | "FAILED";

export type CoreDurationUnit = "ms" | "s" | "m" | "h" | "d" | "w";

export interface CoreDurationValue {
  kind: "duration";
  raw: string;
  amount: number;
  unit: CoreDurationUnit;
}

export type CoreDataValue =
  | CoreScalarValue
  | CoreLevel
  | CoreDurationValue
  | CoreDataValue[];

export type CoreAttributes = Record<string, CoreDataValue>;

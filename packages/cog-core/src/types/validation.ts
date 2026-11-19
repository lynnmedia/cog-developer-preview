import type { SourceSpan } from "./ast";
import type { CoreIssueSeverity } from "./values";

export interface CoreValidationIssue {
  code: string;
  severity: CoreIssueSeverity;
  message: string;
  ref?: string;
  path?: string;
  span?: SourceSpan;
  adapterId?: string;
}

export interface CoreValidationReport {
  valid: boolean;
  issues: CoreValidationIssue[];
  errorCount: number;
  warningCount: number;
}

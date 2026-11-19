import type { SourceSpan } from "./ast";

/**
 * Stable error codes for the Cog cognition-kernel and workspace package pipeline.
 */
export const COG_ERROR_CODES = {
  // Lexer Phase (LEX_*)
  LEX_INVALID_CHARACTER: "LEX_INVALID_CHARACTER",
  LEX_UNTERMINATED_STRING: "LEX_UNTERMINATED_STRING",

  // Parser Phase (PARSE_*)
  PARSE_SYNTAX_ERROR: "PARSE_SYNTAX_ERROR",
  PARSE_UNEXPECTED_TOKEN: "PARSE_UNEXPECTED_TOKEN",
  PARSE_MISMATCHED_BLOCK: "PARSE_MISMATCHED_BLOCK",

  // Compiler Phase (COMPILE_*)
  COMPILE_DUPLICATE_ENTITY: "COMPILE_DUPLICATE_ENTITY",
  COMPILE_INVALID_RELATION: "COMPILE_INVALID_RELATION",
  COMPILE_MISSING_EMISSION_TARGET: "COMPILE_MISSING_EMISSION_TARGET",
  COMPILE_TYPE_MISMATCH: "COMPILE_TYPE_MISMATCH",

  // Validator Phase (VALIDATE_*)
  VALIDATE_MISSING_RELATION_SOURCE: "VALIDATE_MISSING_RELATION_SOURCE",
  VALIDATE_MISSING_RELATION_TARGET: "VALIDATE_MISSING_RELATION_TARGET",
  VALIDATE_MISSING_VIEW_TARGET: "VALIDATE_MISSING_VIEW_TARGET",
  VALIDATE_MISSING_VIEW_PERSPECTIVE: "VALIDATE_MISSING_VIEW_PERSPECTIVE",
  VALIDATE_MISSING_RESOLUTION_TARGET: "VALIDATE_MISSING_RESOLUTION_TARGET",
  VALIDATE_MISSING_RESOLUTION_LEVEL: "VALIDATE_MISSING_RESOLUTION_LEVEL",
  VALIDATE_INVALID_RESOLUTION_LEVEL: "VALIDATE_INVALID_RESOLUTION_LEVEL",
  VALIDATE_MISSING_TRANSFORM_TARGET: "VALIDATE_MISSING_TRANSFORM_TARGET",
  VALIDATE_MISSING_RELATION_KIND: "VALIDATE_MISSING_RELATION_KIND",
  VALIDATE_MISSING_CONSTRAINT_TARGET: "VALIDATE_MISSING_CONSTRAINT_TARGET",
  VALIDATE_MALFORMED_CORE_REFERENCE: "VALIDATE_MALFORMED_CORE_REFERENCE",
  VALIDATE_ADAPTER_ERROR: "VALIDATE_ADAPTER_ERROR",
  VALIDATE_ADAPTER_WARNING: "VALIDATE_ADAPTER_WARNING",
  VALIDATE_ORPHANED_ENTITY: "VALIDATE_ORPHANED_ENTITY",
  VALIDATE_REDUNDANT_TRANSFORM: "VALIDATE_REDUNDANT_TRANSFORM",
  VALIDATE_CIRCULAR_DEPENDENCY: "VALIDATE_CIRCULAR_DEPENDENCY",

  // Planner Phase (PLAN_*)
  PLAN_UNSUPPORTED_ACTION: "PLAN_UNSUPPORTED_ACTION",
  PLAN_CYCLE_DETECTED: "PLAN_CYCLE_DETECTED",

  // Runtime Phase (RUN_*)
  RUN_EXECUTION_FAILURE: "RUN_EXECUTION_FAILURE",
  RUN_STEP_TIMEOUT: "RUN_STEP_TIMEOUT",
  RUN_ADAPTER_ERROR: "RUN_ADAPTER_ERROR",
  RUN_LIMIT_EXCEEDED: "RUN_LIMIT_EXCEEDED",

  // CLI & Builder Phase (CLI_* / BUILD_*)
  CLI_FILE_NOT_FOUND: "CLI_FILE_NOT_FOUND",
  CLI_INVALID_ARGUMENT: "CLI_INVALID_ARGUMENT",
  BUILD_INVALID_STRUCTURE: "BUILD_INVALID_STRUCTURE"
} as const;

export type CogErrorCode = typeof COG_ERROR_CODES[keyof typeof COG_ERROR_CODES];

export interface CogErrorDetails {
  code: CogErrorCode;
  message: string;
  phase: "lexer" | "parser" | "compiler" | "validator" | "planner" | "runtime" | "adapter" | "builder" | "cli" | "lsp";
  remediation?: string;
}

export class CogDiagnosticError extends Error {
  public readonly code: CogErrorCode;
  public readonly phase: "lexer" | "parser" | "compiler" | "validator" | "planner" | "runtime" | "adapter" | "builder" | "cli" | "lsp";
  public readonly span?: SourceSpan;
  public readonly target?: string;
  public readonly remediation?: string;
  public readonly severity: "error" | "warning";

  constructor(options: {
    message: string;
    code: CogErrorCode;
    phase: "lexer" | "parser" | "compiler" | "validator" | "planner" | "runtime" | "adapter" | "builder" | "cli" | "lsp";
    span?: SourceSpan;
    target?: string;
    remediation?: string;
    severity?: "error" | "warning";
  }) {
    super(options.message);
    this.name = "CogDiagnosticError";
    this.code = options.code;
    this.phase = options.phase;
    this.span = options.span;
    this.target = options.target;
    this.remediation = options.remediation;
    this.severity = options.severity ?? "error";
  }
}

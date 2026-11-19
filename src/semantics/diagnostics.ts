import { SourceSpan } from '../lexer/tokenTypes';

export interface Diagnostic {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  span: SourceSpan;
}

export interface ValidationResult<T> {
  ok: boolean;
  diagnostics: Diagnostic[];
  value?: T;
}

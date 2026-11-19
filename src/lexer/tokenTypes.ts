export type TokenType =
  | 'Keyword'
  | 'Identifier'
  | 'String'
  | 'Number'
  | 'Duration'
  | 'Resolution'
  | 'Boolean'
  | 'Null'
  | 'LBrace'
  | 'RBrace'
  | 'LBracket'
  | 'RBracket'
  | 'Colon'
  | 'Comma'
  | 'Arrow'
  | 'EOF';

export interface SourcePosition {
  offset: number;
  line: number;
  column: number;
}

export interface SourceSpan {
  start: SourcePosition;
  end: SourcePosition;
}

export interface Token {
  type: TokenType;
  lexeme: string;
  span: SourceSpan;
}

export const KEYWORDS = new Set([
  'define',
  'concept',
  'relate',
  'view',
  'as',
  'resolve',
  'to',
  'transform',
  'constrain',
  'emit',
  'sequence'
]);

export const BOOLEAN_LITERALS = new Set(['true', 'false']);
export const NULL_LITERALS = new Set(['null']);
export const RESOLUTION_LITERALS = new Set(['R1', 'R2', 'R3', 'R4', 'R5']);

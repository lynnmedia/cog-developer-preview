import type { SourceSpan } from "../types/ast";

export const TOKEN_TYPES = {
  DEFINE: "DEFINE",
  ENTITY: "ENTITY",
  RELATE: "RELATE",
  VIEW: "VIEW",
  AS: "AS",
  RESOLVE: "RESOLVE",
  TO: "TO",
  TRANSFORM: "TRANSFORM",
  CONSTRAIN: "CONSTRAIN",
  EMIT: "EMIT",
  LEVEL_L1: "LEVEL_L1",
  LEVEL_L2: "LEVEL_L2",
  LEVEL_L3: "LEVEL_L3",
  LEVEL_L4: "LEVEL_L4",
  LEVEL_L5: "LEVEL_L5",
  STRING: "STRING",
  NUMBER: "NUMBER",
  IDENTIFIER: "IDENTIFIER",
  DURATION: "DURATION",
  BOOLEAN: "BOOLEAN",
  NULL: "NULL",
  LEFT_BRACE: "LEFT_BRACE",
  RIGHT_BRACE: "RIGHT_BRACE",
  LEFT_BRACKET: "LEFT_BRACKET",
  RIGHT_BRACKET: "RIGHT_BRACKET",
  COLON: "COLON",
  COMMA: "COMMA",
  ARROW: "ARROW",
  EOF: "EOF",
} as const;

export type TokenType = (typeof TOKEN_TYPES)[keyof typeof TOKEN_TYPES];

export interface Token {
  type: TokenType;
  lexeme: string;
  span: SourceSpan;
}

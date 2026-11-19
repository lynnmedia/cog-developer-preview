import type { SourcePosition } from "../types/ast";
import { TOKEN_TYPES, type Token, type TokenType } from "./tokenTypes";
import { COG_RESOURCE_LIMITS } from "../types/limits";
import { COG_ERROR_CODES, CogDiagnosticError } from "../types/errors";

const KEYWORDS: Record<string, TokenType> = {
  define: TOKEN_TYPES.DEFINE,
  entity: TOKEN_TYPES.ENTITY,
  relate: TOKEN_TYPES.RELATE,
  view: TOKEN_TYPES.VIEW,
  as: TOKEN_TYPES.AS,
  resolve: TOKEN_TYPES.RESOLVE,
  to: TOKEN_TYPES.TO,
  transform: TOKEN_TYPES.TRANSFORM,
  constrain: TOKEN_TYPES.CONSTRAIN,
  emit: TOKEN_TYPES.EMIT,
  true: TOKEN_TYPES.BOOLEAN,
  false: TOKEN_TYPES.BOOLEAN,
  null: TOKEN_TYPES.NULL,
  L1: TOKEN_TYPES.LEVEL_L1,
  L2: TOKEN_TYPES.LEVEL_L2,
  L3: TOKEN_TYPES.LEVEL_L3,
  L4: TOKEN_TYPES.LEVEL_L4,
  L5: TOKEN_TYPES.LEVEL_L5,
};

const DURATION_UNITS = ["min", "ms", "s", "m", "h", "d", "w"] as const;

export function lex(source: string): Token[] {
  if (Buffer.byteLength(source, "utf-8") > COG_RESOURCE_LIMITS.MAX_SOURCE_SIZE_BYTES) {
    throw new CogDiagnosticError({
      message: `Source size exceeds limit of ${COG_RESOURCE_LIMITS.MAX_SOURCE_SIZE_BYTES} bytes`,
      code: COG_ERROR_CODES.RUN_LIMIT_EXCEEDED,
      phase: "lexer"
    });
  }

  const tokens: Token[] = [];
  let index = 0;
  let line = 1;
  let column = 1;

  const currentPosition = (): SourcePosition => ({
    offset: index,
    line,
    column,
  });

  const peek = (offset = 0): string => source[index + offset] ?? "";

  const advance = (): string => {
    const char = source[index] ?? "";
    index += 1;
    if (char === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
    return char;
  };

  const addToken = (type: TokenType, lexeme: string, start: SourcePosition): void => {
    tokens.push({
      type,
      lexeme,
      span: {
        start,
        end: currentPosition(),
      },
    });
  };

  const consumeWhile = (predicate: (char: string) => boolean): string => {
    let value = "";
    while (predicate(peek())) {
      value += advance();
    }
    return value;
  };

  while (index < source.length) {
    const start = currentPosition();
    const char = peek();

    if (char === " " || char === "\t" || char === "\r" || char === "\n") {
      advance();
      continue;
    }

    if (char === "/" && peek(1) === "/") {
      consumeWhile((value) => value !== "\n" && value !== "");
      continue;
    }

    if (char === "{" || char === "}" || char === "[" || char === "]" || char === ":" || char === ",") {
      const tokenTypeByChar: Record<string, TokenType> = {
        "{": TOKEN_TYPES.LEFT_BRACE,
        "}": TOKEN_TYPES.RIGHT_BRACE,
        "[": TOKEN_TYPES.LEFT_BRACKET,
        "]": TOKEN_TYPES.RIGHT_BRACKET,
        ":": TOKEN_TYPES.COLON,
        ",": TOKEN_TYPES.COMMA,
      };
      const tokenType = tokenTypeByChar[char];
      if (!tokenType) {
        throw new SyntaxError(`Unexpected punctuation "${char}" at ${start.line}:${start.column}`);
      }
      addToken(tokenType, advance(), start);
      continue;
    }

    if (char === "-" && peek(1) === ">") {
      advance();
      advance();
      addToken(TOKEN_TYPES.ARROW, "->", start);
      continue;
    }

    if (char === "\"" || char === "'") {
      const quote = advance();
      let value = "";
      while (peek() !== quote && peek() !== "") {
        const next = advance();
        if (next === "\\" && peek() !== "") {
          value += advance();
          continue;
        }
        value += next;
      }
      if (peek() !== quote) {
        throw new SyntaxError(`Unterminated string literal at ${start.line}:${start.column}`);
      }
      advance();
      addToken(TOKEN_TYPES.STRING, value, start);
      continue;
    }

    if (isDigit(char)) {
      const numberPart = consumeWhile((value) => isDigit(value) || value === ".");
      const durationUnit = DURATION_UNITS.find(
        (unit) =>
          source.startsWith(unit, index) &&
          !isIdentifierPart(source[index + unit.length] ?? ""),
      );

      if (durationUnit) {
        for (let consumed = 0; consumed < durationUnit.length; consumed += 1) {
          advance();
        }
        addToken(TOKEN_TYPES.DURATION, `${numberPart}${durationUnit}`, start);
        continue;
      }

      addToken(TOKEN_TYPES.NUMBER, numberPart, start);
      continue;
    }

    if (isIdentifierStart(char)) {
      const identifier = consumeWhile((value) => isIdentifierPart(value));
      addToken(KEYWORDS[identifier] ?? TOKEN_TYPES.IDENTIFIER, identifier, start);
      continue;
    }

    throw new SyntaxError(`Unexpected character "${char}" at ${start.line}:${start.column}`);
  }

  const eofPosition = currentPosition();
  tokens.push({
    type: TOKEN_TYPES.EOF,
    lexeme: "",
    span: {
      start: eofPosition,
      end: eofPosition,
    },
  });

  return tokens;
}

function isDigit(value: string): boolean {
  return value >= "0" && value <= "9";
}

function isIdentifierStart(value: string): boolean {
  return /[A-Za-z_]/.test(value);
}

function isIdentifierPart(value: string): boolean {
  return /[A-Za-z0-9_.-]/.test(value);
}

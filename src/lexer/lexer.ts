import {
  BOOLEAN_LITERALS,
  KEYWORDS,
  NULL_LITERALS,
  RESOLUTION_LITERALS,
  SourcePosition,
  SourceSpan,
  Token,
  TokenType
} from './tokenTypes';

function clonePos(pos: SourcePosition): SourcePosition {
  return { offset: pos.offset, line: pos.line, column: pos.column };
}

export class Lexer {
  private index = 0;
  private line = 1;
  private column = 1;

  constructor(private readonly source: string) {}

  tokenize(): Token[] {
    const tokens: Token[] = [];
    while (!this.isAtEnd()) {
      this.skipWhitespaceAndComments();
      if (this.isAtEnd()) break;
      tokens.push(this.nextToken());
    }
    const pos = this.currentPos();
    tokens.push({ type: 'EOF', lexeme: '', span: { start: pos, end: pos } });
    return tokens;
  }

  private nextToken(): Token {
    const start = this.currentPos();
    const ch = this.peek();

    if (ch === '{') return this.singleChar('LBrace', '{', start);
    if (ch === '}') return this.singleChar('RBrace', '}', start);
    if (ch === '[') return this.singleChar('LBracket', '[', start);
    if (ch === ']') return this.singleChar('RBracket', ']', start);
    if (ch === ':') return this.singleChar('Colon', ':', start);
    if (ch === ',') return this.singleChar('Comma', ',', start);
    if (ch === '-' && this.peekNext() === '>') {
      this.advance();
      this.advance();
      return this.makeToken('Arrow', '->', start, this.currentPos());
    }
    if (ch === '"') return this.readString();
    if (this.isDigit(ch)) return this.readNumberOrDuration();
    if (this.isIdentifierStart(ch)) return this.readIdentifierLike();

    throw new Error(`Unexpected character '${ch}' at ${start.line}:${start.column}`);
  }

  private readString(): Token {
    const start = this.currentPos();
    this.advance();
    let value = '';
    while (!this.isAtEnd() && this.peek() !== '"') {
      const ch = this.advance();
      if (ch === '\\' && !this.isAtEnd()) {
        const next = this.advance();
        value += next;
      } else {
        value += ch;
      }
    }
    if (this.isAtEnd()) {
      throw new Error(`Unterminated string at ${start.line}:${start.column}`);
    }
    this.advance();
    return this.makeToken('String', value, start, this.currentPos());
  }

  private readNumberOrDuration(): Token {
    const start = this.currentPos();
    let lexeme = '';
    while (!this.isAtEnd() && this.isDigit(this.peek())) lexeme += this.advance();
    if (!this.isAtEnd() && this.peek() === '.') {
      lexeme += this.advance();
      while (!this.isAtEnd() && this.isDigit(this.peek())) lexeme += this.advance();
    }
    let unit = '';
    while (!this.isAtEnd() && /[A-Za-z]/.test(this.peek())) unit += this.advance();
    if (unit) {
      return this.makeToken('Duration', `${lexeme}${unit}`, start, this.currentPos());
    }
    return this.makeToken('Number', lexeme, start, this.currentPos());
  }

  private readIdentifierLike(): Token {
    const start = this.currentPos();
    let lexeme = '';
    while (!this.isAtEnd() && this.isIdentifierPart(this.peek())) lexeme += this.advance();

    let type: TokenType = 'Identifier';
    if (KEYWORDS.has(lexeme)) type = 'Keyword';
    else if (BOOLEAN_LITERALS.has(lexeme)) type = 'Boolean';
    else if (NULL_LITERALS.has(lexeme)) type = 'Null';
    else if (RESOLUTION_LITERALS.has(lexeme)) type = 'Resolution';

    return this.makeToken(type, lexeme, start, this.currentPos());
  }

  private skipWhitespaceAndComments(): void {
    while (!this.isAtEnd()) {
      const ch = this.peek();
      if (ch === ' ' || ch === '\r' || ch === '\t' || ch === '\n') {
        this.advance();
        continue;
      }
      if (ch === '/' && this.peekNext() === '/') {
        while (!this.isAtEnd() && this.peek() !== '\n') this.advance();
        continue;
      }
      break;
    }
  }

  private singleChar(type: TokenType, expected: string, start: SourcePosition): Token {
    const got = this.advance();
    if (got !== expected) throw new Error(`Expected '${expected}'`);
    return this.makeToken(type, got, start, this.currentPos());
  }

  private makeToken(type: TokenType, lexeme: string, start: SourcePosition, end: SourcePosition): Token {
    return { type, lexeme, span: { start, end } as SourceSpan };
  }

  private currentPos(): SourcePosition {
    return clonePos({ offset: this.index, line: this.line, column: this.column });
  }

  private advance(): string {
    const ch = this.source[this.index++] ?? '';
    if (ch === '\n') {
      this.line += 1;
      this.column = 1;
    } else {
      this.column += 1;
    }
    return ch;
  }

  private peek(): string {
    return this.source[this.index] ?? '';
  }

  private peekNext(): string {
    return this.source[this.index + 1] ?? '';
  }

  private isAtEnd(): boolean {
    return this.index >= this.source.length;
  }

  private isDigit(ch: string): boolean {
    return /[0-9]/.test(ch);
  }

  private isIdentifierStart(ch: string): boolean {
    return /[A-Za-z_]/.test(ch);
  }

  private isIdentifierPart(ch: string): boolean {
    return /[A-Za-z0-9_-]/.test(ch);
  }
}

export function lex(source: string): Token[] {
  return new Lexer(source).tokenize();
}

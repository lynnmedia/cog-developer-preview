import type {
  ConstrainNode,
  DefineEntityNode,
  EmitNode,
  FieldNode,
  IdentifierValueNode,
  LevelValueNode,
  ListValueNode,
  ProgramNode,
  RelateNode,
  ResolveNode,
  SourceSpan,
  StatementNode,
  TransformNode,
  ValueNode,
  ViewNode,
} from "../types/ast";
import type { CoreDurationValue } from "../types/values";
import { TOKEN_TYPES, type Token } from "../lexer/tokenTypes";

export function parseCog(tokens: Token[]): ProgramNode {
  return new Parser(tokens).parseProgram();
}

class Parser {
  private readonly tokens: Token[];
  private current = 0;
  private readonly definedEntities: string[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parseProgram(): ProgramNode {
    const statements: StatementNode[] = [];
    const start = this.peek().span.start;

    while (!this.isAtEnd()) {
      statements.push(this.parseStatement());
    }

    return {
      kind: "Program",
      statements,
      span: createSpan(start, this.previous().span.end),
    };
  }

  private parseStatement(): StatementNode {
    const token = this.peek();

    switch (token.type) {
      case TOKEN_TYPES.DEFINE:
        return this.parseDefineEntity();
      case TOKEN_TYPES.RELATE:
        return this.parseRelate();
      case TOKEN_TYPES.VIEW:
        return this.parseView();
      case TOKEN_TYPES.RESOLVE:
        return this.parseResolve();
      case TOKEN_TYPES.TRANSFORM:
        return this.parseTransform();
      case TOKEN_TYPES.CONSTRAIN:
        return this.parseConstrain();
      case TOKEN_TYPES.EMIT:
        return this.parseEmit();
      default:
        throw this.error(token, `Expected a statement, found ${describeToken(token)}`);
    }
  }

  private parseDefineEntity(): DefineEntityNode {
    const start = this.consume(TOKEN_TYPES.DEFINE, "Expected `define`").span.start;
    this.consume(TOKEN_TYPES.ENTITY, "Expected `entity` after `define`");

    const nameToken = this.consumeOneOf(
      [TOKEN_TYPES.STRING, TOKEN_TYPES.IDENTIFIER],
      "Expected entity name as string or identifier",
    );
    const fields = this.parseBlock();
    const name = toIdentifierNode(nameToken);
    const entityKind = this.findIdentifierLikeField(fields, "kind");
    const level = this.findLevelField(fields, "level");

    this.definedEntities.push(name.name);

    return {
      kind: "DefineEntity",
      name,
      entityKind,
      level,
      fields,
      span: createSpan(start, this.previous().span.end),
    };
  }

  private parseRelate(): RelateNode {
    const start = this.consume(TOKEN_TYPES.RELATE, "Expected `relate`").span.start;
    const sourceToken = this.consumeOneOf(
      [TOKEN_TYPES.STRING, TOKEN_TYPES.IDENTIFIER],
      "Expected relation source as string or identifier",
    );
    this.consume(TOKEN_TYPES.ARROW, "Expected `->` in relate statement");
    const targetToken = this.consumeOneOf(
      [TOKEN_TYPES.STRING, TOKEN_TYPES.IDENTIFIER],
      "Expected relation target as string or identifier",
    );
    const fields = this.parseBlock();
    const source = toIdentifierNode(sourceToken);
    const target = toIdentifierNode(targetToken);
    const relation = this.requireIdentifierLikeField(fields, "kind", 'Relate requires `kind:`. Example: relate "source" -> "target" { kind: "relation_kind" }');
    const level = this.findLevelField(fields, "level");

    return {
      kind: "Relate",
      source,
      relation,
      target,
      level,
      fields,
      span: createSpan(start, this.previous().span.end),
    };
  }

  private parseView(): ViewNode {
    const start = this.consume(TOKEN_TYPES.VIEW, "Expected `view`").span.start;
    const targetToken = this.consumeOneOf(
      [TOKEN_TYPES.STRING, TOKEN_TYPES.IDENTIFIER],
      "Expected view target as string or identifier",
    );
    this.consume(TOKEN_TYPES.AS, "View requires `as`");
    const asToken = this.consume(TOKEN_TYPES.IDENTIFIER, "Expected perspective identifier after `as`");
    const target = toIdentifierNode(targetToken);
    const as = toIdentifierNode(asToken);
    const fields = this.parseBlock();

    return {
      kind: "View",
      target,
      as,
      fields,
      span: createSpan(start, this.previous().span.end),
    };
  }

  private parseResolve(): ResolveNode {
    const start = this.consume(TOKEN_TYPES.RESOLVE, "Expected `resolve`").span.start;
    const targetToken = this.consumeOneOf(
      [TOKEN_TYPES.STRING, TOKEN_TYPES.IDENTIFIER],
      "Expected resolve target as string or identifier",
    );
    this.consume(TOKEN_TYPES.TO, 'Resolve requires `to`. Example: resolve "target" to L1 {}');
    const resolutionToken = this.consumeOneOf(
      [
        TOKEN_TYPES.LEVEL_L1,
        TOKEN_TYPES.LEVEL_L2,
        TOKEN_TYPES.LEVEL_L3,
        TOKEN_TYPES.LEVEL_L4,
        TOKEN_TYPES.LEVEL_L5,
      ],
      "Expected level token L1-L5 after `to`",
    );
    const target = toIdentifierNode(targetToken);
    const to = {
      kind: "LevelValue" as const,
      value: resolutionToken.lexeme as LevelValueNode["value"],
      span: resolutionToken.span,
    };
    const fields = this.parseBlock();

    return {
      kind: "Resolve",
      target,
      to,
      fields,
      span: createSpan(start, this.previous().span.end),
    };
  }

  private parseTransform(): TransformNode {
    const start = this.consume(TOKEN_TYPES.TRANSFORM, "Expected `transform`").span.start;
    const fields = this.parseBlock();
    const target = this.requireIdentifierLikeField(fields, "target", "Transform requires `target:`");
    const transform = this.requireIdentifierLikeField(fields, "to", "Transform requires `to:`");
    return {
      kind: "Transform",
      target,
      transform,
      fields,
      span: createSpan(start, this.previous().span.end),
    };
  }

  private parseConstrain(): ConstrainNode {
    const start = this.consume(TOKEN_TYPES.CONSTRAIN, "Expected `constrain`").span.start;
    const fields = this.parseBlock();
    const target = this.requireIdentifierLikeField(fields, "target", "Constrain requires `target:`");

    return {
      kind: "Constrain",
      target,
      fields,
      span: createSpan(start, this.previous().span.end),
    };
  }

  private parseEmit(): EmitNode {
    const start = this.consume(TOKEN_TYPES.EMIT, "Expected `emit`").span.start;
    const fields = this.parseBlock();
    const explicitTarget = this.findIdentifierLikeField(fields, "target");
    const target = explicitTarget ?? this.inferImplicitEmitTarget();
    const as = this.findIdentifierLikeField(fields, "kind");

    return {
      kind: "Emit",
      target,
      as,
      fields,
      span: createSpan(start, this.previous().span.end),
    };
  }

  private parseBlock(): FieldNode[] {
    this.consume(TOKEN_TYPES.LEFT_BRACE, "Expected `{` to start a flat field block");
    const fields: FieldNode[] = [];

    while (!this.check(TOKEN_TYPES.RIGHT_BRACE)) {
      if (this.isAtEnd()) {
        throw this.error(this.peek(), "Expected `}` to close block");
      }
      fields.push(this.parseField());
    }

    this.consume(TOKEN_TYPES.RIGHT_BRACE, "Expected `}` to close block");
    return fields;
  }

  private parseField(): FieldNode {
    const keyToken = this.consumeOneOf(
      [TOKEN_TYPES.IDENTIFIER, TOKEN_TYPES.TO, TOKEN_TYPES.AS],
      "Expected field name",
    );
    this.consume(TOKEN_TYPES.COLON, `Expected \`:\` after field name "${keyToken.lexeme}"`);
    const value = this.parseValue();

    return {
      kind: "Field",
      name: keyToken.lexeme,
      value,
      span: createSpan(keyToken.span.start, value.span?.end ?? keyToken.span.end),
    };
  }

  private parseValue(): ValueNode {
    const token = this.peek();

    switch (token.type) {
      case TOKEN_TYPES.STRING:
        this.advance();
        return {
          kind: "StringValue",
          value: token.lexeme,
          span: token.span,
        };
      case TOKEN_TYPES.NUMBER:
        this.advance();
        return {
          kind: "NumberValue",
          value: Number.parseFloat(token.lexeme),
          span: token.span,
        };
      case TOKEN_TYPES.BOOLEAN:
        this.advance();
        return {
          kind: "BooleanValue",
          value: token.lexeme === "true",
          span: token.span,
        };
      case TOKEN_TYPES.NULL:
        this.advance();
        return {
          kind: "NullValue",
          value: null,
          span: token.span,
        };
      case TOKEN_TYPES.IDENTIFIER:
        this.advance();
        return {
          kind: "IdentifierValue",
          name: token.lexeme,
          span: token.span,
        };
      case TOKEN_TYPES.LEVEL_L1:
      case TOKEN_TYPES.LEVEL_L2:
      case TOKEN_TYPES.LEVEL_L3:
      case TOKEN_TYPES.LEVEL_L4:
      case TOKEN_TYPES.LEVEL_L5:
        this.advance();
        return {
          kind: "LevelValue",
          value: token.lexeme as LevelValueNode["value"],
          span: token.span,
        };
      case TOKEN_TYPES.DURATION:
        this.advance();
        return {
          kind: "DurationValue",
          value: parseDurationValue(token),
          span: token.span,
        };
      case TOKEN_TYPES.LEFT_BRACKET:
        return this.parseListValue();
      default:
        throw this.error(token, `Expected field value, found ${describeToken(token)}`);
    }
  }

  private parseListValue(): ListValueNode {
    const start = this.consume(TOKEN_TYPES.LEFT_BRACKET, "Expected `[` to start list").span.start;
    const values: ValueNode[] = [];

    while (!this.check(TOKEN_TYPES.RIGHT_BRACKET)) {
      if (this.isAtEnd()) {
        throw this.error(this.peek(), "Expected `]` to close list");
      }

      const value = this.parseValue();
      if (value.kind === "ListValue") {
        throw this.error(this.previous(), "Nested lists are not supported in parser v0.3 minimal subset");
      }
      values.push(value);

      if (!this.match(TOKEN_TYPES.COMMA)) {
        break;
      }
    }

    const end = this.consume(TOKEN_TYPES.RIGHT_BRACKET, "Expected `]` to close list").span.end;

    return {
      kind: "ListValue",
      values,
      span: createSpan(start, end),
    };
  }

  private inferImplicitEmitTarget(): IdentifierValueNode | undefined {
    if (this.definedEntities.length === 1) {
      const name = this.definedEntities[0];
      if (!name) {
        return undefined;
      }
      const token = this.previous();
      return {
        kind: "IdentifierValue",
        name,
        span: token.span,
      };
    }

    return undefined;
  }

  private requireIdentifierLikeField(
    fields: FieldNode[],
    fieldName: string,
    message: string,
  ): IdentifierValueNode {
    const value = this.findIdentifierLikeField(fields, fieldName);
    if (!value) {
      throw this.error(this.previous(), message);
    }
    return value;
  }

  private findIdentifierLikeField(
    fields: FieldNode[],
    fieldName: string,
  ): IdentifierValueNode | undefined {
    const field = fields.find((candidate) => candidate.name === fieldName);
    if (!field) {
      return undefined;
    }

    switch (field.value.kind) {
      case "IdentifierValue":
        return field.value;
      case "StringValue":
        return {
          kind: "IdentifierValue",
          name: field.value.value,
          span: field.value.span,
        };
      default:
        throw this.errorAtSpan(
          field.value.span ?? field.span,
          `Field "${fieldName}" must be a string or identifier, found ${field.value.kind}`,
        );
    }
  }

  private findLevelField(fields: FieldNode[], fieldName: string): LevelValueNode | undefined {
    const field = fields.find((candidate) => candidate.name === fieldName);
    if (!field) {
      return undefined;
    }
    if (field.value.kind !== "LevelValue") {
      throw this.errorAtSpan(
        field.value.span ?? field.span,
        `Field "${fieldName}" must be a level token, found ${field.value.kind}`,
      );
    }
    return field.value;
  }

  private match(type: Token["type"]): boolean {
    if (!this.check(type)) {
      return false;
    }
    this.advance();
    return true;
  }

  private consume(type: Token["type"], message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    throw this.error(this.peek(), message);
  }

  private consumeOneOf(types: Token["type"][], message: string): Token {
    for (const type of types) {
      if (this.check(type)) {
        return this.advance();
      }
    }
    throw this.error(this.peek(), message);
  }

  private check(type: Token["type"]): boolean {
    if (this.isAtEnd()) {
      return type === TOKEN_TYPES.EOF;
    }
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current += 1;
    }
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TOKEN_TYPES.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current] ?? this.tokens[this.tokens.length - 1]!;
  }

  private previous(): Token {
    return this.tokens[Math.max(this.current - 1, 0)] ?? this.tokens[0]!;
  }

  private error(token: Token, message: string): Error {
    return new SyntaxError(`${message} at ${token.span.start.line}:${token.span.start.column} near ${describeToken(token)}`);
  }

  private errorAtSpan(span: SourceSpan | undefined, message: string): Error {
    if (!span) {
      return new SyntaxError(message);
    }
    return new SyntaxError(`${message} at ${span.start.line}:${span.start.column}`);
  }
}

function toIdentifierNode(token: Token): IdentifierValueNode {
  return {
    kind: "IdentifierValue",
    name: token.lexeme,
    span: token.span,
  };
}

function parseDurationValue(token: Token): CoreDurationValue {
  const match = /^(?<amount>\d+(?:\.\d+)?)(?<unit>min|ms|s|m|h|d|w)$/.exec(token.lexeme);
  if (!match?.groups) {
    throw new SyntaxError(`Invalid duration token "${token.lexeme}" at ${token.span.start.line}:${token.span.start.column}`);
  }

  const amount = match.groups.amount;
  const rawUnit = match.groups.unit;
  if (!amount || !rawUnit) {
    throw new SyntaxError(`Invalid duration token "${token.lexeme}" at ${token.span.start.line}:${token.span.start.column}`);
  }

  return {
    kind: "duration",
    raw: token.lexeme,
    amount: Number.parseFloat(amount),
    unit: (rawUnit === "min" ? "m" : rawUnit) as CoreDurationValue["unit"],
  };
}

function createSpan(start: SourceSpan["start"], end: SourceSpan["end"]): SourceSpan {
  return {
    start,
    end,
  };
}

function describeToken(token: Token): string {
  if (token.type === TOKEN_TYPES.EOF) {
    return "EOF";
  }
  return `${token.type} "${token.lexeme}"`;
}

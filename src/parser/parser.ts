import { Token, SourceSpan } from '../lexer/tokenTypes';
import {
  BaseNode,
  BooleanValueNode,
  ConstrainNode,
  DefineConceptNode,
  DurationValueNode,
  EmitNode,
  FieldNode,
  IdentifierValueNode,
  ListValueNode,
  NullValueNode,
  NumberValueNode,
  ProgramNode,
  RelateNode,
  ResolutionLevel,
  ResolutionValueNode,
  ResolveNode,
  SequenceNode,
  StatementNode,
  StringValueNode,
  TransformNode,
  ValueNode,
  ViewNode
} from './ast';

function spanFrom(start: Token, end: Token): SourceSpan {
  return { start: start.span.start, end: end.span.end };
}

export class Parser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  parseProgram(): ProgramNode {
    const start = this.peek();
    const statements: StatementNode[] = [];
    while (!this.check('EOF')) {
      statements.push(this.parseStatement());
    }
    const end = this.peek();
    return { kind: 'Program', statements, span: spanFrom(start, end) };
  }

  private parseStatement(): StatementNode {
    const token = this.peek();
    if (this.matchKeyword('define')) return this.parseDefine(token);
    if (this.matchKeyword('relate')) return this.parseRelate(token);
    if (this.matchKeyword('view')) return this.parseView(token);
    if (this.matchKeyword('resolve')) return this.parseResolve(token);
    if (this.matchKeyword('transform')) return this.parseTransform(token);
    if (this.matchKeyword('constrain')) return this.parseConstrain(token);
    if (this.matchKeyword('emit')) return this.parseEmit(token);
    if (this.matchKeyword('sequence')) return this.parseSequence(token);
    throw this.error(`Unexpected token '${token.lexeme}'`);
  }

  private parseDefine(start: Token): DefineConceptNode {
    this.consumeKeyword('concept');
    const name = this.consume('String', 'Expected concept name as string');
    const fields = this.parseBlock();
    return { kind: 'DefineConcept', name: name.lexeme, fields, span: spanFrom(start, this.previous()) };
  }

  private parseRelate(start: Token): RelateNode {
    const from = this.consume('String', 'Expected source concept string');
    this.consume('Arrow', 'Expected -> in relate statement');
    const to = this.consume('String', 'Expected target concept string');
    const fields = this.parseBlock();
    return { kind: 'Relate', from: from.lexeme, to: to.lexeme, fields, span: spanFrom(start, this.previous()) };
  }

  private parseView(start: Token): ViewNode {
    const target = this.consume('String', 'Expected concept string');
    this.consumeKeyword('as');
    const perspective = this.consume('Identifier', 'Expected perspective identifier');
    const fields = this.parseBlock();
    return { kind: 'View', target: target.lexeme, perspective: perspective.lexeme, fields, span: spanFrom(start, this.previous()) };
  }

  private parseResolve(start: Token): ResolveNode {
    const target = this.consume('String', 'Expected concept string');
    this.consumeKeyword('to');
    const resolution = this.consume('Resolution', 'Expected resolution level R1-R5');
    const fields = this.parseBlock();
    return {
      kind: 'Resolve',
      target: target.lexeme,
      resolution: resolution.lexeme as ResolutionLevel,
      fields,
      span: spanFrom(start, this.previous())
    };
  }

  private parseTransform(start: Token): TransformNode {
    const fields = this.parseBlock();
    return { kind: 'Transform', fields, span: spanFrom(start, this.previous()) };
  }

  private parseConstrain(start: Token): ConstrainNode {
    const fields = this.parseBlock();
    return { kind: 'Constrain', fields, span: spanFrom(start, this.previous()) };
  }

  private parseEmit(start: Token): EmitNode {
    const fields = this.parseBlock();
    return { kind: 'Emit', fields, span: spanFrom(start, this.previous()) };
  }

  private parseSequence(start: Token): SequenceNode {
    const fields = this.parseBlock();
    return { kind: 'Sequence', fields, span: spanFrom(start, this.previous()) };
  }

  private parseBlock(): FieldNode[] {
    this.consume('LBrace', 'Expected {');
    const fields: FieldNode[] = [];
    while (!this.check('RBrace') && !this.check('EOF')) {
      fields.push(this.parseField());
      this.match('Comma');
    }
    this.consume('RBrace', 'Expected }');
    return fields;
  }

  private parseField(): FieldNode {
    const name = this.consumeFieldName();
    this.consume('Colon', 'Expected : after field name');
    const value = this.parseValue();
    return {
      kind: 'Field',
      name: name.lexeme,
      value,
      span: { start: name.span.start, end: value.span.end }
    };
  }

  private parseValue(): ValueNode {
    const token = this.peek();
    switch (token.type) {
      case 'String':
        this.advance();
        return { kind: 'StringValue', value: token.lexeme, span: token.span } as StringValueNode;
      case 'Number':
        this.advance();
        return { kind: 'NumberValue', value: Number(token.lexeme), span: token.span } as NumberValueNode;
      case 'Boolean':
        this.advance();
        return { kind: 'BooleanValue', value: token.lexeme === 'true', span: token.span } as BooleanValueNode;
      case 'Null':
        this.advance();
        return { kind: 'NullValue', span: token.span } as NullValueNode;
      case 'Identifier':
        this.advance();
        return { kind: 'IdentifierValue', value: token.lexeme, span: token.span } as IdentifierValueNode;
      case 'Resolution':
        this.advance();
        return { kind: 'ResolutionValue', value: token.lexeme as ResolutionLevel, span: token.span } as ResolutionValueNode;
      case 'Duration': {
        this.advance();
        const match = token.lexeme.match(/^(\d+(?:\.\d+)?)(min|h|d)$/);
        if (!match) throw this.error(`Invalid duration '${token.lexeme}'`);
        return {
          kind: 'DurationValue',
          raw: token.lexeme,
          value: Number(match[1]),
          unit: match[2] as 'min' | 'h' | 'd',
          span: token.span
        } as DurationValueNode;
      }
      case 'LBracket':
        return this.parseList();
      default:
        throw this.error(`Unexpected value token '${token.lexeme}'`);
    }
  }

  private parseList(): ListValueNode {
    const start = this.consume('LBracket', 'Expected [');
    const items: ValueNode[] = [];
    while (!this.check('RBracket') && !this.check('EOF')) {
      items.push(this.parseValue());
      if (!this.match('Comma')) break;
    }
    const end = this.consume('RBracket', 'Expected ]');
    return { kind: 'ListValue', items, span: spanFrom(start, end) };
  }

  private consume(type: Token['type'], message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(message);
  }

  private consumeFieldName(): Token {
    const token = this.peek();
    if (token.type === 'Identifier' || token.type === 'Keyword') return this.advance();
    throw this.error('Expected field name');
  }

  private consumeKeyword(keyword: string): Token {
    const token = this.peek();
    if (token.type === 'Keyword' && token.lexeme === keyword) return this.advance();
    throw this.error(`Expected keyword '${keyword}'`);
  }

  private match(type: Token['type']): boolean {
    if (!this.check(type)) return false;
    this.advance();
    return true;
  }

  private matchKeyword(keyword: string): boolean {
    const token = this.peek();
    if (token.type === 'Keyword' && token.lexeme === keyword) {
      this.advance();
      return true;
    }
    return false;
  }

  private check(type: Token['type']): boolean {
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.check('EOF')) this.index += 1;
    return this.previous();
  }

  private peek(): Token {
    return this.tokens[this.index];
  }

  private previous(): Token {
    return this.tokens[this.index - 1];
  }

  private error(message: string): Error {
    const token = this.peek();
    return new Error(`${message} at ${token.span.start.line}:${token.span.start.column}`);
  }
}

export function parse(tokens: Token[]): ProgramNode {
  return new Parser(tokens).parseProgram();
}

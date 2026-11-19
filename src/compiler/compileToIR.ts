import { ProgramNode, FieldNode, ValueNode } from '../parser/ast';

export interface IRConcept {
  label: string;
  fields: Record<string, unknown>;
}

export interface IRRelation {
  from: string;
  to: string;
  fields: Record<string, unknown>;
}

export interface IRView {
  target: string;
  perspective: string;
  fields: Record<string, unknown>;
}

export interface IRResolve {
  target: string;
  resolution: string;
  fields: Record<string, unknown>;
}

export interface IRTransform {
  fields: Record<string, unknown>;
}

export interface IRConstraint {
  fields: Record<string, unknown>;
}

export interface IREmit {
  fields: Record<string, unknown>;
}

export interface IRSequence {
  fields: Record<string, unknown>;
}

export interface CognitiveIR {
  concepts: IRConcept[];
  relations: IRRelation[];
  views: IRView[];
  resolves: IRResolve[];
  transforms: IRTransform[];
  constraints: IRConstraint[];
  emits: IREmit[];
  sequences: IRSequence[];
}

function valueToJs(value: ValueNode): unknown {
  switch (value.kind) {
    case 'StringValue':
    case 'IdentifierValue':
    case 'ResolutionValue':
      return value.value;
    case 'NumberValue':
      return value.value;
    case 'BooleanValue':
      return value.value;
    case 'NullValue':
      return null;
    case 'DurationValue':
      return { raw: value.raw, value: value.value, unit: value.unit };
    case 'ListValue':
      return value.items.map(valueToJs);
  }
}

function fieldsToObject(fields: FieldNode[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const field of fields) obj[field.name] = valueToJs(field.value);
  return obj;
}

export function compileToIR(program: ProgramNode): CognitiveIR {
  const ir: CognitiveIR = {
    concepts: [],
    relations: [],
    views: [],
    resolves: [],
    transforms: [],
    constraints: [],
    emits: [],
    sequences: []
  };

  for (const statement of program.statements) {
    switch (statement.kind) {
      case 'DefineConcept':
        ir.concepts.push({ label: statement.name, fields: fieldsToObject(statement.fields) });
        break;
      case 'Relate':
        ir.relations.push({ from: statement.from, to: statement.to, fields: fieldsToObject(statement.fields) });
        break;
      case 'View':
        ir.views.push({ target: statement.target, perspective: statement.perspective, fields: fieldsToObject(statement.fields) });
        break;
      case 'Resolve':
        ir.resolves.push({ target: statement.target, resolution: statement.resolution, fields: fieldsToObject(statement.fields) });
        break;
      case 'Transform':
        ir.transforms.push({ fields: fieldsToObject(statement.fields) });
        break;
      case 'Constrain':
        ir.constraints.push({ fields: fieldsToObject(statement.fields) });
        break;
      case 'Emit':
        ir.emits.push({ fields: fieldsToObject(statement.fields) });
        break;
      case 'Sequence':
        ir.sequences.push({ fields: fieldsToObject(statement.fields) });
        break;
    }
  }

  return ir;
}

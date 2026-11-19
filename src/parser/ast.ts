import { SourceSpan } from '../lexer/tokenTypes';

export type ResolutionLevel = 'R1' | 'R2' | 'R3' | 'R4' | 'R5';

export interface BaseNode {
  kind: string;
  span: SourceSpan;
}

export interface ProgramNode extends BaseNode {
  kind: 'Program';
  statements: StatementNode[];
}

export interface FieldNode extends BaseNode {
  kind: 'Field';
  name: string;
  value: ValueNode;
}

export interface StringValueNode extends BaseNode {
  kind: 'StringValue';
  value: string;
}

export interface NumberValueNode extends BaseNode {
  kind: 'NumberValue';
  value: number;
}

export interface BooleanValueNode extends BaseNode {
  kind: 'BooleanValue';
  value: boolean;
}

export interface NullValueNode extends BaseNode {
  kind: 'NullValue';
}

export interface IdentifierValueNode extends BaseNode {
  kind: 'IdentifierValue';
  value: string;
}

export interface ResolutionValueNode extends BaseNode {
  kind: 'ResolutionValue';
  value: ResolutionLevel;
}

export interface DurationValueNode extends BaseNode {
  kind: 'DurationValue';
  raw: string;
  value: number;
  unit: 'min' | 'h' | 'd';
}

export interface ListValueNode extends BaseNode {
  kind: 'ListValue';
  items: ValueNode[];
}

export type ValueNode =
  | StringValueNode
  | NumberValueNode
  | BooleanValueNode
  | NullValueNode
  | IdentifierValueNode
  | ResolutionValueNode
  | DurationValueNode
  | ListValueNode;

export interface DefineConceptNode extends BaseNode {
  kind: 'DefineConcept';
  name: string;
  fields: FieldNode[];
}

export interface RelateNode extends BaseNode {
  kind: 'Relate';
  from: string;
  to: string;
  fields: FieldNode[];
}

export interface ViewNode extends BaseNode {
  kind: 'View';
  target: string;
  perspective: string;
  fields: FieldNode[];
}

export interface ResolveNode extends BaseNode {
  kind: 'Resolve';
  target: string;
  resolution: ResolutionLevel;
  fields: FieldNode[];
}

export interface TransformNode extends BaseNode {
  kind: 'Transform';
  fields: FieldNode[];
}

export interface ConstrainNode extends BaseNode {
  kind: 'Constrain';
  fields: FieldNode[];
}

export interface EmitNode extends BaseNode {
  kind: 'Emit';
  fields: FieldNode[];
}

export interface SequenceNode extends BaseNode {
  kind: 'Sequence';
  fields: FieldNode[];
}

export type StatementNode =
  | DefineConceptNode
  | RelateNode
  | ViewNode
  | ResolveNode
  | TransformNode
  | ConstrainNode
  | EmitNode
  | SequenceNode;

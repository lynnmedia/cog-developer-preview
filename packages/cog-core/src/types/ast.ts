import type { CoreDataValue, CoreDurationValue, CoreEnforcementMode, CoreLevel } from "./values";

export interface SourcePosition {
  offset: number;
  line: number;
  column: number;
}

export interface SourceSpan {
  start: SourcePosition;
  end: SourcePosition;
}

export interface BaseNode {
  kind: string;
  span?: SourceSpan;
}

export interface ProgramNode extends BaseNode {
  kind: "Program";
  statements: StatementNode[];
}

export interface FieldNode extends BaseNode {
  kind: "Field";
  name: string;
  value: ValueNode;
}

export interface StringValueNode extends BaseNode {
  kind: "StringValue";
  value: string;
}

export interface NumberValueNode extends BaseNode {
  kind: "NumberValue";
  value: number;
}

export interface BooleanValueNode extends BaseNode {
  kind: "BooleanValue";
  value: boolean;
}

export interface NullValueNode extends BaseNode {
  kind: "NullValue";
  value: null;
}

export interface IdentifierValueNode extends BaseNode {
  kind: "IdentifierValue";
  name: string;
}

export interface LevelValueNode extends BaseNode {
  kind: "LevelValue";
  value: CoreLevel;
}

export interface ListValueNode extends BaseNode {
  kind: "ListValue";
  values: ValueNode[];
}

export interface DurationValueNode extends BaseNode {
  kind: "DurationValue";
  value: CoreDurationValue;
}

export type ValueNode =
  | StringValueNode
  | NumberValueNode
  | BooleanValueNode
  | NullValueNode
  | IdentifierValueNode
  | LevelValueNode
  | ListValueNode
  | DurationValueNode;

export interface DefineEntityNode extends BaseNode {
  kind: "DefineEntity";
  name: IdentifierValueNode;
  entityKind?: IdentifierValueNode;
  level?: LevelValueNode;
  fields: FieldNode[];
}

export interface RelateNode extends BaseNode {
  kind: "Relate";
  source: IdentifierValueNode;
  relation: IdentifierValueNode;
  target: IdentifierValueNode;
  level?: LevelValueNode;
  fields: FieldNode[];
}

export interface ViewNode extends BaseNode {
  kind: "View";
  target: IdentifierValueNode;
  as?: IdentifierValueNode;
  fields: FieldNode[];
}

export interface ResolveNode extends BaseNode {
  kind: "Resolve";
  target: IdentifierValueNode;
  to?: ValueNode;
  fields: FieldNode[];
}

export interface TransformNode extends BaseNode {
  kind: "Transform";
  target: IdentifierValueNode;
  transform: IdentifierValueNode;
  fields: FieldNode[];
}

export interface ConstrainNode extends BaseNode {
  kind: "Constrain";
  target: IdentifierValueNode;
  enforcement?: CoreEnforcementMode;
  fields: FieldNode[];
}

export interface EmitNode extends BaseNode {
  kind: "Emit";
  target?: IdentifierValueNode;
  as?: IdentifierValueNode;
  fields: FieldNode[];
}

export type StatementNode =
  | DefineEntityNode
  | RelateNode
  | ViewNode
  | ResolveNode
  | TransformNode
  | ConstrainNode
  | EmitNode;

export type CoreLiteralNode = Exclude<ValueNode, IdentifierValueNode | ListValueNode> & {
  value: CoreDataValue;
};

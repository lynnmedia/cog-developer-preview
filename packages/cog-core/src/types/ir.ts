import type { CoreAttributes, CoreDataValue, CoreEnforcementMode, CoreLevel } from "./values";

export type CoreGraphNodeKind =
  | "entity"
  | "relation"
  | "view"
  | "resolution"
  | "transform"
  | "constraint"
  | "emit";

export interface CoreEntity {
  id: string;
  name: string;
  entityKind: string;
  level?: CoreLevel;
  attributes: CoreAttributes;
}

export interface CoreRelation {
  id: string;
  relationKind: string;
  sourceRef: string;
  targetRef: string;
  sourceEntityId?: string;
  targetEntityId?: string;
  level?: CoreLevel;
  attributes: CoreAttributes;
}

export interface CoreView {
  id: string;
  viewKind: string;
  targetRef: string;
  alias?: string;
  attributes: CoreAttributes;
}

export interface CoreResolutionTarget {
  id: string;
  targetRef: string;
  resolutionRef?: string;
  level?: CoreLevel;
  value?: CoreDataValue;
  attributes: CoreAttributes;
}

export interface CoreTransformation {
  id: string;
  targetRef: string;
  transformRef: string;
  arguments: CoreAttributes;
}

export interface CoreConstraint {
  id: string;
  targetRef: string;
  enforcement: CoreEnforcementMode;
  attributes: CoreAttributes;
}

export interface CoreEmission {
  id: string;
  targetRef: string;
  emissionKind: string;
  attributes: CoreAttributes;
}

export interface CoreExecutionGraphNode {
  id: string;
  kind: CoreGraphNodeKind;
  ref?: string;
}

export interface CoreExecutionGraphEdge {
  from: string;
  to: string;
  kind: "references" | "depends_on";
}

export interface CoreExecutionGraph {
  nodes: CoreExecutionGraphNode[];
  edges: CoreExecutionGraphEdge[];
}

export interface CoreProgramMeta {
  compilerVersion: string;
  compiledAt: string;
  statementCount: number;
  entityIndex: Record<string, string>;
}

export interface CoreIR {
  entities: CoreEntity[];
  relations: CoreRelation[];
  views: CoreView[];
  resolutions: CoreResolutionTarget[];
  transformations: CoreTransformation[];
  constraints: CoreConstraint[];
  emissions: CoreEmission[];
  graph: CoreExecutionGraph;
  meta: CoreProgramMeta;
}

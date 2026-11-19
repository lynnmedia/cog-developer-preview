import type {
  ConstrainNode,
  DefineEntityNode,
  EmitNode,
  FieldNode,
  ProgramNode,
  RelateNode,
  ResolveNode,
  StatementNode,
  TransformNode,
  ValueNode,
  ViewNode,
} from "../types/ast";
import type {
  CoreConstraint,
  CoreEmission,
  CoreEntity,
  CoreExecutionGraph,
  CoreIR,
  CoreRelation,
  CoreResolutionTarget,
  CoreTransformation,
  CoreView,
} from "../types/ir";
import type { CoreAttributes, CoreDataValue, CoreLevel } from "../types/values";

const COMPILER_VERSION = "0.3.0";

export function compileCog(program: ProgramNode): CoreIR {
  const counters: Record<string, number> = {};
  const graph: CoreExecutionGraph = {
    nodes: [],
    edges: [],
  };
  const entities: CoreEntity[] = [];
  const relations: CoreRelation[] = [];
  const views: CoreView[] = [];
  const resolutions: CoreResolutionTarget[] = [];
  const transformations: CoreTransformation[] = [];
  const constraints: CoreConstraint[] = [];
  const emissions: CoreEmission[] = [];
  const entityIndex: Record<string, string> = {};

  for (const statement of program.statements) {
    if (statement.kind !== "DefineEntity") {
      continue;
    }

    const entity = compileEntity(statement, counters);
    entities.push(entity);
    entityIndex[entity.name] = entity.id;
    graph.nodes.push({
      id: entity.id,
      kind: "entity",
      ref: entity.name,
    });
  }

  for (const statement of program.statements) {
    switch (statement.kind) {
      case "DefineEntity":
        break;
      case "Relate": {
        const relation = compileRelation(statement, counters, entityIndex);
        relations.push(relation);
        graph.nodes.push({
          id: relation.id,
          kind: "relation",
          ref: relation.relationKind,
        });
        if (relation.sourceEntityId) {
          graph.edges.push({
            from: relation.id,
            to: relation.sourceEntityId,
            kind: "references",
          });
        }
        if (relation.targetEntityId) {
          graph.edges.push({
            from: relation.id,
            to: relation.targetEntityId,
            kind: "references",
          });
        }
        break;
      }
      case "View": {
        const view = compileView(statement, counters);
        views.push(view);
        graph.nodes.push({
          id: view.id,
          kind: "view",
          ref: view.targetRef,
        });
        linkTarget(graph, view.id, view.targetRef, entityIndex);
        break;
      }
      case "Resolve": {
        const resolution = compileResolution(statement, counters);
        resolutions.push(resolution);
        graph.nodes.push({
          id: resolution.id,
          kind: "resolution",
          ref: resolution.targetRef,
        });
        linkTarget(graph, resolution.id, resolution.targetRef, entityIndex);
        break;
      }
      case "Transform": {
        const transformation = compileTransformation(statement, counters);
        transformations.push(transformation);
        graph.nodes.push({
          id: transformation.id,
          kind: "transform",
          ref: transformation.targetRef,
        });
        linkTarget(graph, transformation.id, transformation.targetRef, entityIndex);
        break;
      }
      case "Constrain": {
        const constraint = compileConstraint(statement, counters);
        constraints.push(constraint);
        graph.nodes.push({
          id: constraint.id,
          kind: "constraint",
          ref: constraint.targetRef,
        });
        linkTarget(graph, constraint.id, constraint.targetRef, entityIndex);
        break;
      }
      case "Emit": {
        const emission = compileEmission(statement, counters);
        emissions.push(emission);
        graph.nodes.push({
          id: emission.id,
          kind: "emit",
          ref: emission.targetRef,
        });
        linkTarget(graph, emission.id, emission.targetRef, entityIndex);
        break;
      }
      default: {
        assertNever(statement);
      }
    }
  }

  return {
    entities,
    relations,
    views,
    resolutions,
    transformations,
    constraints,
    emissions,
    graph,
    meta: {
      compilerVersion: COMPILER_VERSION,
      compiledAt: new Date().toISOString(),
      statementCount: program.statements.length,
      entityIndex,
    },
  };
}

function compileEntity(node: DefineEntityNode, counters: Record<string, number>): CoreEntity {
  return {
    id: nextId("entity", counters),
    name: node.name.name,
    entityKind: node.entityKind?.name ?? "entity",
    level: node.level?.value,
    attributes: compileFields(node.fields),
  };
}

function compileRelation(
  node: RelateNode,
  counters: Record<string, number>,
  entityIndex: Record<string, string>,
): CoreRelation {
  return {
    id: nextId("relation", counters),
    relationKind: node.relation.name,
    sourceRef: node.source.name,
    targetRef: node.target.name,
    sourceEntityId: entityIndex[node.source.name],
    targetEntityId: entityIndex[node.target.name],
    level: node.level?.value,
    attributes: compileFields(node.fields),
  };
}

function compileView(node: ViewNode, counters: Record<string, number>): CoreView {
  return {
    id: nextId("view", counters),
    viewKind: node.as?.name ?? "",
    targetRef: node.target.name,
    alias: node.as?.name,
    attributes: compileFields(node.fields),
  };
}

function compileResolution(
  node: ResolveNode,
  counters: Record<string, number>,
): CoreResolutionTarget {
  const resolutionValue = node.to ? compileValue(node.to) : undefined;
  const isLevel = typeof resolutionValue === "string" && ["L1", "L2", "L3", "L4", "L5"].includes(resolutionValue);
  const level = isLevel ? (resolutionValue as CoreLevel) : undefined;

  return {
    id: nextId("resolution", counters),
    targetRef: node.target.name,
    resolutionRef: node.to?.kind === "IdentifierValue" ? node.to.name : undefined,
    level,
    value: resolutionValue,
    attributes: compileFields(node.fields),
  };
}

function compileTransformation(
  node: TransformNode,
  counters: Record<string, number>,
): CoreTransformation {
  return {
    id: nextId("transform", counters),
    targetRef: node.target.name,
    transformRef: node.transform.name,
    arguments: compileFields(node.fields),
  };
}

function compileConstraint(
  node: ConstrainNode,
  counters: Record<string, number>,
): CoreConstraint {
  return {
    id: nextId("constraint", counters),
    targetRef: node.target.name,
    enforcement: node.enforcement ?? "ADVISORY",
    attributes: compileFields(node.fields),
  };
}

function compileEmission(node: EmitNode, counters: Record<string, number>): CoreEmission {
  const targetRef = node.target?.name;
  if (!targetRef) {
    throw new Error('Emit statement requires a target. Use `target:` in the block or provide a parser-inferred target.');
  }

  return {
    id: nextId("emit", counters),
    targetRef,
    emissionKind: node.as?.name ?? "default",
    attributes: compileFields(node.fields),
  };
}

function compileFields(fields: FieldNode[]): CoreAttributes {
  const attributes: CoreAttributes = {};

  for (const field of fields) {
    attributes[field.name] = compileValue(field.value);
  }

  return attributes;
}

function compileValue(node: ValueNode): CoreDataValue {
  switch (node.kind) {
    case "StringValue":
    case "NumberValue":
    case "BooleanValue":
    case "NullValue":
    case "LevelValue":
      return node.value;
    case "IdentifierValue":
      return node.name;
    case "ListValue":
      return node.values.map((value) => compileValue(value));
    case "DurationValue":
      return node.value;
    default:
      return assertNever(node);
  }
}

function linkTarget(
  graph: CoreExecutionGraph,
  sourceId: string,
  targetRef: string,
  entityIndex: Record<string, string>,
): void {
  const targetId = entityIndex[targetRef];

  if (!targetId) {
    return;
  }

  graph.edges.push({
    from: sourceId,
    to: targetId,
    kind: "references",
  });
}

function nextId(prefix: string, counters: Record<string, number>): string {
  const next = (counters[prefix] ?? 0) + 1;
  counters[prefix] = next;
  return `${prefix}-${next}`;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled statement variant: ${JSON.stringify(value)}`);
}

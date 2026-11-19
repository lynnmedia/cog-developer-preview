import type { CoreEntity, CoreRelation, CoreResolutionTarget } from "../types/ir";
import type { CoreAttributes, CoreLevel } from "../types/values";

export function observe(
  id: string,
  kind: string,
  attributes: CoreAttributes = {},
): CoreEntity {
  return {
    id,
    name: id,
    entityKind: kind,
    attributes,
  };
}

export function identify(entity: CoreEntity): string {
  const attrs = Object.entries(entity.attributes)
    .sort(([k1], [k2]) => k1.localeCompare(k2))
    .map(([k, v]) => `${k}=${v}`)
    .join(",");
  return `${entity.entityKind}:${entity.id}${attrs ? ":" + attrs : ""}`;
}

export interface ComparisonResult {
  added: string[];
  removed: string[];
  modified: string[];
}

export function compare(a: CoreEntity, b: CoreEntity): ComparisonResult {
  const aKeys = Object.keys(a.attributes);
  const bKeys = Object.keys(b.attributes);

  const added = bKeys.filter((k) => !aKeys.includes(k));
  const removed = aKeys.filter((k) => !bKeys.includes(k));
  const modified = aKeys.filter(
    (k) => bKeys.includes(k) && a.attributes[k] !== b.attributes[k],
  );

  return { added, removed, modified };
}

export function classify(entity: CoreEntity, kind: string): CoreEntity {
  return {
    ...entity,
    entityKind: kind,
  };
}

export function relate(
  id: string,
  kind: string,
  sourceRef: string,
  targetRef: string,
  attributes: CoreAttributes = {},
): CoreRelation {
  return {
    id,
    relationKind: kind,
    sourceRef,
    targetRef,
    attributes,
  };
}

export function group(entities: CoreEntity[], key: string): Record<string, CoreEntity[]> {
  const groups: Record<string, CoreEntity[]> = {};
  for (const entity of entities) {
    const val = String(entity.attributes[key] ?? "undefined");
    if (!groups[val]) {
      groups[val] = [];
    }
    groups[val].push(entity);
  }
  return groups;
}

export function project(entity: CoreEntity, keys: string[]): CoreEntity {
  const attributes: CoreAttributes = {};
  for (const key of keys) {
    if (key in entity.attributes) {
      attributes[key] = entity.attributes[key]!;
    }
  }
  return {
    ...entity,
    attributes,
  };
}

export function resolve(
  id: string,
  targetRef: string,
  level: CoreLevel,
  attributes: CoreAttributes = {},
): CoreResolutionTarget {
  return {
    id,
    targetRef,
    resolutionRef: level,
    value: level,
    attributes,
  };
}

export function evaluate(expression: string, context: Record<string, any>): boolean {
  const match = expression.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*(>|<|===|==|!=)\s*(.*)$/);
  if (!match) {
    return false;
  }
  const [, key, op, rawValue] = match;
  const actualVal = context[key!];
  let expectedVal: any = rawValue!.trim();
  if (expectedVal.startsWith('"') && expectedVal.endsWith('"')) {
    expectedVal = expectedVal.slice(1, -1);
  } else if (!isNaN(Number(expectedVal))) {
    expectedVal = Number(expectedVal);
  }

  switch (op) {
    case ">":
      return actualVal > expectedVal;
    case "<":
      return actualVal < expectedVal;
    case "==":
    case "===":
      return actualVal === expectedVal;
    case "!=":
      return actualVal !== expectedVal;
    default:
      return false;
  }
}

export function explain(issue: { message: string; code?: string }): string {
  return `[${issue.code ?? "ERR_GENERIC"}] ${issue.message}`;
}

export function compose<T extends object, U extends object>(a: T, b: U): T & U {
  return {
    ...a,
    ...b,
  };
}

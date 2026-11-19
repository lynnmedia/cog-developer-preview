import type {
  ProgramNode,
  StatementNode,
  FieldNode,
  IdentifierValueNode,
  LevelValueNode,
  StringValueNode,
  ValueNode,
  DefineEntityNode,
  RelateNode,
  ResolveNode,
  ConstrainNode,
  EmitNode
} from "../types/ast";
import type { CoreLevel } from "../types/values";

export class CogAstBuilder {
  private statements: StatementNode[] = [];
  private definedEntities = new Set<string>();
  private validationChecks: Array<() => void> = [];

  private createId(name: string): IdentifierValueNode {
    return { kind: "IdentifierValue", name };
  }

  private createLevel(value: CoreLevel): LevelValueNode {
    return { kind: "LevelValue", value };
  }

  private createString(value: string): StringValueNode {
    return { kind: "StringValue", value };
  }

  private createValue(value: string | number | boolean | null | CoreLevel): ValueNode {
    if (value === null) {
      return { kind: "NullValue", value: null };
    }
    if (typeof value === "boolean") {
      return { kind: "BooleanValue", value };
    }
    if (typeof value === "number") {
      return { kind: "NumberValue", value };
    }
    if (value === "L1" || value === "L2" || value === "L3" || value === "L4" || value === "L5") {
      return this.createLevel(value);
    }
    return this.createString(value);
  }

  private createFields(fieldsMap: Record<string, string | number | boolean | null | CoreLevel>): FieldNode[] {
    return Object.entries(fieldsMap).map(([name, value]) => ({
      kind: "Field",
      name,
      value: this.createValue(value)
    }));
  }

  entity(name: string, options: { kind: string; level: CoreLevel; value: string; [key: string]: any }): this {
    this.definedEntities.add(name);
    const fieldsMap: Record<string, any> = {
      kind: options.kind,
      level: options.level,
      value: options.value,
    };
    for (const [k, v] of Object.entries(options)) {
      if (k === "kind" || k === "level" || k === "value") {
        continue;
      }
      fieldsMap[k] = v;
    }

    const node: DefineEntityNode = {
      kind: "DefineEntity",
      name: this.createId(name),
      entityKind: this.createId(options.kind),
      level: this.createLevel(options.level),
      fields: this.createFields(fieldsMap)
    };
    this.statements.push(node);
    return this;
  }

  relate(source: string, target: string, options: { kind: string; operation: string; [key: string]: any }): this {
    this.validationChecks.push(() => {
      if (!this.definedEntities.has(source)) {
        throw new Error(`Entity "${source}" is not defined. Cannot establish relationship to "${target}".`);
      }
      if (!this.definedEntities.has(target)) {
        throw new Error(`Entity "${target}" is not defined. Cannot establish relationship from "${source}".`);
      }
    });

    const fieldsMap: Record<string, any> = {
      kind: options.kind,
      operation: options.operation
    };
    for (const [k, v] of Object.entries(options)) {
      if (k === "kind" || k === "operation") {
        continue;
      }
      fieldsMap[k] = v;
    }

    const node: RelateNode = {
      kind: "Relate",
      source: this.createId(source),
      relation: this.createId(options.kind),
      target: this.createId(target),
      fields: this.createFields(fieldsMap)
    };
    this.statements.push(node);
    return this;
  }

  resolve(target: string, level: CoreLevel, options?: { operation?: string; reason?: string }): this {
    this.validationChecks.push(() => {
      if (!this.definedEntities.has(target)) {
        throw new Error(`Entity "${target}" is not defined. Cannot resolve target.`);
      }
    });

    const fieldsMap: Record<string, any> = {};
    if (options?.operation) {
      fieldsMap.operation = options.operation;
    }
    if (options?.reason) {
      fieldsMap.reason = options.reason;
    }

    const node: ResolveNode = {
      kind: "Resolve",
      target: this.createId(target),
      to: this.createLevel(level),
      fields: this.createFields(fieldsMap)
    };
    this.statements.push(node);
    return this;
  }

  constrain(target: string, operation: string): this {
    this.validationChecks.push(() => {
      if (!this.definedEntities.has(target)) {
        throw new Error(`Entity "${target}" is not defined. Cannot apply constraint.`);
      }
    });

    const node: ConstrainNode = {
      kind: "Constrain",
      target: this.createId(target),
      fields: this.createFields({ target, operation })
    };
    this.statements.push(node);
    return this;
  }

  emit(target: string, kind: string, asName?: string): this {
    this.validationChecks.push(() => {
      if (!this.definedEntities.has(target)) {
        throw new Error(`Entity "${target}" is not defined. Cannot emit target.`);
      }
    });

    const node: EmitNode = {
      kind: "Emit",
      target: this.createId(target),
      as: asName ? this.createId(asName) : undefined,
      fields: this.createFields({ target, kind })
    };
    this.statements.push(node);
    return this;
  }

  build(options?: { skipValidation?: boolean }): ProgramNode {
    if (!options?.skipValidation) {
      for (const check of this.validationChecks) {
        check();
      }
    }
    return {
      kind: "Program",
      statements: this.statements
    };
  }
}

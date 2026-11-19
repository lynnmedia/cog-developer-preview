export class CogProgramBuilder {
  protected lines: string[] = [];
  protected definedEntities = new Set<string>();
  protected validationChecks: Array<() => void> = [];

  entity(name: string, options: { kind: string; level: string; value: string; [key: string]: any }): this {
    this.definedEntities.add(name);
    this.lines.push(`define entity "${name}" {`);
    this.lines.push(`  kind: "${options.kind}"`);
    this.lines.push(`  level: ${options.level}`);
    this.lines.push(`  value: "${options.value}"`);

    for (const [k, v] of Object.entries(options)) {
      if (k === "kind" || k === "level" || k === "value") {
        continue;
      }
      const valStr = typeof v === "string" ? `"${v}"` : String(v);
      this.lines.push(`  ${k}: ${valStr}`);
    }

    this.lines.push(`}`);
    this.lines.push(``);
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

    this.lines.push(`relate "${source}" -> "${target}" {`);
    this.lines.push(`  kind: "${options.kind}"`);
    this.lines.push(`  operation: "${options.operation}"`);

    for (const [k, v] of Object.entries(options)) {
      if (k === "kind" || k === "operation") {
        continue;
      }
      const valStr = typeof v === "string" ? `"${v}"` : String(v);
      this.lines.push(`  ${k}: ${valStr}`);
    }

    this.lines.push(`}`);
    this.lines.push(``);
    return this;
  }

  resolve(target: string, level: string, options?: { operation?: string; reason?: string }): this {
    this.validationChecks.push(() => {
      if (!this.definedEntities.has(target)) {
        throw new Error(`Entity "${target}" is not defined. Cannot resolve target.`);
      }
    });

    this.lines.push(`resolve "${target}" to ${level} {`);
    if (options?.operation) {
      this.lines.push(`  operation: "${options.operation}"`);
    }
    if (options?.reason) {
      this.lines.push(`  reason: "${options.reason}"`);
    }
    this.lines.push(`}`);
    this.lines.push(``);
    return this;
  }

  constrain(target: string, operation: string): this {
    this.validationChecks.push(() => {
      if (!this.definedEntities.has(target)) {
        throw new Error(`Entity "${target}" is not defined. Cannot apply constraint.`);
      }
    });

    this.lines.push(`constrain {`);
    this.lines.push(`  target: "${target}"`);
    this.lines.push(`  operation: "${operation}"`);
    this.lines.push(`}`);
    this.lines.push(``);
    return this;
  }

  emit(target: string, kind: string, asName?: string): this {
    this.validationChecks.push(() => {
      if (!this.definedEntities.has(target)) {
        throw new Error(`Entity "${target}" is not defined. Cannot emit target.`);
      }
    });

    this.lines.push(`emit {`);
    this.lines.push(`  target: "${target}"`);
    this.lines.push(`  kind: "${kind}"`);
    if (asName) {
      this.lines.push(`  as: "${asName}"`);
    }
    this.lines.push(`}`);
    this.lines.push(``);
    return this;
  }

  build(options?: { skipValidation?: boolean }): string {
    if (!options?.skipValidation) {
      for (const check of this.validationChecks) {
        check();
      }
    }
    return this.lines.join("\n").trim();
  }
}

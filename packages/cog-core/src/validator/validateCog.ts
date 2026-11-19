import type { CogDomainAdapter } from "../types/adapter";
import type { CoreExecutionContext } from "../types/context";
import type { CoreIR } from "../types/ir";
import type { CoreValidationIssue, CoreValidationReport } from "../types/validation";
import type { CoreLevel } from "../types/values";
import { COG_RESOURCE_LIMITS } from "../types/limits";

const CORE_REF_PATTERN = /^[A-Za-z0-9._:-]+$/;
const CORE_LEVELS = new Set<CoreLevel>(["L1", "L2", "L3", "L4", "L5"]);

const DEFAULT_CONTEXT: CoreExecutionContext = {
  runId: "validation-only",
  mode: "batch",
  startedAt: new Date(0).toISOString(),
};

export async function validateCog(
  ir: CoreIR,
  options: {
    context?: CoreExecutionContext;
    adapter?: CogDomainAdapter;
  } = {},
): Promise<CoreValidationReport> {
  const issues: CoreValidationIssue[] = [];
  const context = options.context ?? DEFAULT_CONTEXT;
  const entityRefs = new Set<string>();

  if (ir.entities.length > COG_RESOURCE_LIMITS.MAX_ENTITY_COUNT) {
    issues.push({
      code: "limit_exceeded",
      severity: "error",
      message: `Entity count (${ir.entities.length}) exceeds resource limit of ${COG_RESOURCE_LIMITS.MAX_ENTITY_COUNT}.`,
    });
  }

  for (const entity of ir.entities) {
    entityRefs.add(entity.id);
    entityRefs.add(entity.name);
  }

  for (const relation of ir.relations) {
    if (!relation.relationKind) {
      issues.push({
        code: "missing_relation_kind",
        severity: "error",
        message: `Relation "${relation.id}" is missing relation kind.`,
        ref: relation.id,
      });
    }

    if (!relation.sourceRef || !entityRefs.has(relation.sourceRef)) {
      issues.push({
        code: "missing_relation_source_entity",
        severity: "error",
        message: `Relation "${relation.id}" references missing source entity "${relation.sourceRef}".`,
        ref: relation.id,
      });
    }

    if (!relation.targetRef || !entityRefs.has(relation.targetRef)) {
      issues.push({
        code: "missing_relation_target_entity",
        severity: "error",
        message: `Relation "${relation.id}" references missing target entity "${relation.targetRef}".`,
        ref: relation.id,
      });
    }

    validateRef(issues, relation.sourceRef, relation.id, "relation.sourceRef");
    validateRef(issues, relation.targetRef, relation.id, "relation.targetRef");
  }

  for (const view of ir.views) {
    if (!view.alias && !view.viewKind) {
      issues.push({
        code: "missing_view_perspective",
        severity: "error",
        message: `View "${view.id}" is missing perspective identifier.`,
        ref: view.id,
      });
    }

    if (!view.targetRef || !entityRefs.has(view.targetRef)) {
      issues.push({
        code: "missing_view_target",
        severity: "error",
        message: `View "${view.id}" references missing target "${view.targetRef}".`,
        ref: view.id,
      });
    }
    validateRef(issues, view.targetRef, view.id, "view.targetRef");
  }

  for (const resolution of ir.resolutions) {
    if (!resolution.targetRef || !entityRefs.has(resolution.targetRef)) {
      issues.push({
        code: "missing_resolution_target",
        severity: "error",
        message: `Resolution "${resolution.id}" references missing target "${resolution.targetRef}".`,
        ref: resolution.id,
      });
    }

    const level = resolution.level ?? resolution.value;

    if (level === undefined) {
      issues.push({
        code: "missing_resolution_level",
        severity: "error",
        message: `Resolution "${resolution.id}" is missing level value.`,
        ref: resolution.id,
      });
    } else if (!isCoreLevelValue(level)) {
      issues.push({
        code: "invalid_resolution_level",
        severity: "error",
        message: `Resolution "${resolution.id}" has invalid level "${String(level)}".`,
        ref: resolution.id,
      });
    }

    validateRef(issues, resolution.targetRef, resolution.id, "resolution.targetRef");
    if (resolution.resolutionRef) {
      validateRef(issues, resolution.resolutionRef, resolution.id, "resolution.resolutionRef");
    }
  }

  for (const transformation of ir.transformations) {
    if (!transformation.targetRef || !entityRefs.has(transformation.targetRef)) {
      issues.push({
        code: "missing_transform_target",
        severity: "error",
        message: `Transformation "${transformation.id}" references missing target "${transformation.targetRef}".`,
        ref: transformation.id,
      });
    }

    validateRef(issues, transformation.targetRef, transformation.id, "transform.targetRef");
    validateRef(issues, transformation.transformRef, transformation.id, "transform.transformRef");
  }

  for (const constraint of ir.constraints) {
    if (!constraint.targetRef || !entityRefs.has(constraint.targetRef)) {
      issues.push({
        code: "missing_constraint_target",
        severity: "error",
        message: `Constraint "${constraint.id}" references missing target "${constraint.targetRef}".`,
        ref: constraint.id,
      });
    }

    validateRef(issues, constraint.targetRef, constraint.id, "constraint.targetRef");
  }

  for (const emission of ir.emissions) {
    validateRef(issues, emission.targetRef, emission.id, "emit.targetRef");
  }

  if (options.adapter?.validateProgram) {
    const adapterResult = await options.adapter.validateProgram(ir, context);
    issues.push(...adapterResult.issues);
  }

  return buildReport(issues);
}

function validateRef(
  issues: CoreValidationIssue[],
  ref: string | undefined,
  issueRef: string,
  path: string,
): void {
  if (!ref || CORE_REF_PATTERN.test(ref)) {
    return;
  }

  issues.push({
    code: "malformed_core_ref",
    severity: "error",
    message: `Malformed core reference "${ref}" in ${path}.`,
    ref: issueRef,
    path,
  });
}

function buildReport(issues: CoreValidationIssue[]): CoreValidationReport {
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;

  return {
    valid: errorCount === 0,
    issues,
    errorCount,
    warningCount,
  };
}

function isCoreLevelValue(value: unknown): value is CoreLevel {
  return typeof value === "string" && CORE_LEVELS.has(value as CoreLevel);
}

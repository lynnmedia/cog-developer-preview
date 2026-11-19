import type { CogDomainAdapter } from "../types/adapter";
import type { CoreExecutionContext } from "../types/context";
import type { CoreExecutionPlan, CoreExecutionStep } from "../types/execution";
import type { CoreIR } from "../types/ir";

const DEFAULT_CONTEXT: CoreExecutionContext = {
  runId: "plan-only",
  mode: "batch",
  startedAt: new Date(0).toISOString(),
};

export async function planCog(
  ir: CoreIR,
  options: {
    context?: CoreExecutionContext;
    adapter?: CogDomainAdapter;
  } = {},
): Promise<CoreExecutionPlan> {
  const steps: CoreExecutionStep[] = [];
  const entityBindStepByRef = new Map<string, string>();
  const targetPreparationStepIdsByRef = new Map<string, string[]>();
  let counter = 0;

  const pushStep = (step: Omit<CoreExecutionStep, "id" | "status">): CoreExecutionStep => {
    counter += 1;
    const executionStep: CoreExecutionStep = {
      id: `step-${counter}`,
      status: "PENDING",
      ...step,
      dependsOn: dedupe(step.dependsOn ?? []),
    };
    steps.push(executionStep);
    return executionStep;
  };

  for (const entity of ir.entities) {
    const step = pushStep({
      phase: "bind",
      targetKind: "entity",
      targetId: entity.id,
      targetRef: entity.name,
    });
    entityBindStepByRef.set(entity.name, step.id);
    entityBindStepByRef.set(entity.id, step.id);
    recordTargetPreparation(targetPreparationStepIdsByRef, entity.name, step.id);
    recordTargetPreparation(targetPreparationStepIdsByRef, entity.id, step.id);
  }

  for (const relation of ir.relations) {
    const step = pushStep({
      phase: "bind",
      targetKind: "relation",
      targetId: relation.id,
      targetRef: relation.id,
      inputRefs: [relation.sourceRef, relation.targetRef],
      dependsOn: collectEntityBindDependencies(entityBindStepByRef, [
        relation.sourceRef,
        relation.targetRef,
      ]),
    });
    recordTargetPreparation(targetPreparationStepIdsByRef, relation.id, step.id);
    recordTargetPreparation(targetPreparationStepIdsByRef, relation.sourceRef, step.id);
    recordTargetPreparation(targetPreparationStepIdsByRef, relation.targetRef, step.id);
  }

  for (const view of ir.views) {
    const step = pushStep({
      phase: "bind",
      targetKind: "view",
      targetId: view.id,
      targetRef: view.targetRef,
      dependsOn: collectEntityBindDependencies(entityBindStepByRef, [view.targetRef]),
    });
    recordTargetPreparation(targetPreparationStepIdsByRef, view.targetRef, step.id);
  }

  for (const resolution of ir.resolutions) {
    const step = pushStep({
      phase: "bind",
      targetKind: "resolution",
      targetId: resolution.id,
      targetRef: resolution.targetRef,
      dependsOn: collectEntityBindDependencies(entityBindStepByRef, [resolution.targetRef]),
      metadata: {
        level: resolution.level,
        status: resolution.attributes?.status,
      },
    });
    recordTargetPreparation(targetPreparationStepIdsByRef, resolution.targetRef, step.id);
  }

  for (const constraint of ir.constraints) {
    const step = pushStep({
      phase: "bind",
      targetKind: "constraint",
      targetId: constraint.id,
      targetRef: constraint.targetRef,
      dependsOn: collectEntityBindDependencies(entityBindStepByRef, [constraint.targetRef]),
    });
    recordTargetPreparation(targetPreparationStepIdsByRef, constraint.targetRef, step.id);
  }

  for (const transformation of ir.transformations) {
    const step = pushStep({
      phase: "transform",
      targetKind: "transform",
      targetId: transformation.id,
      targetRef: transformation.targetRef,
      dependsOn: collectEntityBindDependencies(entityBindStepByRef, [transformation.targetRef]),
      metadata: {
        transformRef: transformation.transformRef,
      },
    });
    recordTargetPreparation(targetPreparationStepIdsByRef, transformation.targetRef, step.id);
  }

  const validateStep = pushStep({
    phase: "validate",
    targetKind: "program",
    targetId: "program",
    dependsOn: steps.map((step) => step.id),
  });

  for (const emission of ir.emissions) {
    pushStep({
      phase: "emit",
      targetKind: "emit",
      targetId: emission.id,
      targetRef: emission.targetRef,
      dependsOn: [
        ...collectTargetPreparationDependencies(targetPreparationStepIdsByRef, emission.targetRef),
        validateStep.id,
      ],
      metadata: {
        emissionKind: emission.emissionKind,
      },
    });
  }

  const basePlan: CoreExecutionPlan = {
    id: `plan-${(options.context ?? DEFAULT_CONTEXT).runId}`,
    createdAt: new Date().toISOString(),
    adapterId: options.adapter?.adapterId,
    steps,
  };

  if (!options.adapter?.enrichPlan) {
    return basePlan;
  }

  return options.adapter.enrichPlan(basePlan, ir, options.context ?? DEFAULT_CONTEXT);
}

function collectEntityBindDependencies(
  entityBindStepByRef: Map<string, string>,
  refs: string[],
): string[] {
  return dedupe(refs.flatMap((ref) => entityBindStepByRef.get(ref) ?? []));
}

function collectTargetPreparationDependencies(
  targetPreparationStepIdsByRef: Map<string, string[]>,
  ref: string,
): string[] {
  return dedupe(targetPreparationStepIdsByRef.get(ref) ?? []);
}

function recordTargetPreparation(
  targetPreparationStepIdsByRef: Map<string, string[]>,
  ref: string,
  stepId: string,
): void {
  const existing = targetPreparationStepIdsByRef.get(ref) ?? [];
  targetPreparationStepIdsByRef.set(ref, dedupe([...existing, stepId]));
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

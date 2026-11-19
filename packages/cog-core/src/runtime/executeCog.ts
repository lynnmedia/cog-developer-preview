import type { CogDomainAdapter, DomainTrace } from "../types/adapter";
import type { CoreExecutionContext, ObjectRef } from "../types/context";
import { COG_RESOURCE_LIMITS } from "../types/limits";
import type {
  CoreExecutionPlan,
  CoreExecutionResult,
  CoreExecutionStep,
  DomainEmissionSpec,
} from "../types/execution";
import type { CoreEmission, CoreIR, CoreRelation, CoreView } from "../types/ir";
import type { CoreExecutionTrace, CoreExecutionTraceStep } from "../types/trace";
import { planCog } from "../planner/planCog";
import { validateCog } from "../validator/validateCog";

export async function executeCog(
  ir: CoreIR,
  context: CoreExecutionContext,
  adapter?: CogDomainAdapter,
): Promise<CoreExecutionResult> {
  const validation = await validateCog(ir, { context, adapter });
  const plan = await planCog(ir, { context, adapter });
  const bindings = createInitialBindings(ir, context);
  const emissions: DomainEmissionSpec[] = [];
  const errors: string[] = [];
  const traceSteps: CoreExecutionTraceStep[] = [];
  const traceStartedAt = new Date().toISOString();

  if (!validation.valid) {
    for (const step of plan.steps) {
      traceSteps.push(createTraceStep(step, step.phase === "validate" ? "FAILED" : "SKIPPED"));
    }

    return {
      success: false,
      adapterId: adapter?.adapterId,
      validation,
      plan,
      emissions,
      trace: finalizeTrace(context.runId, adapter?.adapterId, traceStartedAt, traceSteps),
      bindings,
      errors,
    };
  }

  let orderedSteps: CoreExecutionStep[];
  try {
    orderedSteps = orderExecutionGraph(plan);
    if (orderedSteps.length > COG_RESOURCE_LIMITS.MAX_EXECUTION_STEPS) {
      throw new Error(`Execution steps count (${orderedSteps.length}) exceeds resource limit of ${COG_RESOURCE_LIMITS.MAX_EXECUTION_STEPS}.`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(message);
    for (const step of plan.steps) {
      traceSteps.push(createTraceStep(step, "SKIPPED", message));
    }

    return {
      success: false,
      adapterId: adapter?.adapterId,
      validation,
      plan,
      emissions,
      trace: finalizeTrace(context.runId, adapter?.adapterId, traceStartedAt, traceSteps),
      bindings,
      errors,
    };
  }

  for (const step of orderedSteps) {
    try {
      const traceStep = await runStep(step, ir, context, adapter, bindings, emissions);
      traceSteps.push(traceStep);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
      traceSteps.push(
        createTraceStep(step, "FAILED", message, {
          error: message,
        }),
      );
      markRemainingStepsAsSkipped(orderedSteps, step.id, traceSteps);
      break;
    }
  }

  return {
    success: errors.length === 0,
    adapterId: adapter?.adapterId,
    validation,
    plan,
    emissions,
    trace: finalizeTrace(context.runId, adapter?.adapterId, traceStartedAt, traceSteps),
    bindings,
    errors,
  };
}

async function runStep(
  step: CoreExecutionStep,
  ir: CoreIR,
  context: CoreExecutionContext,
  adapter: CogDomainAdapter | undefined,
  bindings: Record<string, ObjectRef>,
  emissions: DomainEmissionSpec[],
): Promise<CoreExecutionTraceStep> {
  const data: Record<string, unknown> = {};

  switch (step.phase) {
    case "bind":
      if (step.targetRef) {
        await bindRef(step.targetRef, bindings, context, adapter);
      }
      data.bindingCount = Object.keys(bindings).length;
      break;
    case "transform":
      data.transformRef = step.metadata?.transformRef;
      break;
    case "validate":
      data.validated = true;
      break;
    case "emit": {
      const emission = ir.emissions.find((item) => item.id === step.targetId);
      if (!emission) {
        throw new Error(`Missing emission for step "${step.id}".`);
      }
      const mapped = await mapEmission(emission, ir, context, adapter);
      emissions.push(...mapped);
      data.emissionCount = mapped.length;
      break;
    }
    default:
      throw new Error(`Unhandled execution phase "${step.phase}".`);
  }

  const domainTrace = await createDomainTrace(step, ir, context, adapter);

  return createTraceStep(step, "SUCCEEDED", undefined, data, domainTrace);
}

async function bindRef(
  ref: string,
  bindings: Record<string, ObjectRef>,
  context: CoreExecutionContext,
  adapter?: CogDomainAdapter,
): Promise<void> {
  if (bindings[ref]) {
    return;
  }

  const reference = {
    ref,
    origin: "adapter" as const,
  };
  const loaded = adapter?.resolveExternalRef
    ? await adapter.resolveExternalRef(reference, context)
    : await adapter?.loadCanonicalRef?.(reference, context);

  if (loaded) {
    bindings[ref] = loaded;
  }
}

function orderExecutionGraph(plan: CoreExecutionPlan): CoreExecutionStep[] {
  const stepIds = new Set<string>();

  for (const step of plan.steps) {
    if (stepIds.has(step.id)) {
      throw new Error(`Invalid execution graph: duplicate step id "${step.id}".`);
    }
    stepIds.add(step.id);
  }

  for (const step of plan.steps) {
    for (const dependencyId of step.dependsOn ?? []) {
      if (dependencyId === step.id) {
        throw new Error(`Invalid execution graph: step "${step.id}" depends on itself.`);
      }
      if (!stepIds.has(dependencyId)) {
        throw new Error(
          `Invalid execution graph: step "${step.id}" depends on missing step "${dependencyId}".`,
        );
      }
    }
  }

  const remaining = new Set(stepIds);
  const completed = new Set<string>();
  const ordered: CoreExecutionStep[] = [];

  while (remaining.size > 0) {
    let progressed = false;

    for (const step of plan.steps) {
      if (!remaining.has(step.id)) {
        continue;
      }
      if (!(step.dependsOn ?? []).every((dependencyId) => completed.has(dependencyId))) {
        continue;
      }

      remaining.delete(step.id);
      completed.add(step.id);
      ordered.push(step);
      progressed = true;
    }

    if (!progressed) {
      throw new Error(
        `Invalid execution graph: dependency cycle or unresolved dependency involving ${[
          ...remaining,
        ].join(", ")}.`,
      );
    }
  }

  return ordered;
}

async function mapEmission(
  emission: CoreEmission,
  ir: CoreIR,
  context: CoreExecutionContext,
  adapter?: CogDomainAdapter,
): Promise<DomainEmissionSpec[]> {
  const targetEntity = ir.entities.find(
    (candidate) => candidate.name === emission.targetRef || candidate.id === emission.targetRef,
  );
  const targetLevel = targetEntity?.level;
  const mappedLevel = targetLevel && adapter?.mapLevel ? adapter.mapLevel(targetLevel) : undefined;
  const views = collectViewsForTarget(emission.targetRef, ir.views, adapter);
  const relations = collectRelationsForTarget(emission.targetRef, ir.relations, adapter);

  if (!adapter?.mapEmission) {
    return [
      {
        emissionId: emission.id,
        adapterId: adapter?.adapterId,
        target: emission.targetRef,
        kind: emission.emissionKind,
        payload: {
          targetRef: emission.targetRef,
          targetLevel,
          mappedLevel,
          views,
          relations,
          attributes: emission.attributes,
        },
      },
    ];
  }

  const mapped = await adapter.mapEmission(emission, ir, context);

  if (!mapped) {
    return [];
  }

  return (Array.isArray(mapped) ? mapped : [mapped]).map((item) => ({
    ...item,
    payload: {
      ...item.payload,
      targetLevel,
      mappedLevel,
      views,
      relations,
    },
  }));
}

function collectViewsForTarget(
  targetRef: string,
  views: CoreView[],
  adapter?: CogDomainAdapter,
): Array<{ id: string; targetRef: string; viewKind: string; mappedViewKind?: string; alias?: string }> {
  return views
    .filter((view) => view.targetRef === targetRef)
    .map((view) => ({
      id: view.id,
      targetRef: view.targetRef,
      viewKind: view.viewKind,
      mappedViewKind: view.viewKind && adapter?.mapViewKind ? adapter.mapViewKind(view.viewKind) : undefined,
      alias: view.alias,
    }));
}

function collectRelationsForTarget(
  targetRef: string,
  relations: CoreRelation[],
  adapter?: CogDomainAdapter,
): Array<{ id: string; sourceRef: string; targetRef: string; relationKind: string; mappedRelationKind?: string; attributes: Record<string, unknown> }> {
  return relations
    .filter((rel) => rel.sourceRef === targetRef || rel.targetRef === targetRef)
    .map((rel) => ({
      id: rel.id,
      sourceRef: rel.sourceRef,
      targetRef: rel.targetRef,
      relationKind: rel.relationKind,
      mappedRelationKind: rel.relationKind && adapter?.mapRelationKind ? adapter.mapRelationKind(rel.relationKind) : undefined,
      attributes: rel.attributes,
    }));
}

function createInitialBindings(
  ir: CoreIR,
  context: CoreExecutionContext,
): Record<string, ObjectRef> {
  const bindings: Record<string, ObjectRef> = {
    ...(context.refs ?? {}),
  };

  for (const entity of ir.entities) {
    const binding: ObjectRef = {
      ref: entity.id,
      kind: entity.entityKind,
      origin: "compiled",
    };
    bindings[entity.name] = binding;
    bindings[entity.id] = binding;
  }

  return bindings;
}

async function createDomainTrace(
  step: CoreExecutionStep,
  ir: CoreIR,
  context: CoreExecutionContext,
  adapter?: CogDomainAdapter,
): Promise<DomainTrace[] | undefined> {
  if (!adapter?.createDomainTrace) {
    return undefined;
  }

  const trace = await adapter.createDomainTrace(step, ir, context);

  if (!trace) {
    return undefined;
  }

  return Array.isArray(trace) ? trace : [trace];
}

function createTraceStep(
  step: CoreExecutionStep,
  status: CoreExecutionTraceStep["status"],
  message?: string,
  data?: Record<string, unknown>,
  domainTrace?: DomainTrace[],
): CoreExecutionTraceStep {
  const now = new Date().toISOString();

  return {
    stepId: step.id,
    phase: step.phase,
    status,
    startedAt: now,
    completedAt: now,
    message,
    data,
    domainTrace,
  };
}

function finalizeTrace(
  runId: string,
  adapterId: string | undefined,
  startedAt: string,
  steps: CoreExecutionTraceStep[],
): CoreExecutionTrace {
  return {
    runId,
    adapterId,
    startedAt,
    completedAt: new Date().toISOString(),
    steps,
  };
}

function markRemainingStepsAsSkipped(
  steps: CoreExecutionStep[],
  failedStepId: string,
  traceSteps: CoreExecutionTraceStep[],
): void {
  const failedIndex = steps.findIndex((step) => step.id === failedStepId);

  for (const step of steps.slice(failedIndex + 1)) {
    traceSteps.push(createTraceStep(step, "SKIPPED"));
  }
}

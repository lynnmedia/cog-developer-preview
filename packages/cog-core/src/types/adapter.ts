import type { CoreExecutionContext, ObjectRef } from "./context";
import type { CoreExecutionPlan, CoreExecutionStep, DomainEmissionSpec } from "./execution";
import type { CoreEmission, CoreIR } from "./ir";
import type { CoreValidationIssue } from "./validation";
import type { CoreLevel } from "./values";

export interface AdapterValidationResult {
  issues: CoreValidationIssue[];
}

export interface DomainTrace {
  adapterId: string;
  stepId?: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface CogDomainAdapter {
  adapterId: string;
  version: string;
  mapEntityKind?(kind: string): string;
  mapRelationKind?(kind: string): string;
  mapViewKind?(kind: string): string;
  mapResolutionKind?(kind: string): string;
  mapTransformationKind?(kind: string): string;
  mapConstraintKind?(kind: string): string;
  mapEmissionKind?(kind: string): string;
  mapLevel?(level: CoreLevel): string;
  validateProgram?(
    ir: CoreIR,
    context: CoreExecutionContext,
  ): AdapterValidationResult | Promise<AdapterValidationResult>;
  enrichPlan?(
    plan: CoreExecutionPlan,
    ir: CoreIR,
    context: CoreExecutionContext,
  ): CoreExecutionPlan | Promise<CoreExecutionPlan>;
  mapEmission?(
    emission: CoreEmission,
    ir: CoreIR,
    context: CoreExecutionContext,
  ):
    | DomainEmissionSpec
    | DomainEmissionSpec[]
    | null
    | undefined
    | Promise<DomainEmissionSpec | DomainEmissionSpec[] | null | undefined>;
  resolveExternalRef?(
    ref: ObjectRef,
    context: CoreExecutionContext,
  ): ObjectRef | null | undefined | Promise<ObjectRef | null | undefined>;
  /**
   * @deprecated Use resolveExternalRef for neutral adapter-side reference resolution.
   */
  loadCanonicalRef?(
    ref: ObjectRef,
    context: CoreExecutionContext,
  ): ObjectRef | null | undefined | Promise<ObjectRef | null | undefined>;
  createDomainTrace?(
    step: CoreExecutionStep,
    ir: CoreIR,
    context: CoreExecutionContext,
  ): DomainTrace | DomainTrace[] | null | undefined | Promise<DomainTrace | DomainTrace[] | null | undefined>;
}

import type { CogDomainAdapter, CoreEmission, DomainEmissionSpec } from "@cog/core";
import type { CoreExecutionContext, CoreIR } from "@cog/core";

export const decisionAdapter: CogDomainAdapter = {
  adapterId: "decision",
  version: "0.3.0",
  mapRelationKind(kind) {
    return `decision:${kind}`;
  },
  mapViewKind(kind) {
    return `decision:${kind}`;
  },
  async mapEmission(
    emission: CoreEmission,
    _ir: CoreIR,
    _context: CoreExecutionContext,
  ): Promise<DomainEmissionSpec> {
    return {
      emissionId: emission.id,
      adapterId: "decision",
      target: `decision:${emission.emissionKind}`,
      kind: emission.emissionKind,
      payload: {
        targetRef: emission.targetRef,
        attributes: emission.attributes,
      },
    };
  },
  async enrichPlan(plan) {
    const emitIdx = plan.steps.findIndex((s) => s.phase === "emit");
    const steps = [...plan.steps];
    const newStep = {
      id: "step-decision-verify",
      phase: "validate" as const,
      targetKind: "decision-verify",
      status: "PENDING" as const,
    };
    if (emitIdx !== -1) {
      steps.splice(emitIdx, 0, newStep);
    } else {
      steps.push(newStep);
    }
    return {
      ...plan,
      steps,
    };
  },
};

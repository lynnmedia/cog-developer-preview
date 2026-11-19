import type { CogDomainAdapter, CoreEmission, CoreLevel, DomainEmissionSpec } from "@cog/core";
import type { CoreExecutionContext, CoreIR } from "@cog/core";

const LEVEL_MAP: Record<CoreLevel, string> = {
  L1: "R1",
  L2: "R2",
  L3: "R3",
  L4: "R4",
  L5: "R5",
};

export const momAdapter: CogDomainAdapter = {
  adapterId: "mom",
  version: "0.3.0",
  mapLevel(level) {
    return LEVEL_MAP[level];
  },
  mapRelationKind(kind) {
    return `mom:${kind}`;
  },
  mapViewKind(kind) {
    return `mom:${kind}`;
  },
  async validateProgram() {
    return {
      issues: [],
    };
  },
  async enrichPlan(plan) {
    const emitIdx = plan.steps.findIndex((s) => s.phase === "emit");
    const steps = [...plan.steps];
    const newStep = {
      id: "step-mom-verify",
      phase: "validate" as const,
      targetKind: "mom-verify",
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
  async mapEmission(
    emission: CoreEmission,
    ir: CoreIR,
    _context: CoreExecutionContext,
  ): Promise<DomainEmissionSpec> {
    const entity = ir.entities.find((candidate) => candidate.name === emission.targetRef || candidate.id === emission.targetRef);
    const level = entity?.level ? LEVEL_MAP[entity.level] : undefined;

    return {
      emissionId: emission.id,
      adapterId: "mom",
      target: `mom:${emission.emissionKind}`,
      kind: emission.emissionKind,
      payload: {
        targetRef: emission.targetRef,
        mappedLevel: level,
        attributes: emission.attributes,
      },
    };
  },
};

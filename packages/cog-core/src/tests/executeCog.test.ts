import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  compileCog,
  type DomainEmissionSpec,
  executeCog,
  lex,
  parseCog,
  validateCog,
  type CogDomainAdapter,
  type CoreExecutionContext,
  type ProgramNode,
} from "../index";
import { momAdapter } from "../../../cog-adapter-mom/src/momAdapter";
import { decisionAdapter } from "../../../cog-adapter-decision/src/decisionAdapter";

const baseContext: CoreExecutionContext = {
  runId: "execute-test",
  mode: "hybrid",
  startedAt: new Date(0).toISOString(),
};

test("executeCog runs without an adapter", async () => {
  const program: ProgramNode = {
    kind: "Program",
    statements: [
      {
        kind: "DefineEntity",
        name: { kind: "IdentifierValue", name: "case" },
        fields: [],
      },
      {
        kind: "Emit",
        target: { kind: "IdentifierValue", name: "case" },
        as: { kind: "IdentifierValue", name: "summary" },
        fields: [],
      },
    ],
  };

  const result = await executeCog(compileCog(program), baseContext);

  assert.equal(result.success, true);
  assert.equal(result.emissions.length, 1);
  assert.equal(result.emissions[0]?.target, "case");
  assert.equal(result.emissions[0]?.payload.targetLevel, undefined);
  assert.equal(result.emissions[0]?.payload.mappedLevel, undefined);
  assert.equal(result.trace.steps.at(-1)?.phase, "emit");
});

test("source pipeline executes without an adapter", async () => {
  const source = `
define entity "case" {
  kind: record
}

transform {
  from: conceptual
  to: actionable
  target: "case"
}

emit {
  kind: summary
}
`.trim();

  const ir = compileCog(parseCog(lex(source)));
  const validation = await validateCog(ir);
  const result = await executeCog(ir, {
    ...baseContext,
    runId: "execute-source-no-adapter",
  });

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(result.validation.valid, true);
  assert.equal(result.plan.steps.length, 4);
  assert.equal(result.trace.steps.length, 4);
  assert.equal(result.emissions.length, 1);
  assert.equal(result.emissions[0]?.kind, "summary");
  assert.equal(result.emissions[0]?.target, "case");
  assert.equal(result.emissions[0]?.payload.targetLevel, undefined);
  assert.equal(result.emissions[0]?.payload.mappedLevel, undefined);
});

test("executeCog runs with the MoM adapter outside core", async () => {
  const program: ProgramNode = {
    kind: "Program",
    statements: [
      {
        kind: "DefineEntity",
        name: { kind: "IdentifierValue", name: "signal" },
        level: { kind: "LevelValue", value: "L3" },
        fields: [],
      },
      {
        kind: "Emit",
        target: { kind: "IdentifierValue", name: "signal" },
        as: { kind: "IdentifierValue", name: "brief" },
        fields: [],
      },
    ],
  };

  const result = await executeCog(
    compileCog(program),
    {
      ...baseContext,
      runId: "execute-mom-test",
    },
    momAdapter,
  );

  assert.equal(result.success, true);
  assert.equal(result.adapterId, "mom");
  assert.equal(result.emissions.length, 1);
  assert.equal(result.emissions[0]?.target, "mom:brief");
  assert.equal(result.emissions[0]?.adapterId, "mom");
  assert.equal(result.emissions[0]?.payload.targetLevel, "L3");
  assert.equal(result.emissions[0]?.payload.mappedLevel, "R3");
});

test("executeCog exercises adapter validation and mapEmission hooks", async () => {
  const adapter: CogDomainAdapter = {
    adapterId: "hook-proof",
    version: "0.1.0",
    validateProgram: () => ({
      issues: [
        {
          code: "adapter_notice",
          severity: "warning",
          message: "Adapter warning carried into execution validation",
          adapterId: "hook-proof",
        },
      ],
    }),
    mapEmission: (emission): DomainEmissionSpec => ({
      emissionId: emission.id,
      adapterId: "hook-proof",
      target: `hook:${emission.emissionKind}`,
      kind: emission.emissionKind,
      payload: {
        targetRef: emission.targetRef,
        via: "mapEmission",
      },
    }),
  };

  const source = `
define entity "signal" {
  kind: record
}

emit {
  kind: digest
}
`.trim();

  const result = await executeCog(
    compileCog(parseCog(lex(source))),
    {
      ...baseContext,
      runId: "execute-hook-proof",
    },
    adapter,
  );

  assert.equal(result.success, true);
  assert.equal(result.adapterId, "hook-proof");
  assert.equal(result.validation.valid, true);
  assert.equal(result.validation.warningCount, 1);
  assert.equal(result.validation.issues[0]?.code, "adapter_notice");
  assert.equal(result.emissions.length, 1);
  assert.equal(result.emissions[0]?.target, "hook:digest");
  assert.equal(result.emissions[0]?.adapterId, "hook-proof");
  assert.deepEqual(result.emissions[0]?.payload, {
    targetRef: "signal",
    via: "mapEmission",
    targetLevel: undefined,
    mappedLevel: undefined,
    views: [],
    relations: [],
  });
});

test("executeCog resolves missing bind targets through neutral external references", async () => {
  const resolvedRefs: string[] = [];
  const adapter: CogDomainAdapter = {
    adapterId: "external-ref-proof",
    version: "0.1.0",
    enrichPlan: (plan) => ({
      ...plan,
      steps: [
        {
          id: "adapter-bind-external-record",
          phase: "bind",
          targetKind: "external-ref",
          targetId: "external-record",
          targetRef: "external:record",
          status: "PENDING",
        },
        ...plan.steps,
      ],
    }),
    resolveExternalRef: (ref) => {
      resolvedRefs.push(ref.ref);
      return {
        ref: `resolved:${ref.ref}`,
        kind: "external-record",
        adapterId: "external-ref-proof",
        origin: "adapter",
      };
    },
  };

  const source = `
define entity "signal" {
  kind: record
}

emit {
  kind: digest
}
`.trim();

  const result = await executeCog(
    compileCog(parseCog(lex(source))),
    {
      ...baseContext,
      runId: "execute-external-ref-proof",
    },
    adapter,
  );

  assert.equal(result.success, true);
  assert.deepEqual(resolvedRefs, ["external:record"]);
  assert.deepEqual(result.bindings["external:record"], {
    ref: "resolved:external:record",
    kind: "external-record",
    adapterId: "external-ref-proof",
    origin: "adapter",
  });
});

test("executeCog keeps a narrow legacy reference-loading migration path", async () => {
  const adapter: CogDomainAdapter = {
    adapterId: "legacy-ref-proof",
    version: "0.1.0",
    enrichPlan: (plan) => ({
      ...plan,
      steps: [
        {
          id: "adapter-bind-legacy-record",
          phase: "bind",
          targetKind: "external-ref",
          targetId: "legacy-record",
          targetRef: "legacy:record",
          status: "PENDING",
        },
        ...plan.steps,
      ],
    }),
    loadCanonicalRef: (ref) => ({
      ref: `legacy:${ref.ref}`,
      kind: "legacy-record",
      adapterId: "legacy-ref-proof",
      origin: "adapter",
    }),
  };

  const source = `
define entity "signal" {
  kind: record
}

emit {
  kind: digest
}
`.trim();

  const result = await executeCog(
    compileCog(parseCog(lex(source))),
    {
      ...baseContext,
      runId: "execute-legacy-ref-proof",
    },
    adapter,
  );

  assert.equal(result.success, true);
  assert.deepEqual(result.bindings["legacy:record"], {
    ref: "legacy:legacy:record",
    kind: "legacy-record",
    adapterId: "legacy-ref-proof",
    origin: "adapter",
  });
});

test("executeCog follows dependency graph order when planner order is not executable", async () => {
  const adapter: CogDomainAdapter = {
    adapterId: "graph-order-proof",
    version: "0.1.0",
    enrichPlan: (plan) => ({
      ...plan,
      steps: [...plan.steps].reverse(),
    }),
  };
  const source = `
define entity "signal" {
  kind: record
}

emit {
  kind: digest
}
`.trim();

  const result = await executeCog(
    compileCog(parseCog(lex(source))),
    {
      ...baseContext,
      runId: "execute-graph-order",
    },
    adapter,
  );

  assert.equal(result.success, true);
  assert.deepEqual(
    result.trace.steps.map((step) => step.stepId),
    ["step-1", "step-2", "step-3"],
  );
  assert.deepEqual(
    result.trace.steps.map((step) => step.phase),
    ["bind", "validate", "emit"],
  );
});

test("executeCog graph execution is deterministic across repeated runs", async () => {
  const adapter: CogDomainAdapter = {
    adapterId: "graph-determinism-proof",
    version: "0.1.0",
    enrichPlan: (plan) => ({
      ...plan,
      steps: [...plan.steps].reverse(),
    }),
  };
  const source = `
define entity "signal" {
  kind: record
}

transform {
  from: conceptual
  to: actionable
  target: "signal"
}

emit {
  kind: digest
}
`.trim();
  const ir = compileCog(parseCog(lex(source)));
  const context = {
    ...baseContext,
    runId: "execute-graph-determinism",
  };

  const first = await executeCog(ir, context, adapter);
  const second = await executeCog(ir, context, adapter);

  assert.equal(first.success, true);
  assert.deepEqual(
    {
      trace: first.trace.steps.map((step) => ({
        stepId: step.stepId,
        phase: step.phase,
        status: step.status,
        data: step.data,
      })),
      emissions: first.emissions,
      bindings: first.bindings,
      errors: first.errors,
    },
    {
      trace: second.trace.steps.map((step) => ({
        stepId: step.stepId,
        phase: step.phase,
        status: step.status,
        data: step.data,
      })),
      emissions: second.emissions,
      bindings: second.bindings,
      errors: second.errors,
    },
  );
});

test("executeCog fails closed when graph dependency references a missing step", async () => {
  const adapter: CogDomainAdapter = {
    adapterId: "graph-missing-dependency-proof",
    version: "0.1.0",
    enrichPlan: (plan) => ({
      ...plan,
      steps: plan.steps.map((step, index) => index === 0
        ? {
          ...step,
          dependsOn: ["missing-step"],
        }
        : step),
    }),
  };
  const source = `
define entity "signal" {
  kind: record
}

emit {
  kind: digest
}
`.trim();

  const result = await executeCog(
    compileCog(parseCog(lex(source))),
    {
      ...baseContext,
      runId: "execute-graph-missing-dependency",
    },
    adapter,
  );

  assert.equal(result.success, false);
  assert.equal(result.emissions.length, 0);
  assert.match(result.errors[0] ?? "", /missing step "missing-step"/);
  assert.deepEqual(
    result.trace.steps.map((step) => step.status),
    ["SKIPPED", "SKIPPED", "SKIPPED"],
  );
});

test("executeCog fails closed when graph dependencies contain a cycle", async () => {
  const adapter: CogDomainAdapter = {
    adapterId: "graph-cycle-proof",
    version: "0.1.0",
    enrichPlan: (plan) => ({
      ...plan,
      steps: plan.steps.map((step) => {
        if (step.id === "step-1") {
          return {
            ...step,
            dependsOn: ["step-2"],
          };
        }
        if (step.id === "step-2") {
          return {
            ...step,
            dependsOn: ["step-1"],
          };
        }
        return step;
      }),
    }),
  };
  const source = `
define entity "signal" {
  kind: record
}

emit {
  kind: digest
}
`.trim();

  const result = await executeCog(
    compileCog(parseCog(lex(source))),
    {
      ...baseContext,
      runId: "execute-graph-cycle",
    },
    adapter,
  );

  assert.equal(result.success, false);
  assert.equal(result.emissions.length, 0);
  assert.match(result.errors[0] ?? "", /cycle/);
  assert.deepEqual(
    result.trace.steps.map((step) => step.status),
    ["SKIPPED", "SKIPPED", "SKIPPED"],
  );
});

test("source pipeline executes with adapter-mapped emissions", async () => {
  const source = `
define entity "signal" {
  kind: record
  level: L3
}

emit {
  kind: brief
}
`.trim();

  const ir = compileCog(parseCog(lex(source)));
  const validation = await validateCog(ir, {
    context: {
      ...baseContext,
      runId: "execute-source-adapter-validation",
    },
    adapter: momAdapter,
  });
  const result = await executeCog(
    ir,
    {
      ...baseContext,
      runId: "execute-source-adapter",
    },
    momAdapter,
  );

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(result.adapterId, "mom");
  assert.equal(result.emissions.length, 1);
  assert.equal(result.emissions[0]?.target, "mom:brief");
  assert.equal(result.emissions[0]?.kind, "brief");
  assert.equal(result.emissions[0]?.payload.targetLevel, "L3");
  assert.equal(result.emissions[0]?.payload.mappedLevel, "R3");
  assert.equal(result.trace.steps.at(-1)?.phase, "emit");
});

test("same program stays level-neutral with no adapter and gains mapped level with momAdapter", async () => {
  const source = `
define entity "signal" {
  kind: record
  level: L4
}

emit {
  kind: brief
}
`.trim();

  const ir = compileCog(parseCog(lex(source)));
  const withoutAdapter = await executeCog(ir, {
    ...baseContext,
    runId: "execute-level-neutral",
  });
  const withMom = await executeCog(
    ir,
    {
      ...baseContext,
      runId: "execute-level-mom",
    },
    momAdapter,
  );

  assert.equal(withoutAdapter.emissions[0]?.payload.targetLevel, "L4");
  assert.equal(withoutAdapter.emissions[0]?.payload.mappedLevel, undefined);
  assert.equal(withMom.emissions[0]?.payload.targetLevel, "L4");
  assert.equal(withMom.emissions[0]?.payload.mappedLevel, "R4");
});

test("decision adapter leaves level mapping neutral because it does not implement mapLevel", async () => {
  const source = `
define entity "signal" {
  kind: record
  level: L2
}

emit {
  kind: brief
}
`.trim();

  const result = await executeCog(
    compileCog(parseCog(lex(source))),
    {
      ...baseContext,
      runId: "execute-level-decision",
    },
    decisionAdapter,
  );

  assert.equal(result.success, true);
  assert.equal(result.adapterId, "decision");
  assert.equal(result.emissions[0]?.payload.targetLevel, "L2");
  assert.equal(result.emissions[0]?.payload.mappedLevel, undefined);
});

test("canonical sample makes view/perspective divergence legible across no adapter, momAdapter, and decisionAdapter", async () => {
  const source = await readFile(
    new URL("../../examples/adapters/adapter-view-divergence.cog", import.meta.url),
    "utf8",
  );
  const ir = compileCog(parseCog(lex(source)));

  const withoutAdapter = await executeCog(ir, {
    ...baseContext,
    runId: "execute-view-neutral",
  });
  const withMom = await executeCog(
    ir,
    {
      ...baseContext,
      runId: "execute-view-mom",
    },
    momAdapter,
  );
  const withDecision = await executeCog(
    ir,
    {
      ...baseContext,
      runId: "execute-view-decision",
    },
    decisionAdapter,
  );

  assert.deepEqual(withoutAdapter.emissions[0]?.payload.views, [
    {
      id: "view-1",
      targetRef: "signal",
      viewKind: "advisory",
      mappedViewKind: undefined,
      alias: "advisory",
    },
  ]);
  assert.deepEqual(withMom.emissions[0]?.payload.views, [
    {
      id: "view-1",
      targetRef: "signal",
      viewKind: "advisory",
      mappedViewKind: "mom:advisory",
      alias: "advisory",
    },
  ]);
  assert.deepEqual(withDecision.emissions[0]?.payload.views, [
    {
      id: "view-1",
      targetRef: "signal",
      viewKind: "advisory",
      mappedViewKind: "decision:advisory",
      alias: "advisory",
    },
  ]);
  assert.equal(withoutAdapter.emissions[0]?.target, "signal");
  assert.equal(withMom.emissions[0]?.target, "mom:brief");
  assert.equal(withDecision.emissions[0]?.target, "decision:brief");
  assert.equal(withoutAdapter.emissions[0]?.payload.mappedLevel, undefined);
  assert.equal(withMom.emissions[0]?.payload.mappedLevel, "R3");
  assert.equal(withDecision.emissions[0]?.payload.mappedLevel, undefined);
});

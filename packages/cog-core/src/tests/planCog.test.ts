import assert from "node:assert/strict";
import test from "node:test";

import { compileCog, planCog, type CogDomainAdapter, type ProgramNode } from "../index";

test("planCog produces ordered bind, transform, validate, and emit steps", async () => {
  const program: ProgramNode = {
    kind: "Program",
    statements: [
      {
        kind: "DefineEntity",
        name: { kind: "IdentifierValue", name: "record" },
        fields: [],
      },
      {
        kind: "Transform",
        target: { kind: "IdentifierValue", name: "record" },
        transform: { kind: "IdentifierValue", name: "normalize" },
        fields: [],
      },
      {
        kind: "Emit",
        target: { kind: "IdentifierValue", name: "record" },
        as: { kind: "IdentifierValue", name: "summary" },
        fields: [],
      },
    ],
  };

  const plan = await planCog(compileCog(program), {
    context: {
      runId: "plan-test",
      mode: "batch",
      startedAt: new Date(0).toISOString(),
    },
  });

  assert.deepEqual(
    plan.steps.map((step) => step.phase),
    ["bind", "transform", "validate", "emit"],
  );
});

test("planCog uses adapter enrichPlan when provided", async () => {
  const program: ProgramNode = {
    kind: "Program",
    statements: [
      {
        kind: "DefineEntity",
        name: { kind: "IdentifierValue", name: "record" },
        fields: [],
      },
      {
        kind: "Emit",
        target: { kind: "IdentifierValue", name: "record" },
        as: { kind: "IdentifierValue", name: "summary" },
        fields: [],
      },
    ],
  };

  const adapter: CogDomainAdapter = {
    adapterId: "plan-proof",
    version: "0.1.0",
    enrichPlan: async (plan) => ({
      ...plan,
      steps: [
        {
          id: "adapter-step",
          phase: "bind",
          targetKind: "adapter",
          targetId: "adapter-step",
          targetRef: "adapter:record",
          status: "PENDING",
          metadata: {
            injectedBy: "plan-proof",
          },
        },
        ...plan.steps,
      ],
    }),
  };

  const plan = await planCog(compileCog(program), {
    context: {
      runId: "plan-adapter-test",
      mode: "batch",
      startedAt: new Date(0).toISOString(),
    },
    adapter,
  });

  assert.equal(plan.adapterId, "plan-proof");
  assert.equal(plan.steps[0]?.id, "adapter-step");
  assert.equal(plan.steps[0]?.metadata?.injectedBy, "plan-proof");
  assert.deepEqual(
    plan.steps.slice(1).map((step) => step.phase),
    ["bind", "validate", "emit"],
  );
});

test("planCog annotates deterministic semantic dependencies", async () => {
  const program: ProgramNode = {
    kind: "Program",
    statements: [
      {
        kind: "DefineEntity",
        name: { kind: "IdentifierValue", name: "source" },
        fields: [],
      },
      {
        kind: "DefineEntity",
        name: { kind: "IdentifierValue", name: "target" },
        fields: [],
      },
      {
        kind: "Relate",
        source: { kind: "IdentifierValue", name: "source" },
        relation: { kind: "IdentifierValue", name: "supports" },
        target: { kind: "IdentifierValue", name: "target" },
        fields: [],
      },
      {
        kind: "View",
        target: { kind: "IdentifierValue", name: "target" },
        as: { kind: "IdentifierValue", name: "brief" },
        fields: [],
      },
      {
        kind: "Resolve",
        target: { kind: "IdentifierValue", name: "target" },
        to: { kind: "LevelValue", value: "L2" },
        fields: [],
      },
      {
        kind: "Constrain",
        target: { kind: "IdentifierValue", name: "target" },
        fields: [],
      },
      {
        kind: "Transform",
        target: { kind: "IdentifierValue", name: "target" },
        transform: { kind: "IdentifierValue", name: "normalize" },
        fields: [],
      },
      {
        kind: "Emit",
        target: { kind: "IdentifierValue", name: "target" },
        as: { kind: "IdentifierValue", name: "summary" },
        fields: [],
      },
    ],
  };

  const plan = await planCog(compileCog(program), {
    context: {
      runId: "plan-dependency-test",
      mode: "batch",
      startedAt: new Date(0).toISOString(),
    },
  });

  const byId = Object.fromEntries(plan.steps.map((step) => [step.id, step]));

  assert.deepEqual(byId["step-1"]?.dependsOn, []);
  assert.deepEqual(byId["step-2"]?.dependsOn, []);
  assert.deepEqual(byId["step-3"]?.dependsOn, ["step-1", "step-2"]);
  assert.deepEqual(byId["step-4"]?.dependsOn, ["step-2"]);
  assert.deepEqual(byId["step-5"]?.dependsOn, ["step-2"]);
  assert.deepEqual(byId["step-6"]?.dependsOn, ["step-2"]);
  assert.deepEqual(byId["step-7"]?.dependsOn, ["step-2"]);
  assert.deepEqual(byId["step-8"]?.dependsOn, [
    "step-1",
    "step-2",
    "step-3",
    "step-4",
    "step-5",
    "step-6",
    "step-7",
  ]);
  assert.deepEqual(byId["step-9"]?.dependsOn, [
    "step-2",
    "step-3",
    "step-4",
    "step-5",
    "step-6",
    "step-7",
    "step-8",
  ]);
});

test("planCog dependency metadata is stable across repeated planning", async () => {
  const program: ProgramNode = {
    kind: "Program",
    statements: [
      {
        kind: "DefineEntity",
        name: { kind: "IdentifierValue", name: "record" },
        fields: [],
      },
      {
        kind: "Transform",
        target: { kind: "IdentifierValue", name: "record" },
        transform: { kind: "IdentifierValue", name: "normalize" },
        fields: [],
      },
      {
        kind: "Emit",
        target: { kind: "IdentifierValue", name: "record" },
        as: { kind: "IdentifierValue", name: "summary" },
        fields: [],
      },
    ],
  };
  const context = {
    runId: "plan-dependency-repeat",
    mode: "batch" as const,
    startedAt: new Date(0).toISOString(),
  };

  const first = await planCog(compileCog(program), { context });
  const second = await planCog(compileCog(program), { context });

  assert.deepEqual(
    first.steps.map((step) => ({
      id: step.id,
      phase: step.phase,
      targetRef: step.targetRef,
      dependsOn: step.dependsOn,
    })),
    second.steps.map((step) => ({
      id: step.id,
      phase: step.phase,
      targetRef: step.targetRef,
      dependsOn: step.dependsOn,
    })),
  );
});

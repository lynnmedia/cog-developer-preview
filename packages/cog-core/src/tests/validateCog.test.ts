import assert from "node:assert/strict";
import test from "node:test";

import {
  compileCog,
  validateCog,
  type CogDomainAdapter,
  type CoreExecutionContext,
  type CoreIR,
  type ProgramNode,
} from "../index";

function createBaseIr(): CoreIR {
  return {
    entities: [],
    relations: [],
    views: [],
    resolutions: [],
    transformations: [],
    constraints: [],
    emissions: [],
    graph: {
      nodes: [],
      edges: [],
    },
    meta: {
      compilerVersion: "0.3.0",
      compiledAt: new Date(0).toISOString(),
      statementCount: 0,
      entityIndex: {},
    },
  };
}

const validationContext: CoreExecutionContext = {
  runId: "validate-test",
  mode: "batch",
  startedAt: new Date(0).toISOString(),
};

test("validateCog accepts a valid compiled IR", async () => {
  const program: ProgramNode = {
    kind: "Program",
    statements: [
      {
        kind: "DefineEntity",
        name: { kind: "IdentifierValue", name: "ticket" },
        fields: [],
      },
      {
        kind: "Emit",
        target: { kind: "IdentifierValue", name: "ticket" },
        fields: [],
      },
    ],
  };

  const report = await validateCog(compileCog(program));

  assert.equal(report.valid, true);
  assert.equal(report.issues.length, 0);
});

test("validateCog accepts valid IR with multiple structural node kinds", async () => {
  const ir: CoreIR = {
    ...createBaseIr(),
    entities: [
      {
        id: "entity-1",
        name: "discipline",
        entityKind: "behavioral_pattern",
        attributes: {},
      },
      {
        id: "entity-2",
        name: "routine",
        entityKind: "practice",
        attributes: {},
      },
    ],
    relations: [
      {
        id: "relation-1",
        relationKind: "supports",
        sourceRef: "discipline",
        targetRef: "routine",
        sourceEntityId: "entity-1",
        targetEntityId: "entity-2",
        attributes: {},
      },
    ],
    views: [
      {
        id: "view-1",
        viewKind: "summary",
        alias: "summary",
        targetRef: "discipline",
        attributes: {},
      },
    ],
    resolutions: [
      {
        id: "resolution-1",
        targetRef: "routine",
        value: "L4",
        attributes: {},
      },
    ],
    transformations: [
      {
        id: "transform-1",
        targetRef: "discipline",
        transformRef: "actionable",
        arguments: {},
      },
    ],
    emissions: [
      {
        id: "emit-1",
        targetRef: "routine",
        emissionKind: "structured_routine",
        attributes: {},
      },
    ],
    constraints: [
      {
        id: "constraint-1",
        targetRef: "discipline",
        enforcement: "ADVISORY",
        attributes: {
          max_steps: 4,
        },
      },
    ],
    meta: {
      ...createBaseIr().meta,
      statementCount: 7,
      entityIndex: {
        discipline: "entity-1",
        routine: "entity-2",
      },
    },
  };

  const report = await validateCog(ir);

  assert.equal(report.valid, true);
  assert.equal(report.issues.length, 0);
});

test("validateCog reports missing relation source and target", async () => {
  const ir: CoreIR = {
    ...createBaseIr(),
    relations: [
      {
        id: "relation-1",
        relationKind: "depends_on",
        sourceRef: "missing-source",
        targetRef: "missing-target",
        attributes: {},
      },
    ],
    meta: {
      ...createBaseIr().meta,
      statementCount: 1,
    },
  };

  const report = await validateCog(ir);

  assert.equal(report.valid, false);
  assert.deepEqual(
    report.issues.map((issue) => issue.code).sort(),
    ["missing_relation_source_entity", "missing_relation_target_entity"],
  );
});

test("validateCog reports missing view target", async () => {
  const ir: CoreIR = {
    ...createBaseIr(),
    views: [
      {
        id: "view-1",
        viewKind: "summary",
        alias: "summary",
        targetRef: "missing-view-target",
        attributes: {},
      },
    ],
    meta: {
      ...createBaseIr().meta,
      statementCount: 1,
    },
  };

  const report = await validateCog(ir);

  assert.equal(report.valid, false);
  assert.deepEqual(report.issues.map((issue) => issue.code), ["missing_view_target"]);
  assert.match(report.issues[0]?.message ?? "", /missing-view-target/);
});

test("validateCog reports missing view perspective", async () => {
  const ir: CoreIR = {
    ...createBaseIr(),
    entities: [
      {
        id: "entity-1",
        name: "discipline",
        entityKind: "entity",
        attributes: {},
      },
    ],
    views: [
      {
        id: "view-1",
        viewKind: "",
        targetRef: "discipline",
        attributes: {},
      },
    ],
    meta: {
      ...createBaseIr().meta,
      statementCount: 1,
      entityIndex: {
        discipline: "entity-1",
      },
    },
  };

  const report = await validateCog(ir);

  assert.equal(report.valid, false);
  assert.deepEqual(report.issues.map((issue) => issue.code), ["missing_view_perspective"]);
});

test("validateCog reports missing resolution target", async () => {
  const ir: CoreIR = {
    ...createBaseIr(),
    resolutions: [
      {
        id: "resolution-1",
        targetRef: "missing-resolution-target",
        value: "L4",
        attributes: {},
      },
    ],
    meta: {
      ...createBaseIr().meta,
      statementCount: 1,
    },
  };

  const report = await validateCog(ir);

  assert.equal(report.valid, false);
  assert.deepEqual(report.issues.map((issue) => issue.code), ["missing_resolution_target"]);
  assert.match(report.issues[0]?.message ?? "", /missing-resolution-target/);
});

test("validateCog reports missing resolution level", async () => {
  const ir: CoreIR = {
    ...createBaseIr(),
    entities: [
      {
        id: "entity-1",
        name: "discipline",
        entityKind: "entity",
        attributes: {},
      },
    ],
    resolutions: [
      {
        id: "resolution-1",
        targetRef: "discipline",
        attributes: {},
      },
    ],
    meta: {
      ...createBaseIr().meta,
      statementCount: 1,
      entityIndex: {
        discipline: "entity-1",
      },
    },
  };

  const report = await validateCog(ir);

  assert.equal(report.valid, false);
  assert.deepEqual(report.issues.map((issue) => issue.code), ["missing_resolution_level"]);
});

test("validateCog reports invalid resolution level", async () => {
  const ir: CoreIR = {
    ...createBaseIr(),
    entities: [
      {
        id: "entity-1",
        name: "discipline",
        entityKind: "entity",
        attributes: {},
      },
    ],
    resolutions: [
      {
        id: "resolution-1",
        targetRef: "discipline",
        value: "L9",
        attributes: {},
      },
    ],
    meta: {
      ...createBaseIr().meta,
      statementCount: 1,
      entityIndex: {
        discipline: "entity-1",
      },
    },
  };

  const report = await validateCog(ir);

  assert.equal(report.valid, false);
  assert.deepEqual(report.issues.map((issue) => issue.code), ["invalid_resolution_level"]);
});

test("validateCog reports missing transform target", async () => {
  const ir: CoreIR = {
    ...createBaseIr(),
    transformations: [
      {
        id: "transform-1",
        targetRef: "missing-transform-target",
        transformRef: "actionable",
        arguments: {},
      },
    ],
    meta: {
      ...createBaseIr().meta,
      statementCount: 1,
    },
  };

  const report = await validateCog(ir);

  assert.equal(report.valid, false);
  assert.deepEqual(report.issues.map((issue) => issue.code), ["missing_transform_target"]);
  assert.match(report.issues[0]?.message ?? "", /missing-transform-target/);
});

test("validateCog reports missing relation kind", async () => {
  const ir: CoreIR = {
    ...createBaseIr(),
    entities: [
      {
        id: "entity-1",
        name: "discipline",
        entityKind: "entity",
        attributes: {},
      },
      {
        id: "entity-2",
        name: "completion",
        entityKind: "entity",
        attributes: {},
      },
    ],
    relations: [
      {
        id: "relation-1",
        relationKind: "",
        sourceRef: "discipline",
        targetRef: "completion",
        attributes: {},
      },
    ],
    meta: {
      ...createBaseIr().meta,
      statementCount: 1,
      entityIndex: {
        discipline: "entity-1",
        completion: "entity-2",
      },
    },
  };

  const report = await validateCog(ir);

  assert.equal(report.valid, false);
  assert.deepEqual(report.issues.map((issue) => issue.code), ["missing_relation_kind"]);
});

test("validateCog no longer claims undeclared transform protection", async () => {
  const ir: CoreIR = {
    ...createBaseIr(),
    entities: [
      {
        id: "entity-1",
        name: "ticket",
        entityKind: "entity",
        attributes: {},
      },
    ],
    transformations: [
      {
        id: "transform-1",
        targetRef: "ticket",
        transformRef: "normalize",
        arguments: {},
      },
    ],
    meta: {
      ...createBaseIr().meta,
      statementCount: 1,
      entityIndex: {
        ticket: "entity-1",
      },
    },
  };

  const report = await validateCog(ir);

  assert.equal(report.valid, true);
  assert.equal(report.issues.length, 0);
});

test("validateCog reports missing constraint target", async () => {
  const ir: CoreIR = {
    ...createBaseIr(),
    constraints: [
      {
        id: "constraint-1",
        targetRef: "missing-target",
        enforcement: "ADVISORY",
        attributes: {
          max_steps: 4,
        },
      },
    ],
    meta: {
      ...createBaseIr().meta,
      statementCount: 1,
    },
  };

  const report = await validateCog(ir);

  assert.equal(report.valid, false);
  assert.deepEqual(report.issues.map((issue) => issue.code), ["missing_constraint_target"]);
});

test("validateCog reports malformed core reference shapes where enforced", async () => {
  const ir: CoreIR = {
    ...createBaseIr(),
    entities: [
      {
        id: "entity-1",
        name: "ticket",
        entityKind: "entity",
        attributes: {},
      },
    ],
    transformations: [
      {
        id: "transform-1",
        targetRef: "ticket",
        transformRef: "bad ref",
        arguments: {},
      },
    ],
    emissions: [
      {
        id: "emit-1",
        targetRef: "bad ref",
        emissionKind: "summary",
        attributes: {},
      },
    ],
    meta: {
      ...createBaseIr().meta,
      statementCount: 2,
      entityIndex: {
        ticket: "entity-1",
      },
    },
  };

  const report = await validateCog(ir);

  assert.equal(report.valid, false);
  assert.deepEqual(
    report.issues.map((issue) => issue.code).sort(),
    ["malformed_core_ref", "malformed_core_ref"],
  );
  assert.deepEqual(
    report.issues.map((issue) => issue.path).sort(),
    ["emit.targetRef", "transform.transformRef"],
  );
});

test("validateCog composes adapter warning issues", async () => {
  const adapter: CogDomainAdapter = {
    adapterId: "warn-adapter",
    version: "0.1.0",
    validateProgram: () => ({
      issues: [
        {
          code: "adapter_warning",
          severity: "warning",
          message: "Adapter-specific warning",
          adapterId: "warn-adapter",
        },
      ],
    }),
  };

  const report = await validateCog(createBaseIr(), {
    context: validationContext,
    adapter,
  });

  assert.equal(report.valid, true);
  assert.equal(report.warningCount, 1);
  assert.equal(report.errorCount, 0);
  assert.equal(report.issues[0]?.code, "adapter_warning");
});

test("validateCog composes adapter error issues", async () => {
  const adapter: CogDomainAdapter = {
    adapterId: "error-adapter",
    version: "0.1.0",
    validateProgram: () => ({
      issues: [
        {
          code: "adapter_error",
          severity: "error",
          message: "Adapter-specific failure",
          adapterId: "error-adapter",
        },
      ],
    }),
  };

  const report = await validateCog(createBaseIr(), {
    context: validationContext,
    adapter,
  });

  assert.equal(report.valid, false);
  assert.equal(report.warningCount, 0);
  assert.equal(report.errorCount, 1);
  assert.equal(report.issues[0]?.code, "adapter_error");
});

test("validateCog validates resolution with valid formal level field", async () => {
  const ir: CoreIR = {
    ...createBaseIr(),
    entities: [
      {
        id: "entity-1",
        name: "discipline",
        entityKind: "entity",
        attributes: {},
      },
    ],
    resolutions: [
      {
        id: "resolution-1",
        targetRef: "discipline",
        level: "L3",
        attributes: {},
      },
    ],
    meta: {
      ...createBaseIr().meta,
      statementCount: 1,
      entityIndex: {
        discipline: "entity-1",
      },
    },
  };

  const report = await validateCog(ir);
  assert.equal(report.valid, true);
});

test("validateCog reports invalid resolution level when formal level is invalid", async () => {
  const ir: CoreIR = {
    ...createBaseIr(),
    entities: [
      {
        id: "entity-1",
        name: "discipline",
        entityKind: "entity",
        attributes: {},
      },
    ],
    resolutions: [
      {
        id: "resolution-1",
        targetRef: "discipline",
        level: "L9" as any,
        attributes: {},
      },
    ],
    meta: {
      ...createBaseIr().meta,
      statementCount: 1,
      entityIndex: {
        discipline: "entity-1",
      },
    },
  };

  const report = await validateCog(ir);
  assert.equal(report.valid, false);
  assert.equal(report.issues[0]?.code, "invalid_resolution_level");
});

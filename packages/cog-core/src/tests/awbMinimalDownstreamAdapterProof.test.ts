import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { executeCog, planCog, validateCog } from "../index";
import minimalAwbOperation from "./fixtures/awb/minimal-audit-operation.json";
import {
  awbAdapter,
  projectNormalizedAwbOperationToCoreIr,
} from "../../../../tests/awb/minimal-awb-adapter";

const EXPECTED_KEYS = ["operation_id", "operation_kind", "subject_ref", "status"] as const;

test("canonical AWB fixture maps into CoreIR through the downstream adapter helper", () => {
  assertCanonicalFixture(minimalAwbOperation);

  const firstProjected = projectNormalizedAwbOperationToCoreIr(minimalAwbOperation);
  const secondProjected = projectNormalizedAwbOperationToCoreIr(minimalAwbOperation);
  const firstStable = stripVolatileCoreIr(firstProjected);
  const secondStable = stripVolatileCoreIr(secondProjected);

  assert.equal(firstProjected.meta.compilerVersion, "0.3.0");
  assert.equal(typeof firstProjected.meta.compiledAt, "string");
  assert.match(firstProjected.meta.compiledAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(firstStable, secondStable);
  assert.deepEqual(Object.keys(minimalAwbOperation), [...EXPECTED_KEYS]);
  assert.deepEqual(firstStable, {
    entities: [
      {
        id: "awb-operation-001",
        name: "awb-operation-001",
        entityKind: "audit_operation",
        attributes: {
          subject_ref: "subject-001",
          status: "approved",
        },
      },
    ],
    relations: [],
    views: [],
    resolutions: [],
    transformations: [],
    constraints: [],
    emissions: [],
    graph: {
      nodes: [
        {
          id: "awb-operation-001",
          kind: "entity",
          ref: "awb-operation-001",
        },
      ],
      edges: [],
    },
    meta: {
      compilerVersion: "0.3.0",
      statementCount: 1,
      entityIndex: {
        "awb-operation-001": "awb-operation-001",
      },
    },
  });
});

test("downstream adapter composes with validateCog, planCog, and executeCog deterministically", async () => {
  const projected = projectNormalizedAwbOperationToCoreIr(minimalAwbOperation);
  const validation = await validateCog(projected, {
    adapter: awbAdapter,
    context: {
      runId: "awb-adapter-proof-validation",
      mode: "batch",
      startedAt: new Date(0).toISOString(),
    },
  });
  const validationRepeat = await validateCog(projected, {
    adapter: awbAdapter,
    context: {
      runId: "awb-adapter-proof-validation-repeat",
      mode: "batch",
      startedAt: new Date(0).toISOString(),
    },
  });
  const plan = await planCog(projected, {
    adapter: awbAdapter,
    context: {
      runId: "awb-adapter-proof-plan",
      mode: "batch",
      startedAt: new Date(0).toISOString(),
    },
  });
  const planRepeat = await planCog(projected, {
    adapter: awbAdapter,
    context: {
      runId: "awb-adapter-proof-plan-repeat",
      mode: "batch",
      startedAt: new Date(0).toISOString(),
    },
  });
  const execution = await executeCog(
    projected,
    {
      runId: "awb-adapter-proof-execution",
      mode: "batch",
      startedAt: new Date(0).toISOString(),
    },
    awbAdapter,
  );
  const executionRepeat = await executeCog(
    projected,
    {
      runId: "awb-adapter-proof-execution-repeat",
      mode: "batch",
      startedAt: new Date(0).toISOString(),
    },
    awbAdapter,
  );

  assert.equal(validation.valid, true);
  assert.equal(validation.errorCount, 0);
  assert.deepEqual(validation, validationRepeat);
  assert.equal(plan.adapterId, "awb");
  assert.deepEqual(plan.steps.map((step) => step.phase), ["bind", "validate"]);
  assert.deepEqual(stripVolatilePlan(plan), stripVolatilePlan(planRepeat));
  assert.equal(execution.success, true);
  assert.equal(execution.adapterId, "awb");
  assert.equal(execution.validation.valid, true);
  assert.deepEqual(execution.plan.steps.map((step) => step.phase), ["bind", "validate"]);
  assert.deepEqual(execution.trace.steps.map((step) => step.phase), ["bind", "validate"]);
  assert.equal(execution.emissions.length, 0);
  assert.equal(execution.errors.length, 0);
  assert.deepEqual(stripVolatileExecutionResult(execution), stripVolatileExecutionResult(executionRepeat));
});

test("kernel boundary, parser surface, and optional hooks stay neutral", async () => {
  const [
    coreIndex,
    coreLexer,
    coreParser,
    coreExecute,
    corePlan,
    coreValidate,
    adapterTypes,
    adapterSource,
  ] = await Promise.all([
    readFile(new URL("../index.ts", import.meta.url), "utf8"),
    readFile(new URL("../lexer/lexer.ts", import.meta.url), "utf8"),
    readFile(new URL("../parser/parser.ts", import.meta.url), "utf8"),
    readFile(new URL("../runtime/executeCog.ts", import.meta.url), "utf8"),
    readFile(new URL("../planner/planCog.ts", import.meta.url), "utf8"),
    readFile(new URL("../validator/validateCog.ts", import.meta.url), "utf8"),
    readFile(new URL("../types/adapter.ts", import.meta.url), "utf8"),
    readFile(new URL("../../../../tests/awb/minimal-awb-adapter.ts", import.meta.url), "utf8"),
  ]);

  for (const source of [coreIndex, coreExecute, corePlan, coreValidate]) {
    assert.equal(source.includes("awb"), false);
    assert.equal(source.includes("minimal-awb-adapter"), false);
  }

  assert.equal(coreIndex.includes("awb"), false);
  assert.equal(coreLexer.includes("awb"), false);
  assert.equal(coreParser.includes("awb"), false);
  assert.equal(coreExecute.includes("awb"), false);
  assert.equal(corePlan.includes("awb"), false);
  assert.equal(coreValidate.includes("awb"), false);
  assert.equal(adapterTypes.includes("awb"), false);
  assert.equal(adapterSource.includes('from "@winmedia/cog-core"'), true);
  assert.equal(adapterTypes.includes("mapRelationKind?"), true);
  assert.equal(adapterTypes.includes("createDomainTrace?"), true);
  assert.equal(adapterTypes.includes("resolveExternalRef?"), true);
  assert.equal(adapterTypes.includes("loadCanonicalRef?"), true);
  assert.equal(coreParser.includes("minimal-awb-adapter"), false);
  assert.equal(coreLexer.includes("minimal-awb-adapter"), false);

  assert.equal(adapterSource.includes("mapRelationKind"), false);
  assert.equal(adapterSource.includes("createDomainTrace"), false);
  assert.equal(adapterSource.includes("resolveExternalRef"), false);
  assert.equal(adapterSource.includes("loadCanonicalRef"), false);
});

test("unused hooks remain absent from the downstream adapter", () => {
  assert.deepEqual(Object.keys(awbAdapter), ["adapterId", "version", "mapEntityKind"]);
  assert.equal("mapRelationKind" in awbAdapter, false);
  assert.equal("createDomainTrace" in awbAdapter, false);
  assert.equal("resolveExternalRef" in awbAdapter, false);
  assert.equal("loadCanonicalRef" in awbAdapter, false);
});

test("malformed fixture shapes are rejected before projection", () => {
  assert.throws(() => assertCanonicalFixture({
    operation_id: "awb-operation-001",
    operation_kind: "audit_operation",
    subject_ref: "subject-001",
    status: "approved",
    audit_id: "unsupported",
  }), /Unsupported AWB fixture fields/);

  assert.throws(() => assertCanonicalFixture({
    operation_id: "",
    operation_kind: "audit_operation",
    subject_ref: "subject-001",
    status: "approved",
  }), /non-empty string/);
});

function assertCanonicalFixture(value: unknown): asserts value is {
  operation_id: string;
  operation_kind: string;
  subject_ref: string;
  status: string;
} {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("AWB fixture must be a plain object.");
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  const unexpectedKeys = keys.filter((key) => !EXPECTED_KEYS.includes(key as typeof EXPECTED_KEYS[number]));

  assert.equal(unexpectedKeys.length, 0, `Unsupported AWB fixture fields: ${unexpectedKeys.join(", ")}`);
  assert.deepEqual(keys, [...EXPECTED_KEYS]);

  for (const key of EXPECTED_KEYS) {
    const field = record[key];
    assert.equal(typeof field, "string", `AWB fixture field "${key}" must be a string.`);
    assert.notEqual(field.trim(), "", `AWB fixture field "${key}" must be a non-empty string.`);
  }
}

function stripVolatileCoreIr(ir: ReturnType<typeof projectNormalizedAwbOperationToCoreIr>) {
  const { meta: { compiledAt, ...stableMeta }, ...stableIr } = ir;
  void compiledAt;
  return {
    ...stableIr,
    meta: stableMeta,
  };
}

function stripVolatilePlan(plan: Awaited<ReturnType<typeof planCog>>) {
  const { id, createdAt, ...stablePlan } = plan;
  void id;
  void createdAt;
  return {
    ...stablePlan,
    id: "",
    createdAt: "",
  };
}

function stripVolatileExecutionResult(result: Awaited<ReturnType<typeof executeCog>>) {
  const { plan, trace, ...rest } = result;

  return {
    ...rest,
    adapterId: rest.adapterId,
    plan: {
      ...plan,
      id: "",
      createdAt: "",
    },
    trace: {
      ...trace,
      runId: "",
      startedAt: "",
      completedAt: "",
      steps: trace.steps.map((step) => ({
        ...step,
        startedAt: "",
        completedAt: "",
      })),
    },
  };
}

import assert from "node:assert/strict";
import test from "node:test";

import {
  compileCog,
  executeCog,
  planCog,
  type CoreIR,
  type ProgramNode,
} from "../index";
import minimalAwbOperation from "./fixtures/awb/minimal-audit-operation.json";

interface AwbNormalizedAuditOperation {
  operation_id: string;
  operation_kind: string;
  subject_ref: string;
  status: string;
}

const EXPECTED_KEYS = ["operation_id", "operation_kind", "subject_ref", "status"] as const;
const EXPECTED_COMPILER_VERSION = "0.3.0";

test("canonical AWB fixture matches the approved normalized shape", () => {
  assertAwbNormalizedAuditOperation(minimalAwbOperation);
  assert.deepEqual(Object.keys(minimalAwbOperation), [...EXPECTED_KEYS]);
  assert.equal(minimalAwbOperation.operation_id, "awb-operation-001");
  assert.equal(minimalAwbOperation.operation_kind, "audit_operation");
  assert.equal(minimalAwbOperation.subject_ref, "subject-001");
  assert.equal(minimalAwbOperation.status, "approved");
  assert.ok(!("audit_id" in minimalAwbOperation));
  assert.ok(!("evidence_refs" in minimalAwbOperation));
  assert.ok(!("constraint_refs" in minimalAwbOperation));
});

test("canonical AWB fixture projects into the expected CoreIR shape", () => {
  assertAwbNormalizedAuditOperation(minimalAwbOperation);

  const projected = projectAwbFixtureToCoreIr(minimalAwbOperation);
  const { meta: { compiledAt, ...stableMeta }, ...stableIr } = projected;

  assert.equal(typeof compiledAt, "string");
  assert.match(compiledAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(stableIr, {
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
  });
  assert.deepEqual(stableMeta, {
    compilerVersion: EXPECTED_COMPILER_VERSION,
    statementCount: 1,
    entityIndex: {
      "awb-operation-001": "awb-operation-001",
    },
  });
});

test("fixture proof stays parser-free and keeps planner and executor phases unchanged", async () => {
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

  const ir = compileCog(program);
  const plan = await planCog(ir, {
    context: {
      runId: "awb-fixture-proof",
      mode: "batch",
      startedAt: new Date(0).toISOString(),
    },
  });
  const result = await executeCog(ir, {
    runId: "awb-fixture-proof",
    mode: "batch",
    startedAt: new Date(0).toISOString(),
  });

  assert.deepEqual(plan.steps.map((step) => step.phase), ["bind", "validate", "emit"]);
  assert.equal(result.success, true);
  assert.equal(result.trace.steps.at(-1)?.phase, "emit");
  assert.equal(result.errors.length, 0);
});

test("malformed fixture shapes are rejected by the test harness", () => {
  assert.throws(() => assertAwbNormalizedAuditOperation({
    operation_id: "awb-operation-001",
    operation_kind: "audit_operation",
    subject_ref: "subject-001",
    status: "approved",
    audit_id: "unsupported",
  }), /unsupported/i);

  assert.throws(() => assertAwbNormalizedAuditOperation({
    operation_id: "",
    operation_kind: "audit_operation",
    subject_ref: "subject-001",
    status: "approved",
  }), /non-empty string/i);
});

function assertAwbNormalizedAuditOperation(value: unknown): asserts value is AwbNormalizedAuditOperation {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("AWB fixture must be a plain object.");
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);

  const unexpectedKeys = keys.filter((key) => !EXPECTED_KEYS.includes(key as typeof EXPECTED_KEYS[number]));
  assert.equal(
    unexpectedKeys.length,
    0,
    `Unsupported AWB fixture fields: ${unexpectedKeys.join(", ")}`,
  );

  assert.deepEqual(keys, [...EXPECTED_KEYS]);

  for (const key of EXPECTED_KEYS) {
    const field = record[key];
    assert.equal(typeof field, "string", `AWB fixture field "${key}" must be a string.`);
    assert.notEqual(field.trim(), "", `AWB fixture field "${key}" must be a non-empty string.`);
  }
}

function projectAwbFixtureToCoreIr(operation: AwbNormalizedAuditOperation): CoreIR {
  return {
    entities: [
      {
        id: operation.operation_id,
        name: operation.operation_id,
        entityKind: operation.operation_kind,
        attributes: {
          subject_ref: operation.subject_ref,
          status: operation.status,
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
          id: operation.operation_id,
          kind: "entity",
          ref: operation.operation_id,
        },
      ],
      edges: [],
    },
    meta: {
      compilerVersion: EXPECTED_COMPILER_VERSION,
      compiledAt: new Date(0).toISOString(),
      statementCount: 1,
      entityIndex: {
        [operation.operation_id]: operation.operation_id,
      },
    },
  };
}

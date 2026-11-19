import assert from "node:assert/strict";
import test from "node:test";
import {
  lex,
  validateCog,
  executeCog,
  compileCog,
  COG_RESOURCE_LIMITS,
  type CoreIR,
  type ProgramNode
} from "../index";

test("Lexer enforces MAX_SOURCE_SIZE_BYTES limit", () => {
  const originalLimit = COG_RESOURCE_LIMITS.MAX_SOURCE_SIZE_BYTES;
  // @ts-ignore
  COG_RESOURCE_LIMITS.MAX_SOURCE_SIZE_BYTES = 5;

  try {
    assert.throws(() => {
      lex("define entity 'signal' {}");
    }, /Source size exceeds limit/);
  } finally {
    // @ts-ignore
    COG_RESOURCE_LIMITS.MAX_SOURCE_SIZE_BYTES = originalLimit;
  }
});

test("Validator enforces MAX_ENTITY_COUNT limit", async () => {
  const originalLimit = COG_RESOURCE_LIMITS.MAX_ENTITY_COUNT;
  // @ts-ignore
  COG_RESOURCE_LIMITS.MAX_ENTITY_COUNT = 1;

  const ir: CoreIR = {
    entities: [
      { id: "e1", name: "e1", entityKind: "observation", attributes: {} },
      { id: "e2", name: "e2", entityKind: "observation", attributes: {} }
    ],
    relations: [],
    views: [],
    resolutions: [],
    transformations: [],
    constraints: [],
    emissions: [],
    graph: { nodes: [], edges: [] },
    meta: {
      compilerVersion: "0.3.0",
      compiledAt: new Date().toISOString(),
      statementCount: 0,
      entityIndex: {}
    }
  };

  try {
    const report = await validateCog(ir);
    assert.equal(report.valid, false);
    assert.ok(report.issues.some(issue => issue.code === "limit_exceeded"));
  } finally {
    // @ts-ignore
    COG_RESOURCE_LIMITS.MAX_ENTITY_COUNT = originalLimit;
  }
});

test("Runtime enforces MAX_EXECUTION_STEPS limit", async () => {
  const originalLimit = COG_RESOURCE_LIMITS.MAX_EXECUTION_STEPS;
  // @ts-ignore
  COG_RESOURCE_LIMITS.MAX_EXECUTION_STEPS = 0;

  const program: ProgramNode = {
    kind: "Program",
    statements: [
      {
        kind: "DefineEntity",
        name: { kind: "IdentifierValue", name: "ticket" },
        fields: []
      }
    ]
  };

  try {
    const ir = compileCog(program);
    const result = await executeCog(ir, {
      runId: "limits-test-run",
      mode: "batch",
      startedAt: new Date().toISOString()
    });

    assert.equal(result.success, false);
    assert.ok(result.errors.some(err => err.includes("exceeds resource limit")));
  } finally {
    // @ts-ignore
    COG_RESOURCE_LIMITS.MAX_EXECUTION_STEPS = originalLimit;
  }
});

import assert from "node:assert/strict";
import test from "node:test";

import { compileCog, type ProgramNode } from "../index";

test("compileCog compiles a hand-built AST into neutral IR", () => {
  const program: ProgramNode = {
    kind: "Program",
    statements: [
      {
        kind: "DefineEntity",
        name: { kind: "IdentifierValue", name: "order" },
        entityKind: { kind: "IdentifierValue", name: "record" },
        level: { kind: "LevelValue", value: "L2" },
        fields: [
          { kind: "Field", name: "status", value: { kind: "StringValue", value: "open" } },
          { kind: "Field", name: "priority", value: { kind: "NumberValue", value: 3 } },
        ],
      },
      {
        kind: "Emit",
        target: { kind: "IdentifierValue", name: "order" },
        as: { kind: "IdentifierValue", name: "summary" },
        fields: [
          { kind: "Field", name: "include", value: { kind: "ListValue", values: [{ kind: "StringValue", value: "status" }] } },
        ],
      },
    ],
  };

  const ir = compileCog(program);

  assert.equal(ir.entities.length, 1);
  assert.equal(ir.entities[0]?.name, "order");
  assert.equal(ir.entities[0]?.entityKind, "record");
  assert.deepEqual(ir.entities[0]?.attributes, {
    status: "open",
    priority: 3,
  });
  assert.equal(ir.emissions.length, 1);
  assert.equal(ir.emissions[0]?.emissionKind, "summary");
  assert.equal(ir.graph.nodes.length, 2);
  assert.equal(ir.graph.edges.length, 1);
});

test("compileCog compiles a resolve statement populating level and value", () => {
  const program: ProgramNode = {
    kind: "Program",
    statements: [
      {
        kind: "Resolve",
        target: { kind: "IdentifierValue", name: "order" },
        to: { kind: "LevelValue", value: "L3" },
        fields: [
          { kind: "Field", name: "reason", value: { kind: "StringValue", value: "verification" } },
        ],
      },
    ],
  };

  const ir = compileCog(program);

  assert.equal(ir.resolutions.length, 1);
  assert.equal(ir.resolutions[0]?.targetRef, "order");
  assert.equal(ir.resolutions[0]?.level, "L3");
  assert.equal(ir.resolutions[0]?.value, "L3");
  assert.deepEqual(ir.resolutions[0]?.attributes, {
    reason: "verification",
  });
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  compileCog,
  compileCogIncremental,
  type IncrementalCompileState,
  type ProgramNode,
} from "../index";

test("compileCogIncremental reuses graph state for an unchanged compatible program", () => {
  const program = buildProgram({ note: "stable" });
  const first = compileCogIncremental(program);
  const second = compileCogIncremental(program, {
    previousState: first.state,
  });

  assert.equal(first.reusedGraph, false);
  assert.equal(second.reusedGraph, true);
  assert.equal(second.ir.graph, first.state.graph);
  assert.deepEqual(second.invalidationReasons, []);
  assert.deepEqual(stripVolatileIR(second.ir), stripVolatileIR(compileCog(program)));
});

test("compileCogIncremental invalidates on source changes even when graph shape is compatible", () => {
  const first = compileCogIncremental(buildProgram({ note: "before" }));
  const changed = buildProgram({ note: "after" });
  const incremental = compileCogIncremental(changed, {
    previousState: first.state,
  });

  assert.equal(incremental.reusedGraph, false);
  assert.deepEqual(incremental.invalidationReasons, ["source_changed"]);
  assert.deepEqual(stripVolatileIR(incremental.ir), stripVolatileIR(compileCog(changed)));
});

test("compileCogIncremental invalidates changed dependency paths", () => {
  const first = compileCogIncremental(buildProgram({ note: "stable" }));
  const changed = buildProgram({
    note: "stable",
    targetName: "alternate",
  });
  const incremental = compileCogIncremental(changed, {
    previousState: first.state,
  });

  assert.equal(incremental.reusedGraph, false);
  assert.deepEqual(incremental.invalidationReasons, [
    "source_changed",
    "dependency_graph_changed",
  ]);
  assert.deepEqual(stripVolatileIR(incremental.ir), stripVolatileIR(compileCog(changed)));
});

test("compileCogIncremental rejects stale graph state", () => {
  const first = compileCogIncremental(buildProgram({ note: "stable" }));
  const staleState: IncrementalCompileState = {
    ...first.state,
    boundaryFingerprint: "stale-boundary",
  };
  const incremental = compileCogIncremental(buildProgram({ note: "stable" }), {
    previousState: staleState,
  });

  assert.equal(incremental.reusedGraph, false);
  assert.deepEqual(incremental.invalidationReasons, ["stale_state"]);
  assert.notEqual(incremental.ir.graph, staleState.graph);
});

function buildProgram(options: {
  note: string;
  targetName?: string;
}): ProgramNode {
  const targetName = options.targetName ?? "target";

  return {
    kind: "Program",
    statements: [
      {
        kind: "DefineEntity",
        name: { kind: "IdentifierValue", name: "source" },
        fields: [
          {
            kind: "Field",
            name: "note",
            value: { kind: "StringValue", value: options.note },
          },
        ],
      },
      {
        kind: "DefineEntity",
        name: { kind: "IdentifierValue", name: targetName },
        fields: [],
      },
      {
        kind: "Relate",
        source: { kind: "IdentifierValue", name: "source" },
        relation: { kind: "IdentifierValue", name: "supports" },
        target: { kind: "IdentifierValue", name: targetName },
        fields: [],
      },
      {
        kind: "Emit",
        target: { kind: "IdentifierValue", name: targetName },
        as: { kind: "IdentifierValue", name: "summary" },
        fields: [],
      },
    ],
  };
}

function stripVolatileIR(ir: ReturnType<typeof compileCog>): ReturnType<typeof compileCog> {
  return {
    ...ir,
    meta: {
      ...ir.meta,
      compiledAt: "VOLATILE",
    },
  };
}

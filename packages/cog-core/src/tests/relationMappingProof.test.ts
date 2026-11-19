import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { executeCog } from "../runtime/executeCog";
import { compileCog } from "../compiler/compileCog";
import { parseCog } from "../parser/parser";
import { lex } from "../lexer/lexer";
import type { CogDomainAdapter } from "../types/adapter";
import { momAdapter } from "../../../cog-adapter-mom/src/momAdapter";
import { decisionAdapter } from "../../../cog-adapter-decision/src/decisionAdapter";

test("executeCog includes mapped relations in emission payload using active adapter", async () => {
  const source = `
    define entity A {
      kind: item
    }
    define entity B {
      kind: item
    }
    relate A -> B {
      kind: dependency
    }
    emit {
      target: A
      kind: dispatch
    }
  `;
  const tokens = lex(source);
  const ast = parseCog(tokens);
  const ir = compileCog(ast);

  const dummyMomAdapter: CogDomainAdapter = {
    adapterId: "mom-test",
    version: "0.3.0",
    mapRelationKind(kind) {
      return `mom:${kind}`;
    },
  };

  const dummyDecisionAdapter: CogDomainAdapter = {
    adapterId: "decision-test",
    version: "0.3.0",
    mapRelationKind(kind) {
      return `decision:${kind}`;
    },
  };

  const resultMom = await executeCog(ir, { runId: "test-mom", mode: "batch", startedAt: new Date(0).toISOString() }, dummyMomAdapter);
  const resultDecision = await executeCog(ir, { runId: "test-decision", mode: "batch", startedAt: new Date(0).toISOString() }, dummyDecisionAdapter);

  assert.equal(resultMom.success, true);
  assert.equal(resultMom.emissions.length, 1);
  const payloadMom = resultMom.emissions[0]!.payload;
  assert.equal(Array.isArray(payloadMom.relations), true);
  assert.equal((payloadMom.relations as any[]).length, 1);
  assert.equal((payloadMom.relations as any[])[0].mappedRelationKind, "mom:dependency");

  assert.equal(resultDecision.success, true);
  assert.equal(resultDecision.emissions.length, 1);
  const payloadDecision = resultDecision.emissions[0]!.payload;
  assert.equal(Array.isArray(payloadDecision.relations), true);
  assert.equal((payloadDecision.relations as any[]).length, 1);
  assert.equal((payloadDecision.relations as any[])[0].mappedRelationKind, "decision:dependency");
});

test("canonical sample makes relation divergence legible across no adapter, momAdapter, and decisionAdapter", async () => {
  const source = await readFile(
    new URL("../../examples/adapters/adapter-relation-divergence.cog", import.meta.url),
    "utf8",
  );
  const ir = compileCog(parseCog(lex(source)));

  const withoutAdapter = await executeCog(ir, {
    runId: "execute-relation-neutral",
    mode: "batch",
    startedAt: new Date(0).toISOString(),
  });
  const withMom = await executeCog(
    ir,
    {
      runId: "execute-relation-mom",
      mode: "batch",
      startedAt: new Date(0).toISOString(),
    },
    momAdapter,
  );
  const withDecision = await executeCog(
    ir,
    {
      runId: "execute-relation-decision",
      mode: "batch",
      startedAt: new Date(0).toISOString(),
    },
    decisionAdapter,
  );

  assert.equal(withoutAdapter.success, true);
  assert.deepEqual(withoutAdapter.emissions[0]?.payload.relations, [
    {
      id: "relation-1",
      sourceRef: "source-entity",
      targetRef: "target-entity",
      relationKind: "dependency",
      mappedRelationKind: undefined,
      attributes: {
        kind: "dependency",
      },
    },
  ]);

  assert.equal(withMom.success, true);
  assert.deepEqual(withMom.emissions[0]?.payload.relations, [
    {
      id: "relation-1",
      sourceRef: "source-entity",
      targetRef: "target-entity",
      relationKind: "dependency",
      mappedRelationKind: "mom:dependency",
      attributes: {
        kind: "dependency",
      },
    },
  ]);

  assert.equal(withDecision.success, true);
  assert.deepEqual(withDecision.emissions[0]?.payload.relations, [
    {
      id: "relation-1",
      sourceRef: "source-entity",
      targetRef: "target-entity",
      relationKind: "dependency",
      mappedRelationKind: "decision:dependency",
      attributes: {
        kind: "dependency",
      },
    },
  ]);
});

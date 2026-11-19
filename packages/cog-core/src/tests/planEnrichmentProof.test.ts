import assert from "node:assert/strict";
import test from "node:test";
import { planCog } from "../planner/planCog";
import { compileCog } from "../compiler/compileCog";
import { parseCog } from "../parser/parser";
import { lex } from "../lexer/lexer";
import { momAdapter } from "../../../cog-adapter-mom/src/momAdapter";
import { decisionAdapter } from "../../../cog-adapter-decision/src/decisionAdapter";

test("planCog enriches plan steps using active adapter enrichPlan hooks", async () => {
  const source = `
    define entity A {
      kind: item
    }
  `;
  const tokens = lex(source);
  const ast = parseCog(tokens);
  const ir = compileCog(ast);

  const planMom = await planCog(ir, { adapter: momAdapter });
  const planDecision = await planCog(ir, { adapter: decisionAdapter });

  const momStepKinds = planMom.steps.map(s => s.targetKind);
  const decisionStepKinds = planDecision.steps.map(s => s.targetKind);

  assert.equal(momStepKinds.includes("mom-verify"), true);
  assert.equal(decisionStepKinds.includes("decision-verify"), true);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { compileCog, executeCog, lex, parseCog, planCog, validateCog } from "../index";

const packageRoot = process.cwd().endsWith(path.join("packages", "cog-core"))
  ? process.cwd()
  : path.join(process.cwd(), "packages", "cog-core");

const context = {
  runId: "governed-decision-tutorial-test",
  mode: "batch" as const,
  startedAt: new Date(0).toISOString(),
};

test("governed decision tutorial fixture validates, plans, executes, and emits the represented decision", async () => {
  const source = await readFile(
    path.join(packageRoot, "examples", "tutorials", "governed-decision.cog"),
    "utf8",
  );

  const ir = compileCog(parseCog(lex(source)));
  const validation = await validateCog(ir, { context });
  const plan = await planCog(ir, { context });
  const result = await executeCog(ir, context);

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);

  assert.deepEqual(
    ir.entities.map((entity) => entity.name),
    [
      "deployment-proposal",
      "availability-evidence",
      "security-evidence",
      "governed-assessment",
      "deployment-decision",
    ],
  );

  assert.deepEqual(
    ir.relations.map((relation) => relation.relationKind),
    ["supports", "qualifies", "transforms-to", "informs-decision"],
  );

  assert.deepEqual(
    ir.views.map((view) => view.viewKind),
    ["operations", "governance"],
  );

  assert.deepEqual(
    ir.resolutions.map((resolution) => `${resolution.targetRef}:${resolution.value}`),
    ["deployment-proposal:L2", "deployment-decision:L3"],
  );

  assert.equal(ir.transformations.length, 1);
  assert.equal(ir.transformations[0]?.targetRef, "deployment-proposal");
  assert.equal(ir.transformations[0]?.transformRef, "assemble-governed-assessment");

  assert.equal(ir.constraints.length, 1);
  assert.equal(ir.constraints[0]?.targetRef, "governed-assessment");
  assert.equal(ir.constraints[0]?.attributes.rule, "rollback-plan-required");

  assert.ok(plan.steps.some((step) => step.phase === "transform"));
  assert.ok(result.trace.steps.some((step) => step.phase === "transform"));

  assert.equal(result.emissions.length, 1);
  assert.equal(result.emissions[0]?.target, "deployment-decision");
  assert.equal(result.emissions[0]?.kind, "governed-decision");
});

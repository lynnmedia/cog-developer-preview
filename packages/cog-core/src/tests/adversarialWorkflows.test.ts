import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, WorkflowLinter } from "../index";

test("Adversarial Workflow: Self-referencing relation is detected by linter", async () => {
  const source = `
define entity "A" {
  kind: record
}
relate "A" -> "A" {
  kind: "self_reference"
}
  `.trim();

  const ir = compileCog(parseCog(lex(source)));
  const report = await validateCog(ir);
  assert.equal(report.valid, true);

  const linter = new WorkflowLinter();
  const issues = linter.lint(ir);
  assert.ok(issues.some(i => i.code === "circular_relation"));
});

test("Adversarial Workflow: Missing relate kind throws SyntaxError in parser", () => {
  const source = `
define entity "A" {
  kind: record
}
define entity "B" {
  kind: record
}
relate "A" -> "B" {
  // missing kind
}
  `.trim();

  assert.throws(() => {
    parseCog(lex(source));
  }, /Relate requires `kind:`/);
});

test("Adversarial Workflow: Invalid resolution level clause throws SyntaxError in parser", () => {
  const source = `
define entity "A" {
  kind: record
}
resolve "A" {
  level: L1
}
  `.trim();

  assert.throws(() => {
    parseCog(lex(source));
  }, /Resolve requires `to`/);
});

test("Adversarial Workflow: Invalid level type value throws SyntaxError in parser", () => {
  const source = `
define entity "A" {
  kind: record
  level: 123
}
  `.trim();

  assert.throws(() => {
    parseCog(lex(source));
  }, /Field "level" must be a level token, found NumberValue/);
});

test("Adversarial Workflow: Orphaned entities are detected by linter", () => {
  const source = `
define entity "A" {
  kind: record
}
define entity "B" {
  kind: record
}
  `.trim();

  const ir = compileCog(parseCog(lex(source)));
  const linter = new WorkflowLinter();
  const issues = linter.lint(ir);
  const orphanedCodes = issues.filter(i => i.code === "orphaned_entity");
  assert.equal(orphanedCodes.length, 2);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  compileCog,
  executeCog,
  lex,
  parseCog,
  validateCog,
  type CoreExecutionContext,
  type ProgramNode,
} from "../index";

const baseContext: CoreExecutionContext = {
  runId: "parser-pipeline-test",
  mode: "batch",
  startedAt: new Date(0).toISOString(),
};

test("parseCog parses an empty program", () => {
  const program = parseCog(lex(""));

  assert.deepEqual(program, {
    kind: "Program",
    statements: [],
    span: program.span,
  });
  assert.equal(program.span?.start.line, 1);
  assert.equal(program.span?.start.column, 1);
});

test("parseCog parses a single define entity statement", () => {
  const program = parseCog(lex(`
define entity "discipline" {
  kind: behavioral_pattern
  description: "consistent execution over time"
}
`.trim()));

  const statement = program.statements[0];
  assert.equal(statement?.kind, "DefineEntity");
  assert.equal(statement?.kind === "DefineEntity" ? statement.name.name : "", "discipline");
  assert.equal(statement?.kind === "DefineEntity" ? statement.entityKind?.name : "", "behavioral_pattern");
});

test("parseCog parses a single relate statement", () => {
  const program = parseCog(lex(`
relate "discipline" -> "completion" {
  kind: enables
  strength: 3
  notes: "stable"
}
`.trim()));

  const statement = program.statements[0];
  assert.equal(statement?.kind, "Relate");
  assert.equal(statement?.kind === "Relate" ? statement.source.name : "", "discipline");
  assert.equal(statement?.kind === "Relate" ? statement.target.name : "", "completion");
  assert.equal(statement?.kind === "Relate" ? statement.relation.name : "", "enables");
});

test("parseCog parses a single view statement", () => {
  const program = parseCog(lex(`
view "discipline" as advisory {
  audience: self
  scope: "daily"
}
`.trim()));

  const statement = program.statements[0];
  assert.equal(statement?.kind, "View");
  assert.equal(statement?.kind === "View" ? statement.target.name : "", "discipline");
  assert.equal(statement?.kind === "View" ? statement.as?.name : "", "advisory");
});

test("parseCog parses a single resolve statement", () => {
  const program = parseCog(lex(`
resolve "discipline" to L4 {
  output: routine
  format: "checklist"
}
`.trim()));

  const statement = program.statements[0];
  assert.equal(statement?.kind, "Resolve");
  assert.equal(statement?.kind === "Resolve" ? statement.target.name : "", "discipline");
  assert.equal(statement?.kind === "Resolve" && statement.to?.kind === "LevelValue" ? statement.to.value : "", "L4");
});

test("parseCog parses a single transform statement", () => {
  const program = parseCog(lex(`
define entity "discipline" {
  kind: behavioral_pattern
}

transform {
  from: conceptual
  to: actionable
  target: "discipline"
}
`.trim()));

  const statement = program.statements[1];
  assert.equal(statement?.kind, "Transform");
  assert.equal(statement?.kind === "Transform" ? statement.target.name : "", "discipline");
  assert.equal(statement?.kind === "Transform" ? statement.transform.name : "", "actionable");
});

test("parseCog parses a single constrain statement with explicit target", () => {
  const program = parseCog(lex(`
define entity "discipline" {
  kind: behavioral_pattern
}

constrain {
  target: "discipline"
  max_steps: 4
  duration: 45min
  strict: true
}
`.trim()));

  const statement = program.statements[1];
  assert.equal(statement?.kind, "Constrain");
  assert.equal(statement?.kind === "Constrain" ? statement.target?.name : "", "discipline");
});

test("parseCog parses a single emit statement with implicit target", () => {
  const program = parseCog(lex(`
define entity "discipline" {
  kind: behavioral_pattern
}

emit {
  kind: structured_routine
}
`.trim()));

  const statement = program.statements[1];
  assert.equal(statement?.kind, "Emit");
  assert.equal(statement?.kind === "Emit" ? statement.target?.name : "", "discipline");
  assert.equal(statement?.kind === "Emit" ? statement.as?.name : "", "structured_routine");
});

test("parseCog parses mixed programs and preserves statement order", () => {
  const program = parseCog(lex(`
define entity "discipline" {
  kind: behavioral_pattern
}

define entity "completion" {
  kind: outcome_state
}

relate "discipline" -> "completion" {
  kind: enables
}

view "discipline" as advisory {
  audience: self
}

resolve "discipline" to L4 {
  output: routine
}

transform {
  from: conceptual
  to: actionable
  target: "discipline"
}

constrain {
  target: "discipline"
  max_steps: 4
  duration: 45min
  strict: true
}

emit {
  target: "discipline"
  kind: structured_routine
}
`.trim()));

  assert.deepEqual(
    program.statements.map((statement) => statement.kind),
    ["DefineEntity", "DefineEntity", "Relate", "View", "Resolve", "Transform", "Constrain", "Emit"],
  );
});

test("parseCog supports flat field values across the expanded statement surface", () => {
  const program = parseCog(lex(`
relate "discipline" -> "completion" {
  kind: enables
  strength: 3
  enabled: true
  notes: null
  tags: ["focus", actionable, 2h]
}

resolve "discipline" to L3 {
  output: routine
  scope: "daily"
}

constrain {
  target: "discipline"
  max_steps: 4
  duration: 45min
  strict: true
}
`.trim()));

  const relate = program.statements[0];
  const resolve = program.statements[1];
  const constrain = program.statements[2];

  assert.equal(relate?.kind, "Relate");
  assert.equal(resolve?.kind, "Resolve");
  assert.equal(constrain?.kind, "Constrain");

  if (relate?.kind === "Relate") {
    const fields = Object.fromEntries(relate.fields.map((field) => [field.name, field.value]));
    assert.equal(fields.kind?.kind, "IdentifierValue");
    assert.equal(fields.strength?.kind, "NumberValue");
    assert.equal(fields.enabled?.kind, "BooleanValue");
    assert.equal(fields.notes?.kind, "NullValue");
    assert.equal(fields.tags?.kind, "ListValue");
  }

  if (resolve?.kind === "Resolve") {
    assert.equal(resolve.to?.kind, "LevelValue");
    const fields = Object.fromEntries(resolve.fields.map((field) => [field.name, field.value.kind]));
    assert.deepEqual(fields, {
      output: "IdentifierValue",
      scope: "StringValue",
    });
  }

  if (constrain?.kind === "Constrain") {
    const fields = Object.fromEntries(constrain.fields.map((field) => [field.name, field.value.kind]));
    assert.deepEqual(fields, {
      target: "StringValue",
      max_steps: "NumberValue",
      duration: "DurationValue",
      strict: "BooleanValue",
    });
  }
});

test("parseCog rejects missing entity name", () => {
  assert.throws(
    () =>
      parseCog(lex(`
define entity {
  kind: behavioral_pattern
}
`.trim())),
    /Expected entity name as string or identifier/,
  );
});

test("parseCog rejects missing block opener", () => {
  assert.throws(
    () => parseCog(lex('define entity "discipline" kind: behavioral_pattern')),
    /Expected `\{` to start a flat field block/,
  );
});

test("parseCog rejects missing field colon", () => {
  assert.throws(
    () =>
      parseCog(lex(`
define entity "discipline" {
  kind behavioral_pattern
}
`.trim())),
    /Expected `:` after field name "kind"/,
  );
});

test("parseCog rejects missing closing brace", () => {
  assert.throws(
    () =>
      parseCog(lex(`
define entity "discipline" {
  kind: behavioral_pattern
`.trim())),
    /Expected `}` to close block/,
  );
});

test("parseCog rejects malformed relate statements without arrow", () => {
  assert.throws(
    () =>
      parseCog(lex(`
relate "discipline" "completion" {
  kind: enables
}
`.trim())),
    /Expected `->` in relate statement/,
  );
});

test("parseCog rejects malformed relate statements without target", () => {
  assert.throws(
    () =>
      parseCog(lex(`
relate "discipline" -> {
  kind: enables
}
`.trim())),
    /Expected relation target as string or identifier/,
  );
});

test("parseCog rejects malformed view statements without as", () => {
  assert.throws(
    () =>
      parseCog(lex(`
view "discipline" advisory {
  audience: self
}
`.trim())),
    /View requires `as`/,
  );
});

test("parseCog rejects malformed view statements without perspective identifier", () => {
  assert.throws(
    () =>
      parseCog(lex(`
view "discipline" as {
  audience: self
}
`.trim())),
    /Expected perspective identifier after `as`/,
  );
});

test("parseCog rejects malformed resolve statements without to", () => {
  assert.throws(
    () =>
      parseCog(lex(`
resolve "discipline" L4 {
  output: routine
}
`.trim())),
    /Resolve requires `to`/,
  );
});

test("parseCog rejects non-level tokens after resolve to", () => {
  assert.throws(
    () =>
      parseCog(lex(`
resolve "discipline" to routine {
  output: routine
}
`.trim())),
    /Expected level token L1-L5 after `to`/,
  );
});

test("parseCog rejects malformed transform blocks", () => {
  assert.throws(
    () =>
      parseCog(lex(`
transform {
  from: conceptual
  target: "discipline"
}
`.trim())),
    /Transform requires `to:`/,
  );
});

test("parseCog rejects malformed constrain statements without a block", () => {
  assert.throws(
    () => parseCog(lex("constrain duration: 45min")),
    /Expected `\{` to start a flat field block/,
  );
});

test("parseCog rejects constrain statements without explicit target", () => {
  assert.throws(
    () =>
      parseCog(lex(`
constrain {
  max_steps: 4
}
`.trim())),
    /Constrain requires `target:`/,
  );
});

test("parseCog rejects malformed field blocks in new statements", () => {
  assert.throws(
    () =>
      parseCog(lex(`
view "discipline" as advisory {
  audience: }
`.trim())),
    /Expected field value, found RIGHT_BRACE "}"/,
  );
});

test("parseCog rejects malformed lists", () => {
  assert.throws(
    () =>
      parseCog(lex(`
relate "discipline" -> "completion" {
  tags: ["focus",, actionable]
}
`.trim())),
    /Expected field value, found COMMA ","/,
  );
});

test("parseCog rejects trailing unexpected tokens", () => {
  assert.throws(
    () =>
      parseCog(lex(`
resolve "discipline" to L4 {
  output: routine
}
45
`.trim())),
    /Expected a statement, found NUMBER "45"/,
  );
});

test("source reaches AST and compileCog for the expanded parser surface", () => {
  const source = `
define entity "discipline" {
  kind: behavioral_pattern
}

define entity "completion" {
  kind: outcome_state
}

relate "discipline" -> "completion" {
  kind: enables
}

view "discipline" as advisory {
  audience: self
}

resolve "discipline" to L4 {
  output: routine
}

transform {
  from: conceptual
  to: actionable
  target: "discipline"
}

constrain {
  target: "discipline"
  max_steps: 4
  duration: 45min
  strict: true
}

emit {
  target: "discipline"
  kind: structured_routine
}
`.trim();

  const ir = compileCog(parseCog(lex(source)));

  assert.equal(ir.entities.length, 2);
  assert.equal(ir.relations.length, 1);
  assert.equal(ir.views.length, 1);
  assert.equal(ir.resolutions.length, 1);
  assert.equal(ir.transformations.length, 1);
  assert.equal(ir.constraints.length, 1);
  assert.equal(ir.emissions.length, 1);
});

test("source reaches AST, compileCog, validateCog, and executeCog for a mixed expanded program", async () => {
  const source = `
define entity "discipline" {
  kind: behavioral_pattern
}

define entity "completion" {
  kind: outcome_state
}

relate "discipline" -> "completion" {
  kind: enables
}

view "discipline" as advisory {
  audience: self
}

resolve "discipline" to L4 {
  output: routine
}

transform {
  from: conceptual
  to: actionable
  target: "discipline"
}

constrain {
  target: "discipline"
  max_steps: 4
  duration: 45min
  strict: true
}

emit {
  target: "discipline"
  kind: structured_routine
}
`.trim();

  const program: ProgramNode = parseCog(lex(source));
  const ir = compileCog(program);
  const validation = await validateCog(ir);
  const result = await executeCog(ir, baseContext);

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(result.validation.valid, true);
  assert.equal(result.plan.steps.length > 0, true);
  assert.equal(result.trace.steps.length > 0, true);
  assert.equal(result.emissions.length, 1);
  assert.equal(result.emissions[0]?.target, "discipline");
  assert.equal(result.emissions[0]?.kind, "structured_routine");
});

test("source parses but validateCog fails for missing relate entities", async () => {
  const source = `
relate "missing-source" -> "missing-target" {
  kind: enables
}
`.trim();

  const validation = await validateCog(compileCog(parseCog(lex(source))));

  assert.equal(validation.valid, false);
  assert.deepEqual(
    validation.issues.map((issue) => issue.code).sort(),
    ["missing_relation_source_entity", "missing_relation_target_entity"],
  );
});

test("source parses but validateCog fails for missing view target", async () => {
  const source = `
view "missing-discipline" as advisory {
  audience: self
}
`.trim();

  const validation = await validateCog(compileCog(parseCog(lex(source))));

  assert.equal(validation.valid, false);
  assert.deepEqual(validation.issues.map((issue) => issue.code), ["missing_view_target"]);
});

test("source parses but validateCog fails for missing resolve target", async () => {
  const source = `
resolve "missing-discipline" to L4 {
  output: routine
}
`.trim();

  const validation = await validateCog(compileCog(parseCog(lex(source))));

  assert.equal(validation.valid, false);
  assert.deepEqual(validation.issues.map((issue) => issue.code), ["missing_resolution_target"]);
});

test("source parses but validateCog fails for missing constrain target entity", async () => {
  const source = `
constrain {
  target: "missing-discipline"
  max_steps: 4
}
`.trim();

  const validation = await validateCog(compileCog(parseCog(lex(source))));

  assert.equal(validation.valid, false);
  assert.deepEqual(validation.issues.map((issue) => issue.code), ["missing_constraint_target"]);
});

import assert from "node:assert/strict";
import test from "node:test";
import { WorkflowRefactoringService } from "../service/workflowRefactoringService";
import { compileCog, lex, parseCog, validateCog } from "../index";

test("WorkflowRefactoringService extracts sub-workflows and inlines workflows deterministically", async () => {
  const service = new WorkflowRefactoringService();

  const source = `define entity "sensor-a" {
  kind: "observation"
  level: L1
  value: "x"
}

define entity "finding-b" {
  kind: "alert"
  level: L2
  value: "y"
}

define entity "isolated-c" {
  kind: "observation"
  level: L1
  value: "z"
}

relate "sensor-a" -> "finding-b" {
  kind: "links"
  operation: "relate"
}
`;

  // 1. Extract sub-workflow
  const extracted = service.extractSubWorkflow(source, ["sensor-a", "finding-b"]);

  // Must contain sensor-a, finding-b and relate, but NOT isolated-c
  assert.ok(extracted.includes('define entity "sensor-a"'));
  assert.ok(extracted.includes('define entity "finding-b"'));
  assert.ok(extracted.includes('relate "sensor-a" -> "finding-b"'));
  assert.equal(extracted.includes('define entity "isolated-c"'), false);

  // Validate compiled IR of extracted block
  const irExtracted = compileCog(parseCog(lex(extracted)));
  const validationExt = await validateCog(irExtracted, {
    context: { runId: "test-refactor", mode: "batch", startedAt: new Date().toISOString() }
  });
  assert.equal(validationExt.valid, true);

  // 2. Inline workflow
  const parent = `define entity "parent-sensor" {
  kind: "observation"
  level: L1
  value: "parent-data"
}
`;
  const inlined = service.inlineWorkflow(parent, extracted);

  assert.ok(inlined.includes('define entity "parent-sensor"'));
  assert.ok(inlined.includes('define entity "sensor-a"'));
  assert.ok(inlined.includes('relate "sensor-a" -> "finding-b"'));

  const irInlined = compileCog(parseCog(lex(inlined)));
  const validationInl = await validateCog(irInlined, {
    context: { runId: "test-refactor", mode: "batch", startedAt: new Date().toISOString() }
  });
  assert.equal(validationInl.valid, true);

  // 3. Rename entity test
  const sourceToRename = `define entity "sensor-a" {
  kind: "observation"
  level: L1
  value: "x"
}

relate "sensor-a" -> "finding-b" {
  kind: "links"
  operation: "relate"
}
`;
  const renamed = service.renameEntity(sourceToRename, "sensor-a", "temp-sensor");
  assert.ok(renamed.includes('define entity "temp-sensor"'));
  assert.ok(renamed.includes('relate "temp-sensor" -> "finding-b"'));
  assert.equal(renamed.includes('sensor-a'), false);

  // 4. Merge patterns test
  const patternA = `define entity "sensor-a" {
  kind: "observation"
}
relate "sensor-a" -> "finding-b" {
  kind: "links"
}
`;
  const patternB = `define entity "sensor-a" {
  kind: "observation"
}
define entity "finding-b" {
  kind: "alert"
}
constrain {
  target: "finding-b"
}
`;
  const merged = service.mergePatterns(patternA, patternB);
  assert.ok(merged.includes('define entity "sensor-a"'));
  assert.ok(merged.includes('define entity "finding-b"'));
  assert.ok(merged.includes('relate "sensor-a" -> "finding-b"'));
  assert.ok(merged.includes('constrain'));
  const occurrences = (merged.match(/define entity "sensor-a"/g) || []).length;
  assert.equal(occurrences, 1);
});

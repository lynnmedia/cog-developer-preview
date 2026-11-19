import assert from "node:assert/strict";
import test from "node:test";
import { CogProgramBuilder } from "../builder/cogProgramBuilder";
import { CogAstBuilder } from "../builder/cogAstBuilder";

test("CogProgramBuilder validation detects missing entities and respects escape hatch", () => {
  // Positive case
  const valid = new CogProgramBuilder()
    .entity("e1", { kind: "observation", level: "L1", value: "x" })
    .entity("e2", { kind: "finding", level: "L2", value: "y" })
    .relate("e1", "e2", { kind: "links", operation: "classify" })
    .resolve("e2", "L2")
    .constrain("e1", "observe")
    .emit("e2", "report")
    .build();
  assert.ok(valid);

  // Negative relate source
  assert.throws(() => {
    new CogProgramBuilder()
      .entity("e2", { kind: "finding", level: "L2", value: "y" })
      .relate("e1", "e2", { kind: "links", operation: "classify" })
      .build();
  }, /entity "e1" is not defined/i);

  // Negative relate target
  assert.throws(() => {
    new CogProgramBuilder()
      .entity("e1", { kind: "observation", level: "L1", value: "x" })
      .relate("e1", "e2", { kind: "links", operation: "classify" })
      .build();
  }, /entity "e2" is not defined/i);

  // Negative resolve target
  assert.throws(() => {
    new CogProgramBuilder()
      .resolve("e1", "L2")
      .build();
  }, /entity "e1" is not defined/i);

  // Negative constrain target
  assert.throws(() => {
    new CogProgramBuilder()
      .constrain("e1", "observe")
      .build();
  }, /entity "e1" is not defined/i);

  // Negative emit target
  assert.throws(() => {
    new CogProgramBuilder()
      .emit("e1", "report")
      .build();
  }, /entity "e1" is not defined/i);

  // Escape hatch
  const escaped = new CogProgramBuilder()
    .relate("e1", "e2", { kind: "links", operation: "classify" })
    .build({ skipValidation: true });
  assert.ok(escaped);
});

test("CogAstBuilder validation detects missing entities and respects escape hatch", () => {
  // Positive case
  const validAst = new CogAstBuilder()
    .entity("e1", { kind: "observation", level: "L1", value: "x" })
    .entity("e2", { kind: "finding", level: "L2", value: "y" })
    .relate("e1", "e2", { kind: "links", operation: "classify" })
    .resolve("e2", "L2")
    .constrain("e1", "observe")
    .emit("e2", "report")
    .build();
  assert.ok(validAst);

  // Negative relate
  assert.throws(() => {
    new CogAstBuilder()
      .relate("e1", "e2", { kind: "links", operation: "classify" })
      .build();
  }, /entity "e1" is not defined/i);

  // Escape hatch
  const escapedAst = new CogAstBuilder()
    .relate("e1", "e2", { kind: "links", operation: "classify" })
    .build({ skipValidation: true });
  assert.ok(escapedAst);
});

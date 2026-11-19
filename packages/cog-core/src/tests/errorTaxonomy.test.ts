import assert from "node:assert/strict";
import test from "node:test";
import { COG_ERROR_CODES } from "../index";

test("COG_ERROR_CODES includes valid error taxonomy codes", () => {
  assert.equal(COG_ERROR_CODES.LEX_INVALID_CHARACTER, "LEX_INVALID_CHARACTER");
  assert.equal(COG_ERROR_CODES.PARSE_SYNTAX_ERROR, "PARSE_SYNTAX_ERROR");
  assert.equal(COG_ERROR_CODES.COMPILE_DUPLICATE_ENTITY, "COMPILE_DUPLICATE_ENTITY");
  assert.equal(COG_ERROR_CODES.VALIDATE_CIRCULAR_DEPENDENCY, "VALIDATE_CIRCULAR_DEPENDENCY");
  assert.equal(COG_ERROR_CODES.RUN_LIMIT_EXCEEDED, "RUN_LIMIT_EXCEEDED");
});

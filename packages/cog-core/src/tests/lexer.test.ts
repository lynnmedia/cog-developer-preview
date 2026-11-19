import assert from "node:assert/strict";
import test from "node:test";

import { lex, TOKEN_TYPES } from "../index";

test("lex tokenizes supported keywords for the current parser subset", () => {
  const tokens = lex("define entity transform emit");

  assert.deepEqual(
    tokens.map((token) => token.type),
    [
      TOKEN_TYPES.DEFINE,
      TOKEN_TYPES.ENTITY,
      TOKEN_TYPES.TRANSFORM,
      TOKEN_TYPES.EMIT,
      TOKEN_TYPES.EOF,
    ],
  );
});

test("lex tokenizes supported literals and identifiers", () => {
  const tokens = lex('"alpha" 42 true false null identifier L1 L2 L3 L4 L5 45min 2h 7d');

  assert.deepEqual(
    tokens.map((token) => token.type),
    [
      TOKEN_TYPES.STRING,
      TOKEN_TYPES.NUMBER,
      TOKEN_TYPES.BOOLEAN,
      TOKEN_TYPES.BOOLEAN,
      TOKEN_TYPES.NULL,
      TOKEN_TYPES.IDENTIFIER,
      TOKEN_TYPES.LEVEL_L1,
      TOKEN_TYPES.LEVEL_L2,
      TOKEN_TYPES.LEVEL_L3,
      TOKEN_TYPES.LEVEL_L4,
      TOKEN_TYPES.LEVEL_L5,
      TOKEN_TYPES.DURATION,
      TOKEN_TYPES.DURATION,
      TOKEN_TYPES.DURATION,
      TOKEN_TYPES.EOF,
    ],
  );
  assert.deepEqual(
    tokens.slice(0, -1).map((token) => token.lexeme),
    ["alpha", "42", "true", "false", "null", "identifier", "L1", "L2", "L3", "L4", "L5", "45min", "2h", "7d"],
  );
});

test("lex tokenizes punctuation including arrow", () => {
  const tokens = lex("{ } [ ] : , ->");

  assert.deepEqual(
    tokens.map((token) => token.type),
    [
      TOKEN_TYPES.LEFT_BRACE,
      TOKEN_TYPES.RIGHT_BRACE,
      TOKEN_TYPES.LEFT_BRACKET,
      TOKEN_TYPES.RIGHT_BRACKET,
      TOKEN_TYPES.COLON,
      TOKEN_TYPES.COMMA,
      TOKEN_TYPES.ARROW,
      TOKEN_TYPES.EOF,
    ],
  );
});

test("lex ignores single-line comments", () => {
  const tokens = lex(`
define // comment after keyword
entity "discipline" // trailing comment
// full line comment
emit
`.trim());

  assert.deepEqual(
    tokens.map((token) => token.type),
    [
      TOKEN_TYPES.DEFINE,
      TOKEN_TYPES.ENTITY,
      TOKEN_TYPES.STRING,
      TOKEN_TYPES.EMIT,
      TOKEN_TYPES.EOF,
    ],
  );
});

test("lex records representative line, column, and span metadata", () => {
  const tokens = lex(`
define entity "discipline" {
  duration: 45min
}
`.trim());

  const defineToken = tokens[0];
  const stringToken = tokens[2];
  const durationToken = tokens[6];

  assert.equal(defineToken?.span.start.line, 1);
  assert.equal(defineToken?.span.start.column, 1);
  assert.equal(defineToken?.span.end.column, 7);

  assert.equal(stringToken?.lexeme, "discipline");
  assert.equal(stringToken?.span.start.line, 1);
  assert.equal(stringToken?.span.start.column, 15);
  assert.equal(stringToken?.span.end.column, 27);

  assert.equal(durationToken?.type, TOKEN_TYPES.DURATION);
  assert.equal(durationToken?.span.start.line, 2);
  assert.equal(durationToken?.span.start.column, 13);
  assert.equal(durationToken?.span.end.column, 18);
});

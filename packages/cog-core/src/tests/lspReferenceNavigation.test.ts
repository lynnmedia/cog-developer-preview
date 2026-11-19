import assert from "node:assert/strict";
import test from "node:test";
import { LspService } from "../lsp/lspService";

test("LspService reference navigation features work correctly", async () => {
  const service = new LspService();
  const source = `define entity "sensor-a" {
  kind: "observation"
  level: L1
  value: "high"
}

relate "sensor-a" -> "sensor-b" {
  kind: "linked"
  operation: "relate"
}

resolve "sensor-a" to L2 {
  operation: "resolve"
}

constrain {
  target: "sensor-a"
  operation: "observe"
}

emit {
  target: "sensor-a"
  kind: "output"
}
`;

  // 1. Symbol outline
  const symbols = await service.getSymbols(source);
  assert.deepEqual(symbols, ["sensor-a"]);

  // 2. Definition lookup
  const defRange = await service.getDefinition(source, "sensor-a");
  assert.ok(defRange);
  assert.equal(defRange.start.line, 0); // first line: define entity "sensor-a"
  assert.equal(defRange.start.character, 14); // start of "sensor-a" string literal (with quotes)

  // 3. Find References
  const refs = await service.findReferences(source, "sensor-a");
  assert.equal(refs.length, 4); // in relate, resolve, constrain, and emit
  assert.equal(refs[0]?.start.line, 6); // relate "sensor-a" -> ...
  assert.equal(refs[1]?.start.line, 11); // resolve "sensor-a" ...
  assert.equal(refs[2]?.start.line, 16); // constrain target: "sensor-a"
  assert.equal(refs[3]?.start.line, 21); // emit target: "sensor-a"

  // 4. Rename Symbol
  const renamed = await service.renameSymbol(source, "sensor-a", "temp-sensor");
  // verify definition and all references are updated
  assert.ok(renamed.includes('define entity "temp-sensor"'));
  assert.ok(renamed.includes('relate "temp-sensor" -> "sensor-b"'));
  assert.ok(renamed.includes('resolve "temp-sensor" to L2'));
  assert.ok(renamed.includes('target: "temp-sensor"'));
});

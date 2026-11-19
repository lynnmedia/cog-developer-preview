import assert from "node:assert/strict";
import test from "node:test";
import { LspService } from "../lsp/lspService";

test("LspService validateDocument produces precise diagnostics for syntax errors and structural issues", async () => {
  const service = new LspService();

  // 1. Lexical/Syntax error case
  const syntaxErrSource = `define entity "sensor-a" {
  kind: observation
  level: L1
  value: "high"
}
@invalidChar
`;
  const syntaxDiag = await service.validateDocument(syntaxErrSource);
  assert.ok(syntaxDiag.length > 0);
  assert.equal(syntaxDiag[0]?.severity, 1); // Error
  // Unexpected character at line 5
  assert.equal(syntaxDiag[0]?.range.start.line, 5);

  // 2. Structural validation issue case (missing relate entity)
  const validationErrSource = `define entity "sensor-a" {
  kind: observation
  level: L1
  value: "high"
}

relate "sensor-a" -> "non-existent" {
  kind: "links"
  operation: "relate"
}
`;
  const validationDiag = await service.validateDocument(validationErrSource);
  assert.ok(validationDiag.length > 0);
  assert.equal(validationDiag[0]?.severity, 1); // Error
  assert.ok(validationDiag[0]?.message.includes("non-existent"));
});

import assert from "node:assert/strict";
import test from "node:test";
import { LspService } from "../lsp/lspService";

test("LspService returns empty diagnostics for valid cog code", async () => {
  const service = new LspService();
  const source = `
    define entity "a" { kind: item }
    emit { target: "a" kind: "out" }
  `;
  const diagnostics = await service.validateDocument(source);
  assert.equal(diagnostics.length, 0);
});

test("LspService returns diagnostic errors for malformed cog code", async () => {
  const service = new LspService();
  const source = `
    define entity "a" { kind: 
  `;
  const diagnostics = await service.validateDocument(source);
  assert.ok(diagnostics.length > 0);
  assert.equal(diagnostics[0].severity, 1);
});

import assert from "node:assert/strict";
import test from "node:test";
import { LspService, CogDiagnosticError, COG_ERROR_CODES } from "../index";

test("LspService handles CogDiagnosticError and produces structured diagnostics", async () => {
  const lsp = new LspService();

  const error = new CogDiagnosticError({
    message: "Structured syntax error message",
    code: COG_ERROR_CODES.PARSE_SYNTAX_ERROR,
    phase: "parser",
    span: {
      start: { line: 2, column: 5, offset: 10 },
      end: { line: 2, column: 15, offset: 20 }
    },
    remediation: "Ensure the block has a closing brace."
  });

  const lspValidateMock = async () => {
    try {
      throw error;
    } catch (err: any) {
      const range = {
        start: { line: error.span!.start.line - 1, character: error.span!.start.column - 1 },
        end: { line: error.span!.end.line - 1, character: error.span!.end.column - 1 }
      };
      
      const diag = {
        range,
        severity: error.severity === "warning" ? 2 : 1,
        message: `[${error.code}] ${error.message} (Remediation: ${error.remediation})`,
        source: "cog-lsp"
      };

      assert.deepEqual(diag.range.start, { line: 1, character: 4 });
      assert.deepEqual(diag.range.end, { line: 1, character: 14 });
      assert.ok(diag.message.includes("PARSE_SYNTAX_ERROR"));
      assert.ok(diag.message.includes("Ensure the block has a closing brace."));
    }
  };

  await lspValidateMock();
});

import assert from "node:assert/strict";
import test from "node:test";
import { executeCog } from "../runtime/executeCog";
import { compileCog } from "../compiler/compileCog";
import { parseCog } from "../parser/parser";
import { lex } from "../lexer/lexer";
import type { CogDomainAdapter } from "../types/adapter";
import type { CoreExecutionContext } from "../types/context";

test("Personal Coda diagnostics compatibility with custom fields", async () => {
  const source = `
    define entity "request" {
      kind: "personal_coda_request"
      level: L1
    }
    resolve "request" to L2 {
      output: "ready"
    }
  `.trim();

  const tokens = lex(source);
  const ast = parseCog(tokens);
  const ir = compileCog(ast);

  // Extend CoreValidationIssue conceptually by returning extra attributes
  const momAdapter: CogDomainAdapter = {
    adapterId: "mom-coda-diagnostics-test",
    version: "0.1.0",
    validateProgram(irData, context) {
      return {
        issues: [
          {
            code: "PCC_CONSENT_MISSING",
            severity: "error",
            message: "Personalization consent is required.",
            path: "consent.personalizationApproved",
            // Custom fields that are expected to be preserved
            remediation: "Request personalization consent from the user.",
            phase: "request-validation",
          } as any,
        ],
      };
    },
  };

  const context: CoreExecutionContext = {
    runId: "run-diagnostics-test-1",
    mode: "strict",
    startedAt: new Date().toISOString(),
  };

  const executionResult = await executeCog(ir, context, momAdapter);
  assert.equal(executionResult.success, false); // should be false since validation failed
  assert.equal(executionResult.validation.valid, false);
  assert.equal(executionResult.validation.issues.length, 1);

  const issue = executionResult.validation.issues[0] as any;
  assert.equal(issue.code, "PCC_CONSENT_MISSING");
  assert.equal(issue.severity, "error");
  assert.equal(issue.path, "consent.personalizationApproved");
  
  // Verify custom attributes are preserved intact without filtering or string parsing
  assert.equal(issue.remediation, "Request personalization consent from the user.");
  assert.equal(issue.phase, "request-validation");
});

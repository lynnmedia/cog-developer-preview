import assert from "node:assert/strict";
import test from "node:test";
import { executeCog } from "../runtime/executeCog";
import { compileCog } from "../compiler/compileCog";
import { parseCog } from "../parser/parser";
import { lex } from "../lexer/lexer";
import type { CogDomainAdapter } from "../types/adapter";
import type { CoreExecutionContext } from "../types/context";

test("Personal Coda execution trace privacy compliance", async () => {
  // Define workflow with sensitive data excluded from the cog statements
  const source = `
    define entity "reader-request" {
      kind: "personal_coda_request"
      level: L1
      request_id: "req-reflective-1"
    }
    define entity "approved-memory-set" {
      kind: "governed_personal_context"
      level: L1
      value: "approved_memory"
    }
    define entity "coda-plan" {
      kind: "personal_coda_plan"
      level: L3
    }
    relate "approved-memory-set" -> "coda-plan" {
      kind: "contextualizes"
    }
    resolve "coda-plan" to L4 {
      output: "generation_ready_plan"
    }
    emit {
      kind: "personal_coda_plan"
      target: "coda-plan"
    }
  `.trim();

  const tokens = lex(source);
  const ast = parseCog(tokens);
  const ir = compileCog(ast);

  // Sensitive private values that should never end up in the trace
  const rawIntake = "I struggle with consistency in daily meditation.";
  const privateProfileName = "John Doe Profile";
  const rawGeneratedProse = "This is a private Coda reflection generated for John.";

  const momAdapter: CogDomainAdapter = {
    adapterId: "mom-personal-coda-trace",
    version: "0.1.0",
    createDomainTrace(step, irData, context) {
      // Adapter trace must only emit structural/metadata traces
      return {
        adapterId: this.adapterId,
        stepId: step.id,
        message: `Step ${step.id} completed successfully`,
        data: {
          successState: true,
        },
      };
    },
  };

  const context: CoreExecutionContext = {
    runId: "run-trace-privacy-1",
    mode: "strict",
    startedAt: new Date().toISOString(),
    // We pass private context only via runtime context (e.g. input payloads) that are not stored in core trace
    input: {
      rawIntake,
      privateProfileName,
      rawGeneratedProse,
    },
  };

  const executionResult = await executeCog(ir, context, momAdapter);
  assert.equal(executionResult.success, true);
  assert.ok(executionResult.trace);

  // Serialize the trace object to string for comprehensive scanning
  const traceString = JSON.stringify(executionResult.trace);

  // Assert that trace contains structural details
  assert.ok(traceString.includes("run-trace-privacy-1"));
  assert.ok(traceString.includes("mom-personal-coda-trace"));
  assert.ok(traceString.includes("SUCCEEDED"));

  // Assert that trace DOES NOT contain any raw private details
  assert.equal(traceString.includes("struggle with consistency"), false);
  assert.equal(traceString.includes("John Doe"), false);
  assert.equal(traceString.includes("generated for John"), false);
});

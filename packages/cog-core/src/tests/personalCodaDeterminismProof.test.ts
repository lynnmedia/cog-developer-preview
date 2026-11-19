import assert from "node:assert/strict";
import test from "node:test";
import { executeCog } from "../runtime/executeCog";
import { compileCog } from "../compiler/compileCog";
import { parseCog } from "../parser/parser";
import { lex } from "../lexer/lexer";
import type { CogDomainAdapter } from "../types/adapter";
import type { CoreExecutionContext } from "../types/context";

// Helper to normalize transient values in execution trace
function normalizeTrace(trace: any): any {
  return {
    ...trace,
    runId: "normalized-run-id",
    startedAt: "normalized-time",
    completedAt: "normalized-time",
    steps: (trace.steps ?? []).map((step: any) => ({
      ...step,
      startedAt: "normalized-time",
      completedAt: "normalized-time",
    })),
  };
}

function normalizeIr(ir: any): any {
  return {
    ...ir,
    meta: ir.meta ? {
      ...ir.meta,
      compiledAt: "normalized-time",
    } : undefined,
  };
}

test("Personal Coda workflow execution determinism", async () => {
  const source = `
    define entity "reader-request" {
      kind: "personal_coda_request"
      level: L1
      request_id: "req-1"
    }
    define entity "perspective" {
      kind: "perspective_selection"
      level: L2
      value: "personal_reflective"
    }
    define entity "coda-plan" {
      kind: "personal_coda_plan"
      level: L3
    }
    relate "perspective" -> "coda-plan" {
      kind: "governs"
    }
    resolve "coda-plan" to L4 {
      output: "generation_ready"
    }
    emit {
      kind: "personal_coda_plan"
      target: "coda-plan"
    }
  `.trim();

  const momAdapter: CogDomainAdapter = {
    adapterId: "mom-personal-coda-determinism",
    version: "0.1.0",
    mapLevel(level) {
      return "R" + level.slice(1);
    },
    mapEmission(emission, irData, context) {
      return {
        emissionId: emission.id,
        adapterId: this.adapterId,
        target: emission.targetRef,
        kind: "mom_personal_coda_plan",
        payload: {
          targetRef: emission.targetRef,
        },
      };
    },
  };

  const runs: any[] = [];

  for (let i = 0; i < 5; i++) {
    const tokens = lex(source);
    const ast = parseCog(tokens);
    const ir = compileCog(ast);

    const context: CoreExecutionContext = {
      runId: `run-id-${i}`,
      mode: "strict",
      startedAt: new Date().toISOString(),
    };

    const executionResult = await executeCog(ir, context, momAdapter);
    assert.equal(executionResult.success, true);

    runs.push({
      ir: JSON.stringify(normalizeIr(ir)),
      emissions: JSON.stringify(executionResult.emissions),
      validation: JSON.stringify(executionResult.validation),
      trace: normalizeTrace(executionResult.trace),
    });
  }

  // Assert that run 1 to 5 are structurally identical
  for (let i = 1; i < runs.length; i++) {
    assert.equal(runs[i].ir, runs[0].ir, `IR mismatch at run ${i}`);
    assert.equal(runs[i].emissions, runs[0].emissions, `Emissions mismatch at run ${i}`);
    assert.equal(runs[i].validation, runs[0].validation, `Validation mismatch at run ${i}`);
    assert.deepEqual(runs[i].trace, runs[0].trace, `Trace mismatch at run ${i}`);
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import { executeCog } from "../runtime/executeCog";
import { compileCog } from "../compiler/compileCog";
import { parseCog } from "../parser/parser";
import { lex } from "../lexer/lexer";
import { validateCog } from "../validator/validateCog";
import type { CogDomainAdapter } from "../types/adapter";
import type { CoreExecutionContext } from "../types/context";

test("Personal Coda validation workflow representation compilation and execution", async () => {
  // A program modeling the validation checks as entities and relations contributing to a validation run status
  const source = `
    define entity "validation-run" {
      kind: "personal_coda_validation"
      level: L1
      coda_id: "draft-1"
      plan_id: "plan-reflective-1"
    }

    define entity "language-check" {
      kind: "validation_phase"
      level: L1
      status: "pass"
    }

    define entity "canonical-check" {
      kind: "validation_phase"
      level: L1
      status: "pass"
    }

    define entity "uncertainty-check" {
      kind: "validation_phase"
      level: L1
      status: "fail"
    }

    relate "language-check" -> "validation-run" {
      kind: "contributes_to"
    }

    relate "canonical-check" -> "validation-run" {
      kind: "contributes_to"
    }

    relate "uncertainty-check" -> "validation-run" {
      kind: "contributes_to"
    }

    constrain {
      target: "validation-run"
      integrity: "strict"
    }

    resolve "validation-run" to L2 {
      output: "revision_required"
    }

    emit {
      kind: "personal_coda_validation"
      target: "validation-run"
    }
  `.trim();

  // 1. Lexing & Parsing
  const tokens = lex(source);
  const ast = parseCog(tokens);
  assert.ok(ast);

  // 2. Compilation
  const ir = compileCog(ast);
  assert.ok(ir);
  assert.equal(ir.entities.length, 4);
  assert.equal(ir.relations.length, 3);
  assert.equal(ir.constraints.length, 1);
  assert.equal(ir.resolutions.length, 1);

  // 3. Validation
  const validation = await validateCog(ir);
  assert.equal(validation.valid, true);

  // 4. Execution
  const momAdapter: CogDomainAdapter = {
    adapterId: "mom-personal-coda-validation",
    version: "0.1.0",
    mapLevel(level) {
      return "R" + level.slice(1);
    },
    mapEmission(emission, irData, context) {
      return {
        emissionId: emission.id,
        adapterId: this.adapterId,
        target: emission.targetRef,
        kind: "mom_personal_coda_validation",
        payload: {
          determination: "REVISION_REQUIRED",
          checks: [
            { code: "PCC_UNCERTAINTY_ERASURE", status: "fail", message: "Uncertainty was erased." }
          ],
        },
      };
    },
    createDomainTrace(step, irData, context) {
      return {
        adapterId: this.adapterId,
        stepId: step.id,
        message: `Step ${step.id} verified validation phase ${step.phase}`,
      };
    },
  };

  const context: CoreExecutionContext = {
    runId: "run-validation-proof-1",
    mode: "strict",
    startedAt: new Date().toISOString(),
  };

  const executionResult = await executeCog(ir, context, momAdapter);
  assert.equal(executionResult.success, true);
  assert.equal(executionResult.emissions.length, 1);
  assert.equal(executionResult.emissions[0].kind, "mom_personal_coda_validation");
  
  const payload = executionResult.emissions[0].payload;
  assert.equal(payload.determination, "REVISION_REQUIRED");
  assert.equal((payload.checks as any[]).length, 1);
  assert.equal((payload.checks as any[])[0].code, "PCC_UNCERTAINTY_ERASURE");
  assert.ok(executionResult.trace);
});

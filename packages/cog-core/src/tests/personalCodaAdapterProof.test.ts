import assert from "node:assert/strict";
import test from "node:test";
import { executeCog } from "../runtime/executeCog";
import { compileCog } from "../compiler/compileCog";
import { parseCog } from "../parser/parser";
import { lex } from "../lexer/lexer";
import type { CogDomainAdapter } from "../types/adapter";
import type { CoreExecutionContext } from "../types/context";

test("Personal Coda adapter contract proof mapping rules", async () => {
  // Define a program structured like the Personal Coda planning workflow
  const source = `
    define entity "reader-request" {
      kind: "personal_coda_request"
      level: L1
    }
    define entity "reader-consent" {
      kind: "consent_state"
      level: L1
    }
    define entity "approved-memory-set" {
      kind: "governed_personal_context"
      level: L1
    }
    define entity "perspective-mode" {
      kind: "perspective_selection"
      level: L2
    }
    define entity "coda-plan" {
      kind: "personal_coda_plan"
      level: L3
    }

    relate "reader-consent" -> "approved-memory-set" {
      kind: "permits"
    }
    relate "approved-memory-set" -> "coda-plan" {
      kind: "contextualizes"
    }

    constrain {
      target: "coda-plan"
      privacy: "strict"
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

  // Implement the MoM adapter interface using neutral mapping callbacks
  const momAdapter: CogDomainAdapter = {
    adapterId: "mom-personal-coda",
    version: "0.1.0",

    mapLevel(level) {
      const mapping: Record<string, string> = {
        L1: "R1",
        L2: "R2",
        L3: "R3",
        L4: "R4",
        L5: "R5",
      };
      return mapping[level] || "R3";
    },

    mapRelationKind(kind) {
      const mapping: Record<string, string> = {
        permits: "mom_permits",
        grounds: "mom_grounds",
        contextualizes: "mom_contextualizes",
        governs: "mom_governs",
        shapes: "mom_shapes",
        qualifies: "mom_qualifies",
      };
      return mapping[kind] || kind;
    },

    mapViewKind(kind) {
      const mapping: Record<string, string> = {
        personal_reflective: "reflective_mode",
        personal_advisory: "advisory_mode",
        personal_integrative: "integrative_mode",
      };
      return mapping[kind] || kind;
    },

    mapEmissionKind(kind) {
      if (kind === "personal_coda_plan") {
        return "mom_personal_coda_plan";
      }
      return kind;
    },

    mapEmission(emission, irData, context) {
      const kind = this.mapEmissionKind ? this.mapEmissionKind(emission.emissionKind) : emission.emissionKind;
      return {
        emissionId: emission.id,
        adapterId: this.adapterId,
        target: emission.targetRef,
        kind,
        payload: {
          targetRef: emission.targetRef,
          attributes: emission.attributes,
        },
      };
    },

    createDomainTrace(step, irData, context) {
      return {
        adapterId: "mom-personal-coda",
        stepId: step.id,
        message: `Validated step ${step.id} for phase ${step.phase}`,
        data: {
          traceLabel: `mom_trace_${step.phase}`,
        },
      };
    },
  };

  const context: CoreExecutionContext = {
    runId: "run-acceptance-proof-1",
    mode: "strict",
    startedAt: new Date().toISOString(),
  };

  const result = await executeCog(ir, context, momAdapter);
  assert.equal(result.success, true);
  assert.equal(result.adapterId, "mom-personal-coda");

  // Verify emission mappings
  assert.equal(result.emissions.length, 1);
  const emission = result.emissions[0];
  assert.equal(emission.kind, "mom_personal_coda_plan"); // mapped by mapEmissionKind
  assert.equal(emission.payload.targetRef, "coda-plan");
  assert.equal(emission.payload.targetLevel, "L3");
  assert.equal(emission.payload.mappedLevel, "R3"); // mapped by mapLevel

  // Verify relation mappings
  const relations = emission.payload.relations as any[];
  assert.ok(relations.length > 0);
  const contextualizesRel = relations.find(r => r.relationKind === "contextualizes");
  assert.ok(contextualizesRel);
  assert.equal(contextualizesRel.mappedRelationKind, "mom_contextualizes"); // mapped by mapRelationKind

  // Verify trace mappings
  assert.ok(result.trace);
  assert.ok(result.trace.steps.length > 0);
  const bindStep = result.trace.steps.find(s => s.phase === "bind");
  assert.ok(bindStep);
  assert.ok(bindStep.domainTrace);
  assert.equal(bindStep.domainTrace[0].adapterId, "mom-personal-coda");
  assert.equal(bindStep.domainTrace[0].data?.traceLabel, "mom_trace_bind"); // mapped by createDomainTrace
});

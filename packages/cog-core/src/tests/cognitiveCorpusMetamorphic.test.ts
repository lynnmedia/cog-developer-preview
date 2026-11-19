import assert from "node:assert/strict";
import test, { describe } from "node:test";
import {
  runCognitiveScenario,
  createCognitiveScenario,
  CogProgramBuilder,
  lex,
  parseCog,
  compileCog,
  executeCog,
  assertCogOutput,
  assertBlocked,
  evaluateToolEvidenceInfluence,
} from "../index";

describe("Cognitive Corpus: Metamorphic Relations (Class 6)", () => {
  // Relation 1: Irrelevant-Context Stability
  test("MR-1A: Irrelevant Environment Variables Stability", async () => {
    const baseScenario = createCognitiveScenario({
      id: "MR-1A-base",
      name: "Base Research Execution",
      given: {
        context: { environment: { REQUIRED_VAR: "active" } },
        source: `
          define entity "core-claim" { kind: "claim" level: L1 }
          resolve "core-claim" to L2 { status: "valid" }
          emit { target: "core-claim" kind: "claim_out" }
        `,
      },
    });

    const extendedScenario = createCognitiveScenario({
      id: "MR-1A-extended",
      name: "Irrelevant Context Extended Research Execution",
      given: {
        context: {
          environment: {
            REQUIRED_VAR: "active",
            IRRELEVANT_DEBUG_FLAG: "verbose_extra",
            UNUSED_REGION_CODE: "us-west-9",
          },
        },
        source: `
          define entity "core-claim" { kind: "claim" level: L1 }
          resolve "core-claim" to L2 { status: "valid" }
          emit { target: "core-claim" kind: "claim_out" }
        `,
      },
    });

    const baseResult = await runCognitiveScenario(baseScenario);
    const extResult = await runCognitiveScenario(extendedScenario);

    assert.equal(baseResult.passed, true);
    assert.equal(extResult.passed, true);
    // Metamorphic Assertion: Output emissions and trace step count must remain identical
    assert.deepEqual(baseResult.executionResult?.emissions, extResult.executionResult?.emissions);
    assert.equal(
      baseResult.executionResult?.trace.steps.length,
      extResult.executionResult?.trace.steps.length,
    );
  });

  test("MR-1B: Irrelevant Entity Metadata Stability", async () => {
    const baseScenario = createCognitiveScenario({
      id: "MR-1B-base",
      name: "Base Entity Resolution",
      given: {
        source: `
          define entity "target-e" { kind: "node" level: L1 }
          resolve "target-e" to L2 { status: "verified" }
          emit { target: "target-e" kind: "node_emit" }
        `,
      },
    });

    const annotatedScenario = createCognitiveScenario({
      id: "MR-1B-annotated",
      name: "Irrelevant Entity Metadata Annotated Resolution",
      given: {
        source: `
          define entity "target-e" {
            kind: "node"
            level: L1
            ui_display_color: "#ffffff"
            ui_icon_name: "circle"
            client_render_order: 99
          }
          resolve "target-e" to L2 { status: "verified" }
          emit { target: "target-e" kind: "node_emit" }
        `,
      },
    });

    const baseRes = await runCognitiveScenario(baseScenario);
    const annRes = await runCognitiveScenario(annotatedScenario);

    assert.equal(baseRes.passed, true);
    assert.equal(annRes.passed, true);
    assert.equal(baseRes.executionResult?.emissions[0].kind, annRes.executionResult?.emissions[0].kind);
  });

  // Relation 2: Representation Equivalence
  test("MR-2A: Programmatic Builder vs Text Source Equivalence", async () => {
    const textSource = `
      define entity "prog-e" { kind: "entity" level: L1 }
      resolve "prog-e" to L2 { reason: "tested" }
      emit { target: "prog-e" kind: "prog_out" }
    `.trim();

    const builder = new CogProgramBuilder();
    builder.entity("prog-e", { kind: "entity", level: "L1" });
    builder.resolve("prog-e", "L2", { reason: "tested" });
    builder.emit("prog-e", "prog_out");
    const builderSource = builder.build();

    const textRes = await runCognitiveScenario(createCognitiveScenario({
      id: "MR-2A-text",
      name: "Text source",
      given: { source: textSource },
    }));

    const builderRes = await runCognitiveScenario(createCognitiveScenario({
      id: "MR-2A-builder",
      name: "Builder source",
      given: { source: builderSource },
    }));

    assert.equal(textRes.passed, true);
    assert.equal(builderRes.passed, true);
    assert.deepEqual(textRes.executionResult?.emissions, builderRes.executionResult?.emissions);
  });

  test("MR-2B: Permutation of Independent Declarations Equivalence", async () => {
    const orderA = `
      define entity "ent-1" { kind: "k1" level: L1 }
      define entity "ent-2" { kind: "k2" level: L1 }
      emit { target: "ent-1" kind: "e1" }
      emit { target: "ent-2" kind: "e2" }
    `;

    const orderB = `
      define entity "ent-2" { kind: "k2" level: L1 }
      define entity "ent-1" { kind: "k1" level: L1 }
      emit { target: "ent-1" kind: "e1" }
      emit { target: "ent-2" kind: "e2" }
    `;

    const resA = await runCognitiveScenario(createCognitiveScenario({
      id: "MR-2B-a",
      name: "Order A",
      given: { source: orderA },
    }));

    const resB = await runCognitiveScenario(createCognitiveScenario({
      id: "MR-2B-b",
      name: "Order B",
      given: { source: orderB },
    }));

    assert.equal(resA.passed, true);
    assert.equal(resB.passed, true);
    assert.equal(resA.executionResult?.emissions.length, 2);
    assert.equal(resB.executionResult?.emissions.length, 2);
  });

  // Relation 3: Evidence Monotonicity
  test("MR-3A: Corroborating Evidence Does Not Exceed Declared Level", async () => {
    const singleEvidence = `
      define entity "hyp" { kind: "hypothesis" level: L1 }
      define entity "ev-1" { kind: "ev" level: L1 }
      relate "ev-1" -> "hyp" { kind: "supports" }
      resolve "hyp" to L2 { status: "corroborated" }
      emit { target: "hyp" kind: "hyp_out" }
    `;

    const doubleEvidence = `
      define entity "hyp" { kind: "hypothesis" level: L1 }
      define entity "ev-1" { kind: "ev" level: L1 }
      define entity "ev-2" { kind: "ev" level: L1 }
      relate "ev-1" -> "hyp" { kind: "supports" }
      relate "ev-2" -> "hyp" { kind: "supports" }
      resolve "hyp" to L2 { status: "corroborated" }
      emit { target: "hyp" kind: "hyp_out" }
    `;

    const res1 = await runCognitiveScenario(createCognitiveScenario({
      id: "MR-3A-1",
      name: "Single Evidence",
      given: { source: singleEvidence },
    }));

    const res2 = await runCognitiveScenario(createCognitiveScenario({
      id: "MR-3A-2",
      name: "Double Evidence",
      given: { source: doubleEvidence },
    }));

    assert.equal(res1.passed, true);
    assert.equal(res2.passed, true);
    // Monotonicity: Additional evidence did not cause spurious escalation or failure
    assert.equal(res1.executionResult?.emissions[0].kind, "hyp_out");
    assert.equal(res2.executionResult?.emissions[0].kind, "hyp_out");
  });

  test("MR-3B: Corroborating Tool Evidence Epistemic Influence Monotonicity", () => {
    const targetClaim = {
      statement: "Build pipeline integrity",
      scope: "project:build",
      confidence: 0.8,
      authorityLevel: "project" as const,
    };

    const moderateEvidence = {
      evidenceId: "ev-mod-01",
      epistemicRole: "MEASUREMENT" as const,
      governanceAuthority: "situational" as const,
      evidentiaryStrength: "corroborative" as const,
      sourceReliability: "calibrated_hardware" as const,
      scope: "project:build",
      observedAt: new Date().toISOString(),
      confidence: 0.70,
      data: { linterPassRate: 0.70 },
      limitations: [],
      tensionsSurfaced: [],
      provenance: { toolId: "tool:ci", executionInvocationId: "inv-1" },
    };

    const highConfidenceEvidence = {
      evidenceId: "ev-high-01",
      epistemicRole: "MEASUREMENT" as const,
      governanceAuthority: "situational" as const,
      evidentiaryStrength: "decisive" as const,
      sourceReliability: "calibrated_hardware" as const,
      scope: "project:build",
      observedAt: new Date().toISOString(),
      confidence: 0.99,
      data: { linterPassRate: 0.99 },
      limitations: [],
      tensionsSurfaced: [],
      provenance: { toolId: "tool:ci", executionInvocationId: "inv-2" },
    };

    const inf1 = evaluateToolEvidenceInfluence(targetClaim, moderateEvidence as any);
    const inf2 = evaluateToolEvidenceInfluence(targetClaim, highConfidenceEvidence as any);

    // Monotonicity: Higher confidence tool evidence yields >= effective confidence
    assert.ok(inf2.effectiveConfidence >= inf1.effectiveConfidence);
  });

  // Relation 4: Restriction Monotonicity
  test("MR-4A: Adding STRICT Constraint Monotonically Restricts Execution", async () => {
    const unconstrainedSource = `
      define entity "doc" { kind: "document" level: L1 }
      relate "doc" -> "external-unverified" { kind: "ref" }
      emit { target: "doc" kind: "doc_out" }
    `;

    // Without strict constraint, unresolved relation target is caught at validation
    const unconstrainedRes = await runCognitiveScenario(createCognitiveScenario({
      id: "MR-4A-unconstrained",
      name: "Unconstrained",
      given: { source: unconstrainedSource },
      expected: { success: false, blocked: true },
    }));

    const constrainedSource = `
      define entity "doc" { kind: "document" level: L1 }
      constrain {
        target: "doc"
        mode: STRICT
      }
      relate "doc" -> "external-unverified" { kind: "ref" }
      emit { target: "doc" kind: "doc_out" }
    `;

    const constrainedRes = await runCognitiveScenario(createCognitiveScenario({
      id: "MR-4A-constrained",
      name: "Constrained",
      given: { source: constrainedSource },
      expected: { success: false, blocked: true },
    }));

    // Monotonicity: Adding STRICT constraint cannot make an invalid/blocked program suddenly succeed
    assert.equal(unconstrainedRes.passed, true);
    assert.equal(constrainedRes.passed, true);
  });

  test("MR-4B: Restriction Monotonicity on Constraint Enforcement", async () => {
    const validBase = `
      define entity "base-ent" { kind: "entity" level: L1 }
      resolve "base-ent" to L2 { status: "ok" }
      emit { target: "base-ent" kind: "out" }
    `;

    const validRes = await runCognitiveScenario(createCognitiveScenario({
      id: "MR-4B-valid",
      name: "Valid Base",
      given: { source: validBase },
      expected: { success: true },
    }));

    const brokenConstraint = `
      define entity "base-ent" { kind: "entity" level: L1 }
      constrain {
        target: "base-ent"
        mode: STRICT
      }
      relate "base-ent" -> "missing-dependency" { kind: "requires" }
      resolve "base-ent" to L2 { status: "ok" }
      emit { target: "base-ent" kind: "out" }
    `;

    const brokenRes = await runCognitiveScenario(createCognitiveScenario({
      id: "MR-4B-broken",
      name: "Broken with Strict Constraint",
      given: { source: brokenConstraint },
      expected: { success: false, blocked: true },
    }));

    assert.equal(validRes.passed, true);
    assert.equal(brokenRes.passed, true);
  });
});

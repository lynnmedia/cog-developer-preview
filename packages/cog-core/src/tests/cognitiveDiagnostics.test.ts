import assert from "node:assert/strict";
import test, { describe } from "node:test";
import {
  createCognitiveScenario,
  diagnoseCognitiveScenario,
  formatCognitiveDiagnostic,
  formatCognitiveDiagnosticReport,
  formatMetamorphicDiagnostic,
  generateScenarioDiagnostics,
  extractTraceReferences,
} from "../index";

describe("Cognitive Diagnostics Suite (HDCP-013)", () => {
  test("Diagnostic Class 1: Positive Output Mismatch Diagnostic", async () => {
    const scenario = createCognitiveScenario({
      id: "DIAG-01-output",
      name: "Induced Output Mismatch Scenario",
      given: {
        source: `
          define entity "fact-1" { kind: "fact" level: L1 }
          emit { target: "fact-1" kind: "fact_emission" }
        `,
      },
      expected: {
        success: true,
        // Induced mismatch: expected kind differs from actual
        emissions: [{ kind: "expected_different_emission" }],
      },
    });

    const report = await diagnoseCognitiveScenario(scenario);

    assert.equal(report.passed, false);
    assert.ok(report.diagnostics.length > 0);
    assert.equal(report.diagnostics[0].category, "OUTPUT_MISMATCH");
    assert.ok(report.diagnostics[0].message.includes("Emission [0] kind mismatch"));
    assert.ok(report.formattedText.includes("OUTPUT_MISMATCH"));
    assert.ok(report.formattedText.includes("Relevant Execution Trace:"));
  });

  test("Diagnostic Class 2: Validation / Syntax Rejection Diagnostic", async () => {
    const scenario = createCognitiveScenario({
      id: "DIAG-02-validation",
      name: "Induced Unexpected Compile Error",
      given: {
        source: `
          relate "non-existent-src" -> "non-existent-tgt" { kind: "invalid" }
        `,
      },
      expected: {
        // Unexpectedly expected success
        success: true,
      },
    });

    const report = await diagnoseCognitiveScenario(scenario);

    assert.equal(report.passed, false);
    assert.ok(report.diagnostics.some((d) => d.category === "VALIDATION_MISMATCH" || d.category === "UNEXPECTED_BLOCK" || d.category === "STATE_MISMATCH"));
  });

  test("Diagnostic Class 3: Unexpected Blocked Execution Diagnostic", async () => {
    const scenario = createCognitiveScenario({
      id: "DIAG-03-unexpected-block",
      name: "Induced Unexpected Block",
      given: {
        source: `
          define entity "item-1" { kind: "item" level: L1 }
          relate "item-1" -> "missing-rel-target" { kind: "depends" }
          emit { target: "item-1" kind: "item_out" }
        `,
      },
      expected: {
        success: true, // Induced mismatch: expected success, but blocked by missing target
      },
    });

    const report = await diagnoseCognitiveScenario(scenario);

    assert.equal(report.passed, false);
    assert.ok(report.diagnostics.length > 0);
    const diag = report.diagnostics[0];
    assert.ok(diag.category === "UNEXPECTED_BLOCK" || diag.category === "VALIDATION_MISMATCH" || diag.category === "STATE_MISMATCH");
    assert.ok(report.formattedText.includes("Scenario: DIAG-03-unexpected-block"));
  });

  test("Diagnostic Class 4: Missing Expected Block Diagnostic", async () => {
    const scenario = createCognitiveScenario({
      id: "DIAG-04-missing-block",
      name: "Induced Missing Expected Block",
      given: {
        source: `
          define entity "valid-item" { kind: "item" level: L1 }
          emit { target: "valid-item" kind: "valid_out" }
        `,
      },
      expected: {
        success: false,
        blocked: true, // Induced mismatch: expected block, but execution succeeds
      },
    });

    const report = await diagnoseCognitiveScenario(scenario);

    assert.equal(report.passed, false);
    assert.ok(report.diagnostics.length > 0);
    assert.equal(report.diagnostics[0].category, "EXPECTED_BLOCK_MISSING");
    assert.ok(report.formattedText.includes("EXPECTED_BLOCK_MISSING"));
  });

  test("Diagnostic Class 5: Block Reason Mismatch Diagnostic", async () => {
    const scenario = createCognitiveScenario({
      id: "DIAG-05-reason",
      name: "Induced Block Reason Mismatch",
      given: {
        source: `
          define entity "source-ent" { kind: "ent" level: L1 }
          relate "source-ent" -> "missing-real-entity" { kind: "link" }
          emit { target: "source-ent" kind: "out" }
        `,
      },
      expected: {
        success: false,
        blocked: true,
        // Induced mismatch: wrong expected blocked reason
        blockedReason: "completely_unrelated_blocked_reason_phrase",
      },
    });

    const report = await diagnoseCognitiveScenario(scenario);

    assert.equal(report.passed, false);
    assert.ok(report.diagnostics.some((d) => d.category === "BLOCK_REASON_MISMATCH"));
    assert.ok(report.formattedText.includes("BLOCK_REASON_MISMATCH"));
  });

  test("Diagnostic Class 6: Level Transition Mismatch Diagnostic", async () => {
    const scenario = createCognitiveScenario({
      id: "DIAG-06-transition",
      name: "Induced Transition Mismatch",
      given: {
        source: `
          define entity "doc" { kind: "doc" level: L1 }
          resolve "doc" to L2 { status: "ready" }
          emit { target: "doc" kind: "out" }
        `,
      },
      expected: {
        success: true,
        // Induced mismatch: expected transition to L5 (never reached)
        transitions: [{ to: "L5", target: "doc", occurred: true }],
      },
    });

    const report = await diagnoseCognitiveScenario(scenario);

    assert.equal(report.passed, false);
    assert.ok(report.diagnostics.some((d) => d.category === "TRANSITION_MISMATCH"));
  });

  test("Diagnostic Class 7: Invariant Violation Diagnostic", async () => {
    const scenario = createCognitiveScenario({
      id: "DIAG-07-invariant",
      name: "Induced Invariant Violation",
      given: {
        source: `
          define entity "inv-ent" { kind: "ent" level: L1 }
          emit { target: "inv-ent" kind: "out" }
        `,
      },
      expected: {
        success: true,
        invariants: [
          {
            name: "impossible_step_count_invariant",
            check: (res) => res.trace.steps.length > 9999, // Deliberate failure
          },
        ],
      },
    });

    const report = await diagnoseCognitiveScenario(scenario);

    assert.equal(report.passed, false);
    assert.ok(report.diagnostics.some((d) => d.category === "INVARIANT_VIOLATION"));
  });

  test("Diagnostic Class 8: State & Memory Reference Extraction", () => {
    const formattedDiag = formatCognitiveDiagnostic({
      scenarioId: "DIAG-08-state",
      scenarioName: "State Extraction",
      category: "MEMORY_MISMATCH",
      message: "Memory key 'tenant_config' underwent unauthorized mutation",
      expected: { tenantId: "tenant-a", tier: "provisional" },
      observed: { tenantId: "tenant-a", tier: "canonical" },
      stateRefs: [
        {
          key: "tenant_config",
          expected: "provisional",
          observed: "canonical",
          origin: "context",
        },
      ],
    });

    assert.ok(formattedDiag.includes("MEMORY_MISMATCH"));
    assert.ok(formattedDiag.includes("State References:"));
    assert.ok(formattedDiag.includes("[tenant_config] expected=\"provisional\" observed=\"canonical\""));
  });

  test("Diagnostic Class 9: Compact Trace Reference Extraction", () => {
    const mockTrace = {
      runId: "run-mock",
      startedAt: "2026-08-20T00:00:00Z",
      completedAt: "2026-08-20T00:00:01Z",
      steps: [
        { stepId: "s1", phase: "bind", status: "SUCCEEDED" as const, startedAt: "", completedAt: "", data: { target: "e1" } },
        { stepId: "s2", phase: "transform", status: "SUCCEEDED" as const, startedAt: "", completedAt: "", data: { target: "e1" } },
        { stepId: "s3", phase: "emit", status: "SUCCEEDED" as const, startedAt: "", completedAt: "", data: { target: "e1" } },
      ],
    };

    const refs = extractTraceReferences(mockTrace);
    assert.equal(refs.length, 3);
    assert.equal(refs[0].stepIndex, 1);
    assert.equal(refs[0].stepId, "s1");
    assert.equal(refs[0].phase, "bind");
    assert.equal(refs[0].targetId, "e1");
  });

  test("Diagnostic Class 10: Metamorphic Relation Formatter", () => {
    const formatted = formatMetamorphicDiagnostic(
      "EVIDENCE_MONOTONICITY",
      { confidence: 0.62, authority: "advisory" },
      { confidence: 0.81, authority: "canonical" },
      "Evidence increased authority from advisory to canonical, violating monotonic governance boundary",
    );

    assert.ok(formatted.includes("COG METAMORPHIC RELATION VIOLATION"));
    assert.ok(formatted.includes("Relation:    EVIDENCE_MONOTONICITY"));
    assert.ok(formatted.includes("Violation:   Evidence increased authority"));
  });
});

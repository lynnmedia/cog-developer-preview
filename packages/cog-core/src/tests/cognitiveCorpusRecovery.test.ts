import assert from "node:assert/strict";
import test, { describe } from "node:test";
import {
  runCognitiveScenario,
  createCognitiveScenario,
  assertCogOutput,
  assertTransitionOccurred,
  reconcileMemoryConflict,
} from "../index";

describe("Cognitive Corpus: Recovery Scenarios (Class 4)", () => {
  test("REC-01: Governed Fallback from Unmet Strict Target to Provisional Level", async () => {
    // When high-confidence criteria are not reached, workflow routes to provisional review level
    const fallbackScenario = createCognitiveScenario({
      id: "REC-01",
      name: "Provisional Level Fallback Routing",
      description: "Falls back to L2 provisional status when full L4 automated validation is withheld",
      given: {
        source: `
          define entity "spec-candidate" {
            kind: "candidate"
            level: L1
            confidence: 0.65
          }
          resolve "spec-candidate" to L2 {
            status: "provisional_review"
            fallback_reason: "confidence_below_l4_threshold"
          }
          emit {
            target: "spec-candidate"
            kind: "provisional_decision"
          }
        `,
      },
      expected: {
        success: true,
        transitions: [
          { to: "L2", target: "spec-candidate", occurred: true },
        ],
        emissions: [
          { target: "spec-candidate", kind: "provisional_decision" },
        ],
      },
    });

    const result = await runCognitiveScenario(fallbackScenario);
    assert.equal(result.passed, true);
    assert.ok(result.executionResult);
    assertTransitionOccurred(result.executionResult, "L2", "spec-candidate");
    assertCogOutput(result.executionResult, { kind: "provisional_decision" });
  });

  test("REC-02: Recovery via Corroborating Multi-Source Relational Support", async () => {
    // Adding secondary independent evidence satisfies joint support requirement and enables emission
    const corroboratedScenario = createCognitiveScenario({
      id: "REC-02",
      name: "Corroborated Multi-Source Recovery",
      given: {
        source: `
          define entity "claim-primary" {
            kind: "hypothesis"
            level: L1
          }
          define entity "obs-telemetry-1" {
            kind: "observation"
            level: L1
            source: "node_exporter"
          }
          define entity "obs-telemetry-2" {
            kind: "observation"
            level: L1
            source: "synthetic_probe"
          }
          relate "obs-telemetry-1" -> "claim-primary" {
            kind: "supports"
          }
          relate "obs-telemetry-2" -> "claim-primary" {
            kind: "corroborates"
          }
          resolve "claim-primary" to L3 {
            corroboration_count: 2
            status: "verified"
          }
          emit {
            target: "claim-primary"
            kind: "verified_claim"
          }
        `,
      },
      expected: {
        success: true,
        transitions: [{ to: "L3", target: "claim-primary", occurred: true }],
        emissions: [{ kind: "verified_claim", target: "claim-primary" }],
      },
    });

    const result = await runCognitiveScenario(corroboratedScenario);
    assert.equal(result.passed, true);
    assert.ok(result.executionResult);
    assertCogOutput(result.executionResult, { kind: "verified_claim" });
  });

  test("REC-03: Recovery through Advisory Constraint Warning Pathway", async () => {
    // Advisory constraint allows execution to proceed while flagging inspection issue
    const advisoryScenario = createCognitiveScenario({
      id: "REC-03",
      name: "Advisory Constraint Flagging Without Hard Abort",
      given: {
        source: `
          define entity "report-alpha" {
            kind: "report"
            level: L1
          }
          constrain {
            target: "report-alpha"
            mode: ADVISORY
          }
          resolve "report-alpha" to L2 {
            status: "flagged_for_review"
          }
          emit {
            target: "report-alpha"
            kind: "advisory_report"
          }
        `,
      },
      expected: {
        success: true,
        emissions: [{ kind: "advisory_report", target: "report-alpha" }],
      },
    });

    const result = await runCognitiveScenario(advisoryScenario);
    assert.equal(result.passed, true);
    assert.ok(result.executionResult?.success);
  });

  test("REC-04: Memory Conflict Recovery via Explicit Authority Reconciliation", () => {
    const canonicalMemory = {
      id: "mem-canonical",
      key: "endpoint_config",
      content: { url: "https://api.internal.org/v2" },
      authorityLevel: "canonical" as const,
      epistemicState: {
        confidence: 0.95,
        isStale: false,
        lastObserved: "2026-08-20T00:00:00Z",
        observationCount: 10,
      },
      provenance: {
        sourceId: "config-service",
        sourceKind: "canonical_source",
        timestamp: "2026-08-20T00:00:00Z",
      },
    };

    const inferredMemory = {
      id: "mem-inferred",
      key: "endpoint_config",
      content: { url: "https://api.staging.org/v2" },
      authorityLevel: "inferred" as const,
      epistemicState: {
        confidence: 0.60,
        isStale: false,
        lastObserved: "2026-08-20T01:00:00Z",
        observationCount: 1,
      },
      provenance: {
        sourceId: "log-parser",
        sourceKind: "inference",
        timestamp: "2026-08-20T01:00:00Z",
      },
    };

    const reconciled = reconcileMemoryConflict(canonicalMemory as any, inferredMemory as any);
    assert.equal(reconciled.status, "authoritative_override");
    assert.equal(reconciled.winner.id, "mem-canonical");
  });
});

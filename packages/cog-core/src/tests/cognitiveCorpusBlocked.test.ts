import assert from "node:assert/strict";
import test, { describe } from "node:test";
import {
  runCognitiveScenario,
  createCognitiveScenario,
  assertBlocked,
  assertBlockedBecause,
  assessMemoryUpdateEligibility,
  validateDomainCapabilityContract,
} from "../index";

describe("Cognitive Corpus: Blocked Scenarios (Class 3)", () => {
  test("BLK-01: Structurally Valid Program Blocked by Constraint Guard", async () => {
    // Valid entities, but relation target does not exist, causing validation guard to block execution
    const scenario = createCognitiveScenario({
      id: "BLK-01",
      name: "Guarded Execution Blocked by Missing Transformation Target",
      given: {
        source: `
          define entity "subject-1" {
            kind: "analysis:subject"
            level: L1
          }
          relate "subject-1" -> "missing-target-blocked" {
            kind: "depends_on"
          }
          constrain {
            target: "subject-1"
            mode: STRICT
          }
          emit {
            target: "subject-1"
            kind: "analysis:output"
          }
        `,
      },
      expected: {
        success: false,
        blocked: true,
        blockedReason: "missing-target-blocked",
      },
    });

    const result = await runCognitiveScenario(scenario);
    assert.equal(result.passed, true);
    assert.ok(result.executionResult);
    assertBlocked(result.executionResult);
    assertBlockedBecause(result.executionResult, "missing-target-blocked");
  });

  test("BLK-02: Blocked by Low-Authority Tool Memory Update Eligibility", () => {
    const lowAuthEvidence = {
      evidenceId: "ev-scrape-001",
      epistemicRole: "MODEL_INFERENCE" as const,
      governanceAuthority: "advisory" as const,
      evidentiaryStrength: "speculative" as const,
      sourceReliability: "stochastic_model" as const,
      scope: "global",
      observedAt: new Date().toISOString(),
      confidence: 0.45,
      data: { rule: "proposed_override" },
      limitations: ["Unverified web scrape"],
      tensionsSurfaced: [],
      provenance: { toolId: "tool:scraper", executionInvocationId: "inv-1" },
    };

    const eligibility = assessMemoryUpdateEligibility(lowAuthEvidence as any);
    assert.equal(eligibility.eligible, false);
    assert.equal(eligibility.humanReviewRequired, true);
    assert.ok(eligibility.rationale.includes("human review") || eligibility.rationale.length > 0);
  });

  test("BLK-03: Blocked by Stale Epistemic Evidence Window", () => {
    const staleEvidence = {
      evidenceId: "ev-stale-001",
      epistemicRole: "MEASUREMENT" as const,
      governanceAuthority: "situational" as const,
      evidentiaryStrength: "decisive" as const,
      sourceReliability: "calibrated_hardware" as const,
      scope: "facility:thermal",
      observedAt: "2026-08-01T00:00:00Z",
      freshnessExpiresAt: "2026-08-01T01:00:00Z",
      confidence: 0.99,
      data: { temp: 45 },
      limitations: [],
      tensionsSurfaced: [],
      provenance: { toolId: "tool:sensor", executionInvocationId: "inv-stale" },
    };

    const eligibility = assessMemoryUpdateEligibility(staleEvidence as any, "2026-08-20T00:00:00Z");
    assert.equal(eligibility.eligible, false);
    assert.ok(eligibility.rationale.includes("expired") || eligibility.rationale.includes("stale"));
  });

  test("BLK-04: Blocked by Invalid Domain Capability Definition", () => {
    const invalidCapability = {
      id: "invalid-cap",
      // Missing required fields like objectClasses, significantDimensions
    };

    const report = validateDomainCapabilityContract(invalidCapability as any);
    assert.equal(report.valid, false);
    assert.ok(report.defects.length > 0);
  });

  test("BLK-05: Blocked by Guarded Envelope Rejection", async () => {
    const guardedScenario = createCognitiveScenario({
      id: "BLK-05",
      name: "Guarded Resolution Blocked by Strict Validation",
      given: {
        source: `
          define entity "target-doc" {
            kind: "document"
            level: L1
          }
          constrain {
            target: "target-doc"
            mode: STRICT
          }
          relate "target-doc" -> "missing-external" {
            kind: "depends_on"
          }
          emit {
            target: "target-doc"
            kind: "doc_emit"
          }
        `,
      },
      expected: {
        success: false,
        blocked: true,
        blockedReason: "missing-external",
      },
    });

    const result = await runCognitiveScenario(guardedScenario);
    assert.equal(result.passed, true);
    assert.ok(result.executionResult);
    assertBlocked(result.executionResult);
    assertBlockedBecause(result.executionResult, "missing-external");
  });
});

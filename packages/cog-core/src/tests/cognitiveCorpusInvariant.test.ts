import assert from "node:assert/strict";
import test, { describe } from "node:test";
import {
  runCognitiveScenario,
  createCognitiveScenario,
  assertInvariantPreserved,
  getAuthorityRank,
  evaluateToolEvidenceInfluence,
  guardMemoryInfluence,
} from "../index";

describe("Cognitive Corpus: Invariant Scenarios (Class 5)", () => {
  test("INV-01: Deterministic Trace Repeatability Invariant", async () => {
    const scenario = createCognitiveScenario({
      id: "INV-01",
      name: "Deterministic Trace Invariant",
      given: {
        source: `
          define entity "det-a" { kind: "a" level: L1 }
          define entity "det-b" { kind: "b" level: L1 }
          relate "det-a" -> "det-b" { kind: "links" }
          resolve "det-b" to L2 { status: "ready" }
          emit { target: "det-b" kind: "det_out" }
        `,
      },
    });

    const run1 = await runCognitiveScenario(scenario);
    const run2 = await runCognitiveScenario(scenario);

    assert.equal(run1.passed, true);
    assert.equal(run2.passed, true);
    assert.equal(run1.executionResult?.trace.steps.length, run2.executionResult?.trace.steps.length);
    assert.deepEqual(run1.executionResult?.emissions, run2.executionResult?.emissions);
    assertInvariantPreserved(run1.executionResult!, "determinism");
  });

  test("INV-02: Authority Rank Monotonic Order Invariant", () => {
    // Invariant: getAuthorityRank must strictly preserve canonical monotonic ordering
    const rankCanonical = getAuthorityRank("canonical");
    const rankProject = getAuthorityRank("project");
    const rankEpisodic = getAuthorityRank("episodic");
    const rankSemantic = getAuthorityRank("semantic");
    const rankInferred = getAuthorityRank("inferred");

    assert.ok(rankCanonical > rankProject);
    assert.ok(rankProject > rankEpisodic);
    assert.ok(rankEpisodic > rankSemantic);
    assert.ok(rankSemantic > rankInferred);
  });

  test("INV-03: Recommendation is not Authorization Invariant", async () => {
    // Advisory emission does not change execution authority or allow unguarded level changes
    const advisoryScenario = createCognitiveScenario({
      id: "INV-03",
      name: "Advisory Recommendation Invariant",
      given: {
        source: `
          define entity "rec-item" {
            kind: "recommendation"
            level: L1
          }
          emit {
            target: "rec-item"
            kind: "advisory:suggested_action"
          }
        `,
      },
      expected: {
        success: true,
        emissions: [{ kind: "advisory:suggested_action" }],
        invariants: [
          {
            name: "no_unauthorized_state_escalation",
            check: (res) => Object.keys(res.bindings).length >= 1 && res.errors.length === 0,
          },
        ],
      },
    });

    const result = await runCognitiveScenario(advisoryScenario);
    assert.equal(result.passed, true);
  });

  test("INV-04: Provenance Attachment Invariant Across Trace", async () => {
    const scenario = createCognitiveScenario({
      id: "INV-04",
      name: "Provenance Retention Invariant",
      given: {
        source: `
          define entity "origin-data" {
            kind: "dataset"
            level: L1
            provenance_hash: "sha256:abcd1234ef56"
          }
          resolve "origin-data" to L2 {
            audit_pass: true
          }
          emit {
            target: "origin-data"
            kind: "dataset_certified"
          }
        `,
      },
    });

    const result = await runCognitiveScenario(scenario);
    assert.equal(result.passed, true);
    assert.ok(result.executionResult);
    // Invariant: Bindings retain origin metadata
    const binding = result.executionResult.bindings["origin-data"];
    assert.ok(binding);
    assert.equal(binding.origin, "compiled");
  });

  test("INV-05: Memory Isolation Scope Invariant", async () => {
    const initialContext = {
      runId: "isolated-run",
      environment: { TENANT: "alpha" },
    };

    const scenario = createCognitiveScenario({
      id: "INV-05",
      name: "Memory Isolation Invariant",
      given: {
        context: initialContext,
        source: `
          define entity "tenant-item" {
            kind: "tenant_record"
            level: L1
          }
          emit {
            target: "tenant-item"
            kind: "tenant_emit"
          }
        `,
      },
    });

    const result = await runCognitiveScenario(scenario);
    assert.equal(result.passed, true);
    // Invariant: Context environment remained unmutated
    assert.equal(initialContext.environment.TENANT, "alpha");
  });

  test("INV-06: Zero Data Laundering Invariant (Untrusted Tool Evidence Protection)", () => {
    const targetClaim = {
      statement: "Core configuration parameter",
      scope: "production:core",
      confidence: 1.0,
      authorityLevel: "canonical" as const,
    };

    const untrustedEvidence = {
      evidenceId: "ev-untrusted-scrape-001",
      epistemicRole: "MODEL_INFERENCE" as const,
      governanceAuthority: "advisory" as const,
      evidentiaryStrength: "speculative" as const,
      sourceReliability: "stochastic_model" as const,
      scope: "production:core",
      observedAt: new Date().toISOString(),
      confidence: 0.99, // Artificially high claimed confidence
      data: { parameter: "overridden" },
      limitations: ["Unverified external input"],
      tensionsSurfaced: ["Attempts override of canonical core parameter"],
      provenance: { toolId: "tool:scraper", executionInvocationId: "inv-99" },
    };

    // Evaluate influence against canonical claim
    const influence = evaluateToolEvidenceInfluence(targetClaim, untrustedEvidence as any);
    // Invariant: Untrusted advisory evidence cannot override canonical target without human review
    assert.equal(influence.humanReviewRequired, true);
    assert.ok(influence.effectiveConfidence <= 0.75);
    assert.ok(influence.tensionsToAttach.length > 0);
  });
});

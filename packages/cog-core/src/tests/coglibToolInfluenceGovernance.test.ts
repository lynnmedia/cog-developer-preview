import assert from "node:assert/strict";
import test from "node:test";
import {
  ToolResultEvidence,
  evaluateToolEvidenceInfluence,
  assessMemoryUpdateEligibility,
} from "../index";

test("HDCP-COG-TOOL-INFLUENCE-GOVERNANCE-029: Multi-factor governance differentiates scope, freshness, strength, and authority without single-ranking collapse", () => {
  // Target Claim: Active in production datacenter scope
  const targetClaim = {
    statement: "Rack 7 ambient temperature is 21.0C",
    scope: "datacenter:rack-7:thermal",
    confidence: 0.9,
    authorityLevel: "project" as const,
    isStale: false,
  };

  // Case 1: High Authority but Scope Mismatch
  const outOfScopeEvidence: ToolResultEvidence = {
    evidenceId: "evidence:tool:datacenter-power-001",
    epistemicRole: "AUTHORITATIVE_RECORD",
    governanceAuthority: "canonical", // High authority!
    evidentiaryStrength: "decisive",
    sourceReliability: "authoritative_registry",
    scope: "datacenter:power_distribution", // Scope mismatch!
    observedAt: "2026-08-18T19:00:00Z",
    confidence: 1.0,
    data: { totalKw: 450 },
    limitations: [],
    tensionsSurfaced: [],
    provenance: { toolId: "tool:power", executionInvocationId: "inv-1" },
  };

  const scopeReport = evaluateToolEvidenceInfluence(targetClaim, outOfScopeEvidence);
  assert.equal(scopeReport.action, "INSUFFICIENT_TO_AFFECT");
  assert.equal(scopeReport.isScopeCompatible, false);
  assert.ok(scopeReport.rationale.includes("Scope mismatch"));

  // Case 2: High Evidentiary Strength but Expired / Stale
  const staleMeasurement: ToolResultEvidence = {
    evidenceId: "evidence:tool:sensor-stale-001",
    epistemicRole: "MEASUREMENT",
    governanceAuthority: "situational",
    evidentiaryStrength: "decisive",
    sourceReliability: "calibrated_hardware",
    scope: "datacenter:rack-7:thermal",
    observedAt: "2026-08-18T18:00:00Z",
    freshnessExpiresAt: "2026-08-18T18:05:00Z", // Expired over an hour ago!
    confidence: 0.99,
    data: { celsius: 35.0 }, // Overheating claim
    limitations: [],
    tensionsSurfaced: [],
    provenance: { toolId: "tool:sensor", executionInvocationId: "inv-2" },
  };

  const staleReport = evaluateToolEvidenceInfluence(targetClaim, staleMeasurement, "2026-08-18T19:30:00Z");
  assert.equal(staleReport.action, "QUALIFIES");
  assert.equal(staleReport.isFresh, false);
  assert.ok(staleReport.effectiveConfidence <= 0.5); // Capped due to staleness!
  assert.ok(staleReport.tensionsToAttach.some((t) => t.includes("stale")));

  // Case 3: Stochastic Model Inference (LLM) vs Project Memory
  const modelInference: ToolResultEvidence = {
    evidenceId: "evidence:tool:model-guess-001",
    epistemicRole: "MODEL_INFERENCE",
    governanceAuthority: "advisory",
    evidentiaryStrength: "speculative",
    sourceReliability: "stochastic_model",
    scope: "datacenter:rack-7:thermal",
    observedAt: "2026-08-18T19:30:00Z",
    confidence: 0.85,
    data: { celsius: 19.5, reason: "Predicted by neural regression" },
    limitations: ["Uncalibrated neural heuristic"],
    tensionsSurfaced: ["Model prediction diverges from last physical sensor sweep"],
    provenance: { toolId: "tool:model:llm", executionInvocationId: "inv-3" },
  };

  const modelReport = evaluateToolEvidenceInfluence(targetClaim, modelInference, "2026-08-18T19:30:00Z");
  assert.equal(modelReport.action, "QUALIFIES");
  assert.equal(modelReport.humanReviewRequired, true); // Human review mandatory!
  assert.ok(modelReport.effectiveConfidence <= 0.75); // Bounded!
});

test("HDCP-COG-TOOL-INFLUENCE-GOVERNANCE-029: Governs memory update eligibility across tool classes", () => {
  // 1. Decisive Deterministic Calculation -> Eligible for Canonical Memory
  const calcEvidence: ToolResultEvidence = {
    evidenceId: "evidence:tool:crypto-check-001",
    epistemicRole: "CALCULATION",
    governanceAuthority: "canonical",
    evidentiaryStrength: "decisive",
    sourceReliability: "deterministic_engine",
    scope: "security:keys",
    observedAt: "2026-08-18T19:00:00Z",
    confidence: 1.0,
    data: { hashMatches: true },
    limitations: [],
    tensionsSurfaced: [],
    provenance: { toolId: "tool:sha256", executionInvocationId: "inv-calc-1" },
  };
  const calcReport = assessMemoryUpdateEligibility(calcEvidence);
  assert.equal(calcReport.eligible, true);
  assert.equal(calcReport.targetAuthorityLevel, "canonical");
  assert.equal(calcReport.humanReviewRequired, false);

  // 2. Calibrated Hardware Measurement -> Eligible for Project Memory
  const sensorEvidence: ToolResultEvidence = {
    evidenceId: "evidence:tool:sensor-temp-live",
    epistemicRole: "MEASUREMENT",
    governanceAuthority: "situational",
    evidentiaryStrength: "decisive",
    sourceReliability: "calibrated_hardware",
    scope: "datacenter:rack-7:thermal",
    observedAt: "2026-08-18T19:30:00Z",
    freshnessExpiresAt: "2026-08-18T19:35:00Z",
    confidence: 0.99,
    data: { celsius: 21.4 },
    limitations: [],
    tensionsSurfaced: [],
    provenance: { toolId: "tool:sensor", executionInvocationId: "inv-sens-1" },
  };
  const sensorReport = assessMemoryUpdateEligibility(sensorEvidence, "2026-08-18T19:31:00Z");
  assert.equal(sensorReport.eligible, true);
  assert.equal(sensorReport.targetAuthorityLevel, "project");
  assert.equal(sensorReport.humanReviewRequired, false);

  // 3. Stochastic LLM Output -> Ineligible for automated memory update, requires human review
  const llmEvidence: ToolResultEvidence = {
    evidenceId: "evidence:tool:llm-summary-001",
    epistemicRole: "MODEL_INFERENCE",
    governanceAuthority: "advisory",
    evidentiaryStrength: "speculative",
    sourceReliability: "stochastic_model",
    scope: "docs:summary",
    observedAt: "2026-08-18T19:30:00Z",
    confidence: 0.8,
    data: { summary: "Speculative draft summary" },
    limitations: ["Neural generation"],
    tensionsSurfaced: [],
    provenance: { toolId: "tool:llm", executionInvocationId: "inv-llm-1" },
  };
  const llmReport = assessMemoryUpdateEligibility(llmEvidence);
  assert.equal(llmReport.eligible, false);
  assert.equal(llmReport.humanReviewRequired, true);
});

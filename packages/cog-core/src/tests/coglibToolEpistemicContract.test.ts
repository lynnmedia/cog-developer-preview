import assert from "node:assert/strict";
import test from "node:test";
import {
  ToolResultEvidence,
  validateToolEvidenceContract,
} from "../index";

test("HDCP-COG-TOOL-EPISTEMIC-CONTRACT-028: Materially distinct tool evidence classes satisfy contract without losing distinctions", () => {
  // 1. CALCULATION: Deterministic Symbolic Math Computation
  const calculationEvidence: ToolResultEvidence<{ result: number; expression: string }> = {
    evidenceId: "evidence:tool:calc-prime-001",
    epistemicRole: "CALCULATION",
    governanceAuthority: "canonical",
    evidentiaryStrength: "decisive",
    sourceReliability: "deterministic_engine",
    scope: "cryptography:prime_factorization",
    observedAt: "2026-08-18T19:00:00Z",
    confidence: 1.0,
    data: { expression: "2^31 - 1", result: 2147483647 },
    limitations: ["Bounded to 64-bit integer arithmetic"],
    tensionsSurfaced: [],
    provenance: {
      toolId: "tool:engine:symbolic-math-v1",
      executionInvocationId: "inv-calc-991",
    },
  };
  assert.equal(validateToolEvidenceContract(calculationEvidence).valid, true);

  // 2. MEASUREMENT: Calibrated Hardware Sensor
  const measurementEvidence: ToolResultEvidence<{ celsius: number; sensorId: string }> = {
    evidenceId: "evidence:tool:sensor-temp-042",
    epistemicRole: "MEASUREMENT",
    governanceAuthority: "situational",
    evidentiaryStrength: "corroborative",
    sourceReliability: "calibrated_hardware",
    scope: "datacenter:rack-7:thermal",
    observedAt: "2026-08-18T19:05:00Z",
    freshnessExpiresAt: "2026-08-18T19:10:00Z",
    confidence: 0.98,
    data: { celsius: 24.2, sensorId: "therm-sens-7b" },
    limitations: ["Calibration tolerance +/- 0.1 C"],
    tensionsSurfaced: [],
    provenance: {
      toolId: "tool:telemetry:fluke-sensor-adapter",
      executionInvocationId: "inv-sensor-840",
    },
  };
  assert.equal(validateToolEvidenceContract(measurementEvidence).valid, true);

  // 3. AUTHORITATIVE_RECORD: Cryptographic Registry
  const registryEvidence: ToolResultEvidence<{ domain: string; registrant: string }> = {
    evidenceId: "evidence:tool:registry-whois-001",
    epistemicRole: "AUTHORITATIVE_RECORD",
    governanceAuthority: "canonical",
    evidentiaryStrength: "decisive",
    sourceReliability: "authoritative_registry",
    scope: "security:dns_provenance",
    observedAt: "2026-08-18T19:00:00Z",
    confidence: 1.0,
    data: { domain: "cog.dev", registrant: "Lynn Media Group" },
    limitations: [],
    tensionsSurfaced: [],
    provenance: {
      toolId: "tool:registry:icann-rdap-client",
      executionInvocationId: "inv-rdap-120",
    },
  };
  assert.equal(validateToolEvidenceContract(registryEvidence).valid, true);

  // 4. RETRIEVED_DOCUMENT: Open Web Search
  const retrievedDocEvidence: ToolResultEvidence<{ url: string; snippet: string }> = {
    evidenceId: "evidence:tool:search-snippet-001",
    epistemicRole: "RETRIEVED_DOCUMENT",
    governanceAuthority: "advisory",
    evidentiaryStrength: "suggestive",
    sourceReliability: "unverified_source",
    scope: "market_research:ai_landscape",
    observedAt: "2026-08-18T19:10:00Z",
    confidence: 0.65,
    data: { url: "https://example.org/blog", snippet: "Report suggests industry trends are shifting..." },
    limitations: ["Unauthenticated third-party blog opinion", "Subject to editorial bias"],
    tensionsSurfaced: ["Contradicts quarterly SEC filing revenue numbers"],
    provenance: {
      toolId: "tool:web:brave-search-crawler",
      executionInvocationId: "inv-crawler-301",
      sourceUri: "https://example.org/blog",
    },
  };
  assert.equal(validateToolEvidenceContract(retrievedDocEvidence).valid, true);

  // 5. MODEL_INFERENCE: Stochastic Neural Network
  const inferenceEvidence: ToolResultEvidence<{ generatedSummary: string }> = {
    evidenceId: "evidence:tool:llm-inference-001",
    epistemicRole: "MODEL_INFERENCE",
    governanceAuthority: "advisory",
    evidentiaryStrength: "speculative",
    sourceReliability: "stochastic_model",
    scope: "nlp:synthesis",
    observedAt: "2026-08-18T19:15:00Z",
    confidence: 0.7,
    data: { generatedSummary: "Plausible draft summary of unstructured meeting notes." },
    limitations: ["Stochastic generation may contain hallucinated details", "Zero formal verification"],
    tensionsSurfaced: ["Unverified assertions regarding project timeline"],
    provenance: {
      toolId: "tool:model:gemini-pro-inference",
      executionInvocationId: "inv-gen-554",
    },
  };
  assert.equal(validateToolEvidenceContract(inferenceEvidence).valid, true);
});

test("HDCP-COG-TOOL-EPISTEMIC-CONTRACT-028: Validator rejects malformed tool evidence", () => {
  const malformed: any = {
    evidenceId: "invalid-id-without-prefix",
    epistemicRole: "INVALID_ROLE",
    governanceAuthority: "super_admin", // Invalid authority
    confidence: 1.5, // Out of range!
  };

  const report = validateToolEvidenceContract(malformed);
  assert.equal(report.valid, false);
  assert.ok(report.defects.some((d) => d.includes("evidence:tool:")));
  assert.ok(report.defects.some((d) => d.includes("epistemicRole")));
  assert.ok(report.defects.some((d) => d.includes("governanceAuthority")));
  assert.ok(report.defects.some((d) => d.includes("confidence")));
});

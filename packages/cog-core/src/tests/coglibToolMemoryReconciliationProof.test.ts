import assert from "node:assert/strict";
import test from "node:test";
import {
  InMemoryCognitiveMemoryProvider,
  ToolResultEvidence,
  evaluateToolEvidenceInfluence,
  reconcileMemoryConflict,
  compareRoutine,
  traceRoutine,
  challengeRoutine,
  executeRoutineWithGuards,
  computeCognitiveMetrics,
} from "../index";

test("HDCP-COG-TOOL-MEMORY-RECONCILIATION-PROOF-031: Reconciles Memory + Tool Evidence across 4 canonical cases without data laundering", async () => {
  const memoryProvider = new InMemoryCognitiveMemoryProvider("memory:provider:reconcile-store");

  // =========================================================================
  // CASE 1: Decisive Fresh Sensor Evidence SUPERSEDES Stale Memory
  // =========================================================================
  const staleMemory = {
    id: "mem-datacenter-thermal",
    objectType: "telemetry_snapshot",
    content: { temperatureC: 21.0 },
    authorityLevel: "project" as const,
    scope: "datacenter:rack-7",
    perspectives: ["telemetry"],
    recordedAt: "2026-08-17T00:00:00Z",
    freshnessExpiresAt: "2026-08-17T01:00:00Z", // Stale
    provenance: { sourceAnchors: ["sensor-log-old"], lineage: ["session-yesterday"] },
    epistemicState: { confidence: 0.95, tensions: [], isStale: true },
    tags: ["thermal"],
  };
  await memoryProvider.persist(staleMemory);

  const freshSensorEvidence: ToolResultEvidence<{ temperatureC: number }> = {
    evidenceId: "evidence:tool:fluke-temp-live",
    epistemicRole: "MEASUREMENT",
    governanceAuthority: "situational",
    evidentiaryStrength: "decisive",
    sourceReliability: "calibrated_hardware",
    scope: "datacenter:rack-7",
    observedAt: "2026-08-18T19:40:00Z",
    freshnessExpiresAt: "2026-08-18T19:45:00Z",
    confidence: 0.99,
    data: { temperatureC: 38.5 }, // Overheating alert!
    limitations: [],
    tensionsSurfaced: ["Temperature exceeded safe threshold (30C)"],
    provenance: { toolId: "tool:sensor:calibrated", executionInvocationId: "inv-fluke-99" },
  };

  const case1Influence = evaluateToolEvidenceInfluence(
    { statement: "Rack 7 temperature is normal", scope: staleMemory.scope, isStale: true },
    freshSensorEvidence,
    "2026-08-18T19:41:00Z",
  );
  assert.equal(case1Influence.action, "SUPERSEDES");

  // Run COMPARE between stale state and fresh tool evidence
  const case1Comp = await executeRoutineWithGuards(compareRoutine, {
    targetA: { id: staleMemory.id, statement: "21.0C nominal", assumptions: ["Cold operating profile"], isStale: true },
    targetB: { id: freshSensorEvidence.evidenceId, statement: "38.5C overheating", assumptions: ["Thermal alert profile"], isStale: false },
  });
  assert.equal(case1Comp.status, "success");
  assert.ok(case1Comp.output?.materialDifferences.some((d) => d.dimension === "assumptions"));

  // =========================================================================
  // CASE 2: Suggestive Tool Evidence Merely QUALIFIES Established Project Memory
  // =========================================================================
  const projectSlaMemory = {
    id: "mem-gateway-sla",
    objectType: "sla_spec",
    content: { latencyBudgetMs: 150 },
    authorityLevel: "project" as const,
    scope: "gateway:perf",
    perspectives: ["architecture"],
    recordedAt: "2026-08-18T18:00:00Z",
    provenance: { sourceAnchors: ["spec-doc-1"], lineage: ["approved-plan"] },
    epistemicState: { confidence: 0.95, tensions: [] },
    tags: ["sla"],
  };

  const suggestiveBenchmarkEvidence: ToolResultEvidence = {
    evidenceId: "evidence:tool:micro-bench-run",
    epistemicRole: "SIMULATION",
    governanceAuthority: "advisory",
    evidentiaryStrength: "suggestive",
    sourceReliability: "stochastic_model",
    scope: "gateway:perf",
    observedAt: "2026-08-18T19:40:00Z",
    confidence: 0.7,
    data: { observedLatencyMs: 120 },
    limitations: ["Synthetic micro-benchmark with only 10 virtual users"],
    tensionsSurfaced: ["May not reflect multi-tenant production contention"],
    provenance: { toolId: "tool:sim:load-test", executionInvocationId: "inv-sim-1" },
  };

  const case2Influence = evaluateToolEvidenceInfluence(
    { statement: "Gateway SLA is 150ms", scope: projectSlaMemory.scope, authorityLevel: "project" },
    suggestiveBenchmarkEvidence,
  );
  assert.equal(case2Influence.action, "QUALIFIES");
  assert.ok(case2Influence.tensionsToAttach.length > 0);

  // =========================================================================
  // CASE 3: Equal-Authority Conflict Preserves Active CONTRADICTION
  // =========================================================================
  const memoryTeamA = {
    id: "mem-auth-team-a",
    objectType: "security_config",
    content: { protocol: "OAuth2-PKCE" },
    authorityLevel: "project" as const,
    scope: "security:auth",
    perspectives: ["backend"],
    recordedAt: "2026-08-18T18:00:00Z",
    provenance: { sourceAnchors: ["team-a-plan"], lineage: ["commit-a"] },
    epistemicState: { confidence: 0.9, tensions: [] },
    tags: ["auth"],
  };

  const toolGatewayAudit = {
    id: "mem-auth-gateway-audit",
    objectType: "security_config",
    content: { protocol: "Mutual-TLS" }, // Direct contradiction!
    authorityLevel: "project" as const,
    scope: "security:auth",
    perspectives: ["ops"],
    recordedAt: "2026-08-18T19:00:00Z",
    provenance: { sourceAnchors: ["envoy-live-config"], lineage: ["audit-tool"] },
    epistemicState: { confidence: 0.9, tensions: [] },
    tags: ["auth"],
  };

  const case3Conflict = reconcileMemoryConflict(memoryTeamA, toolGatewayAudit);
  assert.equal(case3Conflict.status, "unresolved_conflict");
  assert.equal(case3Conflict.winner, null);
  assert.ok(case3Conflict.activeTensions.some((t) => t.includes("Unresolved contradiction")));

  // =========================================================================
  // CASE 4: Weak / Speculative Tool Evidence is INSUFFICIENT_TO_AFFECT Canonical Memory
  // =========================================================================
  const canonicalAxiom = {
    id: "mem-canonical-kernel",
    objectType: "constitution",
    content: { kernelOntology: "agnostic" },
    authorityLevel: "canonical" as const,
    scope: "system:kernel",
    perspectives: ["constitution"],
    recordedAt: "2026-01-01T00:00:00Z",
    provenance: { sourceAnchors: ["PHILOSOPHY.md"], lineage: ["genesis"] },
    epistemicState: { confidence: 1.0, tensions: [] },
    tags: ["constitution"],
  };

  const speculativeWebScrape: ToolResultEvidence = {
    evidenceId: "evidence:tool:web-blog-post",
    epistemicRole: "RETRIEVED_DOCUMENT",
    governanceAuthority: "advisory",
    evidentiaryStrength: "speculative",
    sourceReliability: "unverified_source",
    scope: "marketing:rumors", // Scope mismatch + low authority!
    observedAt: "2026-08-18T19:40:00Z",
    confidence: 0.4,
    data: { statement: "Kernel will embed music primitives directly" },
    limitations: ["Unverified blog commentary"],
    tensionsSurfaced: [],
    provenance: { toolId: "tool:crawler", executionInvocationId: "inv-crawl-1" },
  };

  const case4Influence = evaluateToolEvidenceInfluence(
    { statement: "Kernel is ontology agnostic", scope: canonicalAxiom.scope, authorityLevel: "canonical" },
    speculativeWebScrape,
  );
  assert.equal(case4Influence.action, "INSUFFICIENT_TO_AFFECT");

  // Trace & Challenge confirmation
  const reconciliationChallenge = await executeRoutineWithGuards(challengeRoutine, {
    target: {
      id: canonicalAxiom.id,
      statement: "Kernel is ontology agnostic",
      dependencies: [],
      groundingSources: canonicalAxiom.provenance.sourceAnchors,
    },
  });
  assert.equal(reconciliationChallenge.status, "success");
});

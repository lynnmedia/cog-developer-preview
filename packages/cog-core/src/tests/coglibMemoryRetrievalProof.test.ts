import assert from "node:assert/strict";
import test from "node:test";
import {
  InMemoryCognitiveMemoryProvider,
  MemoryEntry,
  guardMemoryInfluence,
  reconcileMemoryConflict,
  computeCognitiveMetrics,
  shapeRoutine,
  challengeRoutine,
  executeRoutineWithGuards,
} from "../index";

// Generic naive retrieval simulation (unaware of authority, scope, or staleness)
function naiveSimilarityRetrieval(entries: MemoryEntry[], keyword: string): MemoryEntry | null {
  return entries.find((e) => JSON.stringify(e.content).toLowerCase().includes(keyword.toLowerCase())) ?? null;
}

test("HDCP-COG-MEMORY-RETRIEVAL-PROOF-025: Governed retrieval resists stale and low-authority contamination vs naive retrieval", async () => {
  const memoryProvider = new InMemoryCognitiveMemoryProvider("memory:provider:proof-store");

  const corpus: MemoryEntry[] = [
    // Stale, low-authority speculative draft matching "latency"
    {
      id: "mem-stale-draft-latency",
      objectType: "design_draft",
      content: { latencyBudgetMs: 5 }, // Unrealistic 5ms budget
      authorityLevel: "inferred", // Low authority
      scope: "legacy-prototype",
      perspectives: ["brainstorming"],
      recordedAt: "2023-01-01T00:00:00Z",
      freshnessExpiresAt: "2023-06-01T00:00:00Z", // Stale!
      provenance: { sourceAnchors: ["scratchpad-v0"], lineage: ["unverified-chat"] },
      epistemicState: { confidence: 0.9, tensions: [] },
      tags: ["latency", "performance"],
    },
    // Fresh, high-authority ratified standard
    {
      id: "mem-canonical-sla-latency",
      objectType: "sla_specification",
      content: { latencyBudgetMs: 150, quantile: "p99" },
      authorityLevel: "canonical",
      scope: "production-gateway",
      perspectives: ["architecture", "ops"],
      recordedAt: "2026-08-18T18:00:00Z",
      provenance: { sourceAnchors: ["RFC-8402-SLA"], lineage: ["architecture-board-approved"] },
      epistemicState: { confidence: 1.0, tensions: [] },
      tags: ["latency", "sla", "production"],
    },
  ];

  for (const entry of corpus) {
    await memoryProvider.persist(entry);
  }

  // 1. Naive text retrieval: grabs the first matching keyword (the 5ms stale draft!)
  const naiveMatch = naiveSimilarityRetrieval(corpus, "latency");
  assert.equal(naiveMatch?.id, "mem-stale-draft-latency");

  // 2. Governed retrieval: intent + scope + minAuthority filter
  const governedResult = await memoryProvider.retrieve({
    intent: "latency sla",
    scope: "production-gateway",
    minAuthority: "project", // Filters out low-authority inferred drafts
  });

  assert.equal(governedResult.entries.length, 1);
  assert.equal(governedResult.entries[0]!.id, "mem-canonical-sla-latency");

  // 3. Reconcile conflict between naive match and governed match
  const conflictReconciliation = reconcileMemoryConflict(
    governedResult.entries[0]!,
    naiveMatch!,
    "2026-08-18T18:30:00Z",
  );

  assert.equal(conflictReconciliation.status, "authoritative_override");
  assert.equal(conflictReconciliation.winner?.id, "mem-canonical-sla-latency");

  // 4. Downstream CogLib Routine execution influenced by governed memory
  const memoryGuardedClaim = guardMemoryInfluence(
    { statement: "Service must meet 150ms p99 latency SLA", confidence: 1.0 },
    governedResult.entries[0]!,
  );

  assert.equal(memoryGuardedClaim.permitted, true);
  assert.equal(memoryGuardedClaim.epistemicConfidence, 1.0);
  assert.ok(memoryGuardedClaim.provenanceEntry.includes("mem-canonical-sla-latency"));

  // 5. Multidimensional Evaluation of Governed Retrieval vs Naive Baseline
  const candidateResult = await executeRoutineWithGuards(challengeRoutine, {
    target: {
      id: "claim-service-sla",
      statement: memoryGuardedClaim.qualifiedClaim.statement,
      groundingSources: [memoryGuardedClaim.qualifiedClaim.groundedInMemory],
    },
  });

  const profile = computeCognitiveMetrics(candidateResult, { id: "baseline:naive_retrieval" });

  const falseCertainty = profile.dimensions.find((d) => d.dimensionId === "false_certainty_avoidance")!;
  assert.equal((falseCertainty.metricValue as any).pass, 1);

  const provenance = profile.dimensions.find((d) => d.dimensionId === "provenance_integrity")!;
  assert.equal((provenance.metricValue as any).provenanceRatio, 1.0);
});

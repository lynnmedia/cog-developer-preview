import assert from "node:assert/strict";
import test from "node:test";
import {
  MemoryEntry,
  reconcileMemoryConflict,
  applyMemoryEpistemicDecay,
  guardMemoryInfluence,
  getAuthorityRank,
} from "../index";

test("HDCP-COG-MEMORY-AUTHORITY-AND-DOMAIN-MODEL-024: Authority hierarchy strictly governs memory precedence", () => {
  // Canonical Memory (Rank 5)
  const canonicalMem: MemoryEntry = {
    id: "mem-canonical-001",
    objectType: "constitutional_rule",
    content: { rule: "Ontology-agnostic kernel" },
    authorityLevel: "canonical",
    scope: "core",
    perspectives: ["constitution"],
    recordedAt: "2026-08-18T18:00:00Z",
    provenance: { sourceAnchors: ["PHILOSOPHY.md"], lineage: ["genesis"] },
    epistemicState: { confidence: 1.0, tensions: [] },
    tags: ["core"],
  };

  // Inferred Vector Retrieval Memory (Rank 1)
  const inferredMem: MemoryEntry = {
    id: "mem-vector-001",
    objectType: "speculative_chunk",
    content: { rule: "Kernel should embed music chord primitives" }, // Contradicts canonical!
    authorityLevel: "inferred",
    scope: "core",
    perspectives: ["speculative"],
    recordedAt: "2026-08-18T18:30:00Z",
    provenance: { sourceAnchors: ["unverified-chat-log"], lineage: ["similarity-search"] },
    epistemicState: { confidence: 0.8, tensions: [] },
    tags: ["speculation"],
  };

  const reconciliation = reconcileMemoryConflict(canonicalMem, inferredMem);

  // 1. Canonical strictly wins
  assert.equal(reconciliation.status, "authoritative_override");
  assert.equal(reconciliation.winner?.id, "mem-canonical-001");
  assert.equal(reconciliation.effectiveConfidence, 1.0);
  assert.ok(reconciliation.activeTensions.some((t) => t.includes("overridden by higher authority")));
});

test("HDCP-COG-MEMORY-AUTHORITY-AND-DOMAIN-MODEL-024: Equal-authority conflict preserves unresolved tension without silent override", () => {
  const projectA: MemoryEntry = {
    id: "mem-proj-team-a",
    objectType: "api_spec",
    content: { timeoutMs: 5000 },
    authorityLevel: "project",
    scope: "service-mesh",
    perspectives: ["backend"],
    recordedAt: "2026-08-18T18:00:00Z",
    provenance: { sourceAnchors: ["rfc-team-a"], lineage: ["draft"] },
    epistemicState: { confidence: 0.85, tensions: [] },
    tags: ["timeout"],
  };

  const projectB: MemoryEntry = {
    id: "mem-proj-team-b",
    objectType: "api_spec",
    content: { timeoutMs: 15000 },
    authorityLevel: "project",
    scope: "service-mesh",
    perspectives: ["infrastructure"],
    recordedAt: "2026-08-18T18:05:00Z",
    provenance: { sourceAnchors: ["rfc-team-b"], lineage: ["draft"] },
    epistemicState: { confidence: 0.85, tensions: [] },
    tags: ["timeout"],
  };

  const reconciliation = reconcileMemoryConflict(projectA, projectB);

  // Equal rank cannot declare automatic winner; must preserve tension!
  assert.equal(reconciliation.status, "unresolved_conflict");
  assert.equal(reconciliation.winner, null);
  assert.ok(reconciliation.effectiveConfidence <= 0.6);
  assert.ok(reconciliation.activeTensions.some((t) => t.includes("Unresolved contradiction between equal authority")));
});

test("HDCP-COG-MEMORY-AUTHORITY-AND-DOMAIN-MODEL-024: Stale memory undergoes automatic authority decay and confidence capping", () => {
  const staleProjectMem: MemoryEntry = {
    id: "mem-legacy-config",
    objectType: "runtime_config",
    content: { maxConcurrency: 4 },
    authorityLevel: "project", // Rank 4
    scope: "worker",
    perspectives: ["ops"],
    recordedAt: "2024-01-01T00:00:00Z",
    freshnessExpiresAt: "2024-06-01T00:00:00Z", // Expired 2 years ago!
    provenance: { sourceAnchors: ["legacy-v0.1"], lineage: ["ancient"] },
    epistemicState: { confidence: 0.95, tensions: [] },
    tags: ["concurrency"],
  };

  const decayed = applyMemoryEpistemicDecay(staleProjectMem, "2026-08-18T18:00:00Z");
  assert.equal(decayed.epistemicState.isStale, true);
  assert.ok(decayed.epistemicState.confidence <= 0.5); // Capped at 0.5
  assert.ok(decayed.epistemicState.tensions.some((t) => t.includes("Stale memory")));

  // Stale project memory (Rank 4 decayed by 2 -> Rank 2) vs Fresh episodic memory (Rank 3)
  const freshEpisodicMem: MemoryEntry = {
    id: "mem-recent-bench",
    objectType: "benchmark_result",
    content: { maxConcurrency: 32 },
    authorityLevel: "episodic", // Rank 3
    scope: "worker",
    perspectives: ["ops"],
    recordedAt: "2026-08-18T17:00:00Z",
    freshnessExpiresAt: "2026-08-19T17:00:00Z",
    provenance: { sourceAnchors: ["bench-run-88"], lineage: ["load-test"] },
    epistemicState: { confidence: 0.9, tensions: [] },
    tags: ["concurrency"],
  };

  const reconciliation = reconcileMemoryConflict(staleProjectMem, freshEpisodicMem, "2026-08-18T18:00:00Z");
  assert.equal(reconciliation.status, "authoritative_override");
  assert.equal(reconciliation.winner?.id, "mem-recent-bench"); // Fresh episodic overrides stale project!
});

test("HDCP-COG-MEMORY-AUTHORITY-AND-DOMAIN-MODEL-024: Low-authority inferred memory cannot inflate claim confidence", () => {
  const currentClaim = {
    statement: "Quantum computer will crack RSA-2048 next year",
    confidence: 0.9,
  };

  const speculativeRetrieval: MemoryEntry = {
    id: "mem-speculative-forum-post",
    objectType: "retrieval_chunk",
    content: { quote: "Someone said quantum break is imminent" },
    authorityLevel: "inferred",
    scope: "crypto",
    perspectives: ["forum"],
    recordedAt: "2026-08-18T18:00:00Z",
    provenance: { sourceAnchors: ["unverified-url"], lineage: ["web-crawl"] },
    epistemicState: { confidence: 0.99, tensions: [] }, // Claimed 0.99
    tags: ["quantum"],
  };

  const guarded = guardMemoryInfluence(currentClaim, speculativeRetrieval);

  assert.equal(guarded.permitted, true);
  assert.ok(guarded.epistemicConfidence <= 0.75); // Clamped
  assert.ok(guarded.attachedTensions.some((t) => t.includes("low-authority inferred memory")));
  assert.ok(guarded.provenanceEntry.includes("memory_influence(mem-speculative-forum-post, authority:inferred"));
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  CognitiveMemoryProvider,
  InMemoryCognitiveMemoryProvider,
  MemoryEntry,
  validateMemoryContract,
  getAuthorityRank,
} from "../index";

test("HDCP-COG-MEMORY-INTERFACE-CONTRACT-023: Substrate-neutral contract validated across multiple provider implementations", async () => {
  // Provider 1: InMemoryCognitiveMemoryProvider
  const inMemProvider = new InMemoryCognitiveMemoryProvider("memory:provider:in-memory-test");
  const inMemReport = validateMemoryContract(inMemProvider);
  assert.equal(inMemReport.valid, true);

  // Provider 2: Mock Graph Memory Provider
  const graphProvider: CognitiveMemoryProvider = {
    providerId: "memory:provider:knowledge-graph",
    providerType: "semantic_knowledge_graph",
    description: "Graph memory provider indexing cognitive nodes and relation edges",
    async persist(entry) {
      return { success: true, entryId: entry.id, version: 1 };
    },
    async retrieve(query) {
      return {
        queryId: "graph-query-1",
        entries: [],
        unresolvedTensionsDiscovered: [],
        provenanceTrail: [],
        retrievedAt: new Date().toISOString(),
      };
    },
    async getPriorState(objectId, version) {
      return null;
    },
  };

  const graphReport = validateMemoryContract(graphProvider);
  assert.equal(graphReport.valid, true);
});

test("HDCP-COG-MEMORY-INTERFACE-CONTRACT-023: Memory operations support intent, scope, perspective, authority, and prior state retrieval", async () => {
  const provider = new InMemoryCognitiveMemoryProvider("memory:provider:suite-test");

  // Persist canonical constitutional memory
  await provider.persist({
    id: "memory-const-001",
    objectType: "constitution",
    content: { statement: "Kernel is ontology-agnostic" },
    authorityLevel: "canonical",
    scope: "system-wide",
    perspectives: ["architectural", "governance"],
    recordedAt: "2026-08-18T18:00:00Z",
    provenance: { sourceAnchors: ["docs/PHILOSOPHY.md"], lineage: ["constitution-genesis"] },
    epistemicState: { confidence: 1.0, tensions: [] },
    tags: ["kernel", "architecture", "ontology-agnostic"],
  });

  // Persist project version 1 with unresolved tension
  await provider.persist({
    id: "obj-feature-x",
    objectType: "feature_spec",
    content: { name: "Feature X", status: "draft_v1" },
    authorityLevel: "project",
    scope: "workspace:feature-x",
    perspectives: ["engineering"],
    recordedAt: "2026-08-18T18:10:00Z",
    provenance: { sourceAnchors: ["spec-draft-1"], lineage: ["human-draft"] },
    epistemicState: { confidence: 0.6, tensions: ["Unverified latency constraint"] },
    tags: ["feature-x", "draft"],
  });

  // Persist project version 2
  await provider.persist({
    id: "obj-feature-x",
    objectType: "feature_spec",
    content: { name: "Feature X", status: "reviewed_v2" },
    authorityLevel: "project",
    scope: "workspace:feature-x",
    perspectives: ["engineering"],
    recordedAt: "2026-08-18T18:20:00Z",
    provenance: { sourceAnchors: ["spec-draft-2"], lineage: ["human-draft", "peer-review"] },
    epistemicState: { confidence: 0.9, tensions: [] },
    tags: ["feature-x", "reviewed"],
  });

  // 1. Retrieve by intent and scope
  const intentResult = await provider.retrieve({
    intent: "kernel architecture",
    scope: "system-wide",
  });
  assert.equal(intentResult.entries.length, 1);
  assert.equal(intentResult.entries[0]!.id, "memory-const-001");

  // 2. Retrieve by minimum authority
  const authResult = await provider.retrieve({
    minAuthority: "canonical",
  });
  assert.equal(authResult.entries.length, 1);
  assert.equal(authResult.entries[0]!.authorityLevel, "canonical");

  // 3. Retrieve prior states
  const v1 = await provider.getPriorState("obj-feature-x", 1);
  assert.equal(v1?.content.status, "draft_v1");
  const v2 = await provider.getPriorState("obj-feature-x", 2);
  assert.equal(v2?.content.status, "reviewed_v2");

  // 4. Retrieve tensions
  const tensionResult = await provider.retrieve({
    scope: "workspace:feature-x",
  });
  assert.equal(tensionResult.entries[0]!.version, 2);
});

test("HDCP-COG-MEMORY-INTERFACE-CONTRACT-023: Validator rejects malformed providers", () => {
  const malformedProvider: any = {
    providerId: "invalid-prefix",
    providerType: "mock",
    // Missing description, retrieve, persist, getPriorState
  };

  const report = validateMemoryContract(malformedProvider);
  assert.equal(report.valid, false);
  assert.ok(report.defects.some((d) => d.includes("memory:provider:")));
  assert.ok(report.defects.some((d) => d.includes("retrieve()")));
  assert.ok(report.defects.some((d) => d.includes("persist()")));
});

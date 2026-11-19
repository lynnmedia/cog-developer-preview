import assert from "node:assert/strict";
import test from "node:test";
import {
  CognitiveObjectEnvelope,
  validateCognitiveObjectEnvelope,
} from "../index";

test("HDCP-COG-COGNITIVE-OBJECT-ENVELOPE-033: Materially distinct cognitive objects round-trip through envelope without information loss", () => {
  // Object 1: Generic Software Architecture Decision
  const archEnvelope: CognitiveObjectEnvelope<{ pattern: string; replication: string }> = {
    envelopeId: "cogop:env:arch-cluster-001",
    protocolVersion: "cogop/1.0",
    objectId: "obj-arch-storage-v2",
    objectType: "architecture_decision",
    scope: "distributed_systems:storage",
    frameAndIntent: {
      frame: "systems_architecture",
      intent: "Transition database subsystem to multi-region active-active replication",
      perspective: "reliability",
    },
    payload: { pattern: "multi_master_dynamo", replication: "asynchronous_gossip" },
    assumptions: ["Network partitions will occur", "Eventual consistency acceptable for non-financial tables"],
    epistemicState: {
      confidence: 0.85,
      tensions: ["Financial ledger breaks under eventual consistency"],
      limitations: ["Not evaluated under multi-partition Byzantine scenarios"],
    },
    grounding: {
      sourceAnchors: ["ADR-042", "benchmarks/multi-region-load.json"],
      groundingSources: ["doc:adr-042", "tool:bench:k6"],
      evidenceIds: ["evidence:tool:fluke-temp-live"],
    },
    provenance: {
      originRuntime: "runtime:node-a:primary-cog",
      lineage: ["genesis", "shape:v1", "compare:v1_v2", "trace:migration"],
      createdAt: "2026-08-18T20:00:00Z",
    },
    capabilityContext: {
      mountedCapabilities: ["capability:domain:software-architecture"],
    },
    memoryContext: {
      authorityLevel: "project",
      priorStateVersion: 1,
    },
    permissions: {
      allowMutation: true,
      permittedOperations: ["shape", "compare", "challenge", "trace"],
      allowAuthorityEscalation: false,
      requireChangeDisclosure: true,
    },
    requestedOperation: {
      routineId: "coglib:routine:challenge",
      parameters: { adversarialDepth: "strict" },
    },
  };

  const report1 = validateCognitiveObjectEnvelope(archEnvelope);
  assert.equal(report1.valid, true);

  // Serialization & Deserialization Roundtrip Simulation
  const serialized = JSON.stringify(archEnvelope);
  const deserialized: CognitiveObjectEnvelope = JSON.parse(serialized);

  assert.deepEqual(deserialized, archEnvelope);
  assert.equal(validateCognitiveObjectEnvelope(deserialized).valid, true);

  // Object 2: Music-Specialized Harmonic Cadence Object
  const musicEnvelope: CognitiveObjectEnvelope<{ sopranoContour: string; bassHarmonicProgression: string }> = {
    envelopeId: "cogop:env:music-chorale-042",
    protocolVersion: "cogop/1.0",
    objectId: "obj-bach-chorale-cadence",
    objectType: "harmonic_analysis",
    scope: "music:counterpoint:tonal",
    frameAndIntent: {
      frame: "tonal_music_theory",
      intent: "Analyze voice leading parsimony and identify cadential closure",
    },
    payload: { sopranoContour: "D5-C#5-D5", bassHarmonicProgression: "ii6-V7-I" },
    assumptions: ["Equal temperament 12-TET", "D-minor tonal center"],
    epistemicState: {
      confidence: 0.98,
      tensions: [],
    },
    grounding: {
      sourceAnchors: ["BWV-244-score"],
      groundingSources: ["corpus:bach-chorales"],
    },
    provenance: {
      originRuntime: "runtime:music-station:mom-edition",
      lineage: ["mom:ingest", "shape:cadence"],
      createdAt: "2026-08-18T20:05:00Z",
    },
    capabilityContext: {
      requiredCapabilityId: "capability:domain:music",
      mountedCapabilities: ["provider:me:mandala-of-music"],
    },
    permissions: {
      allowMutation: false,
      permittedOperations: ["compare", "trace"],
      allowAuthorityEscalation: false,
      requireChangeDisclosure: true,
    },
  };

  const report2 = validateCognitiveObjectEnvelope(musicEnvelope);
  assert.equal(report2.valid, true);

  // Object 3: Scientific Inquiry Causal Claim Object
  const scienceEnvelope: CognitiveObjectEnvelope<{ hypothesis: string; effectSize: number }> = {
    envelopeId: "cogop:env:science-cohort-099",
    protocolVersion: "cogop/1.0",
    objectId: "obj-health-cohort-claim",
    objectType: "causal_inference_claim",
    scope: "epidemiology:cardiovascular",
    frameAndIntent: {
      frame: "causal_dag_analysis",
      intent: "Assess causal identification of dietary intervention on mortality",
    },
    payload: { hypothesis: "Dietary polyphenol reduces all-cause mortality", effectSize: -0.15 },
    assumptions: ["Unmeasured confounding is conditionally ignorable given covariates"],
    epistemicState: {
      confidence: 0.65,
      tensions: ["Healthy user bias not fully adjusted in observational cohort"],
    },
    grounding: {
      sourceAnchors: ["cohort-study-2024-data"],
      groundingSources: ["doi:10.1001/jama.2024.001"],
    },
    provenance: {
      originRuntime: "runtime:epidemiology-cluster:science-node",
      lineage: ["science:shape", "science:challenge"],
      createdAt: "2026-08-18T20:10:00Z",
    },
    capabilityContext: {
      requiredCapabilityId: "capability:domain:scientific-inquiry",
    },
    permissions: {
      allowMutation: true,
      permittedOperations: ["challenge"],
      allowAuthorityEscalation: false,
      requireChangeDisclosure: true,
    },
  };

  const report3 = validateCognitiveObjectEnvelope(scienceEnvelope);
  assert.equal(report3.valid, true);
});

test("HDCP-COG-COGNITIVE-OBJECT-ENVELOPE-033: Validator rejects malformed envelopes and hidden model states", () => {
  // 1. Missing prefix and bad version
  const badEnvelope: any = {
    envelopeId: "bad-id",
    protocolVersion: "v2.0",
    objectId: "obj-1",
    objectType: "type",
    scope: "scope",
    frameAndIntent: { frame: "f", intent: "i" },
    epistemicState: { confidence: 0.9, tensions: [] },
    grounding: { sourceAnchors: [], groundingSources: [] },
    provenance: { originRuntime: "r1", lineage: [], createdAt: "2026-08-18T00:00:00Z" },
    permissions: { allowMutation: true, permittedOperations: [], allowAuthorityEscalation: false, requireChangeDisclosure: true },
  };

  const report = validateCognitiveObjectEnvelope(badEnvelope);
  assert.equal(report.valid, false);
  assert.ok(report.defects.some((d) => d.includes("cogop:env:")));
  assert.ok(report.defects.some((d) => d.includes("Unsupported protocolVersion")));

  // 2. Hidden Model State Injection: STRICTLY FORBIDDEN
  const hiddenStateEnvelope: any = {
    ...badEnvelope,
    envelopeId: "cogop:env:test-hidden-state",
    protocolVersion: "cogop/1.0",
    chainOfThought: "Step 1: think secretly about user intent...", // FORBIDDEN!
  };

  const reportHidden = validateCognitiveObjectEnvelope(hiddenStateEnvelope);
  assert.equal(reportHidden.valid, false);
  assert.ok(reportHidden.defects.some((d) => d.includes("PROHIBITED: Transporting hidden model state")));
});

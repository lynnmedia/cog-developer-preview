import assert from "node:assert/strict";
import test from "node:test";
import {
  MachineEditionCapabilityProvider,
  DomainCapability,
  validateCapabilityProvider,
  executeRoutineWithCapability,
  CapabilityMountError,
  shapeRoutine,
  compareRoutine,
  challengeRoutine,
} from "../index";

// Mock Provider 1: Music ME Capability Provider
const musicProvider: MachineEditionCapabilityProvider = {
  providerId: "provider:me:mandala-of-music",
  providerVersion: "1.0.0",
  getCapability(): DomainCapability {
    return {
      id: "capability:domain:music",
      name: "Music Theory & Composition Cognition",
      version: "1.0.0",
      targetDomain: "music",
      description: "Music domain capability",
      objectClasses: ["melodic_phrase", "harmonic_progression", "tone_row"],
      significantDimensions: ["tonal_center", "voice_leading_parsimony", "pitch_class_set"],
      relationshipVocabulary: ["resolves_to", "counterpoints"],
      domainInvariants: [],
      evidenceClasses: ["score_manuscript", "audio_recording"],
      domainAssumptions: ["A4 = 440Hz baseline"],
      characteristicFailures: [],
      hooks: {
        onShape: {
          categorizeRawElement: (elem) => ({
            isDomainKnown: true,
            domainClass: "harmonic_cadence",
            domainAnchorValid: true,
          }),
        },
        onCompare: {
          evaluateDomainDifference: (targetA, targetB) => ({
            differences: [
              {
                dimension: "voice_leading",
                description: "Target A uses authentic cadence while B uses plagal cadence",
                significance: "material",
              },
            ],
          }),
        },
        onChallenge: {
          inspectDomainVulnerabilities: (target, evidence) => [
            {
              dimension: "voice_leading_parsimony",
              severity: "minor",
              description: "Voice crossing detected between soprano and alto",
              groundingRef: "music:part-writing-rules",
            },
          ],
        },
      },
    };
  },
};

// Mock Provider 2: Scientific Claim Capability Provider
const scienceProvider: MachineEditionCapabilityProvider = {
  providerId: "provider:me:scientific-inquiry",
  providerVersion: "1.0.0",
  getCapability(): DomainCapability {
    return {
      id: "capability:domain:scientific-inquiry",
      name: "Scientific Claim Cognition",
      version: "1.0.0",
      targetDomain: "scientific-inquiry",
      description: "Scientific claim capability",
      objectClasses: ["empirical_claim", "hypothesis"],
      significantDimensions: ["construct_validity", "statistical_power"],
      relationshipVocabulary: ["falsifies", "supports"],
      domainInvariants: [],
      evidenceClasses: ["rct_trial"],
      domainAssumptions: ["alpha = 0.05 default"],
      characteristicFailures: [],
      hooks: {
        onShape: {
          categorizeRawElement: (elem) => ({
            isDomainKnown: true,
            domainClass: "empirical_hypothesis",
            domainAnchorValid: true,
          }),
        },
      },
    };
  },
};

test("HDCP-COG-ME-CAPABILITY-ADAPTER-014: Multiple distinct providers mount through identical dependency-inverted interface", async () => {
  // 1. Mount Music provider onto SHAPE
  const musicShapeResult = await executeRoutineWithCapability(
    shapeRoutine,
    {
      rawElements: [{ id: "m1", statement: "V-I cadence progression", sourceAnchor: "chorale-bach-1" }],
    },
    { provider: musicProvider },
  );

  assert.equal(musicShapeResult.status, "success");
  assert.ok((musicShapeResult.output as any).recognizedDomainClasses.includes("harmonic_cadence"));
  assert.ok(musicShapeResult.provenance.lineage.includes("mounted(capability:domain:music)"));

  // 2. Mount Science provider onto SHAPE
  const scienceShapeResult = await executeRoutineWithCapability(
    shapeRoutine,
    {
      rawElements: [{ id: "s1", statement: "CRISPR-Cas9 target editing efficiency", sourceAnchor: "nature-2020" }],
    },
    { provider: scienceProvider },
  );

  assert.equal(scienceShapeResult.status, "success");
  assert.ok((scienceShapeResult.output as any).recognizedDomainClasses.includes("empirical_hypothesis"));
  assert.ok(scienceShapeResult.provenance.lineage.includes("mounted(capability:domain:scientific-inquiry)"));
});

test("HDCP-COG-ME-CAPABILITY-ADAPTER-014: Mounted ME capability specializes COMPARE and CHALLENGE routines", async () => {
  // COMPARE + Music Provider
  const compRes = await executeRoutineWithCapability(
    compareRoutine,
    {
      targetA: { id: "phrase-1", assumptions: ["tonal root"] },
      targetB: { id: "phrase-2", assumptions: ["tonal root"] },
    },
    { provider: musicProvider },
  );

  assert.equal(compRes.status, "success");
  assert.ok((compRes.output as any).domainDifferences.some((d: any) => d.dimension === "voice_leading"));

  // CHALLENGE + Music Provider
  const challRes = await executeRoutineWithCapability(
    challengeRoutine,
    {
      target: { id: "four-part-chorale", statement: "Four part choral harmonization is strictly voice-leading compliant" },
    },
    { provider: musicProvider },
  );

  assert.equal(challRes.status, "qualified");
  assert.ok((challRes.output as any).domainVulnerabilities.some((v: any) => v.dimension === "voice_leading_parsimony"));
});

test("HDCP-COG-ME-CAPABILITY-ADAPTER-014: Fail-closed behavior for invalid or throwing capability providers", async () => {
  const invalidProvider: any = {
    providerId: "bad-prefix-id", // Missing provider:me:
    providerVersion: "1.0.0",
    getCapability: () => ({ id: "bad" }),
  };

  // Strict mode: throws typed CapabilityMountError
  await assert.rejects(
    async () => {
      await executeRoutineWithCapability(
        shapeRoutine,
        { rawElements: [{ id: "e1", statement: "Claim" }] },
        { provider: invalidProvider, strictCompatibility: true },
      );
    },
    (err: any) => err instanceof CapabilityMountError && err.code === "INCOMPATIBLE_CAPABILITY_PROVIDER",
  );

  // Non-strict mode: fails closed, executes base routine, adds qualification
  const fallbackResult = await executeRoutineWithCapability(
    shapeRoutine,
    { rawElements: [{ id: "e1", statement: "Claim" }] },
    { provider: invalidProvider, strictCompatibility: false },
  );

  assert.equal(fallbackResult.status, "qualified");
  assert.ok(fallbackResult.epistemicState.tensions.some((t) => t.includes("Capability mount rejected")));

  // Throwing provider hook: safely caught and qualified without crash
  const throwingProvider: MachineEditionCapabilityProvider = {
    providerId: "provider:me:exploding",
    providerVersion: "1.0.0",
    getCapability: () => ({
      ...musicProvider.getCapability(),
      hooks: {
        onShape: {
          categorizeRawElement: () => {
            throw new Error("Simulated fatal internal domain crash");
          },
        },
      },
    }),
  };

  const throwingResult = await executeRoutineWithCapability(
    shapeRoutine,
    { rawElements: [{ id: "e1", statement: "Claim" }] },
    { provider: throwingProvider },
  );

  assert.equal(throwingResult.status, "qualified");
  assert.ok(throwingResult.epistemicState.tensions.some((t) => t.includes("Capability hook error")));
});

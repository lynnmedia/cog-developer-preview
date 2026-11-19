import assert from "node:assert/strict";
import test from "node:test";
import {
  shapeRoutine,
  compareRoutine,
  challengeRoutine,
  executeRoutineWithGuards,
  executeRoutineWithCapability,
  MachineEditionCapabilityProvider,
  DomainCapability,
} from "../index";

// Authenticated Mandala of Music ME Capability Provider
export const mandalaOfMusicCapabilityProvider: MachineEditionCapabilityProvider = {
  providerId: "provider:me:mandala-of-music",
  providerVersion: "1.0.0",
  getCapability(): DomainCapability {
    return {
      id: "capability:domain:music",
      name: "Mandala of Music Domain Capability",
      version: "1.0.0",
      targetDomain: "music",
      description: "Music theory, modal systems, harmonic progression, and voice leading cognition",
      objectClasses: [
        "melodic_phrase",
        "harmonic_progression",
        "cadential_gesture",
        "tone_row",
        "timbral_envelope",
        "modal_frame",
      ],
      significantDimensions: [
        "tonal_center",
        "rhythmic_meter",
        "voice_leading_parsimony",
        "harmonic_density",
        "modal_orientation",
        "fixed_vs_open_structure",
      ],
      relationshipVocabulary: [
        "resolves_to",
        "counterpoints",
        "transforms_via",
        "prolongs",
        "substitutes_for",
      ],
      domainInvariants: [
        {
          id: "octave-equivalence",
          description: "Pitch class intervals are modulo 12 invariant under 12-TET",
          enforce: () => ({ valid: true }),
        },
      ],
      evidenceClasses: [
        "score_manuscript",
        "audio_recording",
        "spectrogram",
        "performance_transcript",
      ],
      domainAssumptions: [
        "Equal temperament 12-TET baseline (A4 = 440Hz)",
        "Standard western staff / pitch-class notation",
      ],
      characteristicFailures: [
        {
          code: "MUSIC_PARALLEL_FIFTHS",
          description: "Consecutive perfect fifths in strict four-part contrapuntal texture",
          domainMitigation: "Apply contrary or oblique voice motion",
        },
      ],
      hooks: {
        onShape: {
          recognizedObjectClasses: ["cadential_gesture", "harmonic_progression"],
          domainAssumptions: ["Equal temperament 12-TET baseline (A4 = 440Hz)"],
          categorizeRawElement: (elem) => {
            if (elem.statement?.includes("cadence") || elem.statement?.includes("V-I")) {
              return { isDomainKnown: true, domainClass: "cadential_gesture", domainAnchorValid: true };
            }
            if (elem.statement?.includes("chords") || elem.statement?.includes("progression")) {
              return { isDomainKnown: true, domainClass: "harmonic_progression", domainAnchorValid: true };
            }
            return { isDomainKnown: true, domainClass: "melodic_phrase", domainAnchorValid: Boolean(elem.sourceAnchor) };
          },
        },
        onCompare: {
          domainDimensions: ["voice_leading_parsimony", "modal_orientation"],
          evaluateDomainDifference: (targetA, targetB) => {
            const diffs: Array<{ dimension: string; description: string; significance: "minor" | "material" | "critical" }> = [];
            const limits: Array<{ dimension: string; reason: string }> = [];

            if (targetA.modalSystem && targetB.modalSystem && targetA.modalSystem !== targetB.modalSystem) {
              diffs.push({
                dimension: "modal_orientation",
                description: `Modal framework shifts from '${targetA.modalSystem}' to '${targetB.modalSystem}'`,
                significance: "material",
              });
            }

            if (
              (targetA.tonalFramework === "12-tone-serial" && targetB.tonalFramework === "functional-diatonic") ||
              (targetA.tonalFramework === "functional-diatonic" && targetB.tonalFramework === "12-tone-serial")
            ) {
              limits.push({
                dimension: "harmonic_functionality",
                reason: "Cannot compare functional diatonic harmonic tension directly against non-tonal serial matrix rows without translation",
              });
            }

            return { differences: diffs, incommensurabilityLimits: limits };
          },
        },
        onChallenge: {
          inspectDomainVulnerabilities: (target, evidencePool) => {
            const vulns: Array<{ dimension: string; severity: "minor" | "moderate" | "severe"; description: string; groundingRef: string }> = [];

            if (target.statement?.includes("strict four-part") && target.statement?.includes("parallel fifths")) {
              vulns.push({
                dimension: "counterexamples",
                severity: "severe",
                description: "Contains parallel fifths in strict four-part vocal counterpoint",
                groundingRef: "fux-gradus-ad-parnassum-1725",
              });
            }

            return vulns;
          },
        },
      },
    };
  },
};

test("HDCP-COG-MUSIC-CAPABILITY-PROOF-015: SHAPE + Music Capability adds domain classification while preserving generic routine honesty", async () => {
  const musicalInput = {
    objectId: "bach-chorale-cadence-001",
    rawElements: [
      { id: "e1", statement: "Authentic V-I cadence in G major", sourceAnchor: "bwv-244-no-62" },
      { id: "e2", statement: "Soprano melodic ascent to high G", sourceAnchor: "bwv-244-score" },
    ],
    expectedDimensions: ["statement"],
  };

  // 1. Generic CogLib execution
  const genericResult = await executeRoutineWithGuards(shapeRoutine, musicalInput);
  assert.equal(genericResult.status, "success");
  assert.equal((genericResult.output as any).recognizedDomainClasses, undefined);

  // 2. CogLib + Music capability execution
  const specializedResult = await executeRoutineWithCapability(shapeRoutine, musicalInput, {
    provider: mandalaOfMusicCapabilityProvider,
  });

  assert.equal(specializedResult.status, "success");
  const specOut = specializedResult.output as any;
  // Domain amplification verified
  assert.ok(specOut.recognizedDomainClasses.includes("cadential_gesture"));
  assert.ok(specOut.recognizedDomainClasses.includes("melodic_phrase"));
  assert.ok(specOut.domainAssumptions.includes("Equal temperament 12-TET baseline (A4 = 440Hz)"));

  // Governance preservation verified
  assert.equal(specializedResult.epistemicState.confidence, genericResult.epistemicState.confidence);
  assert.ok(specializedResult.provenance.lineage.includes("mounted(capability:domain:music)"));
});

test("HDCP-COG-MUSIC-CAPABILITY-PROOF-015: COMPARE + Music Capability detects harmonic incommensurability", async () => {
  const diatonicProgression = {
    id: "bach-chorale",
    tonalFramework: "functional-diatonic",
    modalSystem: "major-diatonic",
    assumptions: ["Tonal root hierarchy"],
  };

  const serialMatrixRow = {
    id: "schoenberg-op25",
    tonalFramework: "12-tone-serial",
    modalSystem: "dodecaphonic",
    assumptions: ["All 12 pitch classes equal weight"],
  };

  // 1. Generic execution
  const genericComp = await executeRoutineWithGuards(compareRoutine, {
    targetA: diatonicProgression,
    targetB: serialMatrixRow,
  });
  assert.equal(genericComp.status, "success");

  // 2. Specialized execution with Music ME
  const specComp = await executeRoutineWithCapability(
    compareRoutine,
    { targetA: diatonicProgression, targetB: serialMatrixRow },
    { provider: mandalaOfMusicCapabilityProvider },
  );

  assert.equal(specComp.status, "qualified"); // Correctly qualified due to domain incommensurability limit
  const specOut = specComp.output as any;
  assert.ok(specOut.domainDifferences.some((d: any) => d.dimension === "modal_orientation"));
  assert.ok(specOut.domainIncommensurabilityLimits.some((l: any) => l.dimension === "harmonic_functionality"));
  assert.ok(specComp.epistemicState.tensions.some((t) => t.includes("Domain incommensurability [harmonic_functionality]")));
});

test("HDCP-COG-MUSIC-CAPABILITY-PROOF-015: CHALLENGE + Music Capability exposes counterpoint defects", async () => {
  const voiceLeadingClaim = {
    target: {
      id: "contrapuntal-passage",
      statement: "This strict four-part passage with parallel fifths satisfies strict classical counterpoint",
      sampleSize: 100,
    },
  };

  // Specialized execution with Music ME
  const specChall = await executeRoutineWithCapability(
    challengeRoutine,
    voiceLeadingClaim,
    { provider: mandalaOfMusicCapabilityProvider },
  );

  assert.equal(specChall.status, "qualified");
  const specOut = specChall.output as any;
  assert.ok(specOut.domainVulnerabilities.some((v: any) => v.description.includes("parallel fifths")));
  assert.ok(specChall.epistemicState.tensions.some((t) => t.includes("parallel fifths in strict four-part")));
});

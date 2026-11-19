import assert from "node:assert/strict";
import test from "node:test";
import {
  DomainCapability,
  validateDomainCapabilityContract,
  applyGovernedSpecialization,
  shapeRoutine,
  executeRoutineWithGuards,
} from "../index";

test("HDCP-COG-DOMAIN-CAPABILITY-CONTRACT-013: Domain Capability Contract validates compliant multi-domain capabilities", () => {
  // Compliant Music Capability Definition
  const musicCapability: DomainCapability = {
    id: "capability:domain:music",
    name: "Music Theory & Composition Cognition",
    version: "1.0.0",
    targetDomain: "music",
    description: "Domain capability specializing harmonic, melodic, and formal musical analysis",
    objectClasses: ["melodic_phrase", "harmonic_progression", "tone_row", "cadential_gesture"],
    significantDimensions: ["tonal_center", "rhythmic_meter", "voice_leading_parsimony", "pitch_class_set"],
    relationshipVocabulary: ["resolves_to", "counterpoints", "transforms_via", "prolongs"],
    domainInvariants: [
      {
        id: "octave-equivalence",
        description: "Pitch classes are modulo 12 invariant",
        enforce: (target: any) => ({ valid: true }),
      },
    ],
    evidenceClasses: ["audio_recording", "score_manuscript", "spectrogram"],
    domainAssumptions: ["Equal temperament unless specified", "A4 = 440Hz baseline"],
    characteristicFailures: [
      {
        code: "MUSIC_UNRESOLVED_DISSONANCE",
        description: "Dissonant interval lacks voice leading resolution",
        domainMitigation: "Trace preparatory and resolving chord steps",
      },
    ],
    hooks: {
      onShape: {
        expectedDimensions: ["tonal_center", "tempo_bpm"],
      },
    },
  };

  const musicReport = validateDomainCapabilityContract(musicCapability);
  assert.equal(musicReport.valid, true);
  assert.equal(musicReport.defects.length, 0);

  // Compliant Scientific Claim Capability Definition
  const scienceCapability: DomainCapability = {
    id: "capability:domain:scientific-inquiry",
    name: "Scientific Claim & Empirical Methodology Cognition",
    version: "1.0.0",
    targetDomain: "scientific-inquiry",
    description: "Domain capability specializing in construct validity, causal identification, and replication assessment",
    objectClasses: ["empirical_claim", "observational_dataset", "hypothesis", "causal_dag"],
    significantDimensions: ["construct_validity", "measurement_error", "confounding_factors", "statistical_power"],
    relationshipVocabulary: ["falsifies", "supports", "confounds", "replicates", "mediates"],
    domainInvariants: [
      {
        id: "temporal-precedence",
        description: "Causes must temporally precede effects in causal DAGs",
        enforce: (target: any) => ({ valid: true }),
      },
    ],
    evidenceClasses: ["rct_trial", "meta_analysis", "observational_cohort", "pre-registration_record"],
    domainAssumptions: ["Statistical significance alpha = 0.05 default", "Absence of evidence != evidence of absence"],
    characteristicFailures: [
      {
        code: "SCIENCE_P_HACKING_RISK",
        description: "High multiplicity of uncorrected hypothesis tests",
        domainMitigation: "Apply Benjamini-Hochberg FDR correction",
      },
    ],
    hooks: {
      onChallenge: {},
    },
  };

  const scienceReport = validateDomainCapabilityContract(scienceCapability);
  assert.equal(scienceReport.valid, true);
  assert.equal(scienceReport.defects.length, 0);
});

test("HDCP-COG-DOMAIN-CAPABILITY-CONTRACT-013: Contract validator rejects malformed capabilities", () => {
  const malformedCapability: any = {
    id: "invalid-prefix-name", // Missing capability:domain: prefix
    name: "Bad Capability",
    version: "not-semver",
    objectClasses: [], // Empty!
    significantDimensions: [], // Empty!
  };

  const report = validateDomainCapabilityContract(malformedCapability);
  assert.equal(report.valid, false);
  assert.ok(report.defects.some((d) => d.includes("capability:domain:")));
  assert.ok(report.defects.some((d) => d.includes("SemVer")));
  assert.ok(report.defects.some((d) => d.includes("domain object class")));
});

test("HDCP-COG-DOMAIN-CAPABILITY-CONTRACT-013: Governance engine strictly rejects prohibited overrides", async () => {
  const testCapability: DomainCapability = {
    id: "capability:domain:test-rig",
    name: "Test Rig Capability",
    version: "1.0.0",
    targetDomain: "test",
    description: "Capability for testing governance guards",
    objectClasses: ["test_obj"],
    significantDimensions: ["test_dim"],
    relationshipVocabulary: [],
    domainInvariants: [],
    evidenceClasses: [],
    domainAssumptions: [],
    characteristicFailures: [],
    hooks: {},
  };

  // Run a base SHAPE routine that yields qualified status with confidence 0.5 and missing dimensions
  const baseResult = await executeRoutineWithGuards(shapeRoutine, {
    rawElements: [
      { id: "e1", statement: "Test claim", confidence: 0.5 },
    ],
    expectedDimensions: ["missing_dim_1"],
  });

  assert.equal(baseResult.status, "qualified");
  assert.ok(baseResult.epistemicState.confidence <= 0.8);
  const baseTensionCount = baseResult.epistemicState.tensions.length;
  assert.ok(baseTensionCount > 0);

  // Prohibited Override Attempt 1: Inflating confidence to 0.99
  // Prohibited Override Attempt 2: Erasing base tensions
  const specialized = applyGovernedSpecialization(
    baseResult,
    {
      enhancedOutput: { domainFlag: "specialized" } as any,
      attemptedConfidenceOverride: 0.99, // FORBIDDEN!
      domainTensions: ["Domain specific tension"],
    },
    testCapability,
  );

  // 1. Confidence must NOT be inflated above base confidence
  assert.equal(specialized.epistemicState.confidence, baseResult.epistemicState.confidence);

  // 2. Tensions must retain base tensions + domain tensions (monotonic union)
  assert.ok(specialized.epistemicState.tensions.length > baseTensionCount);
  assert.ok(specialized.epistemicState.tensions.some((t) => t.includes("Domain specific tension")));

  // 3. Provenance must record capability mount
  assert.ok(specialized.provenance.lineage.includes("mounted(capability:domain:test-rig)"));

  // 4. Status remains qualified due to unresolved tensions
  assert.equal(specialized.status, "qualified");
});

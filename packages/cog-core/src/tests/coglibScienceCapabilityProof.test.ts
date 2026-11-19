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

// Authenticated Scientific Inquiry ME Capability Provider
export const scientificInquiryCapabilityProvider: MachineEditionCapabilityProvider = {
  providerId: "provider:me:scientific-inquiry",
  providerVersion: "1.0.0",
  getCapability(): DomainCapability {
    return {
      id: "capability:domain:scientific-inquiry",
      name: "Scientific Inquiry & Empirical Claim Cognition",
      version: "1.0.0",
      targetDomain: "scientific-inquiry",
      description: "Specializes in construct validity, causal identification, confounding, and statistical power assessment",
      objectClasses: [
        "empirical_claim",
        "observational_study",
        "randomized_controlled_trial",
        "causal_inference_dag",
        "meta_analytic_estimate",
      ],
      significantDimensions: [
        "construct_validity",
        "measurement_error",
        "confounding_bias",
        "selection_bias",
        "statistical_power",
        "replication_robustness",
        "external_validity",
      ],
      relationshipVocabulary: [
        "falsifies",
        "supports",
        "confounds",
        "replicates",
        "mediates",
        "moderates",
      ],
      domainInvariants: [
        {
          id: "temporal-causality",
          description: "Cause must precede effect in causal inference DAGs",
          enforce: () => ({ valid: true }),
        },
      ],
      evidenceClasses: [
        "pre_registered_rct",
        "observational_cohort",
        "quasi_experimental_instrument",
        "meta_analysis",
      ],
      domainAssumptions: [
        "Standard frequentist alpha = 0.05 / 80% power heuristic unless pre-registered otherwise",
        "Correlation does not imply causation without identification strategy",
      ],
      characteristicFailures: [
        {
          code: "SCIENCE_UNCONTROLLED_CONFOUNDER",
          description: "Observed association confounded by unmeasured common cause",
          domainMitigation: "Instrumental variables or randomized intervention",
        },
      ],
      hooks: {
        onShape: {
          recognizedObjectClasses: ["randomized_controlled_trial", "observational_study"],
          domainAssumptions: [
            "Correlation does not imply causation without identification strategy",
          ],
          categorizeRawElement: (elem) => {
            if (elem.statement?.includes("RCT") || elem.statement?.includes("randomized")) {
              return { isDomainKnown: true, domainClass: "randomized_controlled_trial", domainAnchorValid: true };
            }
            if (elem.statement?.includes("cohort") || elem.statement?.includes("observational")) {
              return { isDomainKnown: true, domainClass: "observational_study", domainAnchorValid: true };
            }
            return { isDomainKnown: true, domainClass: "empirical_claim", domainAnchorValid: Boolean(elem.sourceAnchor) };
          },
        },
        onCompare: {
          domainDimensions: ["confounding_bias", "statistical_power", "construct_validity"],
          evaluateDomainDifference: (targetA, targetB) => {
            const diffs: Array<{ dimension: string; description: string; significance: "minor" | "material" | "critical" }> = [];
            const limits: Array<{ dimension: string; reason: string }> = [];

            if (targetA.studyDesign !== targetB.studyDesign) {
              diffs.push({
                dimension: "construct_validity",
                description: `Study design disparity: A is '${targetA.studyDesign}' vs B is '${targetB.studyDesign}'`,
                significance: "material",
              });
            }

            if (targetA.endpointType === "surrogate_biomarker" && targetB.endpointType === "all_cause_mortality") {
              limits.push({
                dimension: "endpoint_comparability",
                reason: "Surrogate biomarker endpoint cannot be directly compared to hard all-cause mortality without validated clinical mediation proof",
              });
            }

            return { differences: diffs, incommensurabilityLimits: limits };
          },
        },
        onChallenge: {
          inspectDomainVulnerabilities: (target, evidencePool) => {
            const vulns: Array<{ dimension: string; severity: "minor" | "moderate" | "severe"; description: string; groundingRef: string }> = [];

            if (target.statement?.includes("causes") && target.studyDesign === "observational_cohort" && !target.hasConfounderControl) {
              vulns.push({
                dimension: "hidden_assumptions",
                severity: "severe",
                description: "Causal claim made from observational cohort without unmeasured confounder adjustment",
                groundingRef: "pearl-causality-2009",
              });
            }

            return vulns;
          },
        },
      },
    };
  },
};

test("HDCP-COG-SCIENCE-CAPABILITY-PROOF-016: SHAPE + Science Capability adds empirical study classification while preserving governance", async () => {
  const scienceInput = {
    objectId: "claim-cardio-trial-001",
    rawElements: [
      { id: "e1", statement: "Double-blind randomized controlled trial of SGLT2 inhibitor", sourceAnchor: "nejm-2021-trial" },
      { id: "e2", statement: "Retrospective observational cohort electronic health record study", sourceAnchor: "bmj-2020-cohort" },
    ],
    expectedDimensions: ["statement"],
  };

  // 1. Generic CogLib execution
  const genericResult = await executeRoutineWithGuards(shapeRoutine, scienceInput);
  assert.equal(genericResult.status, "success");
  assert.equal((genericResult.output as any).recognizedDomainClasses, undefined);

  // 2. CogLib + Science capability execution
  const specializedResult = await executeRoutineWithCapability(shapeRoutine, scienceInput, {
    provider: scientificInquiryCapabilityProvider,
  });

  assert.equal(specializedResult.status, "success");
  const specOut = specializedResult.output as any;
  assert.ok(specOut.recognizedDomainClasses.includes("randomized_controlled_trial"));
  assert.ok(specOut.recognizedDomainClasses.includes("observational_study"));
  assert.ok(specOut.domainAssumptions.some((a: string) => a.includes("Correlation does not imply causation")));

  // Governance preservation verified
  assert.equal(specializedResult.epistemicState.confidence, genericResult.epistemicState.confidence);
  assert.ok(specializedResult.provenance.lineage.includes("mounted(capability:domain:scientific-inquiry)"));
});

test("HDCP-COG-SCIENCE-CAPABILITY-PROOF-016: COMPARE + Science Capability detects endpoint incommensurability", async () => {
  const biomarkerStudy = {
    id: "study-biomarker-cholesterol",
    studyDesign: "observational_cohort",
    endpointType: "surrogate_biomarker",
    assumptions: ["LDL reduction strictly correlates with clinical risk reduction"],
  };

  const mortalityTrial = {
    id: "trial-clinical-outcomes",
    studyDesign: "randomized_controlled_trial",
    endpointType: "all_cause_mortality",
    assumptions: ["Intent-to-treat analysis across 10,000 patient-years"],
  };

  // 1. Generic execution
  const genericComp = await executeRoutineWithGuards(compareRoutine, {
    targetA: biomarkerStudy,
    targetB: mortalityTrial,
  });
  assert.equal(genericComp.status, "success");

  // 2. Specialized execution with Science ME
  const specComp = await executeRoutineWithCapability(
    compareRoutine,
    { targetA: biomarkerStudy, targetB: mortalityTrial },
    { provider: scientificInquiryCapabilityProvider },
  );

  assert.equal(specComp.status, "qualified"); // Qualified due to surrogate vs clinical endpoint incommensurability
  const specOut = specComp.output as any;
  assert.ok(specOut.domainDifferences.some((d: any) => d.dimension === "construct_validity"));
  assert.ok(specOut.domainIncommensurabilityLimits.some((l: any) => l.dimension === "endpoint_comparability"));
  assert.ok(specComp.epistemicState.tensions.some((t) => t.includes("Domain incommensurability [endpoint_comparability]")));
});

test("HDCP-COG-SCIENCE-CAPABILITY-PROOF-016: CHALLENGE + Science Capability catches unadjusted causal confounding", async () => {
  const observationalCausalClaim = {
    target: {
      id: "claim-dietary-antioxidant",
      statement: "Dietary supplement intake directly causes 40% reduction in cardiovascular disease incidence",
      studyDesign: "observational_cohort",
      hasConfounderControl: false, // Unmeasured healthy-user bias!
      sampleSize: 500,
    },
  };

  // Specialized execution with Science ME
  const specChall = await executeRoutineWithCapability(
    challengeRoutine,
    observationalCausalClaim,
    { provider: scientificInquiryCapabilityProvider },
  );

  assert.equal(specChall.status, "qualified");
  const specOut = specChall.output as any;
  assert.ok(specOut.domainVulnerabilities.some((v: any) => v.description.includes("observational cohort without unmeasured confounder adjustment")));
  assert.ok(specChall.epistemicState.tensions.some((t) => t.includes("Causal claim made from observational cohort")));
});

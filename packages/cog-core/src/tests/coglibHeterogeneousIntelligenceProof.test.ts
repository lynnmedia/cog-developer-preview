import assert from "node:assert/strict";
import test from "node:test";
import {
  CognitiveObjectEnvelope,
  CognitiveCapabilityProfile,
  validateCognitiveObjectEnvelope,
  negotiateCognitiveTask,
  applyGovernedEnvelopeTransformation,
  validateTransformationIntegrity,
  challengeRoutine,
  executeRoutineWithCapability,
  computeCognitiveMetrics,
} from "../index";
import { scientificInquiryCapabilityProvider } from "./coglibScienceCapabilityProof.test";

test("HDCP-COG-HETEROGENEOUS-INTELLIGENCE-PROOF-037: Generic and specialized runtimes collaborate through CogOP preserving provenance and domain limitations", async () => {
  // =========================================================================
  // NODE A (Generic Runtime): Ingests Unstructured Empirical Claim
  // =========================================================================
  const genericEnvelope: CognitiveObjectEnvelope<{ statement: string; studyDesign: string; sampleSize: number }> = {
    envelopeId: "cogop:env:epi-claim-001",
    protocolVersion: "cogop/1.0",
    objectId: "obj-dietary-mortality-claim",
    objectType: "empirical_claim",
    scope: "epidemiology:cardiovascular",
    frameAndIntent: {
      frame: "claim_verification",
      intent: "Verify causal assertion regarding dietary polyphenol and longevity",
    },
    payload: {
      statement: "High dietary polyphenol intake causes 30% reduction in all-cause mortality",
      studyDesign: "observational_cohort",
      sampleSize: 5000,
    },
    assumptions: ["Self-reported dietary questionnaires are accurate"],
    epistemicState: {
      confidence: 0.85,
      tensions: [],
    },
    grounding: {
      sourceAnchors: ["doi:10.1001/jama.2025.101"],
      groundingSources: ["corpus:jama-observational"],
    },
    provenance: {
      originRuntime: "runtime:node-a:generic",
      lineage: ["genesis", "shape:unstructured_claim"],
      createdAt: "2026-08-18T20:00:00Z",
    },
    permissions: {
      allowMutation: true,
      permittedOperations: ["challenge", "compare"],
      allowAuthorityEscalation: false,
      requireChangeDisclosure: true,
    },
    requestedOperation: {
      routineId: "coglib:routine:challenge",
    },
  };

  assert.equal(validateCognitiveObjectEnvelope(genericEnvelope).valid, true);

  // Wire Transmission from Node A to Node B
  const payloadToB = JSON.stringify(genericEnvelope);

  // =========================================================================
  // NODE B (Specialized Science Runtime): Ingests, Negotiates & Executes Specialized CHALLENGE
  // =========================================================================
  const nodeBProfile: CognitiveCapabilityProfile = {
    runtimeId: "runtime:node-b:scientific-specialist",
    supportedProtocolVersions: ["cogop/1.0"],
    supportedRoutines: [{ routineId: "coglib:routine:challenge", version: "1.0.0" }],
    mountedCapabilities: ["capability:domain:scientific-inquiry"],
    supportedEvidenceRoles: ["MEASUREMENT", "CALCULATION", "RETRIEVED_DOCUMENT"],
    supportsMemory: true,
    supportsEvaluation: true,
    allowsMutations: true,
  };

  const receivedOnB: CognitiveObjectEnvelope = JSON.parse(payloadToB);
  const negotiation = negotiateCognitiveTask(receivedOnB, nodeBProfile);
  assert.equal(negotiation.canExecute, true);

  // Node B runs specialized routine with mounted Scientific Inquiry capability
  const scienceChallengeResult = await executeRoutineWithCapability(
    challengeRoutine,
    {
      target: {
        id: receivedOnB.objectId,
        statement: receivedOnB.payload.statement,
        studyDesign: receivedOnB.payload.studyDesign,
        hasConfounderControl: false, // Uncontrolled healthy lifestyle bias
        sampleSize: receivedOnB.payload.sampleSize,
        groundingSources: receivedOnB.grounding.groundingSources,
      },
    },
    { provider: scientificInquiryCapabilityProvider },
  );

  assert.equal(scienceChallengeResult.status, "qualified");
  assert.ok(scienceChallengeResult.output?.domainVulnerabilities.some((v: any) => v.description.includes("confounder")));

  // Node B transforms envelope with domain limitations and declared mutation
  const transformedByB = applyGovernedEnvelopeTransformation(receivedOnB, {
    transformerRuntime: nodeBProfile.runtimeId,
    newConfidence: 0.6,
    addedTensions: [
      "Observational cohort without unmeasured confounder control cannot establish causal mortality reduction",
    ],
    addedSourceAnchors: ["dag:confounding:healthy-user-effect"],
    addedGroundingSources: ["capability:domain:scientific-inquiry"],
    mutationRecords: [
      {
        timestamp: "2026-08-18T20:10:00Z",
        transformerRuntime: nodeBProfile.runtimeId,
        action: "CHALLENGED",
        field: "epistemicState.confidence",
        rationale: "Detected unadjusted confounding bias in observational causal claim",
        previousValueSummary: "0.85",
        newValueSummary: "0.60",
      },
    ],
  });

  // Attach capability context to disclose specialization origin
  const envelopeWithCapabilityContext: CognitiveObjectEnvelope = {
    ...transformedByB,
    capabilityContext: {
      mountedCapabilities: ["capability:domain:scientific-inquiry"],
    },
  };

  // Wire Transmission back to Node A
  const payloadToA = JSON.stringify(envelopeWithCapabilityContext);

  // =========================================================================
  // NODE A (Generic Runtime): Ingests & Inspects Specialized Contribution
  // =========================================================================
  const receivedBackOnA: CognitiveObjectEnvelope = JSON.parse(payloadToA);

  // 1. Verify semantic integrity and Concept Identity continuity
  const report = validateTransformationIntegrity(genericEnvelope, receivedBackOnA);
  assert.equal(report.valid, true);

  // 2. Generic Node A can inspect the specialized contribution without possessing the science capability engine:
  // - Originating capability:
  assert.ok(receivedBackOnA.capabilityContext?.mountedCapabilities?.includes("capability:domain:scientific-inquiry"));
  // - Resulting tensions:
  assert.ok(receivedBackOnA.epistemicState.tensions.some((t) => t.includes("confounder control")));
  // - Epistemic status:
  assert.equal(receivedBackOnA.epistemicState.confidence, 0.6);
  // - Traceable mutation disclosure:
  assert.equal(receivedBackOnA.declaredMutations?.length, 1);
  assert.equal(receivedBackOnA.declaredMutations[0]!.action, "CHALLENGED");

  // 3. Cognitive Evaluation: Useful Cognitive Delta & False Certainty Avoidance
  const profile = computeCognitiveMetrics(scienceChallengeResult, { id: "baseline:generic_unspecialized_node" });
  const domainDetection = profile.dimensions.find((d) => d.dimensionId === "domain_significant_issue_detection")!;
  assert.ok((domainDetection.metricValue as any).detectedDomainItems > 0);

  const falseCertainty = profile.dimensions.find((d) => d.dimensionId === "false_certainty_avoidance")!;
  assert.equal((falseCertainty.metricValue as any).pass, 1);
});

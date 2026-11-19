import assert from "node:assert/strict";
import test from "node:test";
import {
  traceRoutine,
  TraceInput,
  TraceOutput,
  LineageRecord,
} from "../coglib/routines/trace";
import {
  executeRoutineWithGuards,
  CognitiveProofHarness,
  evaluateCandidateForAdmission,
} from "../coglib";

test("HDCP-COGLIB-TRACE-008: Complete backward lineage traversal with explanatory narrative and confidence shifts", async () => {
  const completeChain: LineageRecord[] = [
    {
      id: "src-ice-core",
      stage: "source",
      sourceAnchor: "doi:10.1038/nature06949",
      description: "EPICA Dome C Antarctic ice core CO2 & isotope records",
      isRecorded: true,
    },
    {
      id: "grd-forcing-law",
      stage: "grounding",
      parentId: "src-ice-core",
      sourceAnchor: "arrhenius-1896",
      description: "Logarithmic CO2 radiative forcing formula deltaF = 5.35 * ln(C/C0)",
      isRecorded: true,
    },
    {
      id: "inf-feedback-gain",
      stage: "inference",
      parentId: "grd-forcing-law",
      description: "Derived water vapor and cloud feedback gain factors",
      confidenceDelta: -0.05,
      assumptionsAdded: ["Fast cloud feedback linearity"],
      isRecorded: true,
    },
    {
      id: "tx-gcm-ensemble",
      stage: "transformation",
      parentId: "inf-feedback-gain",
      description: "Coupled CMIP6 multi-model climate simulation ensemble projection",
      confidenceDelta: -0.05,
      assumptionsAdded: ["Representative Concentration Pathway 4.5"],
      isRecorded: true,
    },
    {
      id: "res-sensitivity-3c",
      stage: "result",
      parentId: "tx-gcm-ensemble",
      description: "Equilibrium Climate Sensitivity estimated at 3.0°C +/- 0.5°C",
      isRecorded: true,
    },
  ];

  const result = await executeRoutineWithGuards(traceRoutine, {
    targetObjectId: "res-sensitivity-3c",
    records: completeChain,
    rootSourceExpected: "doi:10.1038/nature06949",
  });

  assert.equal(result.status, "success");
  const out = result.output as TraceOutput;
  assert.equal(out.integrity, "complete");
  assert.equal(out.traversalChain.length, 5);
  assert.equal(out.gaps.length, 0);
  assert.equal(out.conflicts.length, 0);

  // Verifies explanatory causal narrative
  assert.ok(out.explanatoryNarrative.includes("[Step 1: SOURCE]"));
  assert.ok(out.explanatoryNarrative.includes("[Step 5: RESULT]"));

  // Verifies accumulated assumptions exposed
  const finalStep = out.traversalChain[4]!;
  assert.ok(finalStep.assumptionsAccumulated.includes("Fast cloud feedback linearity"));
  assert.ok(finalStep.assumptionsAccumulated.includes("Representative Concentration Pathway 4.5"));
});

test("HDCP-COGLIB-TRACE-008: Incomplete lineage with gaps qualifies integrity and exposes missing links", async () => {
  const gappedRecords: LineageRecord[] = [
    {
      id: "tx-event-mesh",
      stage: "transformation",
      parentId: "missing-incident-record-404", // Pointing to missing parent!
      description: "Refactored monolith into Kafka event stream",
      isRecorded: true,
    },
    {
      id: "res-arch-v2",
      stage: "result",
      parentId: "tx-event-mesh",
      description: "Deployed Event Mesh v2",
      isRecorded: true,
    },
  ];

  const result = await executeRoutineWithGuards(traceRoutine, {
    targetObjectId: "res-arch-v2",
    records: gappedRecords,
  });

  assert.equal(result.status, "qualified");
  const out = result.output as TraceOutput;
  assert.equal(out.integrity, "gapped");
  assert.equal(out.gaps.length, 1);
  assert.ok(out.unresolvedTensions.some((t) => t.includes("Lineage gap: missing predecessor record")));
});

test("HDCP-COGLIB-TRACE-008: Conflicting provenance and root mismatch detected", async () => {
  const records: LineageRecord[] = [
    {
      id: "src-actual",
      stage: "source",
      sourceAnchor: "synthetic-source-y",
      description: "Synthetic test data",
      isRecorded: true,
    },
    {
      id: "res-claim",
      stage: "result",
      parentId: "src-actual",
      description: "Final claim",
      isRecorded: true,
    },
  ];

  const result = await executeRoutineWithGuards(traceRoutine, {
    targetObjectId: "res-claim",
    records,
    rootSourceExpected: "authentic-field-source-x", // Root mismatch!
  });

  assert.equal(result.status, "qualified");
  const out = result.output as TraceOutput;
  assert.equal(out.integrity, "conflicted");
  assert.ok(out.conflicts.some((c) => c.reason.includes("does not match discovered root")));
});

test("HDCP-COGLIB-TRACE-008: Cross-domain proof across Music, Science, and Software Architecture", async () => {
  const harness = new CognitiveProofHarness();

  // Domain 1: Music (12-tone serial matrix transformation trace)
  harness.registerTestCase({
    testId: "TRACE-MUSIC-001",
    domain: "music",
    description: "Traces backward lineage of 12-tone hexachord combinatoriality back to prime series",
    routine: traceRoutine,
    input: {
      targetObjectId: "res-hexachord-cluster",
      records: [
        { id: "src-prime-row", stage: "source", sourceAnchor: "schoenberg-op25", description: "Original 12-tone prime row P0", isRecorded: true },
        { id: "grd-intervals", stage: "grounding", parentId: "src-prime-row", description: "Interval class vector [0,1,4,2,9,5]", isRecorded: true },
        { id: "tx-inversion", stage: "transformation", parentId: "grd-intervals", description: "Inversion I5 combined with retrograde R5", isRecorded: true },
        { id: "res-hexachord-cluster", stage: "result", parentId: "tx-inversion", description: "All-interval hexachordal harmony", isRecorded: true },
      ],
    },
    expectedStatus: "success",
    expectedLineageSubstring: "src-prime-row",
  });

  // Domain 2: Science (Paleoclimate trace)
  harness.registerTestCase({
    testId: "TRACE-SCIENCE-001",
    domain: "science",
    description: "Traces empirical grounding of ocean acidification claim to sensor mooring data",
    routine: traceRoutine,
    input: {
      targetObjectId: "res-ph-drop",
      records: [
        { id: "src-aloha-station", stage: "source", sourceAnchor: "noaa-pmel-aloha", description: "HOT Station ALOHA seawater pH timeseries 1988-2022", isRecorded: true },
        { id: "grd-calcite-sat", stage: "grounding", parentId: "src-aloha-station", description: "Aragonite saturation state thermodynamics", isRecorded: true },
        { id: "res-ph-drop", stage: "result", parentId: "grd-calcite-sat", description: "Calculated 0.1 pH surface decrease", isRecorded: true },
      ],
    },
    expectedStatus: "success",
    expectedLineageSubstring: "src-aloha-station",
  });

  // Domain 3: Software Architecture (Gapped trace of undocumented microservice dependency)
  harness.registerTestCase({
    testId: "TRACE-SW-ARCH-001",
    domain: "software-architecture",
    description: "Detects missing architectural lineage record for undocumented database dependency",
    routine: traceRoutine,
    input: {
      targetObjectId: "res-db-query",
      records: [
        { id: "res-db-query", stage: "result", parentId: "unknown-legacy-service", description: "Direct cross-database table lock", isRecorded: true },
      ],
    },
    expectedStatus: "qualified",
    expectedTensionSubstring: "Lineage gap: missing predecessor record",
  });

  const summary = await harness.runAll();
  assert.equal(summary.totalTests, 3);
  assert.equal(summary.passedCount, 3);
  assert.equal(summary.domainBreakdown["music"].passed, 1);
  assert.equal(summary.domainBreakdown["science"].passed, 1);
  assert.equal(summary.domainBreakdown["software-architecture"].passed, 1);
});

test("HDCP-COGLIB-TRACE-008: TRACE qualifies for ADMIT under 3-domain CogLib Admission Standard", () => {
  const traceEvidence = {
    candidateId: "coglib:routine:trace",
    candidateName: "Universal Cognitive Lineage Trace",
    description: "Backward traversal of cognitive lineage without inventing provenance or unsupported causal links.",
    routineDefinition: traceRoutine,
    domainsDemonstrated: ["music", "science", "software-architecture"],
    isCognitiveFunction: true,
    hasDomainSpecificOntology: false,
    isMESpecific: false,
    isApplicationLocal: false,
    hasStableSemantics: true,
    hasExplicitFailureModes: true,
    hasProvenanceSupport: true,
    isComposable: true,
    hasMeasurableValue: true,
    isDuplicateOfExisting: false,
    hasBoundedAuthority: true,
    proofCaseCount: 3,
  };

  const evalResult = evaluateCandidateForAdmission(traceEvidence);
  assert.equal(evalResult.disposition, "ADMIT");
  assert.equal(evalResult.score, 100);
});

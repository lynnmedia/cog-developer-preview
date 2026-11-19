import assert from "node:assert/strict";
import test from "node:test";
import * as core from "../index";

const EXPECTED_EXPORTS = [
  "CapabilityMountError",
  "CanonicalDocumentationSynchronizer",
  "CogAstBuilder",
  "CogDiagnosticError",
  "CogDomainBuilder",
  "CogProgramBuilder",
  "CognitiveProofHarness",
  "COG_ERROR_CODES",
  "COG_RESOURCE_LIMITS",
  "DiscoveryService",
  "GoldenTraceAssertor",
  "InMemoryCognitiveMemoryProvider",
  "LibraryCompositionVisualizer",
  "LibraryDocumentationGenerator",
  "LspService",
  "PatternSuggestionEngine",
  "RuntimeService",
  "SnapshotTester",
  "TOKEN_TYPES",
  "TestReporter",
  "TraceDiffVisualizer",
  "TraceExplorer",
  "TraceVisualizationService",
  "WorkflowCatalogService",
  "WorkflowDocumentationGenerator",
  "WorkflowFixtureLibrary",
  "WorkflowGraphViewerService",
  "WorkflowLinter",
  "WorkflowQualityMetricsService",
  "WorkflowRefactoringService",
  "applyGovernedEnvelopeTransformation",
  "applyGovernedSpecialization",
  "applyMemoryEpistemicDecay",
  "assessMemoryUpdateEligibility",
  "auditLibrary",
  "challengeRoutine",
  "classify",
  "cognitiveEcologyLibrary",
  "compare",
  "compareRoutine",
  "compileCog",
  "compileCogIncremental",
  "compose",
  "composeAuditToDecision",
  "composeBranch",
  "composeGraphToResearch",
  "composeGuardedTransition",
  "composeMerge",
  "composeMultiNodeContributions",
  "composePipeline",
  "composeResearchToEditorial",
  "computeCognitiveMetrics",
  "decisionAdapterLibraryProof",
  "decisionLibrary",
  "devotionalIntelligenceLibrary",
  "discoverEligibleNodes",
  "domainRegistry",
  "driftLensInstrument",
  "editorialLibrary",
  "epistemicMapInstrument",
  "evaluate",
  "evaluateCandidateForAdmission",
  "evaluateMultidimensionalTrust",
  "evaluateNodeDiscoveryMatch",
  "evaluateToolEvidenceInfluence",
  "executeCog",
  "executeRoutineWithCapability",
  "executeRoutineWithGuards",
  "explain",
  "getAuthorityRank",
  "governanceLibrary",
  "graphLibrary",
  "group",
  "guardMemoryInfluence",
  "identify",
  "learningLibrary",
  "lex",
  "momLibraryProof",
  "negotiateCognitiveTask",
  "observe",
  "orientationLibrary",
  "parseCog",
  "planCog",
  "planningLibrary",
  "project",
  "provenanceLineageInstrument",
  "reconcileMemoryConflict",
  "relate",
  "researchLibrary",
  "researchToBookPipeline",
  "resolve",
  "routeAndDelegateCognitiveTask",
  "runCli",
  "shapeRoutine",
  "tensionFieldInstrument",
  "traceRoutine",
  "validateCapabilityProvider",
  "validateCog",
  "validateCognitiveInstrumentContract",
  "validateCognitiveObjectEnvelope",
  "validateDomainCapabilityContract",
  "validateEvaluationContract",
  "validateGovernedNodeProfile",
  "validateMemoryContract",
  "validateRoutineContract",
  "validateToolEvidenceContract",
  "validateTransformationIntegrity",
  "verifyCompositionCompatibility"
];

test("Proprietary and excluded integration surfaces are not reachable through the public @cog/core entrypoint", () => {
  const prohibitedSymbols = [
    "generateAuditWorkbenchWorkflow",
    "generateBookFactoryOutlineWorkflow",
    "generateBookFactoryPlanningWorkflow",
    "generateBookFactoryReviewWorkflow",
    "generateCognitiveEcologyWorkflow",
    "generateDevotionalIntelligenceWorkflow",
    "generateHumanOrientationWorkflow",
    "generateMandalaStacksWorkflow",
    "generatePersonalCodaWorkflow",
    "generateRealResearchSynthesisWorkflow",
    "generateResearchFactoryWorkflow"
  ];

  for (const symbol of prohibitedSymbols) {
    assert.equal(
      (core as Record<string, unknown>)[symbol],
      undefined,
      `Prohibited integration symbol "${symbol}" must not be exported from the public @cog/core entrypoint.`
    );
  }
});

test("Public API surface exports are locked and match expectations", () => {
  const actualExports = Object.keys(core).sort();
  const expectedSorted = [...EXPECTED_EXPORTS].sort();

  // Verify no missing exports
  const missing = expectedSorted.filter(key => !actualExports.includes(key));
  // Verify no unexpected new exports
  const extra = actualExports.filter(key => !expectedSorted.includes(key));

  assert.deepEqual(
    missing,
    [],
    `The following expected exports are missing from the public API: ${missing.join(", ")}`
  );

  assert.deepEqual(
    extra,
    [],
    `The following unexpected symbols were found in the public API: ${extra.join(", ")}. Please verify if they should be public and update EXPECTED_EXPORTS accordingly.`
  );

  assert.deepEqual(actualExports, expectedSorted, "Exported symbols list matches exactly.");
});

test("Public API allows end-to-end compilation, execution, validation, and adapter tracing", async () => {
  const source = `
    define entity "request-node" {
      kind: "coda_request"
      level: L1
    }
    resolve "request-node" to L2 {
      output: "ready"
    }
    emit {
      kind: "coda_plan"
      target: "request-node"
    }
  `.trim();

  // 1. Compile
  const tokens = core.lex(source);
  const ast = core.parseCog(tokens);
  const ir = core.compileCog(ast);
  assert.ok(ir);

  // 2. Validate
  const validationResult = await core.validateCog(ir);
  assert.equal(validationResult.valid, true);

  // 3. Adapter
  const adapterLogs: string[] = [];
  const adapter: core.CogDomainAdapter = {
    adapterId: "test-adapter",
    version: "1.0.0",
    mapLevel(level) {
      return "R" + level.slice(1);
    },
    mapRelationKind(kind) {
      return "rel_" + kind;
    },
    createDomainTrace(step, ir, context) {
      adapterLogs.push(`Step ${step.id} phased as ${step.phase}`);
      return {
        adapterId: "test-adapter",
        message: `Traced step ${step.id}`,
      };
    },
  };

  const context: core.CoreExecutionContext = {
    runId: "run-test-1",
    mode: "strict",
    startedAt: new Date().toISOString(),
  };

  // 4. Execute
  const executionResult = await core.executeCog(ir, context, adapter);
  assert.equal(executionResult.success, true);
  assert.equal(executionResult.adapterId, "test-adapter");
  assert.ok(executionResult.trace);
  assert.equal(executionResult.trace.runId, "run-test-1");
  assert.ok(executionResult.emissions.length > 0);
  assert.ok(adapterLogs.length > 0);
});

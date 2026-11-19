import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";

const rootDir = path.resolve(__dirname, "..");

const distributablePackages = [
  "packages/cog-core",
  "packages/cog-adapter-mom",
  "packages/cog-adapter-decision"
];

const requiredDocs = [
  "README.md",
  "docs/GETTING_STARTED.md",
  "docs/AUTHORING_TUTORIAL.md",
  "docs/DOMAIN_LIBRARY_TUTORIALS.md",
  "docs/RELEASE_CHECKLIST.md",
  "docs/RELEASE_NOTES_DEVELOPER_PREVIEW.md",
  "docs/COG_DEVELOPER_PREVIEW_PUBLIC_DISTRIBUTION_MANIFEST_v0.1.md",
  "CHANGELOG.md"
];

const EXPECTED_CORE_EXPORTS = [
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

const PROHIBITED_INTEGRATION_SYMBOLS = [
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

function runCommand(cmd: string, cwd = rootDir) {
  console.log(`Running: ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd });
}

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), "utf-8"));
}

function checkRootBoundary() {
  const root = readJson("package.json");
  if (root.private !== true) {
    throw new Error("Root package must remain private; publish workspace packages instead.");
  }
  if (root.engines?.node !== "20.x" || root.engines?.npm !== ">=10") {
    throw new Error("Root engine contract must remain Node 20.x / npm >=10.");
  }

  const allowedWorkspaces = [
    "packages/cog-core",
    "packages/cog-adapter-mom",
    "packages/cog-adapter-decision",
    "packages/cog-vscode-extension"
  ];

  for (const ws of root.workspaces ?? []) {
    if (!allowedWorkspaces.includes(ws)) {
      throw new Error(`Unauthorized workspace "${ws}" detected in root package.json.`);
    }
  }
}

function checkNoResidualApplications() {
  const prohibitedPaths = [
    "packages/book-assistant",
    "packages/cognitive-workspace",
    "artifacts/book-assistant",
    "docs/book-assistant",
    "docs/cognitive-workspace",
    "packages/cog-core/src/integration",
    "src/product",
    "docs/awb-integration",
    "docs/hdcp-renderer-pilot",
    "STATE.md",
    "ORCHESTRATOR.md"
  ];

  for (const relPath of prohibitedPaths) {
    if (fs.existsSync(path.join(rootDir, relPath))) {
      throw new Error(`Residual extracted or proprietary path "${relPath}" must not exist in cog repository.`);
    }
  }
}

function checkPackageJson(pkgPath: string) {
  const jsonPath = path.join(rootDir, pkgPath, "package.json");
  console.log(`Checking distributable metadata in ${jsonPath}...`);
  const pkg = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  const requiredFields = [
    "name",
    "version",
    "description",
    "author",
    "license",
    "repository",
    "engines",
    "main",
    "types",
    "exports",
    "files"
  ];

  for (const field of requiredFields) {
    if (!pkg[field]) {
      throw new Error(`Missing required package.json field "${field}" in ${pkgPath}`);
    }
  }

  if (pkg.private === true) {
    throw new Error(`Distributable package ${pkg.name} is marked private.`);
  }

  if (pkg.engines?.node !== "20.x" || pkg.engines?.npm !== ">=10") {
    throw new Error(`Invalid engine contract in ${pkgPath}; expected Node 20.x / npm >=10.`);
  }

  for (const group of ["dependencies", "devDependencies", "peerDependencies"]) {
    const deps = pkg[group] ?? {};
    for (const [dep, val] of Object.entries(deps)) {
      if (typeof val === "string" && val.startsWith("file:")) {
        throw new Error(`Invalid local file: reference for ${dep} in ${pkgPath} (${group}).`);
      }
      if (typeof val === "string" && val.startsWith("workspace:")) {
        throw new Error(`Invalid workspace: reference for ${dep} in ${pkgPath} (${group}); use semantic versions.`);
      }
    }
  }
}

function checkDocumentation() {
  for (const doc of requiredDocs) {
    if (!fs.existsSync(path.join(rootDir, doc))) {
      throw new Error(`Missing required release documentation file: ${doc}`);
    }
  }

  const gettingStarted = fs.readFileSync(path.join(rootDir, "docs/GETTING_STARTED.md"), "utf-8");
  if (!gettingStarted.includes("Node.js 20.x")) {
    throw new Error("Getting Started must document the current Node.js 20.x requirement.");
  }
}

function checkApiLock() {
  console.log("Checking @cog/core API lock (114 approved symbols, 0 prohibited)...");
  const coreDistPath = path.join(rootDir, "packages/cog-core/dist/index.js");
  if (!fs.existsSync(coreDistPath)) {
    throw new Error("Missing packages/cog-core/dist/index.js; run build first.");
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const core = require(coreDistPath);
  const actualExports = Object.keys(core).sort();
  const expectedSorted = [...EXPECTED_CORE_EXPORTS].sort();

  const missing = expectedSorted.filter((key) => !actualExports.includes(key));
  const extra = actualExports.filter((key) => !expectedSorted.includes(key));

  if (missing.length > 0) {
    throw new Error(`Missing expected exports in @cog/core: ${missing.join(", ")}`);
  }
  if (extra.length > 0) {
    throw new Error(`Unexpected symbols found in @cog/core: ${extra.join(", ")}`);
  }

  for (const sym of PROHIBITED_INTEGRATION_SYMBOLS) {
    if (core[sym] !== undefined) {
      throw new Error(`Prohibited integration symbol "${sym}" found in @cog/core export!`);
    }
  }
}

function packDistributables(outDir: string): Record<string, string> {
  console.log(`Packing distributable packages to ${outDir}...`);
  fs.mkdirSync(outDir, { recursive: true });

  const tarballMap: Record<string, string> = {};

  for (const pkgPath of distributablePackages) {
    const pkgJson = readJson(path.join(pkgPath, "package.json"));
    const pkgDir = path.join(rootDir, pkgPath);
    const packOutput = execSync(`npm pack --pack-destination="${outDir}"`, {
      cwd: pkgDir,
      encoding: "utf-8"
    }).trim();
    const tarballFileName = packOutput.split("\n").filter(Boolean).pop()?.trim();
    if (!tarballFileName) {
      throw new Error(`Failed to determine tarball file name for ${pkgJson.name}`);
    }
    const tarballPath = path.join(outDir, tarballFileName);
    if (!fs.existsSync(tarballPath)) {
      throw new Error(`Tarball not found at ${tarballPath}`);
    }
    tarballMap[pkgJson.name] = tarballPath;
    console.log(`- Packed ${pkgJson.name}@${pkgJson.version} -> ${tarballFileName} (${fs.statSync(tarballPath).size} bytes)`);
  }

  return tarballMap;
}

function verifyPackageTarballs(outDir: string) {
  console.log("Verifying tarball contents and archive safety...");
  const files = fs.readdirSync(outDir).filter((f) => f.endsWith(".tgz"));
  if (files.length !== distributablePackages.length) {
    throw new Error(`Expected ${distributablePackages.length} tarballs in ${outDir}, found ${files.length}`);
  }

  for (const file of files) {
    const filePath = path.join(outDir, file);
    const tarList = execSync(`tar -tf "${filePath}"`, { encoding: "utf-8" });
    const entries = tarList.split("\n").filter(Boolean);

    for (const entry of entries) {
      if (
        entry.includes(".env") ||
        entry.includes("src/tests") ||
        entry.includes("artifacts/") ||
        entry.includes(".git") ||
        entry.endsWith(".ts") && !entry.endsWith(".d.ts")
      ) {
        throw new Error(`Unsafe or private file entry "${entry}" detected in tarball ${file}`);
      }
    }
  }
}

function proveIsolatedConsumer(tarballMap: Record<string, string>) {
  const tempConsumerDir = fs.mkdtempSync(path.join(os.tmpdir(), "cog-consumer-proof-"));
  console.log(`Setting up isolated external consumer proof in ${tempConsumerDir}...`);

  try {
    const consumerPkgJson = {
      name: "cog-isolated-consumer-proof",
      version: "1.0.0",
      private: true,
      type: "commonjs",
      dependencies: {
        "@cog/core": `file:${tarballMap["@cog/core"]}`,
        "@cog/adapter-mom": `file:${tarballMap["@cog/adapter-mom"]}`,
        "@cog/adapter-decision": `file:${tarballMap["@cog/adapter-decision"]}`
      }
    };

    fs.writeFileSync(path.join(tempConsumerDir, "package.json"), JSON.stringify(consumerPkgJson, null, 2));

    console.log("Running npm install in isolated consumer...");
    execSync("npm install --no-audit --no-fund", { cwd: tempConsumerDir, stdio: "inherit" });

    const proofScriptContent = `
const assert = require("node:assert/strict");
const { lex, parseCog, compileCog, validateCog, executeCog, CogProgramBuilder, observe, relate } = require("@cog/core");
const { momAdapter } = require("@cog/adapter-mom");
const { decisionAdapter } = require("@cog/adapter-decision");

async function runProof() {
  console.log("Consumer Proof 1: Pure Core .cog flow (lex -> parse -> compile -> validate -> execute)");
  const source = \`
    define entity "concept-alpha" {
      kind: "concept"
      level: L1
    }
    define entity "concept-beta" {
      kind: "concept"
      level: L1
      transformed-from: "concept-alpha"
    }
    transform {
      target: "concept-alpha"
      to: "refine-concept"
      operation: "refine"
    }
    relate "concept-alpha" -> "concept-beta" {
      kind: "transforms-to"
      operation: "refine"
    }
    resolve "concept-beta" to L2 {
      confidence: 0.95
    }
    emit {
      kind: "cognitive_emission"
      target: "concept-beta"
    }
  \`.trim();

  const tokens = lex(source);
  assert.ok(tokens.length > 0, "Lexing succeeded");

  const ast = parseCog(tokens);
  assert.ok(ast && ast.statements.length === 6, "Parsing succeeded");

  const ir = compileCog(ast);
  assert.ok(ir && ir.entities.length === 2, "Compilation succeeded");

  const validation = await validateCog(ir);
  if (!validation.valid) {
    console.error("Validation issues:", validation.issues);
  }
  assert.equal(validation.valid, true, "Validation passed");

  const context = {
    runId: "consumer-proof-run",
    mode: "batch",
    startedAt: new Date().toISOString()
  };

  const execResult = await executeCog(ir, context);
  assert.equal(execResult.success, true, "Execution succeeded");
  assert.ok(execResult.trace, "Execution trace generated");
  assert.equal(execResult.emissions.length, 1, "One emission produced");
  assert.equal(execResult.emissions[0].kind, "cognitive_emission");

  console.log("Consumer Proof 2: Execution with @cog/adapter-mom");
  const momExecResult = await executeCog(ir, context, momAdapter);
  assert.equal(momExecResult.success, true, "MoM execution succeeded");
  assert.equal(momExecResult.adapterId, "mom");
  assert.ok(momExecResult.emissions.length > 0);
  assert.equal(momExecResult.emissions[0].target, "mom:cognitive_emission");

  console.log("Consumer Proof 3: Execution with @cog/adapter-decision");
  const decExecResult = await executeCog(ir, context, decisionAdapter);
  assert.equal(decExecResult.success, true, "Decision adapter execution succeeded");
  assert.equal(decExecResult.adapterId, "decision");
  assert.ok(decExecResult.emissions.length > 0);
  assert.equal(decExecResult.emissions[0].target, "decision:cognitive_emission");

  console.log("Consumer Proof 4: Standard library primitives");
  const obs = observe("e1", "node", { contextId: "c1" });
  assert.equal(obs.id, "e1");
  assert.equal(obs.entityKind, "node");

  console.log("Consumer Proof 5: Programmatic CogProgramBuilder");
  const builder = new CogProgramBuilder();
  builder.entity("p1", { kind: "pattern", level: "L1", value: "initial" });
  builder.resolve("p1", "L2", { operation: "validate", reason: "verified" });
  builder.emit("p1", "proof_emit");
  const builtSource = builder.build();
  const builtTokens = lex(builtSource);
  const builtAst = parseCog(builtTokens);
  const builtIr = compileCog(builtAst);
  const builtValidation = await validateCog(builtIr, { context });
  assert.equal(builtValidation.valid, true);
  const builtExec = await executeCog(builtIr, context);
  assert.equal(builtExec.success, true);

  console.log("=== ALL ISOLATED CONSUMER PROOFS PASSED CLEANLY ===");
}

runProof().catch((err) => {
  console.error("Isolated Consumer Proof FAILED:", err);
  process.exit(1);
});
`;

    fs.writeFileSync(path.join(tempConsumerDir, "consumerProof.js"), proofScriptContent);

    console.log("Executing isolated consumer proof script...");
    execSync("node consumerProof.js", { cwd: tempConsumerDir, stdio: "inherit" });
  } finally {
    fs.rmSync(tempConsumerDir, { recursive: true, force: true });
  }
}

function main() {
  console.log("=== Cog Developer Preview Release Validation ===");

  console.log("1. Verifying root/public package boundary...");
  checkRootBoundary();
  checkNoResidualApplications();

  console.log("2. Building current v0.3 workspace surface (including VS Code tooling)...");
  runCommand("npm run build:v0.3");

  console.log("3. Verifying distributable package metadata...");
  for (const pkg of distributablePackages) {
    checkPackageJson(pkg);
  }

  console.log("4. Verifying current release documentation...");
  checkDocumentation();

  console.log("5. Running v0.3 regression suite...");
  runCommand("npm run test:v0.3");

  console.log("6. Verifying public API lock on @cog/core...");
  checkApiLock();

  console.log("7. Packing distributable packages and verifying archive contents...");
  const tempPackDir = path.join(rootDir, "temp-pack-dist");
  fs.rmSync(tempPackDir, { recursive: true, force: true });

  try {
    const tarballMap = packDistributables(tempPackDir);
    verifyPackageTarballs(tempPackDir);

    console.log("8. Proving isolated external consumer installation and execution...");
    proveIsolatedConsumer(tarballMap);
  } finally {
    fs.rmSync(tempPackDir, { recursive: true, force: true });
  }

  console.log("=== Developer Preview release validation PASSED ===");
}

try {
  main();
  process.exit(0);
} catch (err: any) {
  console.error("Release validation FAILED:", err?.message ?? err);
  process.exit(1);
}

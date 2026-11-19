import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import assert from "node:assert/strict";

const rootDir = path.resolve(__dirname, "..");
console.log("============================================================");
console.log("COG DEVELOPER PREVIEW CLEAN-CLONE STRANGER TEST (HDCP-014)");
console.log("============================================================");

// Create isolated temporary directories
const tempBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "cog-clean-clone-"));
const cleanRepoDir = path.join(tempBaseDir, "cloned-repo");
const cleanConsumerDir = path.join(tempBaseDir, "outsider-consumer");
const packDistDir = path.join(tempBaseDir, "dist-packages");

fs.mkdirSync(cleanRepoDir, { recursive: true });
fs.mkdirSync(cleanConsumerDir, { recursive: true });
fs.mkdirSync(packDistDir, { recursive: true });

console.log(`Isolated Clean Workspace: ${tempBaseDir}`);

const frictionLog: Array<{ code: string; step: string; detail: string }> = [];

function recordFriction(code: string, step: string, detail: string) {
  console.warn(`[FRICTION] ${code} at ${step}: ${detail}`);
  frictionLog.push({ code, step, detail });
}

try {
  // 1. Simulating fresh clone from public baseline
  console.log("\n--- Step 1: Simulating Clean Public Clone ---");
  // Export git archive of baseline into cleanRepoDir and sync working tree files
  execSync(`git archive HEAD | tar -x -C "${cleanRepoDir}"`, { cwd: rootDir, stdio: "inherit" });
  execSync(`rsync -av --exclude="node_modules" --exclude=".git" --exclude="dist" --exclude="temp*" --exclude=".gemini" "${rootDir}/" "${cleanRepoDir}/"`, { stdio: "inherit" });
  console.log("Archive and working tree extracted into clean repo clone directory.");

  // 2. Build & Test in Clean Clone
  console.log("\n--- Step 2: Fresh Clean Install & Build ---");
  execSync("npm install", { cwd: cleanRepoDir, stdio: "inherit" });
  execSync("npm run build", { cwd: cleanRepoDir, stdio: "inherit" });
  execSync("npm test", { cwd: cleanRepoDir, stdio: "inherit" });
  execSync("npm run build:v0.3", { cwd: cleanRepoDir, stdio: "inherit" });
  execSync("npm run test:v0.3", { cwd: cleanRepoDir, stdio: "inherit" });
  execSync("npm run validate:release", { cwd: cleanRepoDir, stdio: "inherit" });
  console.log("Clean clone build, test, and release validation passed cleanly!");

  // 3. Pack distributable tarballs
  console.log("\n--- Step 3: Packing Distributable Packages ---");
  execSync(`npm pack "${path.join(cleanRepoDir, "packages", "cog-core")}" --pack-destination "${packDistDir}"`, { stdio: "inherit" });
  execSync(`npm pack "${path.join(cleanRepoDir, "packages", "cog-adapter-mom")}" --pack-destination "${packDistDir}"`, { stdio: "inherit" });
  execSync(`npm pack "${path.join(cleanRepoDir, "packages", "cog-adapter-decision")}" --pack-destination "${packDistDir}"`, { stdio: "inherit" });

  const packedFiles = fs.readdirSync(packDistDir);
  const coreTarball = packedFiles.find((f) => f.startsWith("winmedia-cog-core"));
  const momTarball = packedFiles.find((f) => f.startsWith("winmedia-cog-adapter-mom"));
  const decisionTarball = packedFiles.find((f) => f.startsWith("winmedia-cog-adapter-decision"));

  assert.ok(coreTarball, "Packed @winmedia/cog-core tarball exists");
  assert.ok(momTarball, "Packed @winmedia/cog-adapter-mom tarball exists");
  assert.ok(decisionTarball, "Packed @winmedia/cog-adapter-decision tarball exists");
  assert.deepEqual(
    [coreTarball, momTarball, decisionTarball],
    ["winmedia-cog-core-0.3.0.tgz", "winmedia-cog-adapter-mom-0.3.0.tgz", "winmedia-cog-adapter-decision-0.3.0.tgz"],
    "Scoped package archive selectors resolve the npm-generated winmedia tarball filenames",
  );

  // 4. Outsider Consumer Setup & Installation
  console.log("\n--- Step 4: External Outsider Consumer Setup ---");
  fs.writeFileSync(
    path.join(cleanConsumerDir, "package.json"),
    JSON.stringify({
      name: "outsider-cog-test",
      version: "1.0.0",
      private: true,
      dependencies: {
        "@winmedia/cog-core": `file:${path.join(packDistDir, coreTarball)}`,
        "@winmedia/cog-adapter-mom": `file:${path.join(packDistDir, momTarball)}`,
        "@winmedia/cog-adapter-decision": `file:${path.join(packDistDir, decisionTarball)}`,
      },
    }, null, 2),
  );

  execSync("npm install", { cwd: cleanConsumerDir, stdio: "inherit" });
  console.log("Installed packed packages into external outsider consumer.");

  // 5. Outsider Consumer Comprehensive Verification Script
  console.log("\n--- Step 5: Executing Complete Outsider Stranger Test ---");
  const outsiderScript = `
const assert = require("node:assert/strict");
const {
  lex,
  parseCog,
  compileCog,
  validateCog,
  executeCog,
  observe,
  identify,
  compare,
  relate,
  group,
  project,
  resolve,
  evaluate,
  explain,
  compose,
  decisionLibrary,
  researchLibrary,
  editorialLibrary,
  CogProgramBuilder,
  createCognitiveScenario,
  executeCognitiveScenario,
  defineCognitiveSuite,
  runCognitiveSuite,
  diagnoseCognitiveScenario,
  formatCognitiveDiagnosticReport,
  formatMetamorphicDiagnostic,
  WorkflowLinter,
  TraceVisualizationService,
} = require("@winmedia/cog-core");
const { momAdapter } = require("@winmedia/cog-adapter-mom");
const { decisionAdapter } = require("@winmedia/cog-adapter-decision");

async function runStrangerTest() {
  console.log("Test 1: README Quickstart Program Execution");
  const quickstartSource = \`
    define entity "observation-1" {
      kind: "signal:observation"
      level: L1
      value: "Telemetry shows database latency spike."
    }
    define entity "root-cause-hypothesis" {
      kind: "analysis:hypothesis"
      level: L2
      value: "Unindexed query on accounts table."
    }
    relate "observation-1" -> "root-cause-hypothesis" {
      kind: "supports"
    }
    resolve "root-cause-hypothesis" to L2 {
      confidence: 0.95
    }
    emit {
      target: "root-cause-hypothesis"
      kind: "analysis:finding"
    }
  \`;

  const tokens = lex(quickstartSource);
  assert.ok(tokens.length > 0);
  const ast = parseCog(tokens);
  assert.ok(ast.statements.length >= 5);
  const ir = compileCog(ast);
  assert.equal(ir.entities.length, 2);
  const validation = await validateCog(ir);
  assert.equal(validation.valid, true);

  const context = {
    runId: "stranger-run-1",
    mode: "batch",
    startedAt: new Date().toISOString(),
  };
  const execResult = await executeCog(ir, context);
  assert.equal(execResult.success, true);
  assert.equal(execResult.emissions.length, 1);
  assert.equal(execResult.emissions[0].kind, "analysis:finding");
  console.log("  -> README Quickstart Program: SUCCESS");

  console.log("Test 2: Standard Library Universal Primitives");
  const obs = observe("entity-alpha", "document", { owner: "team-a" });
  assert.equal(obs.id, "entity-alpha");
  const idDescriptor = identify(obs);
  assert.ok(idDescriptor.includes("document:entity-alpha"));
  const obs2 = observe("entity-beta", "document", { owner: "team-b" });
  const diff = compare(obs, obs2);
  assert.ok(diff.modified.includes("owner"));
  const rel = relate("rel-1", "depends_on", "entity-alpha", "entity-beta");
  assert.equal(rel.sourceRef, "entity-alpha");
  assert.equal(rel.targetRef, "entity-beta");
  console.log("  -> Stdlib Primitives: SUCCESS");

  console.log("Test 3: Reference Domain Libraries");
  assert.equal(typeof decisionLibrary.generate, "function");
  assert.equal(typeof researchLibrary.generate, "function");
  assert.equal(typeof editorialLibrary.generate, "function");
  const decisionSource = decisionLibrary.generate({});
  assert.ok(decisionSource.includes("define entity"));
  console.log("  -> Reference Domain Libraries: SUCCESS");

  console.log("Test 4: Programmatic CogProgramBuilder");
  const builder = new CogProgramBuilder();
  builder.entity("task-1", { kind: "task", level: "L1" });
  builder.resolve("task-1", "L2", { status: "complete" });
  builder.emit("task-1", "task_done");
  const builtSource = builder.build();
  const builtIR = compileCog(parseCog(lex(builtSource)));
  const builtRes = await executeCog(builtIR, context);
  assert.equal(builtRes.success, true);
  assert.equal(builtRes.emissions[0].kind, "task_done");
  console.log("  -> Programmatic CogProgramBuilder: SUCCESS");

  console.log("Test 5: Cognitive Scenario & Invariant Assertions");
  const cognitiveScen = createCognitiveScenario({
    id: "stranger-scen-1",
    name: "Stranger Scenario Execution",
    given: { source: quickstartSource },
    expected: {
      success: true,
      emissions: [{ kind: "analysis:finding", target: "root-cause-hypothesis" }],
    },
  });
  const scenRes = await executeCognitiveScenario(cognitiveScen);
  assert.equal(scenRes.success, true);
  console.log("  -> Cognitive Scenario Execution: SUCCESS");

  console.log("Test 6: Cognitive Suite Execution");
  const suite = defineCognitiveSuite({
    id: "stranger-suite-1",
    name: "Stranger Suite",
    scenarios: [cognitiveScen],
  });
  const suiteRes = await runCognitiveSuite(suite);
  assert.equal(suiteRes.passed, true);
  assert.equal(suiteRes.passedCount, 1);
  console.log("  -> Cognitive Suite Execution: SUCCESS");

  console.log("Test 7: Deliberate Cognitive Failure & Semantic Diagnostics");
  const failingScen = createCognitiveScenario({
    id: "stranger-fail-1",
    name: "Deliberate Mismatch Scenario",
    given: { source: quickstartSource },
    expected: {
      success: true,
      emissions: [{ kind: "different_unmatched_kind" }],
    },
  });
  const diagReport = await diagnoseCognitiveScenario(failingScen);
  assert.equal(diagReport.passed, false);
  assert.equal(diagReport.diagnostics[0].category, "OUTPUT_MISMATCH");
  assert.ok(diagReport.formattedText.includes("COG COGNITIVE TEST DIAGNOSTIC"));
  assert.ok(diagReport.formattedText.includes("OUTPUT_MISMATCH"));

  const metamorphicFormatted = formatMetamorphicDiagnostic(
    "EVIDENCE_MONOTONICITY",
    { confidence: 0.50, authority: "advisory" },
    { confidence: 0.90, authority: "canonical" },
    "Unauthorized authority escalation",
  );
  assert.ok(metamorphicFormatted.includes("COG METAMORPHIC RELATION VIOLATION"));
  console.log("  -> Deliberate Failure & Semantic Diagnostics: SUCCESS");

  console.log("Test 8: Companion Adapters (@winmedia/cog-adapter-mom & @winmedia/cog-adapter-decision)");
  const momSource = \`
    define entity "concept-mom" { kind: "concept" level: L1 }
    resolve "concept-mom" to L2 { status: "ok" }
    emit { target: "concept-mom" kind: "mom_emission" }
  \`;
  const momIR = compileCog(parseCog(lex(momSource)));
  const momRes = await executeCog(momIR, context, momAdapter);
  assert.equal(momRes.success, true);
  assert.equal(momRes.adapterId, "mom");
  assert.equal(momRes.emissions[0].target, "mom:mom_emission");

  const decSource = \`
    define entity "candidate-a" { kind: "candidate" level: L1 }
    resolve "candidate-a" to L2 { status: "selected" }
    emit { target: "candidate-a" kind: "dec_emission" }
  \`;
  const decIR = compileCog(parseCog(lex(decSource)));
  const decRes = await executeCog(decIR, context, decisionAdapter);
  assert.equal(decRes.success, true);
  assert.equal(decRes.adapterId, "decision");
  console.log("  -> Companion Adapters: SUCCESS");

  console.log("Test 9: Getting Started Tutorial Workflow");
  const gettingStartedSource = \`
    define entity "user-request" { kind: "record" level: L1 }
    define entity "user-profile" { kind: "record" level: L1 }
    define entity "risk-assessment" { kind: "assessment" level: L2 }
    relate "user-request" -> "user-profile" { kind: "references" }
    relate "risk-assessment" -> "user-request" { kind: "derived_from" }
    resolve "risk-assessment" to L2 {}
    emit { target: "risk-assessment" kind: "assessment-completed" }
  \`;
  const gsIR = compileCog(parseCog(lex(gettingStartedSource)));
  const gsValidation = await validateCog(gsIR);
  assert.equal(gsValidation.valid, true);
  const gsRes = await executeCog(gsIR, context);
  assert.equal(gsRes.success, true);
  assert.equal(gsRes.emissions[0].kind, "assessment-completed");
  console.log("  -> Getting Started Tutorial Workflow: SUCCESS");

  console.log("Test 10: Authoring Tutorial Financial Application Workflow");
  const authoringSource = \`
    define entity "credit-application" { kind: "record" level: L1 }
    define entity "credit-score" { kind: "verification" level: L1 }
    define entity "income-verification" { kind: "verification" level: L2 }
    relate "credit-application" -> "credit-score" { kind: "references_credit" }
    relate "credit-application" -> "income-verification" { kind: "references_income" }
    resolve "credit-score" to L2 { verified: true }
    emit { target: "credit-application" kind: "application-processed" }
  \`;
  const authIR = compileCog(parseCog(lex(authoringSource)));
  const authValidation = await validateCog(authIR);
  assert.equal(authValidation.valid, true);
  const authRes = await executeCog(authIR, context);
  assert.equal(authRes.success, true);
  assert.equal(authRes.emissions[0].kind, "application-processed");
  console.log("  -> Authoring Tutorial Workflow: SUCCESS");

  console.log("Test 11: Developer Tooling & Linting");
  const linter = new WorkflowLinter();
  const lintReport = linter.lint(authIR);
  assert.ok(Array.isArray(lintReport));

  const visualizer = new TraceVisualizationService();
  const viz = visualizer.formatTraceForVisualization(authRes.trace);
  assert.ok(viz.mermaidFlowchart.includes("graph TD"));
  console.log("  -> Developer Tooling & Linters: SUCCESS");

  console.log("\\n============================================================");
  console.log("ALL 11 STRANGER TESTS PASSED CLEANLY WITH ZERO FRICTION");
  console.log("============================================================");
}

runStrangerTest().catch((err) => {
  console.error("STRANGER TEST FAILED:", err);
  process.exit(1);
});
`;

  fs.writeFileSync(path.join(cleanConsumerDir, "strangerTest.js"), outsiderScript);
  execSync("node strangerTest.js", { cwd: cleanConsumerDir, stdio: "inherit" });

  console.log("\nStranger Test completed successfully!");
} finally {
  // Clean up temporary workspace
  fs.rmSync(tempBaseDir, { recursive: true, force: true });
}

console.log("\nFriction Summary:");
if (frictionLog.length === 0) {
  console.log("SUCCESS_WITHOUT_INTERVENTION: 0 friction points encountered.");
} else {
  console.log(`${frictionLog.length} friction point(s) recorded:`, frictionLog);
}

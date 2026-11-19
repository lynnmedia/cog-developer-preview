import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const packageRoot = process.cwd().endsWith(path.join("packages", "cog-core"))
  ? process.cwd()
  : path.join(process.cwd(), "packages", "cog-core");

const learningFiles = [
  "MANIFEST.md",
  "START_HERE.md",
  "LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md",
  "GOVERNED_DECISION_TUTORIAL.md",
  "LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md",
  "LEVEL_3_COGNITIVE_APPLICATIONS.md",
  "LANGUAGE_SPEC_v0.4.md",
  "LANGUAGE_SEMANTIC_MODEL.md",
  "DEVELOPER_PREVIEW_TEACHING_SURFACE.md",
];

const primitiveFiles = [
  "canonical-observation.cog",
  "canonical-identification.cog",
  "canonical-comparison.cog",
  "canonical-classification.cog",
  "canonical-relation.cog",
  "canonical-projection.cog",
  "canonical-resolution.cog",
  "canonical-constraint.cog",
  "canonical-transformation.cog",
  "canonical-emission.cog",
];

const applicationFiles = [
  "canonical-research-synthesis.cog",
  "canonical-document-review.cog",
  "canonical-decision-workflow.cog",
  "canonical-audit-workflow.cog",
  "canonical-knowledge-graph.cog",
];

function run(command: string, args: string[], cwd: string) {
  return spawnSync(command, args, { cwd, encoding: "utf8" });
}

function assertCommand(bin: string, args: string[], cwd: string, expected?: RegExp) {
  const result = run(bin, args, cwd);
  assert.equal(result.status, 0, `${args.join(" ")}: ${result.stderr || result.stdout}`);
  if (expected) {
    assert.match(result.stdout, expected);
  }
  return result;
}

test("packed Developer Preview learning pack supports a clean-recipient stranger path", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "cog-learning-stranger-"));
  const packDir = path.join(tempRoot, "pack");
  const consumerDir = path.join(tempRoot, "consumer");

  try {
    await mkdir(packDir, { recursive: true });
    await mkdir(consumerDir, { recursive: true });

    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    const packResult = run(
      npm,
      ["pack", "--json", "--silent", "--pack-destination", packDir],
      packageRoot,
    );
    assert.equal(packResult.status, 0, packResult.stderr || packResult.stdout);

    const packInfo = JSON.parse(packResult.stdout) as Array<{ filename: string }>;
    const tarball = path.join(packDir, packInfo[0]!.filename);

    await writeFile(
      path.join(consumerDir, "package.json"),
      JSON.stringify({ name: "cog-learning-stranger-proof", private: true }, null, 2),
      "utf8",
    );

    const installResult = run(npm, ["install", "--ignore-scripts", tarball], consumerDir);
    assert.equal(installResult.status, 0, installResult.stderr || installResult.stdout);

    const installedRoot = path.join(consumerDir, "node_modules", "@winmedia", "cog-core");
    const learningRoot = path.join(installedRoot, "learning");
    const examplesRoot = path.join(installedRoot, "examples");
    const bin = path.join(
      consumerDir,
      "node_modules",
      ".bin",
      process.platform === "win32" ? "cog.cmd" : "cog",
    );

    for (const fileName of learningFiles) {
      await access(path.join(learningRoot, fileName));
    }

    const manifest = await readFile(path.join(learningRoot, "MANIFEST.md"), "utf8");
    assert.match(manifest, /learning\/START_HERE\.md/);
    assert.match(manifest, /LEVEL_3_COGNITIVE_APPLICATIONS\.md/);
    assert.match(manifest, /examples\/applications\/canonical-research-synthesis\.cog/);

    const startHere = await readFile(path.join(learningRoot, "START_HERE.md"), "utf8");
    assert.match(startHere, /assembled-cog-learning-pack/);
    assert.doesNotMatch(startHere, /packages\/cog-core\/examples\//);
    assert.doesNotMatch(startHere, /\/Users\//);
    assert.match(startHere, /LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS\.md/);

    assertCommand(bin, ["help"], consumerDir, /Cog CLI Guide:/);
    assertCommand(bin, ["discover"], consumerDir, /Available Domain Libraries:/);
    assertCommand(bin, ["workflows"], consumerDir, /Runnable Workflow Catalog:/);

    for (const fileName of primitiveFiles) {
      const examplePath = path.join(examplesRoot, "primitives", fileName);
      await access(examplePath);
      assertCommand(bin, ["validate", examplePath], consumerDir, /Validation passed successfully!/);
      assertCommand(bin, ["run", examplePath], consumerDir, /Execution finished successfully!/);
    }

    const tutorialPath = path.join(examplesRoot, "tutorials", "governed-decision.cog");
    await access(tutorialPath);
    assertCommand(bin, ["validate", tutorialPath], consumerDir, /Validation passed successfully!/);
    assertCommand(bin, ["lint", tutorialPath], consumerDir, /Lint/);
    assertCommand(bin, ["graph", tutorialPath], consumerDir, /graph TD/);
    assertCommand(bin, ["run", tutorialPath], consumerDir, /Execution finished successfully!/);
    assertCommand(bin, ["trace", tutorialPath], consumerDir, /Trace cli-trace:/);

    for (const fileName of applicationFiles) {
      const applicationPath = path.join(examplesRoot, "applications", fileName);
      await access(applicationPath);
      assertCommand(bin, ["validate", applicationPath], consumerDir, /Validation passed successfully!/);
      assertCommand(bin, ["graph", applicationPath], consumerDir, /graph TD/);
      assertCommand(bin, ["run", applicationPath], consumerDir, /Execution finished successfully!/);
      assertCommand(bin, ["trace", applicationPath], consumerDir, /Trace cli-trace:/);
      assertCommand(bin, ["diff", applicationPath, applicationPath], consumerDir, /No trace changes detected\./);
    }
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

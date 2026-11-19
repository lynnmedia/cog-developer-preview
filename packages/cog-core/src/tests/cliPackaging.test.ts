import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const packageRoot = process.cwd().endsWith(path.join("packages", "cog-core"))
  ? process.cwd()
  : path.join(process.cwd(), "packages", "cog-core");

function run(command: string, args: string[], cwd: string) {
  return spawnSync(command, args, { cwd, encoding: "utf8" });
}

test("package exposes installed cog executable and built help command runs", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(packageRoot, "package.json"), "utf8"),
  ) as { bin?: Record<string, string> };

  assert.equal(manifest.bin?.cog, "dist/cli/bin.js");

  const result = run(process.execPath, [path.join(packageRoot, "dist", "cli", "bin.js"), "help"], packageRoot);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Cog CLI Guide:/);
  assert.match(result.stdout, /discover/);
  assert.match(result.stdout, /workflows/);
  assert.match(result.stdout, /validate <file>/);
  assert.match(result.stdout, /run <file>/);
  assert.match(result.stdout, /lint <file>/);
  assert.match(result.stdout, /graph <file>/);
  assert.match(result.stdout, /trace <file>/);
  assert.match(result.stdout, /diff <before> <after>/);
});

test("packed consumer install executes Developer Preview CLI surface", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "cog-cli-consumer-"));
  const packDir = path.join(tempRoot, "pack");
  const consumerDir = path.join(tempRoot, "consumer");

  try {
    await mkdir(packDir, { recursive: true });
    await mkdir(consumerDir, { recursive: true });

    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    const packResult = run(npm, ["pack", "--json", "--silent", "--pack-destination", packDir], packageRoot);
    assert.equal(packResult.status, 0, packResult.stderr || packResult.stdout);

    const packInfo = JSON.parse(packResult.stdout) as Array<{ filename: string }>;
    const tarball = path.join(packDir, packInfo[0]!.filename);

    await writeFile(
      path.join(consumerDir, "package.json"),
      JSON.stringify({ name: "cog-cli-consumer-proof", private: true }, null, 2),
      "utf8",
    );

    const installResult = run(npm, ["install", "--ignore-scripts", tarball], consumerDir);
    assert.equal(installResult.status, 0, installResult.stderr || installResult.stdout);

    const bin = path.join(
      consumerDir,
      "node_modules",
      ".bin",
      process.platform === "win32" ? "cog.cmd" : "cog",
    );

    const sourcePath = path.join(consumerDir, "proof.cog");
    await writeFile(
      sourcePath,
      `define entity "proof" {\n  kind: record\n  level: L1\n}\n\nemit {\n  target: "proof"\n  kind: proof\n}\n`,
      "utf8",
    );

    for (const [name, args, expected] of [
      ["help", ["help"], /Cog CLI Guide:/],
      ["discover", ["discover"], /Available Domain Libraries:/],
      ["workflows", ["workflows"], /Runnable Workflow Catalog:/],
      ["validate", ["validate", sourcePath], /Validation passed successfully!/],
      ["run", ["run", sourcePath], /Execution finished successfully!/],
      ["lint", ["lint", sourcePath], /Lint passed with no workflow issues\./],
      ["graph", ["graph", sourcePath], /graph TD/],
      ["trace", ["trace", sourcePath], /Trace cli-trace:/],
      ["diff", ["diff", sourcePath, sourcePath], /No trace changes detected\./],
    ] as const) {
      const result = run(bin, [...args], consumerDir);
      assert.equal(result.status, 0, `${name}: ${result.stderr || result.stdout}`);
      assert.match(result.stdout, expected);
    }
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

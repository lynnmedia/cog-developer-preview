import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const packageRoot = process.cwd().endsWith(path.join("packages", "cog-core"))
  ? process.cwd()
  : path.join(process.cwd(), "packages", "cog-core");

test("End-to-end consumer install and bridge verification proof", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cog-consumer-install-proof-"));
  const packDir = path.join(tempRoot, "pack");
  const consumerDir = path.join(tempRoot, "consumer");
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";

  fs.mkdirSync(packDir, { recursive: true });
  fs.mkdirSync(consumerDir, { recursive: true });

  try {
    // 1. Pack the exact package under test through its real prepack lifecycle.
    const packOutput = execFileSync(
      npm,
      ["pack", "--json", "--silent", "--pack-destination", packDir],
      { cwd: packageRoot, encoding: "utf8" },
    );
    const packInfo = JSON.parse(packOutput) as Array<{ filename: string }>;
    const tarballPath = path.join(packDir, packInfo[0]!.filename);
    assert.ok(fs.existsSync(tarballPath), `Packed tarball not found at ${tarballPath}`);

    // 2. Initialize a clean downstream npm project and install only the tarball.
    execFileSync(npm, ["init", "-y"], { cwd: consumerDir, stdio: "ignore" });
    execFileSync(npm, ["install", "--no-save", "--ignore-scripts", tarballPath], {
      cwd: consumerDir,
      stdio: "ignore",
    });

    // 3. Write a consumer script that uses the installed public package API.
    const scriptContent = `
const { lex, parseCog, compileCog, validateCog, executeCog } = require("@winmedia/cog-core");

async function run() {
  const source = \`
    define entity "request" {
      kind: "coda_request"
      level: L1
    }
    resolve "request" to L2 {
      output: "ready"
    }
  \`.trim();

  const tokens = lex(source);
  const ast = parseCog(tokens);
  const ir = compileCog(ast);
  const validation = await validateCog(ir);

  if (!validation.valid) {
    console.error("Validation failed");
    process.exit(1);
  }

  const result = await executeCog(ir, {
    runId: "run-consumer-install-1",
    mode: "strict",
    startedAt: new Date().toISOString()
  });

  if (result.success) {
    console.log("SUCCESS");
  } else {
    console.error("Execution failed");
    process.exit(1);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
    `.trim();

    fs.writeFileSync(path.join(consumerDir, "index.js"), scriptContent, "utf8");

    // 4. Execute from the downstream project, not the repository checkout.
    const output = execFileSync(process.execPath, ["index.js"], {
      cwd: consumerDir,
      encoding: "utf8",
    }).trim();

    assert.equal(output, "SUCCESS");
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

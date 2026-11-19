import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("End-to-end consumer install and bridge verification proof", () => {
  const tempDir = path.join(__dirname, "tmp-consumer-proof");
  const tarballPath = path.join(__dirname, "..", "..", "cog-core-0.3.0.tgz");

  // Ensure tarball exists
  assert.ok(fs.existsSync(tarballPath), `Tarball not found at ${tarballPath}. Run npm pack first.`);

  // Cleanup old temp directory if exists
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // 1. Initialize temporary npm project
    execSync("npm init -y", { cwd: tempDir, stdio: "ignore" });

    // 2. Install the local packed tarball
    execSync(`npm install --no-save "${tarballPath}"`, { cwd: tempDir, stdio: "ignore" });

    // 3. Write a consumer script that uses the installed package
    const scriptContent = `
const { lex, parseCog, compileCog, validateCog, executeCog } = require("@cog/core");

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

    fs.writeFileSync(path.join(tempDir, "index.js"), scriptContent, "utf-8");

    // 4. Execute the script using node
    const output = execSync("node index.js", { cwd: tempDir, encoding: "utf-8" }).trim();

    // 5. Verify the consumer output
    assert.equal(output, "SUCCESS");
  } finally {
    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

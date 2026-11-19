import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("VS Code extension scaffold exists and contains valid metadata", () => {
  const extensionPath = path.resolve(__dirname, "../../../cog-vscode-extension");
  const packageJsonPath = path.join(extensionPath, "package.json");

  assert.ok(fs.existsSync(packageJsonPath), "VS Code package.json should exist");

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  assert.equal(packageJson.name, "cog-vscode-extension");
  assert.equal(packageJson.publisher, "lynnmedia");

  // Verify languages and commands contributions
  const contributes = packageJson.contributes;
  assert.ok(contributes);

  const lang = contributes.languages.find((l: any) => l.id === "cog");
  assert.ok(lang, "Should contribute cog language");
  assert.ok(lang.extensions.includes(".cog"), "Should map to .cog extension");

  const command = contributes.commands.find((c: any) => c.command === "cog.validateWorkflow");
  assert.ok(command, "Should register cog.validateWorkflow command");
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { compileCog, type ProgramNode } from "../index";

test("Package, compiler, and IR versions are consistent", () => {
  const rootDir = path.resolve(__dirname, "../../../..");
  
  // Read workspace packages package.json files
  const coreJson = JSON.parse(fs.readFileSync(path.join(rootDir, "packages/cog-core/package.json"), "utf-8"));
  const momJson = JSON.parse(fs.readFileSync(path.join(rootDir, "packages/cog-adapter-mom/package.json"), "utf-8"));
  const decisionJson = JSON.parse(fs.readFileSync(path.join(rootDir, "packages/cog-adapter-decision/package.json"), "utf-8"));

  const coreVersion = coreJson.version;
  const momVersion = momJson.version;
  const decisionVersion = decisionJson.version;

  // 1. Enforce workspaces have matching versions
  assert.equal(momVersion, coreVersion, `@cog/adapter-mom version (${momVersion}) must match @cog/core version (${coreVersion})`);
  assert.equal(decisionVersion, coreVersion, `@cog/adapter-decision version (${decisionVersion}) must match @cog/core version (${coreVersion})`);

  // 2. Enforce compileCog output metadata.compilerVersion matches the package version
  const emptyProgram: ProgramNode = {
    kind: "Program",
    statements: []
  };
  const ir = compileCog(emptyProgram);
  const compilerVersion = ir.meta.compilerVersion;

  assert.equal(compilerVersion, coreVersion, `Compiler output version (${compilerVersion}) must match @cog/core package version (${coreVersion})`);
});

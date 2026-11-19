import assert from "node:assert/strict";
import test from "node:test";
import { LibraryDocumentationGenerator } from "../service/libraryDocumentationGenerator";

test("LibraryDocumentationGenerator generates reference manuals dynamically from registry metadata", () => {
  const generator = new LibraryDocumentationGenerator();
  const manual = generator.generateReferenceManual();

  // 1. Check title and intro
  assert.ok(manual.includes("# Cog Domain Library Reference Manual"));

  // 2. Check registered libraries are documented
  assert.ok(manual.includes("Library: Research Synthesis Library"));
  assert.ok(manual.includes("Library: Planning Cognition Library"));
  assert.ok(manual.includes("- **ID**: `cog:domain:research`"));

  // 3. Check capabilities and patterns are detailed
  assert.ok(manual.includes("research-synthesis"));
  assert.ok(manual.includes("planning-workflow"));

  // 4. Check usage examples are generated
  assert.ok(manual.includes("### Usage Example (.cog DSL)"));
  assert.ok(manual.includes("define entity"));
});

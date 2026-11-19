import assert from "node:assert/strict";
import test from "node:test";
import { CanonicalDocumentationSynchronizer } from "../service/canonicalDocumentationSynchronizer";
import { LibraryDocumentationGenerator } from "../service/libraryDocumentationGenerator";

test("CanonicalDocumentationSynchronizer detects drift between manual and registry", () => {
  const generator = new LibraryDocumentationGenerator();
  const synchronizer = new CanonicalDocumentationSynchronizer();

  const correctManual = generator.generateReferenceManual();

  // 1. Correct manual should synchronize successfully
  assert.doesNotThrow(() => {
    synchronizer.verifySynchronization(correctManual);
  });

  // 2. An incomplete manual (missing planning library info) should throw out-of-sync error
  const incompleteManual = correctManual.replace(/cog:domain:planning/g, "cog:domain:outdated-id");
  assert.throws(() => {
    synchronizer.verifySynchronization(incompleteManual);
  }, /Documentation drift detected/i);
});

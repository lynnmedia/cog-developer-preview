import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog, executeCog } from "../index";
import { researchToBookPipeline } from "../domain/research/researchToBookPipeline";

const baseContext = {
  runId: "research-to-book-test",
  mode: "batch" as const,
  startedAt: new Date(0).toISOString(),
};

test("Research-to-book pipeline generates a valid, compilable, and executable .cog code", async () => {
  const params = {
    bookTitle: "The Future of AI",
    chapters: [
      { id: "chapter-1", notes: "Notes on neural nets" },
      { id: "chapter-2", notes: "Notes on transformers" },
    ],
    outlineId: "final-book-outline",
  };

  const source = researchToBookPipeline.generate(params);

  // Verify structure is generated
  assert.ok(source.includes('define entity "chapter-1"'));
  assert.ok(source.includes('define entity "final-book-outline"'));
  assert.ok(source.includes('resolve "book-synthesis-cluster" to L4'));
  assert.ok(source.includes('emit {'));

  // Test compilation and execution pipeline
  const ir = compileCog(parseCog(lex(source)));
  const validation = await validateCog(ir, { context: baseContext });
  assert.equal(validation.valid, true);

  const executionResult = await executeCog(ir, baseContext);
  assert.equal(executionResult.success, true);
});

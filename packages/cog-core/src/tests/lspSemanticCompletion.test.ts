import assert from "node:assert/strict";
import test from "node:test";
import { LspService } from "../lsp/lspService";

test("LspService getCompletions returns keywords, entities, and library patterns", async () => {
  const service = new LspService();
  const source = `
    define entity "sensor-reading" {
      kind: observation
      level: L1
    }
  `;

  // Get completions at a random position
  const completions = await service.getCompletions(source, { line: 4, character: 0 });

  // 1. Check keywords are present
  const labels = completions.map((c) => c.label);
  assert.ok(labels.includes("define"));
  assert.ok(labels.includes("entity"));
  assert.ok(labels.includes("relate"));
  assert.ok(labels.includes("resolve"));
  assert.ok(labels.includes("emit"));

  // 2. Check defined entities in the file are suggested
  assert.ok(labels.includes("sensor-reading"));

  // 3. Check domain library pattern suggestions are present
  assert.ok(labels.includes("source-to-claim"));
  assert.ok(labels.includes("drift-detection"));
  assert.ok(labels.includes("severity-resolution"));
});

import assert from "node:assert/strict";
import test from "node:test";
import { LspService } from "../lsp/lspService";

test("LspService getQuickFixes suggests correct definitions for missing entities", async () => {
  const service = new LspService();
  const source = `define entity "sensor-a" {
  kind: observation
  level: L1
  value: "high"
}

relate "sensor-a" -> "sensor-b" {
  kind: "links"
  operation: "relate"
}
`;

  // Get validation diagnostics first
  const diagnostics = await service.validateDocument(source);
  assert.ok(diagnostics.length > 0);
  const targetDiag = diagnostics.find((d) => d.message.includes("missing_relation_target_entity"));
  assert.ok(targetDiag);

  // Retrieve quick fixes
  const quickFixes = await service.getQuickFixes(source, targetDiag);
  assert.equal(quickFixes.length, 1);
  assert.equal(quickFixes[0]?.title, 'Define missing entity "sensor-b"');

  const edit = quickFixes[0]?.edit?.changes["document"];
  assert.ok(edit);
  assert.ok(edit[0]?.newText.includes('define entity "sensor-b"'));

  // Test applying the edit
  const applied = source + edit[0]?.newText;
  const newDiag = await service.validateDocument(applied);
  // The error should now be resolved!
  assert.equal(newDiag.filter((d) => d.message.includes("sensor-b")).length, 0);
});

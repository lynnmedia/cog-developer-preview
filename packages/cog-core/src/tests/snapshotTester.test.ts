import assert from "node:assert/strict";
import test from "node:test";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { SnapshotTester } from "../service/snapshotTester";

test("SnapshotTester matches content exactly and handles missing snapshots gracefully", async () => {
  const tempDir = path.join(__dirname, "temp-snapshots");
  const tester = new SnapshotTester(tempDir);

  const testSnapshotName = "workflow-snapshot-test";
  const testContent = "define entity \"sensor-a\" {}\n";

  // Cleanup potential leftover from previous runs
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch {}

  // 1. First run should create the snapshot file
  await tester.assertMatch(testSnapshotName, testContent);

  const createdFilepath = path.join(tempDir, `${testSnapshotName}.snap`);
  const writtenContent = await fs.readFile(createdFilepath, "utf8");
  assert.equal(writtenContent, testContent);

  // 2. Second run with matching content should pass
  await assert.doesNotReject(async () => {
    await tester.assertMatch(testSnapshotName, testContent);
  });

  // 3. Second run with mismatched content should reject
  await assert.rejects(async () => {
    await tester.assertMatch(testSnapshotName, "define entity \"sensor-b\" {}\n");
  }, /Snapshot mismatch/);

  // 4. Update snapshot should overwrite and succeed
  const updatedContent = "define entity \"sensor-c\" {}\n";
  await tester.assertMatch(testSnapshotName, updatedContent, true);
  const reReadContent = await fs.readFile(createdFilepath, "utf8");
  assert.equal(reReadContent, updatedContent);

  // Cleanup
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch {}
});

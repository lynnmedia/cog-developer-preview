import { promises as fs } from "node:fs";
import * as path from "node:path";

export class SnapshotTester {
  private snapshotDir: string;

  constructor(customDir?: string) {
    this.snapshotDir = customDir ?? path.join(__dirname, "..", "snapshots");
  }

  /**
   * Asserts that the actual content matches the saved snapshot exactly.
   * If the snapshot file does not exist, it is created.
   */
  async assertMatch(name: string, actualContent: string, updateSnapshots = false): Promise<void> {
    const filename = `${name}.snap`;
    const filepath = path.join(this.snapshotDir, filename);

    // Ensure snapshot directory exists
    await fs.mkdir(this.snapshotDir, { recursive: true });

    if (updateSnapshots) {
      await fs.writeFile(filepath, actualContent, "utf8");
      return;
    }

    try {
      const expectedContent = await fs.readFile(filepath, "utf8");
      if (actualContent !== expectedContent) {
        throw new Error(
          `Snapshot mismatch for "${name}".\nExpected:\n${expectedContent}\n\nActual:\n${actualContent}`
        );
      }
    } catch (err: any) {
      if (err.code === "ENOENT") {
        // Automatically write if not found (standard snapshot behavior on first run)
        await fs.writeFile(filepath, actualContent, "utf8");
      } else {
        throw err;
      }
    }
  }
}

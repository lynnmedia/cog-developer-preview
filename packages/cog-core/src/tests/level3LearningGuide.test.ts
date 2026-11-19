import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const packageRoot = process.cwd().endsWith(path.join("packages", "cog-core"))
  ? process.cwd()
  : path.join(process.cwd(), "packages", "cog-core");
const repoRoot = path.resolve(packageRoot, "../..");

const canonicalOrder = [
  "canonical-research-synthesis.cog",
  "canonical-document-review.cog",
  "canonical-decision-workflow.cog",
  "canonical-audit-workflow.cog",
  "canonical-knowledge-graph.cog",
];

function normalize(source: string): string {
  return source.trim().replace(/\r\n/g, "\n");
}

test("Level 3 guide embeds the five canonical application fixtures in curriculum order", async () => {
  const guide = await readFile(
    path.join(repoRoot, "docs", "LEVEL_3_COGNITIVE_APPLICATIONS.md"),
    "utf8",
  );

  const embedded = [...guide.matchAll(/```cog\s*\n([\s\S]*?)```/g)].map((match) =>
    normalize(match[1] ?? ""),
  );

  assert.equal(embedded.length, canonicalOrder.length);

  for (const [index, fileName] of canonicalOrder.entries()) {
    const canonical = await readFile(
      path.join(packageRoot, "examples", "applications", fileName),
      "utf8",
    );

    assert.equal(
      embedded[index],
      normalize(canonical),
      `Level 3 application ${index + 1} must match ${fileName}`,
    );
  }
});

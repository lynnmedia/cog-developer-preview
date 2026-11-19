import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const packageRoot = process.cwd().endsWith(path.join("packages", "cog-core"))
  ? process.cwd()
  : path.join(process.cwd(), "packages", "cog-core");
const repoRoot = path.resolve(packageRoot, "../..");

const canonicalOrder = [
  "canonical-observation.cog",
  "canonical-identification.cog",
  "canonical-comparison.cog",
  "canonical-classification.cog",
  "canonical-relation.cog",
  "canonical-projection.cog",
  "canonical-resolution.cog",
  "canonical-constraint.cog",
  "canonical-transformation.cog",
  "canonical-emission.cog",
];

function normalize(source: string): string {
  return source.trim().replace(/\r\n/g, "\n");
}

test("Level 1 guide embeds the ten canonical primitive fixtures in learning order", async () => {
  const guide = await readFile(
    path.join(repoRoot, "docs", "LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md"),
    "utf8",
  );

  const embedded = [...guide.matchAll(/```cog\s*\n([\s\S]*?)```/g)].map((match) =>
    normalize(match[1] ?? ""),
  );

  assert.equal(embedded.length, canonicalOrder.length);

  for (const [index, fileName] of canonicalOrder.entries()) {
    const canonical = await readFile(
      path.join(packageRoot, "examples", "primitives", fileName),
      "utf8",
    );

    assert.equal(
      embedded[index],
      normalize(canonical),
      `Level 1 lesson ${index + 1} must match ${fileName}`,
    );
  }
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { lex, parseCog } from "../index";

const packageRoot = process.cwd().endsWith(path.join("packages", "cog-core"))
  ? process.cwd()
  : path.join(process.cwd(), "packages", "cog-core");
const repoRoot = path.resolve(packageRoot, "../..");

const developerPreviewDocs = [
  "docs/START_HERE.md",
  "docs/LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md",
  "docs/GOVERNED_DECISION_TUTORIAL.md",
  "docs/LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md",
  "docs/LEVEL_3_COGNITIVE_APPLICATIONS.md",
  "docs/LANGUAGE_SPEC_v0.4.md",
  "docs/LANGUAGE_SEMANTIC_MODEL.md",
  "docs/DEVELOPER_PREVIEW_TEACHING_SURFACE.md",
  "docs/GETTING_STARTED.md",
  "docs/AUTHORING_TUTORIAL.md",
];

const statementStart = /^(define|relate|view|resolve|transform|constrain|emit)\b/;

function cogPrograms(markdown: string): string[] {
  return [...markdown.matchAll(/```cog\s*\n([\s\S]*?)```/g)]
    .map((match) => match[1]?.trim() ?? "")
    .filter((source) => Boolean(source) && statementStart.test(source));
}

test("Developer Preview Cog programs conform to the executable parser", async () => {
  let checked = 0;

  for (const relativePath of developerPreviewDocs) {
    const markdown = await readFile(path.join(repoRoot, relativePath), "utf8");

    for (const source of cogPrograms(markdown)) {
      let ast;
      try {
        ast = parseCog(lex(source));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        assert.fail(`${relativePath} contains non-conforming Cog source:\n${source}\n\n${message}`);
      }

      for (const statement of ast.statements) {
        if (statement.kind === "Emit") {
          const hasExplicitTarget = statement.fields.some((field) => field.name === "target");
          assert.equal(
            hasExplicitTarget,
            true,
            `${relativePath} contains a Developer Preview emit without explicit target:\n${source}`,
          );
        }
      }

      checked += 1;
    }
  }

  assert.ok(checked > 0, "Expected at least one Developer Preview Cog documentation program");
});

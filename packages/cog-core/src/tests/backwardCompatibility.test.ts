import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { lex, parseCog, compileCog, validateCog } from "../index";

test("Backward compatibility test corpus compiles successfully without errors", async () => {
  const corpusDir = path.join(__dirname, "corpus");
  const files = fs.readdirSync(corpusDir).filter(f => f.endsWith(".cog"));

  assert.ok(files.length >= 3, `Expected at least 3 historical corpus files, found ${files.length}`);

  for (const file of files) {
    const filePath = path.join(corpusDir, file);
    const source = fs.readFileSync(filePath, "utf-8");

    try {
      const tokens = lex(source);
      const ast = parseCog(tokens);
      const ir = compileCog(ast);
      const validation = await validateCog(ir);

      assert.equal(validation.valid, true, `File ${file} failed validation: ${JSON.stringify(validation.issues)}`);
      assert.ok(ir.meta.compilerVersion, `File ${file} compiled IR lacks compiler version`);
    } catch (err: any) {
      assert.fail(`Failed to compile historical corpus file ${file}: ${err.message || err}`);
    }
  }
});

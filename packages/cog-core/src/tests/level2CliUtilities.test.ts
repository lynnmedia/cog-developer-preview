import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { runCli } from "../cli";

async function writeCog(dir: string, name: string, source: string): Promise<string> {
  const filePath = path.join(dir, name);
  await writeFile(filePath, source, "utf8");
  return filePath;
}

async function invoke(args: string[]): Promise<string[]> {
  const output: string[] = [];
  process.exitCode = undefined;
  await runCli(args, (message) => output.push(message));
  assert.equal(process.exitCode, undefined, output.join("\n"));
  return output;
}

test("Level 2 commands appear in CLI help", async () => {
  const output = await invoke(["help"]);
  const text = output.join("\n");

  assert.match(text, /lint <file>/);
  assert.match(text, /graph <file>/);
  assert.match(text, /trace <file>/);
  assert.match(text, /diff <before> <after>/);
});

test("lint and graph expose existing structural services through the CLI", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "cog-level2-"));
  try {
    const file = await writeCog(
      dir,
      "graph.cog",
      `define entity "source" {\n  kind: observation\n  level: L1\n}\n\ndefine entity "result" {\n  kind: finding\n  level: L2\n}\n\nrelate "source" -> "result" {\n  kind: supports\n}\n\nemit {\n  target: "result"\n  kind: finding\n}\n`,
    );

    const lint = (await invoke(["lint", file])).join("\n");
    assert.match(lint, /Lint passed with no workflow issues\./);

    const graph = (await invoke(["graph", file])).join("\n");
    assert.match(graph, /^graph TD/m);
    assert.match(graph, /relate: supports/);
    assert.match(graph, /Emit: finding/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("trace can inspect one execution phase", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "cog-level2-"));
  try {
    const file = await writeCog(
      dir,
      "trace.cog",
      `define entity "raw" {\n  kind: observation\n  level: L1\n}\n\ndefine entity "normalized" {\n  kind: observation\n  level: L1\n}\n\ntransform {\n  target: "raw"\n  to: normalize\n}\n\nrelate "raw" -> "normalized" {\n  kind: transforms-to\n}\n\nemit {\n  target: "normalized"\n  kind: normalized\n}\n`,
    );

    const trace = (await invoke(["trace", file, "--phase", "transform"])).join("\n");
    assert.match(trace, /Trace cli-trace: 1 step in phase transform\./);
    assert.match(trace, /transform SUCCEEDED/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("diff compares execution traces for two Cog programs", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "cog-level2-"));
  try {
    const before = await writeCog(
      dir,
      "before.cog",
      `define entity "result" {\n  kind: record\n  level: L1\n}\n\nemit {\n  target: "result"\n  kind: result\n}\n`,
    );
    const after = await writeCog(
      dir,
      "after.cog",
      `define entity "source" {\n  kind: observation\n  level: L1\n}\n\ndefine entity "result" {\n  kind: record\n  level: L1\n}\n\nrelate "source" -> "result" {\n  kind: supports\n}\n\nemit {\n  target: "result"\n  kind: result\n}\n`,
    );

    const diff = (await invoke(["diff", before, after])).join("\n");
    assert.match(diff, /Trace changes detected\./);
    assert.match(diff, /added|modified|removed/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import { runCli } from "../cli";

test("CLI discover command outputs registered libraries", async () => {
  const output: string[] = [];
  const mockLog = (msg: string) => output.push(msg);

  await runCli(["discover"], mockLog);

  assert.ok(output.some((line) => line.includes("Research Synthesis Library")));
});

test("CLI workflows command outputs workflow list", async () => {
  const output: string[] = [];
  const mockLog = (msg: string) => output.push(msg);

  await runCli(["workflows"], mockLog);

  assert.ok(output.some((line) => line.includes("Research to Book Pipeline")));
});

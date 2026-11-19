#!/usr/bin/env node

import { runCli } from "./index";

runCli(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Cog CLI failed: ${message}`);
  process.exitCode = 1;
});

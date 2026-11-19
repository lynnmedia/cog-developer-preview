import fs from "node:fs";
import { lex } from "../lexer/lexer";
import { parseCog } from "../parser/parser";
import { compileCog } from "../compiler/compileCog";
import { validateCog } from "../validator/validateCog";
import { executeCog } from "../runtime/executeCog";
import { DiscoveryService } from "../service/discoveryService";
import { WorkflowCatalogService } from "../service/workflowCatalogService";

export async function runCli(args: string[], log: (msg: string) => void = console.log): Promise<void> {
  const command = args[0];

  if (!command || command === "help" || command === "--help" || command === "-h") {
    log("Cog CLI Guide:");
    log("  discover           List all available domain libraries");
    log("  workflows          List all runnable workflows in the catalog");
    log("  validate <file>    Validate a .cog source file");
    log("  run <file>         Run a .cog source file locally");
    return;
  }

  const discovery = new DiscoveryService();
  const catalog = new WorkflowCatalogService();

  switch (command) {
    case "discover": {
      log("Available Domain Libraries:");
      discovery.discoverLibraries().forEach((lib) => {
        log(`- ${lib.id}: ${lib.name} (${lib.description})`);
      });
      break;
    }
    case "workflows": {
      log("Runnable Workflow Catalog:");
      catalog.listWorkflows().forEach((w) => {
        log(`- ${w.id}: ${w.name} (${w.description})`);
      });
      break;
    }
    case "validate": {
      const filePath = args[1];
      if (!filePath) {
        log("Error: Specify a file path to validate");
        process.exitCode = 1;
        return;
      }
      try {
        const source = fs.readFileSync(filePath, "utf-8");
        const tokens = lex(source);
        const ast = parseCog(tokens);
        const ir = compileCog(ast);
        const report = await validateCog(ir, {
          context: { runId: "cli-validate", mode: "batch", startedAt: new Date().toISOString() }
        });
        if (report.valid) {
          log("Validation passed successfully!");
        } else {
          log(`Validation failed with ${report.errorCount} errors:`);
          report.issues.forEach((i) => log(`- [${i.code}] ${i.message}`));
          process.exitCode = 1;
        }
      } catch (err: any) {
        log(`Error: ${err.message || String(err)}`);
        process.exitCode = 1;
      }
      break;
    }
    case "run": {
      const filePath = args[1];
      if (!filePath) {
        log("Error: Specify a file path to run");
        process.exitCode = 1;
        return;
      }
      try {
        const source = fs.readFileSync(filePath, "utf-8");
        const tokens = lex(source);
        const ast = parseCog(tokens);
        const ir = compileCog(ast);
        const report = await validateCog(ir, {
          context: { runId: "cli-run", mode: "batch", startedAt: new Date().toISOString() }
        });
        if (!report.valid) {
          log("Validation failed, aborting execution.");
          process.exitCode = 1;
          return;
        }
        const result = await executeCog(ir, {
          runId: "cli-run",
          mode: "batch",
          startedAt: new Date().toISOString()
        });
        if (result.success) {
          log("Execution finished successfully!");
          log(`Emitted ${result.emissions.length} payloads.`);
        } else {
          log("Execution failed.");
          process.exitCode = 1;
        }
      } catch (err: any) {
        log(`Error: ${err.message || String(err)}`);
        process.exitCode = 1;
      }
      break;
    }
    default: {
      log(`Unknown command: ${command}`);
      process.exitCode = 1;
    }
  }
}

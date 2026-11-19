import fs from "node:fs";
import { lex } from "../lexer/lexer";
import { parseCog } from "../parser/parser";
import { compileCog } from "../compiler/compileCog";
import { validateCog } from "../validator/validateCog";
import { executeCog } from "../runtime/executeCog";
import { DiscoveryService } from "../service/discoveryService";
import { WorkflowCatalogService } from "../service/workflowCatalogService";
import { WorkflowLinter } from "../service/workflowLinter";
import { WorkflowGraphViewerService } from "../service/workflowGraphViewerService";
import { TraceExplorer } from "../service/traceExplorer";
import { TraceDiffVisualizer } from "../service/traceDiffVisualizer";

function compileFile(filePath: string) {
  const source = fs.readFileSync(filePath, "utf-8");
  return compileCog(parseCog(lex(source)));
}

function durationMs(startedAt: string, completedAt: string): number {
  return Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime());
}

export async function runCli(args: string[], log: (msg: string) => void = console.log): Promise<void> {
  const command = args[0];

  if (!command || command === "help" || command === "--help" || command === "-h") {
    log("Cog CLI Guide:");
    log("  discover                        List all available domain libraries");
    log("  workflows                       List all runnable workflows in the catalog");
    log("  validate <file>                 Validate a .cog source file");
    log("  run <file>                      Run a .cog source file locally");
    log("  lint <file>                     Inspect compiled structure for workflow smells");
    log("  graph <file>                    Print the compiled semantic graph as Mermaid");
    log("  trace <file> [--phase <phase>]  Execute and inspect the runtime trace");
    log("  diff <before> <after>           Compare execution traces for two .cog files");
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
        const ir = compileFile(filePath);
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
        const ir = compileFile(filePath);
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
    case "lint": {
      const filePath = args[1];
      if (!filePath) {
        log("Error: Specify a file path to lint");
        process.exitCode = 1;
        return;
      }
      try {
        const issues = new WorkflowLinter().lint(compileFile(filePath));
        if (issues.length === 0) {
          log("Lint passed with no workflow issues.");
        } else {
          log(`Lint found ${issues.length} workflow issue${issues.length === 1 ? "" : "s"}:`);
          issues.forEach((issue) => log(`- [${issue.severity}] ${issue.code}: ${issue.message}`));
        }
      } catch (err: any) {
        log(`Error: ${err.message || String(err)}`);
        process.exitCode = 1;
      }
      break;
    }
    case "graph": {
      const filePath = args[1];
      if (!filePath) {
        log("Error: Specify a file path to graph");
        process.exitCode = 1;
        return;
      }
      try {
        const graph = new WorkflowGraphViewerService().formatWorkflowForVisualization(compileFile(filePath));
        log(graph.mermaidFlowchart.trimEnd());
      } catch (err: any) {
        log(`Error: ${err.message || String(err)}`);
        process.exitCode = 1;
      }
      break;
    }
    case "trace": {
      const filePath = args[1];
      if (!filePath) {
        log("Error: Specify a file path to trace");
        process.exitCode = 1;
        return;
      }
      const phaseFlagIndex = args.indexOf("--phase");
      const phase = phaseFlagIndex >= 0 ? args[phaseFlagIndex + 1] : undefined;
      if (phaseFlagIndex >= 0 && !phase) {
        log("Error: --phase requires a phase name");
        process.exitCode = 1;
        return;
      }
      try {
        const ir = compileFile(filePath);
        const result = await executeCog(ir, {
          runId: "cli-trace",
          mode: "batch",
          startedAt: new Date().toISOString()
        });
        if (!result.success) {
          log("Execution failed; trace contains failed or skipped steps.");
          process.exitCode = 1;
        }
        const explorer = new TraceExplorer(result.trace);
        const query = explorer.querySteps({ phase });
        log(`Trace ${result.trace.runId}: ${query.steps.length} step${query.steps.length === 1 ? "" : "s"}${phase ? ` in phase ${phase}` : ""}.`);
        log(`Total selected duration: ${query.totalDurationMs}ms.`);
        for (const step of query.steps) {
          const detail = step.message ? ` — ${step.message}` : "";
          log(`- ${step.stepId} ${step.phase} ${step.status} ${durationMs(step.startedAt, step.completedAt)}ms${detail}`);
        }
      } catch (err: any) {
        log(`Error: ${err.message || String(err)}`);
        process.exitCode = 1;
      }
      break;
    }
    case "diff": {
      const beforePath = args[1];
      const afterPath = args[2];
      if (!beforePath || !afterPath) {
        log("Error: Specify before and after .cog file paths");
        process.exitCode = 1;
        return;
      }
      try {
        const before = await executeCog(compileFile(beforePath), {
          runId: "cli-diff-before",
          mode: "batch",
          startedAt: new Date().toISOString()
        });
        const after = await executeCog(compileFile(afterPath), {
          runId: "cli-diff-after",
          mode: "batch",
          startedAt: new Date().toISOString()
        });
        if (!before.success || !after.success) {
          log("Error: Both programs must execute successfully before their traces can be compared");
          process.exitCode = 1;
          return;
        }
        const report = new TraceDiffVisualizer().compareTraces(before.trace, after.trace);
        log(report.hasChanges ? "Trace changes detected." : "No trace changes detected.");
        log(`Duration shift: ${report.durationShiftMs}ms.`);
        for (const change of report.stepDiffs.filter((item) => item.changeType !== "unchanged")) {
          log(`- ${change.stepId}: ${change.changeType}`);
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

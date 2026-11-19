import assert from "node:assert/strict";
import test from "node:test";
import { performance } from "node:perf_hooks";
import { lex, parseCog, compileCog, validateCog, planCog, executeCog } from "../index";
import {
  researchLibrary,
  editorialLibrary,
  decisionLibrary,
  auditLibrary,
  graphLibrary
} from "../index";

test("runtime performance baseline measurement", async () => {
  const workflows = [
    {
      name: "Research Synthesis Domain",
      source: researchLibrary.generate({
        sources: [
          { id: "s-1", value: "Primary observation data." },
          { id: "s-2", value: "Corroborating signal data." }
        ],
        claims: [
          { id: "c-1", sourceId: "s-1", value: "Extracted claim A." },
          { id: "c-2", sourceId: "s-2", value: "Extracted claim B." }
        ],
        clusterId: "perf-cluster",
        resolutionId: "perf-synthesis-res"
      })
    },
    {
      name: "Editorial Review Domain",
      source: editorialLibrary.generate({
        draftDocumentId: "draft-doc-1",
        draftContent: "Initial draft manuscript section.",
        reviewedClaims: [
          { id: "claim-rev-1", status: "verified" },
          { id: "claim-rev-2", status: "reconciled" }
        ],
        outputTargetId: "final-reviewed-doc"
      })
    },
    {
      name: "Decision Analysis Domain",
      source: decisionLibrary.generate({
        problemId: "perf-problem-1",
        problemDescription: "Evaluate architectural routing trade-offs.",
        options: [
          { id: "opt-1", description: "In-memory caching", score: 0.92 },
          { id: "opt-2", description: "Direct storage lookup", score: 0.81 }
        ],
        selectedOptionId: "opt-1",
        resolutionId: "perf-decision-resolution"
      })
    },
    {
      name: "Audit Domain",
      source: auditLibrary.generate({
        ledgerEntries: [
          { id: "entry-1", amount: 100, verified: true },
          { id: "entry-2", amount: 250, verified: true }
        ],
        auditId: "perf-audit-check-1",
        certificateId: "perf-audit-cert"
      })
    },
    {
      name: "Graph Domain",
      source: graphLibrary.generate({
        nodes: [
          { id: "node-1", kind: "service", label: "Kernel" },
          { id: "node-2", kind: "adapter", label: "MoM" }
        ],
        edges: [
          { from: "node-1", to: "node-2", relation: "connects_to" }
        ],
        queryTargetId: "perf-graph-result"
      })
    }
  ];

  console.log("\n=================== PERFORMANCE BASELINE RESULTS ===================");
  for (const wf of workflows) {
    const t0 = performance.now();
    const tokens = lex(wf.source);
    const t1 = performance.now();
    const ast = parseCog(tokens);
    const t2 = performance.now();
    const ir = compileCog(ast);
    const t3 = performance.now();

    const validation = await validateCog(ir, {
      context: { runId: "perf-test", mode: "batch", startedAt: new Date().toISOString() }
    });
    const t4 = performance.now();

    const plan = await planCog(ir, {
      context: { runId: "perf-test", mode: "batch", startedAt: new Date().toISOString() }
    });
    const t5 = performance.now();

    const execution = await executeCog(ir, {
      runId: "perf-test",
      mode: "batch",
      startedAt: new Date().toISOString()
    });
    const t6 = performance.now();

    const lexTime = t1 - t0;
    const parseTime = t2 - t1;
    const compileTime = t3 - t2;
    const validateTime = t4 - t3;
    const planTime = t5 - t4;
    const executeTime = t6 - t5;
    const totalTime = t6 - t0;

    console.log(`Workflow: ${wf.name}`);
    console.log(`  - Lex:      ${lexTime.toFixed(4)} ms`);
    console.log(`  - Parse:    ${parseTime.toFixed(4)} ms`);
    console.log(`  - Compile:  ${compileTime.toFixed(4)} ms`);
    console.log(`  - Validate: ${validateTime.toFixed(4)} ms`);
    console.log(`  - Plan:     ${planTime.toFixed(4)} ms`);
    console.log(`  - Execute:  ${executeTime.toFixed(4)} ms`);
    console.log(`  - Total:    ${totalTime.toFixed(4)} ms`);
    console.log("--------------------------------------------------------------------");

    assert.ok(lexTime >= 0);
    assert.ok(parseTime >= 0);
    assert.ok(compileTime >= 0);
    assert.ok(validateTime >= 0);
    assert.ok(planTime >= 0);
    assert.ok(executeTime >= 0);
    assert.ok(validation.valid);
    assert.ok(execution.success);
  }
  console.log("====================================================================\n");
});

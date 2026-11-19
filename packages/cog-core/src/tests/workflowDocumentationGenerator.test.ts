import assert from "node:assert/strict";
import test from "node:test";
import { compileCog, lex, parseCog } from "../index";
import { WorkflowDocumentationGenerator } from "../service/workflowDocumentationGenerator";

test("WorkflowDocumentationGenerator formats compiled workflow IR into structured Markdown/Mermaid docs", () => {
  const source = `
    define entity "sensor-a" {
      kind: observation
      level: L1
      value: "reading-x"
    }

    define entity "finding-a" {
      kind: risk
      level: L2
      value: "alert-y"
    }

    relate "sensor-a" -> "finding-a" {
      kind: "links"
      operation: "evaluate"
    }

    resolve "finding-a" to L2 {
      operation: "resolve"
      reason: "security-approved"
    }
  `;

  const ir = compileCog(parseCog(lex(source)));
  const generator = new WorkflowDocumentationGenerator();
  const docs = generator.generateMarkdown(ir, "My Test Workflow Docs");

  // Check Title
  assert.ok(docs.includes("# My Test Workflow Docs"));

  // Check Mermaid flowchart
  assert.ok(docs.includes("graph TD"));
  assert.ok(docs.includes("sensor_a"));
  assert.ok(docs.includes("finding_a"));

  // Check Entity Catalog table
  assert.ok(docs.includes("## Entity Catalog"));
  assert.ok(docs.includes("| sensor-a | observation | L1 | reading-x |"));

  // Check Relations Catalog table
  assert.ok(docs.includes("## Relations Catalog"));
  assert.ok(docs.includes("| sensor-a | links | finding-a | evaluate |"));

  // Check Resolution Rules table
  assert.ok(docs.includes("## Resolution Rules"));
  assert.ok(docs.includes("| finding-a | L2 | security-approved |"));
});

import assert from "node:assert/strict";
import test from "node:test";
import { WorkflowCatalogService } from "../service/workflowCatalogService";

test("WorkflowCatalogService lists workflows with metadata", () => {
  const service = new WorkflowCatalogService();
  const list = service.listWorkflows();

  assert.ok(list.length > 0);
  const bf = list.find((w) => w.id === "research-to-book-pipeline");
  assert.ok(bf);
  assert.ok(bf.dependencies.includes("cog:domain:research"));
});

test("WorkflowCatalogService retrieves details for specific workflow", () => {
  const service = new WorkflowCatalogService();
  const workflow = service.getWorkflow("audit-compliance");

  assert.ok(workflow);
  assert.ok(workflow.adapterRequirements.includes("decisionAdapter"));
});

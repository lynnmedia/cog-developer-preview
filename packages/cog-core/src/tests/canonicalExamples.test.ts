import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { compileCog, executeCog, lex, parseCog, planCog, validateCog, type CoreIR } from "../index";
import { momAdapter } from "../../../cog-adapter-mom/src/momAdapter";
import { decisionAdapter } from "../../../cog-adapter-decision/src/decisionAdapter";

const exampleRoot = path.join(
  process.cwd().endsWith(path.join("packages", "cog-core"))
    ? process.cwd()
    : path.join(process.cwd(), "packages", "cog-core"),
  "examples",
);

const baseContext = {
  runId: "canonical-example-test",
  mode: "batch" as const,
  startedAt: new Date(0).toISOString(),
};

async function findFileRecursively(dir: string, fileName: string): Promise<string | null> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = await findFileRecursively(fullPath, fileName);
      if (found) return found;
    } else if (entry.isFile() && entry.name === fileName) {
      return fullPath;
    }
  }
  return null;
}

async function loadExample(fileName: string): Promise<CoreIR> {
  const filePath = await findFileRecursively(exampleRoot, fileName);
  if (!filePath) {
    throw new Error(`Example file not found: ${fileName}`);
  }
  const source = await readFile(filePath, "utf8");
  return compileCog(parseCog(lex(source)));
}

test("canonical observation example validates and emits observed attributes", async () => {
  const ir = await loadExample("canonical-observation.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(ir.entities.length, 1);
  assert.deepEqual(ir.entities[0], {
    id: "entity-1",
    name: "observed-signal",
    entityKind: "observation",
    level: "L1",
    attributes: {
      kind: "observation",
      level: "L1",
      operation: "observe",
      attribute: "ambient-light",
      value: "present",
      confidence: 1,
    },
  });
  assert.equal(result.emissions.length, 1);
  assert.equal(result.emissions[0]?.target, "observed-signal");
  assert.equal(result.emissions[0]?.kind, "observation");
  assert.deepEqual(result.emissions[0]?.payload.attributes, {
    target: "observed-signal",
    kind: "observation",
  });
});

test("canonical identification example validates deterministic signature identity", async () => {
  const first = await loadExample("canonical-identification.cog");
  const second = await loadExample("canonical-identification.cog");
  const validation = await validateCog(first, { context: baseContext });
  const result = await executeCog(first, baseContext);

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(first.entities.length, 1);
  assert.equal(first.entities[0]?.name, "identity-candidate");
  assert.equal(first.entities[0]?.entityKind, "identity-signature");
  assert.equal(first.entities[0]?.attributes.operation, "identify");
  assert.equal(first.entities[0]?.attributes.signature, "kind:observation|source:scanner-1|value:present");
  assert.equal(first.entities[0]?.attributes.identity, "identity:scanner-1:present");
  assert.deepEqual(first.entities[0]?.attributes, second.entities[0]?.attributes);
  assert.equal(result.emissions[0]?.kind, "identity");
  assert.equal(result.emissions[0]?.payload.targetRef, "identity-candidate");
});

test("canonical comparison example validates structural difference relation", async () => {
  const ir = await loadExample("canonical-comparison.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.deepEqual(
    ir.entities.map((entity) => entity.name),
    ["baseline-signal", "current-signal"],
  );
  assert.equal(ir.relations.length, 1);
  assert.equal(ir.relations[0]?.relationKind, "differs-from");
  assert.deepEqual(ir.relations[0]?.attributes, {
    kind: "differs-from",
    operation: "compare",
    field: "value",
    before: "present",
    after: "absent",
  });
  assert.deepEqual(result.emissions[0]?.payload.relations, [
    {
      id: "relation-1",
      sourceRef: "current-signal",
      targetRef: "baseline-signal",
      relationKind: "differs-from",
      mappedRelationKind: undefined,
      attributes: {
        kind: "differs-from",
        operation: "compare",
        field: "value",
        before: "present",
        after: "absent",
      },
    },
  ]);
});

test("canonical classification example preserves attributes across kind reassignment", async () => {
  const ir = await loadExample("canonical-classification.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);
  const source = ir.entities.find((entity) => entity.name === "raw-signal");
  const classified = ir.entities.find((entity) => entity.name === "classified-signal");
  const emittedAttributes = result.emissions[0]?.payload.attributes as
    | Record<string, unknown>
    | undefined;

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(source?.entityKind, "observation");
  assert.equal(classified?.entityKind, "incident");
  assert.equal(source?.attributes.source, classified?.attributes.source);
  assert.equal(source?.attributes.value, classified?.attributes.value);
  assert.equal(classified?.attributes.operation, "classify");
  assert.equal(ir.relations[0]?.relationKind, "classified-as");
  assert.equal(result.emissions[0]?.target, "classified-signal");
  assert.equal(emittedAttributes?.["preserved-source"], "raw-signal");
});

test("canonical relation example constructs a deterministic graph relation", async () => {
  const ir = await loadExample("canonical-relation.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.deepEqual(
    ir.entities.map((entity) => entity.name),
    ["sensor", "reading"],
  );
  assert.equal(ir.relations.length, 1);
  assert.equal(ir.relations[0]?.relationKind, "produces");
  assert.equal(ir.relations[0]?.sourceEntityId, "entity-1");
  assert.equal(ir.relations[0]?.targetEntityId, "entity-2");
  assert.deepEqual(ir.graph.edges, [
    { from: "relation-1", to: "entity-1", kind: "references" },
    { from: "relation-1", to: "entity-2", kind: "references" },
    { from: "emit-1", to: "entity-1", kind: "references" },
  ]);
  assert.equal(
    (result.emissions[0]?.payload.relations as Array<{ relationKind: string }>)[0]?.relationKind,
    "produces",
  );
});

test("canonical projection example emits a reduced view", async () => {
  const ir = await loadExample("canonical-projection.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(ir.views.length, 1);
  assert.equal(ir.views[0]?.targetRef, "signal-record");
  assert.equal(ir.views[0]?.viewKind, "reduced");
  assert.deepEqual(ir.views[0]?.attributes.include, ["source", "value"]);
  assert.deepEqual(ir.views[0]?.attributes.exclude, ["raw"]);
  assert.deepEqual(result.emissions[0]?.payload.views, [
    {
      id: "view-1",
      targetRef: "signal-record",
      viewKind: "reduced",
      mappedViewKind: undefined,
      alias: "reduced",
    },
  ]);
});

test("canonical resolution example validates level and execution output", async () => {
  const ir = await loadExample("canonical-resolution.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(ir.resolutions.length, 1);
  assert.equal(ir.resolutions[0]?.targetRef, "candidate-decision");
  assert.equal(ir.resolutions[0]?.value, "L3");
  assert.deepEqual(
    result.trace.steps.map((step) => step.phase),
    ["bind", "bind", "validate", "emit"],
  );
  assert.equal(result.emissions[0]?.target, "candidate-decision");
  assert.equal(result.emissions[0]?.kind, "resolution");
});

test("canonical constraint example validates an explicit target", async () => {
  const ir = await loadExample("canonical-constraint.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(ir.constraints.length, 1);
  assert.equal(ir.constraints[0]?.targetRef, "candidate-record");
  assert.equal(ir.constraints[0]?.enforcement, "ADVISORY");
  assert.deepEqual(ir.constraints[0]?.attributes, {
    target: "candidate-record",
    operation: "constrain",
    rule: "confidence-at-least",
    threshold: 0.8,
  });
  assert.deepEqual(
    result.trace.steps.map((step) => step.phase),
    ["bind", "bind", "validate", "emit"],
  );
});

test("canonical transformation example records before and after state", async () => {
  const ir = await loadExample("canonical-transformation.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);
  const before = ir.entities.find((entity) => entity.name === "raw-record");
  const after = ir.entities.find((entity) => entity.name === "normalized-record");

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(before?.attributes.value, "  Present  ");
  assert.equal(after?.attributes.value, "present");
  assert.equal(ir.transformations.length, 1);
  assert.equal(ir.transformations[0]?.targetRef, "raw-record");
  assert.equal(ir.transformations[0]?.transformRef, "normalize-value");
  assert.equal(ir.relations[0]?.relationKind, "transforms-to");
  assert.ok(result.trace.steps.some((step) => step.phase === "transform"));
  assert.equal(result.emissions[0]?.target, "normalized-record");
});

test("canonical emission example carries payload attributes and trace", async () => {
  const ir = await loadExample("canonical-emission.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);
  const emittedAttributes = result.emissions[0]?.payload.attributes as
    | Record<string, unknown>
    | undefined;

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(result.emissions.length, 1);
  assert.equal(result.emissions[0]?.target, "emission-record");
  assert.equal(result.emissions[0]?.kind, "digest");
  assert.equal(emittedAttributes?.payload, "canonical-emission");
  assert.equal(emittedAttributes?.trace, "required");
  assert.deepEqual(
    result.trace.steps.map((step) => step.phase),
    ["bind", "validate", "emit"],
  );
});

test("canonical observe-to-resolve pipeline validates reasoning chain", async () => {
  const ir = await loadExample("canonical-observe-to-resolve-pipeline.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.deepEqual(
    ir.entities.map((entity) => entity.name),
    ["observed-state", "expected-state"],
  );
  assert.equal(ir.relations[0]?.relationKind, "differs-from");
  assert.equal(ir.constraints[0]?.attributes.operation, "evaluate");
  assert.equal(ir.resolutions[0]?.value, "L2");
  assert.equal(result.emissions[0]?.kind, "observe-to-resolve");
  assert.deepEqual(
    result.trace.steps.map((step) => step.phase),
    ["bind", "bind", "bind", "bind", "bind", "validate", "emit"],
  );
});

test("canonical classify-and-relate pipeline emits classified relation graph", async () => {
  const ir = await loadExample("canonical-classify-and-relate.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);
  const classified = ir.entities.find((entity) => entity.name === "classified-event");
  const relationPayload = result.emissions[0]?.payload.relations as
    | Array<{ relationKind: string; sourceRef: string; targetRef: string }>
    | undefined;

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(classified?.entityKind, "event");
  assert.equal(classified?.attributes.operation, "classify");
  assert.deepEqual(
    ir.relations.map((relation) => relation.relationKind),
    ["classified-as", "causes"],
  );
  assert.deepEqual(relationPayload?.map((relation) => relation.relationKind), [
    "classified-as",
    "causes",
  ]);
});

test("canonical constraint-evaluation pipeline resolves governed observation", async () => {
  const ir = await loadExample("canonical-constraint-evaluation.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(ir.entities[0]?.name, "measured-signal");
  assert.equal(ir.constraints.length, 1);
  assert.equal(ir.constraints[0]?.targetRef, "measured-signal");
  assert.equal(ir.constraints[0]?.attributes.operation, "evaluate");
  assert.equal(ir.constraints[0]?.attributes.rule, "confidence-at-least");
  assert.equal(ir.resolutions[0]?.value, "L2");
  assert.equal(result.emissions.length, 0);
  assert.deepEqual(
    result.trace.steps.map((step) => step.phase),
    ["bind", "bind", "bind", "validate"],
  );
});

test("canonical transformation pipeline emits transformed comparison", async () => {
  const ir = await loadExample("canonical-transformation-pipeline.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);
  const relationPayload = result.emissions[0]?.payload.relations as
    | Array<{ relationKind: string }>
    | undefined;

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(ir.transformations[0]?.targetRef, "raw-observation");
  assert.equal(ir.transformations[0]?.transformRef, "normalize-value");
  assert.deepEqual(
    ir.relations.map((relation) => relation.relationKind),
    ["transforms-to", "differs-from"],
  );
  assert.deepEqual(relationPayload?.map((relation) => relation.relationKind), [
    "transforms-to",
    "differs-from",
  ]);
  assert.ok(result.trace.steps.some((step) => step.phase === "transform"));
  assert.equal(result.emissions[0]?.target, "normalized-observation");
});

test("canonical dependency graph example plans deterministic dependencies", async () => {
  const ir = await loadExample("canonical-dependency-graph.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const plan = await planCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);
  const byId = Object.fromEntries(plan.steps.map((step) => [step.id, step]));

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.deepEqual(
    plan.steps.map((step) => step.phase),
    ["bind", "bind", "bind", "bind", "bind", "transform", "validate", "emit"],
  );
  assert.deepEqual(byId["step-3"]?.dependsOn, ["step-1", "step-2"]);
  assert.deepEqual(byId["step-4"]?.dependsOn, ["step-2"]);
  assert.deepEqual(byId["step-5"]?.dependsOn, ["step-2"]);
  assert.deepEqual(byId["step-6"]?.dependsOn, ["step-2"]);
  assert.deepEqual(byId["step-8"]?.dependsOn, [
    "step-2",
    "step-3",
    "step-4",
    "step-5",
    "step-6",
    "step-7",
  ]);
  assert.deepEqual(result.trace.steps.map((step) => step.phase), plan.steps.map((step) => step.phase));
});

test("canonical multi-relation graph example maps traversable relations", async () => {
  const ir = await loadExample("canonical-multi-relation-graph.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);
  const relationPayload = result.emissions[0]?.payload.relations as
    | Array<{ relationKind: string; sourceRef: string; targetRef: string }>
    | undefined;

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.deepEqual(
    ir.relations.map((relation) => relation.relationKind),
    ["supports", "blocks", "informs"],
  );
  assert.deepEqual(relationPayload?.map((relation) => relation.relationKind), [
    "supports",
    "blocks",
    "informs",
  ]);
  assert.deepEqual(relationPayload?.map((relation) => `${relation.sourceRef}->${relation.targetRef}`), [
    "node-a->node-b",
    "node-b->node-c",
    "node-c->node-b",
  ]);
});

test("canonical perspective graph example exposes views and adapter mappings", async () => {
  const ir = await loadExample("canonical-perspective-graph.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const neutralResult = await executeCog(ir, baseContext);
  const mappedResult = await executeCog(ir, baseContext, momAdapter);
  const neutralViews = neutralResult.emissions[0]?.payload.views as
    | Array<{ viewKind: string; mappedViewKind?: string }>
    | undefined;
  const mappedViews = mappedResult.emissions[0]?.payload.views as
    | Array<{ viewKind: string; mappedViewKind?: string }>
    | undefined;

  assert.equal(validation.valid, true);
  assert.equal(neutralResult.success, true);
  assert.equal(mappedResult.success, true);
  assert.deepEqual(
    ir.views.map((view) => view.viewKind),
    ["operator", "summary"],
  );
  assert.deepEqual(neutralViews?.map((view) => view.mappedViewKind), [undefined, undefined]);
  assert.deepEqual(mappedViews?.map((view) => view.mappedViewKind), [
    "mom:operator",
    "mom:summary",
  ]);
});

test("canonical multi-entity resolution example orders several resolutions", async () => {
  const ir = await loadExample("canonical-multi-entity-resolution.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const plan = await planCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.deepEqual(
    ir.resolutions.map((resolution) => `${resolution.targetRef}:${resolution.value}`),
    ["entity-a:L2", "entity-b:L3", "entity-c:L4"],
  );
  assert.deepEqual(
    plan.steps.map((step) => step.phase),
    ["bind", "bind", "bind", "bind", "bind", "bind", "bind", "bind", "validate", "emit"],
  );
  assert.equal(result.emissions[0]?.target, "entity-c");
  assert.equal((result.emissions[0]?.payload.relations as unknown[]).length, 1);
});

test("canonical no-adapter reference keeps same-source mappings neutral", async () => {
  const ir = await loadExample("canonical-adapter-reference.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);
  const views = result.emissions[0]?.payload.views as
    | Array<{ mappedViewKind?: string }>
    | undefined;
  const relations = result.emissions[0]?.payload.relations as
    | Array<{ mappedRelationKind?: string }>
    | undefined;

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(result.adapterId, undefined);
  assert.equal(result.emissions[0]?.target, "adapter-signal");
  assert.equal(result.emissions[0]?.payload.targetLevel, "L3");
  assert.equal(result.emissions[0]?.payload.mappedLevel, undefined);
  assert.deepEqual(views?.map((view) => view.mappedViewKind), [undefined]);
  assert.deepEqual(relations?.map((relation) => relation.mappedRelationKind), [undefined]);
});

test("canonical MoM adapter example maps same-source levels relations and views", async () => {
  const ir = await loadExample("canonical-adapter-reference.cog");
  const validation = await validateCog(ir, { context: baseContext, adapter: momAdapter });
  const plan = await planCog(ir, { context: baseContext, adapter: momAdapter });
  const result = await executeCog(ir, baseContext, momAdapter);
  const views = result.emissions[0]?.payload.views as
    | Array<{ mappedViewKind?: string }>
    | undefined;
  const relations = result.emissions[0]?.payload.relations as
    | Array<{ mappedRelationKind?: string }>
    | undefined;

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(result.adapterId, "mom");
  assert.equal(plan.adapterId, "mom");
  assert.ok(plan.steps.some((step) => step.id === "step-mom-verify"));
  assert.equal(result.emissions[0]?.target, "mom:adapter-reference");
  assert.equal(result.emissions[0]?.payload.targetLevel, "L3");
  assert.equal(result.emissions[0]?.payload.mappedLevel, "R3");
  assert.deepEqual(views?.map((view) => view.mappedViewKind), ["mom:operator"]);
  assert.deepEqual(relations?.map((relation) => relation.mappedRelationKind), ["mom:recommends"]);
});

test("canonical Decision adapter example maps same-source levels relations and views", async () => {
  const ir = await loadExample("canonical-adapter-reference.cog");
  const validation = await validateCog(ir, { context: baseContext, adapter: decisionAdapter });
  const plan = await planCog(ir, { context: baseContext, adapter: decisionAdapter });
  const result = await executeCog(ir, baseContext, decisionAdapter);
  const views = result.emissions[0]?.payload.views as
    | Array<{ mappedViewKind?: string }>
    | undefined;
  const relations = result.emissions[0]?.payload.relations as
    | Array<{ mappedRelationKind?: string }>
    | undefined;

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(result.adapterId, "decision");
  assert.equal(plan.adapterId, "decision");
  assert.ok(plan.steps.some((step) => step.id === "step-decision-verify"));
  assert.equal(result.emissions[0]?.target, "decision:adapter-reference");
  assert.equal(result.emissions[0]?.payload.targetLevel, "L3");
  assert.equal(result.emissions[0]?.payload.mappedLevel, undefined);
  assert.deepEqual(views?.map((view) => view.mappedViewKind), ["decision:operator"]);
  assert.deepEqual(relations?.map((relation) => relation.mappedRelationKind), ["decision:recommends"]);
});

test("canonical adapter comparison capstone runs same program through no adapter, momAdapter, and decisionAdapter", async () => {
  const ir = await loadExample("canonical-adapter-reference.cog");

  // Execute without adapter
  const validationNeutral = await validateCog(ir, { context: baseContext });
  const planNeutral = await planCog(ir, { context: baseContext });
  const resultNeutral = await executeCog(ir, baseContext);

  // Execute with MoM adapter
  const validationMom = await validateCog(ir, { context: baseContext, adapter: momAdapter });
  const planMom = await planCog(ir, { context: baseContext, adapter: momAdapter });
  const resultMom = await executeCog(ir, baseContext, momAdapter);

  // Execute with Decision adapter
  const validationDecision = await validateCog(ir, { context: baseContext, adapter: decisionAdapter });
  const planDecision = await planCog(ir, { context: baseContext, adapter: decisionAdapter });
  const resultDecision = await executeCog(ir, baseContext, decisionAdapter);

  // 1. Identical core execution / validation validity
  assert.equal(validationNeutral.valid, true);
  assert.equal(validationMom.valid, true);
  assert.equal(validationDecision.valid, true);

  assert.equal(resultNeutral.success, true);
  assert.equal(resultMom.success, true);
  assert.equal(resultDecision.success, true);

  // 2. Differing adapter projections
  // - No Adapter
  assert.equal(resultNeutral.adapterId, undefined);
  assert.equal(resultNeutral.emissions[0]?.target, "adapter-signal");
  assert.equal(resultNeutral.emissions[0]?.payload.mappedLevel, undefined);
  assert.deepEqual(
    (resultNeutral.emissions[0]?.payload.views as any[]).map(v => v.mappedViewKind),
    [undefined]
  );
  assert.deepEqual(
    (resultNeutral.emissions[0]?.payload.relations as any[]).map(r => r.mappedRelationKind),
    [undefined]
  );

  // - MoM Adapter
  assert.equal(resultMom.adapterId, "mom");
  assert.equal(resultMom.emissions[0]?.target, "mom:adapter-reference");
  assert.equal(resultMom.emissions[0]?.payload.mappedLevel, "R3");
  assert.deepEqual(
    (resultMom.emissions[0]?.payload.views as any[]).map(v => v.mappedViewKind),
    ["mom:operator"]
  );
  assert.deepEqual(
    (resultMom.emissions[0]?.payload.relations as any[]).map(r => r.mappedRelationKind),
    ["mom:recommends"]
  );
  assert.ok(planMom.steps.some(s => s.id === "step-mom-verify"));

  // - Decision Adapter
  assert.equal(resultDecision.adapterId, "decision");
  assert.equal(resultDecision.emissions[0]?.target, "decision:adapter-reference");
  assert.equal(resultDecision.emissions[0]?.payload.mappedLevel, undefined);
  assert.deepEqual(
    (resultDecision.emissions[0]?.payload.views as any[]).map(v => v.mappedViewKind),
    ["decision:operator"]
  );
  assert.deepEqual(
    (resultDecision.emissions[0]?.payload.relations as any[]).map(r => r.mappedRelationKind),
    ["decision:recommends"]
  );
  assert.ok(planDecision.steps.some(s => s.id === "step-decision-verify"));
});

test("canonical research synthesis example validates, plans, and executes", async () => {
  const ir = await loadExample("canonical-research-synthesis.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const plan = await planCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(ir.entities.length, 6);
  assert.equal(ir.relations.length, 6);
  assert.equal(ir.resolutions.length, 1);
  assert.equal(result.emissions.length, 1);
  assert.equal(result.emissions[0]?.target, "final-resolution");
  assert.equal(result.emissions[0]?.kind, "research-synthesis");
});

test("canonical document review example validates, plans, and executes", async () => {
  const ir = await loadExample("canonical-document-review.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const plan = await planCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(ir.entities.length, 5);
  assert.equal(ir.relations.length, 4);
  assert.equal(ir.resolutions.length, 1);
  assert.equal(result.emissions.length, 1);
  assert.equal(result.emissions[0]?.target, "explanation-summary");
  assert.equal(result.emissions[0]?.kind, "document-review");
});

test("canonical decision workflow example validates, plans, and executes", async () => {
  const ir = await loadExample("canonical-decision-workflow.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const plan = await planCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(ir.entities.length, 3);
  assert.equal(ir.relations.length, 2);
  assert.equal(ir.resolutions.length, 1);
  assert.equal(result.emissions.length, 1);
  assert.equal(result.emissions[0]?.target, "final-decision");
  assert.equal(result.emissions[0]?.kind, "decision-analysis");
});

test("canonical audit workflow example validates, plans, and executes", async () => {
  const ir = await loadExample("canonical-audit-workflow.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const plan = await planCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(ir.entities.length, 4);
  assert.equal(ir.relations.length, 4);
  assert.equal(ir.resolutions.length, 1);
  assert.equal(result.emissions.length, 1);
  assert.equal(result.emissions[0]?.target, "severity-evaluation");
  assert.equal(result.emissions[0]?.kind, "audit-report");
});

test("canonical knowledge graph example validates, plans, and executes", async () => {
  const ir = await loadExample("canonical-knowledge-graph.cog");
  const validation = await validateCog(ir, { context: baseContext });
  const plan = await planCog(ir, { context: baseContext });
  const result = await executeCog(ir, baseContext);

  assert.equal(validation.valid, true);
  assert.equal(result.success, true);
  assert.equal(ir.entities.length, 5);
  assert.equal(ir.relations.length, 6);
  assert.equal(ir.resolutions.length, 1);
  assert.equal(result.emissions.length, 1);
  assert.equal(result.emissions[0]?.target, "explanation-node");
  assert.equal(result.emissions[0]?.kind, "knowledge-graph");
});

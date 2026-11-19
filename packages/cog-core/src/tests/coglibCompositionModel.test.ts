import assert from "node:assert/strict";
import test from "node:test";
import { CognitiveRoutine, executeRoutineWithGuards } from "../coglib/routineContract";
import {
  composePipeline,
  composeBranch,
  composeMerge,
  composeGuardedTransition,
  verifyCompositionCompatibility,
} from "../coglib/compositionModel";

function createMockRoutine(
  id: string,
  name: string,
  category: any,
  tensions: string[] = [],
  confidence = 0.9,
  incompatible: string[] = [],
): CognitiveRoutine {
  return {
    metadata: {
      id,
      name,
      version: "1.0.0",
      category,
      description: `Mock routine ${name}`,
    },
    inputs: [{ name: "data", type: "any", required: true, description: "Input" }],
    outputs: [{ name: "result", type: "any", required: true, description: "Output" }],
    preconditions: [],
    postconditions: [],
    failureModes: [],
    provenanceRequirements: { requiresSourceAnchors: true, preserveLineage: true, trackTransformations: true, auditRequired: false },
    epistemicContract: { producesUncertainty: true, uncertaintyHandling: "preserve", epistemicDelta: "Transformed", preservesTensions: true },
    invariants: [],
    domainHooks: [],
    evaluationHooks: [],
    compatibility: {
      compatibleRoutines: [],
      incompatibleRoutines: incompatible,
      compositionPatterns: ["pipeline", "branch", "merge", "guarded_transition"],
      requiredKernelVersion: ">=0.1.0",
    },
    execute: (input) => ({
      status: "success",
      output: { ...input, [`processed_by_${id}`]: true },
      epistemicState: {
        confidence,
        uncertaintyBounded: true,
        tensions,
        provenanceLineage: [id],
      },
      provenance: {
        routineId: id,
        routineVersion: "1.0.0",
        lineage: [id],
        timestamp: new Date().toISOString(),
      },
    }),
  };
}

test("HDCP-COGLIB-COMPOSITION-MODEL-003: pipeline preserves provenance, epistemic state, and tensions", async () => {
  const stepA = createMockRoutine("coglib:routine:step-a", "Step A", "analysis", ["Tension A1", "Tension A2"], 0.95);
  const stepB = createMockRoutine("coglib:routine:step-b", "Step B", "synthesis", ["Tension B1"], 0.9);

  const pipeline = composePipeline(stepA, stepB);
  const result = await executeRoutineWithGuards(pipeline, { initial: "data-123" });

  assert.equal(result.status, "success");
  assert.equal(result.output.initial, "data-123");
  assert.equal(result.output["processed_by_coglib:routine:step-a"], true);
  assert.equal(result.output["processed_by_coglib:routine:step-b"], true);

  // Lineage preservation across composition
  assert.deepEqual(result.provenance.lineage, ["coglib:routine:step-a", "coglib:routine:step-b"]);

  // Epistemic confidence compounding (0.95 * 0.9 = 0.855)
  assert.equal(result.epistemicState.confidence, 0.855);

  // Tension preservation: no tension dropped
  assert.ok(result.epistemicState.tensions.includes("Tension A1"));
  assert.ok(result.epistemicState.tensions.includes("Tension A2"));
  assert.ok(result.epistemicState.tensions.includes("Tension B1"));
});

test("HDCP-COGLIB-COMPOSITION-MODEL-003: explicit failure on incompatible routine composition", () => {
  const stepA = createMockRoutine("coglib:routine:step-a", "Step A", "analysis", [], 0.9, ["coglib:routine:incompatible-b"]);
  const stepB = createMockRoutine("coglib:routine:incompatible-b", "Step B", "analysis");

  const compat = verifyCompositionCompatibility(stepA, stepB);
  assert.equal(compat.compatible, false);
  assert.ok(compat.errors.length > 0);

  assert.throws(
    () => composePipeline(stepA, stepB),
    /Incompatible routine pipeline composition/,
  );
});

test("HDCP-COGLIB-COMPOSITION-MODEL-003: branch routes deterministically and records path provenance", async () => {
  const routineFast = createMockRoutine("coglib:routine:fast", "Fast Path", "analysis");
  const routineThorough = createMockRoutine("coglib:routine:thorough", "Thorough Path", "analysis");
  const routineDefault = createMockRoutine("coglib:routine:default", "Default Path", "analysis");

  const branchRouter = composeBranch(
    [
      { branchId: "fast", predicate: (input: any) => input.mode === "fast", routine: routineFast },
      { branchId: "thorough", predicate: (input: any) => input.mode === "thorough", routine: routineThorough },
    ],
    routineDefault,
  );

  const resFast = await executeRoutineWithGuards(branchRouter, { mode: "fast" });
  assert.equal(resFast.status, "success");
  assert.ok(resFast.provenance.lineage.includes("branch:fast"));
  assert.ok(resFast.provenance.lineage.includes("coglib:routine:fast"));

  const resFallback = await executeRoutineWithGuards(branchRouter, { mode: "unknown" });
  assert.equal(resFallback.status, "success");
  assert.ok(resFallback.provenance.lineage.includes("branch:fallback"));
  assert.ok(resFallback.provenance.lineage.includes("coglib:routine:default"));
});

test("HDCP-COGLIB-COMPOSITION-MODEL-003: merge aggregates multi-branch outputs and preserves all tensions", async () => {
  const branch1 = createMockRoutine("coglib:routine:b1", "Branch 1", "analysis", ["Branch 1 Tension"], 0.88);
  const branch2 = createMockRoutine("coglib:routine:b2", "Branch 2", "analysis", ["Branch 2 Tension"], 0.92);

  const merger = composeMerge(
    [
      { id: "b1", routine: branch1 },
      { id: "b2", routine: branch2 },
    ],
    (outputs) => ({
      mergedOutput: {
        combined: true,
        b1Data: outputs.b1,
        b2Data: outputs.b2,
      },
      syntheticTensions: ["Cross-branch disagreement on metric X"],
    }),
  );

  const res = await executeRoutineWithGuards(merger, { query: "assess" });
  assert.equal(res.status, "success");
  assert.equal(res.output.combined, true);

  // Lineage contains both branches
  assert.ok(res.provenance.lineage.includes("coglib:routine:b1"));
  assert.ok(res.provenance.lineage.includes("coglib:routine:b2"));

  // Tensions from b1, b2, and synthesized tension are all preserved
  assert.ok(res.epistemicState.tensions.includes("Branch 1 Tension"));
  assert.ok(res.epistemicState.tensions.includes("Branch 2 Tension"));
  assert.ok(res.epistemicState.tensions.includes("Cross-branch disagreement on metric X"));

  // Epistemic confidence takes conservative lower bound (0.88)
  assert.equal(res.epistemicState.confidence, 0.88);
});

test("HDCP-COGLIB-COMPOSITION-MODEL-003: guarded transition halts or falls back on invariant violation", async () => {
  const source = createMockRoutine("coglib:routine:source", "Source Step", "analysis", [], 0.95);
  const target = createMockRoutine("coglib:routine:target", "Target Step", "synthesis", [], 0.9);
  const fallback = createMockRoutine("coglib:routine:fallback", "Fallback Step", "reconciliation", ["Fallback engaged"], 0.6);

  // Guard that fails if confidence < 0.99
  const guardedWithFallback = composeGuardedTransition(
    source,
    (_out, epistemic) => ({
      passed: epistemic.confidence >= 0.99,
      reason: "Confidence below 0.99 threshold",
    }),
    target,
    fallback,
  );

  const resFallback = await executeRoutineWithGuards(guardedWithFallback, { val: 1 });
  assert.equal(resFallback.status, "success");
  assert.ok(resFallback.provenance.lineage.includes("guard:fallback"));
  assert.ok(resFallback.epistemicState.tensions.some((t) => t.includes("Confidence below 0.99 threshold")));

  // Guard without fallback: emits qualified output
  const guardedWithoutFallback = composeGuardedTransition(
    source,
    (_out, epistemic) => ({
      passed: epistemic.confidence >= 0.99,
      reason: "Confidence below 0.99 threshold",
    }),
    target,
  );

  const resQualified = await executeRoutineWithGuards(guardedWithoutFallback, { val: 1 });
  assert.equal(resQualified.status, "qualified");
  assert.equal(resQualified.failure?.code, "ERR_GUARD_CHECK_FAILED");
  assert.ok(resQualified.provenance.lineage.includes("guard:halted"));
});

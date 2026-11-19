import assert from "node:assert/strict";
import test from "node:test";
import {
  createCognitiveScenario,
  executeCognitiveScenario,
  assertCogOutput,
  assertCogState,
  assertTraceContains,
  assertTransitionOccurred,
  assertTransitionNotOccurred,
  assertBlocked,
  assertBlockedBecause,
  assertInvariantPreserved,
  assertMemoryChanged,
  assertMemoryUnchanged,
  assertEvaluation,
} from "../index";

test("Representative 1: Successful Execution Scenario", async () => {
  const scenario = createCognitiveScenario({
    id: "scen-001-success",
    name: "Successful Research Synthesis Execution",
    description: "Verifies that valid research source and claim statements execute deterministically to completion",
    given: {
      source: `
        define entity "obs-1" {
          kind: "observation"
          level: L1
          value: "Telemetry confirms 20% latency reduction."
        }
        define entity "claim-1" {
          kind: "claim"
          level: L2
          value: "Indexing improves query throughput."
        }
        relate "obs-1" -> "claim-1" {
          kind: "supports"
        }
        resolve "claim-1" to L2 {
          status: "verified"
        }
        emit {
          target: "claim-1"
          kind: "synthesis_emission"
        }
      `,
    },
    expected: {
      success: true,
      emissions: [
        {
          target: "claim-1",
          kind: "synthesis_emission",
        },
      ],
      transitions: [
        {
          to: "L2",
          target: "claim-1",
          occurred: true,
        },
      ],
    },
  });

  const result = await executeCognitiveScenario(scenario);

  // Direct assertion vocabulary verification
  assertCogState(result, { success: true });
  assertCogOutput(result, { target: "claim-1", kind: "synthesis_emission" });
  assertTransitionOccurred(result, "L2", "claim-1");
  assertTransitionNotOccurred(result, "L5", "claim-1");
});

test("Representative 2: Validation Rejection Scenario", async () => {
  const scenario = createCognitiveScenario({
    id: "scen-002-rejection",
    name: "Validation Rejection for Undefined Relation Targets",
    description: "Asserts that referencing undefined entities in a relation is rejected at validation",
    given: {
      source: `
        define entity "e1" {
          kind: "node"
          level: L1
          value: "Defined entity."
        }
        relate "e1" -> "undefined-target-e2" {
          kind: "references"
        }
        emit {
          target: "e1"
          kind: "test_emit"
        }
      `,
    },
    expected: {
      success: false,
      blocked: true,
      blockedReason: /undefined-target-e2|UNDEFINED_ENTITY|does not exist/i,
    },
  });

  const result = await executeCognitiveScenario(scenario);

  assertBlocked(result);
  assertBlockedBecause(result, /undefined-target-e2|UNDEFINED_ENTITY/i);
  assertCogState(result, { success: false });
});

test("Representative 3: Blocked Execution Scenario", async () => {
  const scenario = createCognitiveScenario({
    id: "scen-003-blocked",
    name: "Blocked Execution on Contradictory Invariants",
    description: "Verifies that semantic validation failures immediately block execution and mark plan steps as FAILED or SKIPPED",
    given: {
      source: `
        relate "missing-src" -> "missing-tgt" {
          kind: "invalid_link"
        }
        emit {
          target: "missing-tgt"
          kind: "blocked_emit"
        }
      `,
    },
  });

  const result = await executeCognitiveScenario(scenario);

  assertBlocked(result);
  assertBlockedBecause(result, "missing-src");
  assertTraceContains(result, { status: "FAILED" });
  assert.equal(result.emissions.length, 0);
});

test("Representative 4: State Invariant Preservation Scenario", async () => {
  const scenario = createCognitiveScenario({
    id: "scen-004-invariant",
    name: "State Invariant Preservation Across Execution",
    description: "Verifies that deterministic execution preserves execution trace integrity and structure invariants",
    given: {
      source: `
        define entity "task-1" {
          kind: "task"
          level: L1
          value: "Initial backlog task."
        }
        resolve "task-1" to L2 {
          status: "in_progress"
        }
        emit {
          target: "task-1"
          kind: "progress_update"
        }
      `,
    },
    expected: {
      success: true,
      invariants: [
        {
          name: "trace-non-empty",
          check: (res) => res.trace.steps.length > 0,
        },
        {
          name: "bindings-consistent",
          check: (res) => Object.keys(res.bindings).length >= 1,
        },
      ],
    },
  });

  const result = await executeCognitiveScenario(scenario);

  assertInvariantPreserved(result, "determinism");
  assertInvariantPreserved(result, (res) => res.trace.steps.every((s) => s.startedAt && s.completedAt));
  assertMemoryChanged(result, "task-1");
  assertMemoryUnchanged(result, "non_existent_key", { a: 1 }, { a: 1 });
});

test("Representative 5: Trace & Transition Assertion Scenario", async () => {
  const scenario = createCognitiveScenario({
    id: "scen-005-trace",
    name: "Multi-Step Trace and Level Transition Inspection",
    description: "Inspects phase-by-phase trace steps and validates resolution transitions",
    given: {
      source: `
        define entity "artifact-alpha" {
          kind: "document"
          level: L1
          value: "Draft specification document."
        }
        transform {
          target: "artifact-alpha"
          to: "audited-alpha"
          operation: "deep_audit"
        }
        resolve "artifact-alpha" to L3 {
          operation: "deep_audit"
          status: "ratified"
        }
        emit {
          target: "artifact-alpha"
          kind: "ratification_certificate"
        }
      `,
    },
    expected: {
      success: true,
      traceSteps: [
        { phase: "bind" },
        { phase: "transform" },
        { phase: "emit" },
      ],
      transitions: [
        { to: "L3", target: "artifact-alpha", occurred: true },
        { to: "L5", target: "artifact-alpha", occurred: false },
      ],
    },
  });

  const result = await executeCognitiveScenario(scenario);

  assertTraceContains(result, { phase: "bind" });
  assertTraceContains(result, { phase: "transform" });
  assertTraceContains(result, { phase: "emit" });
  assertTransitionOccurred(result, "L3", "artifact-alpha");
  assertTransitionNotOccurred(result, "L5", "artifact-alpha");

  assertEvaluation(result, (res) => {
    return res.emissions.some((e) => e.kind === "ratification_certificate");
  });
});

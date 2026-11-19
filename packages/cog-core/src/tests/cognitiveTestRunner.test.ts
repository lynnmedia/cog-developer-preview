import assert from "node:assert/strict";
import test, { describe } from "node:test";
import {
  defineCognitiveSuite,
  runCognitiveScenario,
  runCognitiveSuite,
  cognitiveTest,
  registerCognitiveSuite,
  createCognitiveScenario,
  assertCogOutput,
  assertBlocked,
  assertTraceContains,
} from "../index";

test("Runner Test 1: All-pass Suite Execution", async () => {
  const suite = defineCognitiveSuite({
    id: "suite-all-pass",
    name: "All-Pass Research Suite",
    scenarios: [
      {
        id: "scen-1",
        name: "Observation Ingestion",
        given: {
          source: `
            define entity "obs-a" {
              kind: "observation"
              level: L1
              value: "Observation A."
            }
            emit {
              target: "obs-a"
              kind: "ingestion_emit"
            }
          `,
        },
        expected: {
          success: true,
          emissions: [{ kind: "ingestion_emit", target: "obs-a" }],
        },
      },
      {
        id: "scen-2",
        name: "Claim Extraction",
        given: {
          source: `
            define entity "obs-b" {
              kind: "observation"
              level: L1
              value: "Observation B."
            }
            define entity "claim-b" {
              kind: "claim"
              level: L2
              value: "Claim B."
            }
            relate "obs-b" -> "claim-b" {
              kind: "supports"
            }
            resolve "claim-b" to L2 {
              status: "verified"
            }
            emit {
              target: "claim-b"
              kind: "claim_emit"
            }
          `,
        },
        expected: {
          success: true,
          emissions: [{ kind: "claim_emit", target: "claim-b" }],
        },
      },
    ],
  });

  const result = await runCognitiveSuite(suite);

  assert.equal(result.suiteId, "suite-all-pass");
  assert.equal(result.passed, true);
  assert.equal(result.totalCount, 2);
  assert.equal(result.passedCount, 2);
  assert.equal(result.failedCount, 0);
  assert.equal(result.scenarios.length, 2);
  assert.ok(result.durationMs >= 0);
  assert.equal(result.scenarios[0].passed, true);
  assert.equal(result.scenarios[1].passed, true);
});

test("Runner Test 2: Mixed Pass/Fail Suite Execution without Masking", async () => {
  const mixedSuite = defineCognitiveSuite({
    id: "suite-mixed",
    name: "Mixed Pass/Fail Suite",
    scenarios: [
      {
        id: "scen-pass",
        name: "Passing Scenario",
        given: {
          source: `
            define entity "item-1" {
              kind: "item"
              level: L1
            }
            emit {
              target: "item-1"
              kind: "item_emit"
            }
          `,
        },
        expected: {
          success: true,
          emissions: [{ kind: "item_emit" }],
        },
      },
      {
        id: "scen-fail",
        name: "Intentionally Failing Expectation",
        given: {
          source: `
            define entity "item-2" {
              kind: "item"
              level: L1
            }
            emit {
              target: "item-2"
              kind: "item_emit"
            }
          `,
        },
        expected: {
          // Expected emission kind is different from actual
          emissions: [{ kind: "non_existent_emission_kind" }],
        },
      },
    ],
  });

  const result = await runCognitiveSuite(mixedSuite, { throwOnFailure: false });

  assert.equal(result.passed, false);
  assert.equal(result.totalCount, 2);
  assert.equal(result.passedCount, 1);
  assert.equal(result.failedCount, 1);
  assert.equal(result.scenarios[0].passed, true);
  assert.equal(result.scenarios[1].passed, false);
  assert.ok(result.scenarios[1].failures.length > 0);
  assert.ok(result.scenarios[1].failures[0].message.includes("Emission [0] kind mismatch"));
});

test("Runner Test 3: Shared Defaults and Scenario Overrides", async () => {
  const suiteWithDefaults = defineCognitiveSuite({
    id: "suite-defaults",
    name: "Suite with Shared Defaults",
    defaults: {
      context: {
        mode: "batch",
        environment: { SUITE_ENV: "production" },
      },
      inputs: {
        globalThreshold: 0.85,
      },
    },
    scenarios: [
      {
        id: "scen-inherit",
        name: "Inheriting Defaults",
        given: {
          source: `
            define entity "n1" {
              kind: "node"
              level: L1
            }
            emit {
              target: "n1"
              kind: "emit_1"
            }
          `,
        },
        expected: {
          success: true,
        },
      },
      {
        id: "scen-override",
        name: "Overriding Defaults",
        given: {
          source: `
            define entity "n2" {
              kind: "node"
              level: L1
            }
            emit {
              target: "n2"
              kind: "emit_2"
            }
          `,
          context: {
            mode: "hybrid",
          },
        },
        expected: {
          success: true,
        },
      },
    ],
  });

  const resInherit = await runCognitiveScenario(suiteWithDefaults.scenarios[0], {
    defaults: suiteWithDefaults.defaults,
  });
  const resOverride = await runCognitiveScenario(suiteWithDefaults.scenarios[1], {
    defaults: suiteWithDefaults.defaults,
  });

  assert.equal(resInherit.passed, true);
  assert.equal(resInherit.executionResult?.trace.runId, "scen-inherit");

  assert.equal(resOverride.passed, true);
  assert.equal(resOverride.executionResult?.trace.runId, "scen-override");
});

test("Runner Test 4: Blocked Scenario through Runner", async () => {
  const blockedScenario = createCognitiveScenario({
    id: "scen-blocked-runner",
    name: "Blocked Scenario Execution",
    given: {
      source: `
        relate "orphan-1" -> "orphan-2" {
          kind: "invalid"
        }
        emit {
          target: "orphan-2"
          kind: "blocked"
        }
      `,
    },
    expected: {
      success: false,
      blocked: true,
      blockedReason: "orphan-1",
    },
  });

  const scenarioResult = await runCognitiveScenario(blockedScenario);

  assert.equal(scenarioResult.passed, true); // The scenario expectation (blocked) was satisfied
  assert.ok(scenarioResult.executionResult);
  assertBlocked(scenarioResult.executionResult);
});

test("Runner Test 5: Invariant and Trace Scenario through Runner", async () => {
  const invariantScenario = createCognitiveScenario({
    id: "scen-invariant-runner",
    name: "Invariant and Trace Step Check",
    given: {
      source: `
        define entity "state-item" {
          kind: "state"
          level: L1
          value: "init"
        }
        resolve "state-item" to L2 {
          status: "updated"
        }
        emit {
          target: "state-item"
          kind: "state_snapshot"
        }
      `,
    },
    expected: {
      success: true,
      traceSteps: [{ phase: "bind" }, { phase: "emit" }],
      invariants: [
        {
          name: "trace-intact",
          check: (res) => res.trace.steps.length >= 2,
        },
      ],
    },
  });

  const result = await runCognitiveScenario(invariantScenario);

  assert.equal(result.passed, true);
  assert.ok(result.executionResult);
  assertTraceContains(result.executionResult, { phase: "emit" });
  assertCogOutput(result.executionResult, { kind: "state_snapshot" });
});

describe("Runner Test 6: Native Node Test Registration Helpers", () => {
  const scenario = createCognitiveScenario({
    id: "node-test-1",
    name: "Direct cognitiveTest() Integration",
    given: {
      source: `
        define entity "node-ent" {
          kind: "entity"
          level: L1
        }
        emit {
          target: "node-ent"
          kind: "direct_emit"
        }
      `,
    },
    expected: {
      success: true,
      emissions: [{ kind: "direct_emit" }],
    },
  });

  // Call cognitiveTest helper directly
  cognitiveTest(scenario);

  const suite = defineCognitiveSuite({
    id: "registered-suite",
    name: "Register Suite Integration",
    scenarios: [
      {
        id: "reg-scen-1",
        name: "Suite Scenario One",
        given: {
          source: `
            define entity "s1" { kind: "k1" level: L1 }
            emit { target: "s1" kind: "e1" }
          `,
        },
        expected: { success: true },
      },
    ],
  });

  // Call registerCognitiveSuite helper directly
  registerCognitiveSuite(suite);
});

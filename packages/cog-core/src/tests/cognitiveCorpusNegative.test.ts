import assert from "node:assert/strict";
import test, { describe } from "node:test";
import {
  defineCognitiveSuite,
  runCognitiveSuite,
  runCognitiveScenario,
  assertBlocked,
  assertBlockedBecause,
} from "../index";

describe("Cognitive Corpus: Negative Scenarios (Class 2)", () => {
  const negativeSuite = defineCognitiveSuite({
    id: "corpus-negative-suite",
    name: "Corpus Class 2: Negative Malformed / Invalid Program Rejection Suite",
    scenarios: [
      {
        id: "NEG-01",
        name: "Undefined Entity in Relation Source",
        description: "Rejects relations referencing undeclared source entities",
        given: {
          source: `
            define entity "valid-target" {
              kind: "node"
              level: L1
            }
            relate "non-existent-source" -> "valid-target" {
              kind: "supports"
            }
            emit {
              target: "valid-target"
              kind: "out"
            }
          `,
        },
        expected: {
          success: false,
          blocked: true,
          blockedReason: /non-existent-source/i,
        },
      },
      {
        id: "NEG-02",
        name: "Undefined Entity in Relation Target",
        description: "Rejects relations referencing undeclared target entities",
        given: {
          source: `
            define entity "valid-source" {
              kind: "node"
              level: L1
            }
            relate "valid-source" -> "non-existent-target" {
              kind: "supports"
            }
            emit {
              target: "valid-source"
              kind: "out"
            }
          `,
        },
        expected: {
          success: false,
          blocked: true,
          blockedReason: /non-existent-target/i,
        },
      },
      {
        id: "NEG-03",
        name: "View Referencing Non-Existent Target",
        description: "Rejects view projections targeting undeclared entities",
        given: {
          source: `
            view "missing-entity" as analyst {
              perspective: "analyst"
            }
            emit {
              target: "missing-entity"
              kind: "out"
            }
          `,
        },
        expected: {
          success: false,
          blocked: true,
          blockedReason: /missing-entity/i,
        },
      },
      {
        id: "NEG-04",
        name: "Resolution on Undeclared Target",
        description: "Rejects resolution attempts targeting entities not defined in program or context",
        given: {
          source: `
            resolve "undeclared-entity" to L2 {
              status: "verified"
            }
            emit {
              target: "undeclared-entity"
              kind: "out"
            }
          `,
        },
        expected: {
          success: false,
          blocked: true,
          blockedReason: /undeclared-entity/i,
        },
      },
      {
        id: "NEG-05",
        name: "Constraint with Missing Target",
        description: "Rejects constraints declared with empty or undeclared target references",
        given: {
          source: `
            constrain {
              target: "ghost-target"
              mode: STRICT
            }
            emit {
              target: "ghost-target"
              kind: "out"
            }
          `,
        },
        expected: {
          success: false,
          blocked: true,
          blockedReason: /ghost-target/i,
        },
      },
      {
        id: "NEG-06",
        name: "Transform Referencing Undeclared Target",
        description: "Rejects transformations that target undeclared entities",
        given: {
          source: `
            transform {
              target: "missing-transform-source"
              to: "transformed-target"
              operation: "synthesize"
            }
            emit {
              target: "missing-transform-source"
              kind: "out"
            }
          `,
        },
        expected: {
          success: false,
          blocked: true,
          blockedReason: /missing-transform-source/i,
        },
      },
    ],
  });

  test("Runs entire Negative Corpus Suite via runCognitiveSuite", async () => {
    const result = await runCognitiveSuite(negativeSuite);
    assert.equal(result.passed, true);
    assert.equal(result.totalCount, 6);
    assert.equal(result.passedCount, 6);
    assert.equal(result.failedCount, 0);
  });
});

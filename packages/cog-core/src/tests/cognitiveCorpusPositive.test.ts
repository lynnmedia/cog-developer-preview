import assert from "node:assert/strict";
import test, { describe } from "node:test";
import {
  defineCognitiveSuite,
  runCognitiveSuite,
  runCognitiveScenario,
  createCognitiveScenario,
  assertCogOutput,
  assertCogState,
  assertTraceContains,
  assertTransitionOccurred,
} from "../index";
import { momAdapter } from "../../../cog-adapter-mom/dist/index";
import { decisionAdapter } from "../../../cog-adapter-decision/dist/index";

describe("Cognitive Corpus: Positive Scenarios (Class 1)", () => {
  const positiveSuite = defineCognitiveSuite({
    id: "corpus-positive-suite",
    name: "Corpus Class 1: Positive Semantic Execution Suite",
    scenarios: [
      {
        id: "POS-01",
        name: "Research Evidence Synthesis",
        description: "Ingests telemetry observation, relates supports to claim, resolves to L2, and emits synthesis",
        given: {
          source: `
            define entity "obs-latency" {
              kind: "research:observation"
              level: L1
              value: "P99 latency down 35ms."
            }
            define entity "claim-optimization" {
              kind: "research:claim"
              level: L2
              value: "Caching layer reduces latency."
            }
            relate "obs-latency" -> "claim-optimization" {
              kind: "supports"
              weight: 0.95
            }
            resolve "claim-optimization" to L2 {
              status: "verified"
            }
            emit {
              target: "claim-optimization"
              kind: "research:synthesis_report"
            }
          `,
        },
        expected: {
          success: true,
          emissions: [
            {
              target: "claim-optimization",
              kind: "research:synthesis_report",
            },
          ],
          transitions: [
            { to: "L2", target: "claim-optimization", occurred: true },
          ],
          traceSteps: [
            { phase: "bind" },
            { phase: "validate" },
            { phase: "emit" },
          ],
        },
      },
      {
        id: "POS-02",
        name: "Editorial Content Refinement",
        description: "Drafts manuscript section, transforms via editorial pass, resolves to L3, and emits publication",
        given: {
          source: `
            define entity "manuscript-draft" {
              kind: "editorial:draft"
              level: L1
              value: "Draft chapter text."
            }
            transform {
              target: "manuscript-draft"
              to: "manuscript-reviewed"
              operation: "editorial:peer_review"
            }
            resolve "manuscript-draft" to L3 {
              status: "approved"
              reviewer: "editorial_board"
            }
            emit {
              target: "manuscript-draft"
              kind: "editorial:published_chapter"
            }
          `,
        },
        expected: {
          success: true,
          emissions: [
            {
              target: "manuscript-draft",
              kind: "editorial:published_chapter",
            },
          ],
          transitions: [
            { to: "L3", target: "manuscript-draft", occurred: true },
          ],
        },
      },
      {
        id: "POS-03",
        name: "Decision Analysis & Tradeoff Selection",
        description: "Scores alternative choices, resolves winner to L3, and emits decision record",
        given: {
          source: `
            define entity "option-alpha" {
              kind: "decision:candidate"
              level: L1
              score: 8.5
            }
            define entity "option-beta" {
              kind: "decision:candidate"
              level: L1
              score: 6.2
            }
            resolve "option-alpha" to L3 {
              criteria: "cost_benefit"
              decision: "selected"
            }
            emit {
              target: "option-alpha"
              kind: "decision:actionable_record"
            }
          `,
        },
        expected: {
          success: true,
          emissions: [
            {
              target: "option-alpha",
              kind: "decision:actionable_record",
            },
          ],
        },
      },
      {
        id: "POS-04",
        name: "Audit Verification & Compliance Trail",
        description: "Verifies policy constraints against access log, resolves compliance to L4, emits certificate",
        given: {
          source: `
            define entity "audit-target-db" {
              kind: "audit:resource"
              level: L1
              mfa_enabled: true
            }
            resolve "audit-target-db" to L4 {
              policy: "SOC2_CC6"
              compliance: "passed"
            }
            emit {
              target: "audit-target-db"
              kind: "audit:compliance_certificate"
            }
          `,
        },
        expected: {
          success: true,
          emissions: [
            {
              target: "audit-target-db",
              kind: "audit:compliance_certificate",
            },
          ],
          transitions: [
            { to: "L4", target: "audit-target-db", occurred: true },
          ],
        },
      },
      {
        id: "POS-05",
        name: "Graph Knowledge Multi-Node Connection",
        description: "Ingests graph nodes, builds directional relationship, resolves clustering, and emits topology",
        given: {
          source: `
            define entity "node-101" {
              kind: "graph:vertex"
              level: L1
            }
            define entity "node-102" {
              kind: "graph:vertex"
              level: L1
            }
            relate "node-101" -> "node-102" {
              kind: "graph:edge"
              weight: 1.0
            }
            resolve "node-101" to L2 {
              cluster: "primary_component"
            }
            emit {
              target: "node-101"
              kind: "graph:topology_export"
            }
          `,
        },
        expected: {
          success: true,
          emissions: [
            {
              target: "node-101",
              kind: "graph:topology_export",
            },
          ],
        },
      },
      {
        id: "POS-06",
        name: "Companion Adapter Execution (@winmedia/cog-adapter-mom)",
        description: "Executes cognitive pipeline through MoM adapter preserving domain emission prefixing",
        given: {
          adapter: momAdapter,
          source: `
            define entity "mom-concept" {
              kind: "concept"
              level: L1
            }
            resolve "mom-concept" to L2 {
              status: "verified"
            }
            emit {
              target: "mom-concept"
              kind: "mom_emission"
            }
          `,
        },
        expected: {
          success: true,
          emissions: [
            {
              target: "mom:mom_emission",
              kind: "mom_emission",
              adapterId: "mom",
            },
          ],
        },
      },
    ],
  });

  test("Runs entire Positive Corpus Suite via runCognitiveSuite", async () => {
    const result = await runCognitiveSuite(positiveSuite);
    assert.equal(result.passed, true);
    assert.equal(result.totalCount, 6);
    assert.equal(result.passedCount, 6);
    assert.equal(result.failedCount, 0);
  });
});

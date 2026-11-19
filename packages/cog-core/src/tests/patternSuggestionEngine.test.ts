import assert from "node:assert/strict";
import test from "node:test";
import { compileCog, lex, parseCog } from "../index";
import { PatternSuggestionEngine } from "../service/patternSuggestionEngine";

test("PatternSuggestionEngine recommends domain patterns based on workflow structure", () => {
  const engine = new PatternSuggestionEngine();

  // Test case 1: Research patterns match
  const researchSource = `
    define entity "src-1" {
      kind: "observation"
      level: L1
      value: "raw-data"
    }
    define entity "claim-1" {
      kind: "extraction"
      level: L2
      value: "fact"
    }
    relate "src-1" -> "claim-1" {
      kind: "extracts"
      operation: "extract"
    }
    emit {
      target: "claim-1"
      kind: "research-synthesis"
    }
  `;
  const irResearch = compileCog(parseCog(lex(researchSource)));
  const suggestionsResearch = engine.suggest(irResearch);

  assert.ok(suggestionsResearch.length > 0);
  assert.ok(suggestionsResearch.some(s => s.patternName === "source-to-claim" && s.libraryId === "cog:domain:research"));
  assert.ok(suggestionsResearch.some(s => s.patternName === "claim-clustering"));

  // Test case 2: Decision patterns match
  const decisionSource = `
    define entity "opt-1" {
      kind: "option"
      value: "do-nothing"
    }
    define entity "crit-1" {
      kind: "criteria"
      value: "cost"
    }
    constrain {
      target: "opt-1"
      operation: "evaluate"
    }
  `;
  const irDecision = compileCog(parseCog(lex(decisionSource)));
  const suggestionsDecision = engine.suggest(irDecision);

  assert.ok(suggestionsDecision.length > 0);
  assert.ok(suggestionsDecision.some(s => s.patternName === "alternative-evaluation" && s.libraryId === "cog:domain:decision"));
});

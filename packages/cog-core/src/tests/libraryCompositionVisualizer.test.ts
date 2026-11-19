import assert from "node:assert/strict";
import test from "node:test";
import { compileCog, lex, parseCog } from "../index";
import { LibraryCompositionVisualizer } from "../service/libraryCompositionVisualizer";

test("LibraryCompositionVisualizer detects composed libraries, boundary interfaces, and produces Mermaid layout", () => {
  // A program that composes research observations and editorial validation
  const source = `
    define entity "source-doc" {
      kind: observation
      level: L1
      value: "original draft text"
    }

    define entity "extracted-claim" {
      kind: extraction
      level: L2
      value: "fact A"
    }

    define entity "golden-reference" {
      kind: expectation
      level: L2
      value: "fact A verified"
    }

    relate "source-doc" -> "extracted-claim" {
      kind: "extracts"
      operation: "extract"
    }

    relate "extracted-claim" -> "golden-reference" {
      kind: "differs-from"
      operation: "compare"
    }
  `;

  const ir = compileCog(parseCog(lex(source)));
  const visualizer = new LibraryCompositionVisualizer();
  const report = visualizer.analyzeComposition(ir);

  // 1. Verify composed libraries are detected
  assert.ok(report.composedLibraries.includes("cog:domain:research"));
  assert.ok(report.composedLibraries.includes("cog:domain:editorial"));

  // 2. Verify boundary entity (extracted-claim acts as the link between research and editorial)
  assert.ok(report.boundaryEntities.includes("extracted-claim"));

  // 3. Verify nodes and edges structure
  assert.ok(report.nodes.some((n) => n.id === "cog:domain:research"));
  assert.ok(report.nodes.some((n) => n.id === "boundary:extracted-claim"));
  assert.ok(report.edges.some((e) => e.from === "cog:domain:research" && e.to === "boundary:extracted-claim"));

  // 4. Verify Mermaid structure
  assert.ok(report.mermaidComposition.includes("cog_domain_research"));
  assert.ok(report.mermaidComposition.includes("boundary_extracted_claim"));
});

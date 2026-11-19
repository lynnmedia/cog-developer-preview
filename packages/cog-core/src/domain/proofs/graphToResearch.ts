import { graphLibrary } from "../graph/graphLibrary";
import { researchLibrary } from "../research/researchLibrary";

/**
 * Composes Knowledge Graph and Research Synthesis domain libraries.
 * Pipes the final explanation of a knowledge graph directly as a source observation for research claim extraction.
 */
export function composeGraphToResearch(graphParams: any, researchParams: any): string {
  const graphSource = graphLibrary.generate(graphParams);
  const researchSource = researchLibrary.generate(researchParams);

  const graphLines = graphSource.split("\n");
  const researchLines = researchSource.split("\n");

  // Remove duplicate source entity definition from Research Synthesis code
  const explanationId = graphParams.explanationId ?? "explanation-node";
  const filteredResearchLines: string[] = [];
  let insideSourceDefinition = false;

  for (const line of researchLines) {
    if (line.trim().startsWith(`define entity "${explanationId}"`)) {
      insideSourceDefinition = true;
      continue;
    }
    if (insideSourceDefinition) {
      if (line.trim() === "}") {
        insideSourceDefinition = false;
      }
      continue;
    }
    filteredResearchLines.push(line);
  }

  // Remove the emit block of Knowledge Graph to only keep the Research Synthesis final emission
  const filteredGraphLines: string[] = [];
  let insideEmit = false;
  for (const line of graphLines) {
    if (line.trim().startsWith("emit {")) {
      insideEmit = true;
      continue;
    }
    if (insideEmit) {
      if (line.trim() === "}") {
        insideEmit = false;
      }
      continue;
    }
    filteredGraphLines.push(line);
  }

  return [
    "// === Composed Cog Program: Knowledge Graph -> Research Synthesis ===",
    "// --- Knowledge Graph Phase ---",
    ...filteredGraphLines,
    "",
    "// --- Research Synthesis Phase ---",
    ...filteredResearchLines,
  ].join("\n").trim();
}

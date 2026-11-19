import { researchLibrary } from "../research/researchLibrary";
import { editorialLibrary } from "../editorial/editorialLibrary";

/**
 * Composes Research Synthesis and Editorial Review domain libraries.
 * Pipes the final resolution of research as the draft document input for review.
 */
export function composeResearchToEditorial(researchParams: any, editorialParams: any): string {
  const researchSource = researchLibrary.generate(researchParams);
  const editorialSource = editorialLibrary.generate(editorialParams);

  const researchLines = researchSource.split("\n");
  const editorialLines = editorialSource.split("\n");

  // Remove the duplicate entity definition of the shared draft/resolution entity in Editorial review
  const draftId = editorialParams.draftId ?? "document-draft";
  const filteredEditorialLines: string[] = [];
  let insideDraftDefinition = false;

  for (const line of editorialLines) {
    if (line.trim().startsWith(`define entity "${draftId}"`)) {
      insideDraftDefinition = true;
      continue;
    }
    if (insideDraftDefinition) {
      if (line.trim() === "}") {
        insideDraftDefinition = false;
      }
      continue;
    }
    filteredEditorialLines.push(line);
  }

  // Remove the emit block of Research Synthesis to only keep the Editorial review final emission
  const filteredResearchLines: string[] = [];
  let insideEmit = false;
  for (const line of researchLines) {
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
    filteredResearchLines.push(line);
  }

  return [
    "// === Composed Cog Program: Research -> Editorial ===",
    "// --- Research Synthesis Phase ---",
    ...filteredResearchLines,
    "",
    "// --- Editorial Review Phase ---",
    ...filteredEditorialLines,
  ].join("\n").trim();
}

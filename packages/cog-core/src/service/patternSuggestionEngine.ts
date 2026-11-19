import type { CoreIR } from "../types/ir";

export interface PatternSuggestion {
  patternName: string;
  libraryId: string;
  confidence: number;
  reason: string;
}

export class PatternSuggestionEngine {
  /**
   * Recommends reusable domain library patterns based on the structure of the workflow IR.
   */
  suggest(ir: CoreIR): PatternSuggestion[] {
    const suggestions: PatternSuggestion[] = [];

    // Collect info from IR
    const entityKinds = new Set(ir.entities.map(e => e.entityKind?.toLowerCase()).filter(Boolean));
    const relationKinds = new Set(ir.relations.map(r => r.relationKind?.toLowerCase()).filter(Boolean));
    const emissionKinds = new Set(ir.emissions.map(e => e.emissionKind?.toLowerCase()).filter(Boolean));

    // Rule 1: Research Synthesis Library
    if (
      entityKinds.has("observation") ||
      entityKinds.has("extraction") ||
      entityKinds.has("cluster") ||
      relationKinds.has("extracts") ||
      relationKinds.has("clustered-into") ||
      emissionKinds.has("research-synthesis")
    ) {
      suggestions.push({
        patternName: "source-to-claim",
        libraryId: "cog:domain:research",
        confidence: 0.9,
        reason: "Detected observation or extraction entity kinds with extract relationships, suggesting claim-based research analysis.",
      });
      suggestions.push({
        patternName: "claim-clustering",
        libraryId: "cog:domain:research",
        confidence: 0.8,
        reason: "Workflow utilizes multiple claims or extractions that can be structured using pattern-based clustering.",
      });
      suggestions.push({
        patternName: "synthesis-resolution",
        libraryId: "cog:domain:research",
        confidence: 0.85,
        reason: "Workflow has research-synthesis emission characteristics, suggesting a final synthesis resolution.",
      });
    }

    // Rule 2: Decision Analysis Library
    if (
      entityKinds.has("option") ||
      entityKinds.has("alternative") ||
      entityKinds.has("criteria") ||
      relationKinds.has("evaluates") ||
      ir.constraints.length > 0 ||
      emissionKinds.has("decision-resolution")
    ) {
      suggestions.push({
        patternName: "alternative-evaluation",
        libraryId: "cog:domain:decision",
        confidence: 0.9,
        reason: "Detected criteria/option entity kinds or constraint checks, recommending alternative evaluation logic.",
      });
      suggestions.push({
        patternName: "metric-constraint",
        libraryId: "cog:domain:decision",
        confidence: 0.8,
        reason: "Presence of workflow constraints suggests matching metric-constraint patterns.",
      });
      suggestions.push({
        patternName: "decision-resolution",
        libraryId: "cog:domain:decision",
        confidence: 0.85,
        reason: "Entity structure indicates decision resolving points based on defined criteria.",
      });
    }

    // Rule 3: Audit Reasoning Library
    if (
      entityKinds.has("finding") ||
      entityKinds.has("alert") ||
      relationKinds.has("links") ||
      emissionKinds.has("audit-report")
    ) {
      suggestions.push({
        patternName: "finding-identification",
        libraryId: "cog:domain:audit",
        confidence: 0.85,
        reason: "Detected finding/alert entity definitions suggesting an audit identification pattern.",
      });
      suggestions.push({
        patternName: "finding-relationship",
        libraryId: "cog:domain:audit",
        confidence: 0.8,
        reason: "Linked alerts/findings suggest using finding relationship models to structure trace outcomes.",
      });
      suggestions.push({
        patternName: "severity-resolution",
        libraryId: "cog:domain:audit",
        confidence: 0.75,
        reason: "Resolving finding levels maps to audit severity-resolution patterns.",
      });
    }

    // Rule 4: Learning Library
    if (
      entityKinds.has("gap") ||
      entityKinds.has("concept") ||
      entityKinds.has("practice") ||
      entityKinds.has("understanding") ||
      emissionKinds.has("learning-outcome")
    ) {
      suggestions.push({
        patternName: "observe-gap",
        libraryId: "cog:domain:learning",
        confidence: 0.9,
        reason: "Entity kinds match conceptual gap observations, recommending gap tracking patterns.",
      });
      suggestions.push({
        patternName: "concept-identification",
        libraryId: "cog:domain:learning",
        confidence: 0.85,
        reason: "Conceptual nodes map to concept-identification domain patterns.",
      });
      suggestions.push({
        patternName: "understanding-resolution",
        libraryId: "cog:domain:learning",
        confidence: 0.8,
        reason: "Resolving understanding nodes suggests learning resolutions.",
      });
    }

    return suggestions;
  }
}

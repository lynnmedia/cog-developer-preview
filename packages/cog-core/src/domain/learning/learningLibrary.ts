import type { DomainLibrary } from "../contract";

export const learningLibrary: DomainLibrary = {
  id: "cog:domain:learning",
  name: "Learning Cognition Library",
  description: "Instructional learning cognition library mapping gaps, concept identifications, practice attempts, and understanding resolutions.",
  capabilities: ["learning-workflow"],
  supportedPatterns: ["observe-gap", "concept-identification", "understanding-resolution"],

  generate(params: {
    gapId: string;
    gapVal: string;
    conceptId: string;
    conceptVal: string;
    resolutionId: string;
    resolutionVal: string;
  }): string {
    const lines: string[] = [];

    // Define L1 gap observation
    lines.push(`define entity "${params.gapId}" {`);
    lines.push(`  kind: "learning-gap"`);
    lines.push(`  level: L1`);
    lines.push(`  value: "${params.gapVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Define L2 concept identification
    lines.push(`define entity "${params.conceptId}" {`);
    lines.push(`  kind: "concept"`);
    lines.push(`  level: L2`);
    lines.push(`  value: "${params.conceptVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Define L3 understanding resolution
    lines.push(`define entity "${params.resolutionId}" {`);
    lines.push(`  kind: "understanding-resolution"`);
    lines.push(`  level: L3`);
    lines.push(`  value: "${params.resolutionVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Relate gap to concept (identifies)
    lines.push(`relate "${params.gapId}" -> "${params.conceptId}" {`);
    lines.push(`  kind: "identifies-concept"`);
    lines.push(`  operation: "classify"`);
    lines.push(`}`);
    lines.push(``);

    // Relate concept to resolution (resolves)
    lines.push(`relate "${params.conceptId}" -> "${params.resolutionId}" {`);
    lines.push(`  kind: "resolves-understanding"`);
    lines.push(`  operation: "relate"`);
    lines.push(`}`);
    lines.push(``);

    // Emit resolved understanding (instructional/non-diagnostic learning trace)
    lines.push(`emit {`);
    lines.push(`  target: "${params.resolutionId}"`);
    lines.push(`  kind: "learning-workflow"`);
    lines.push(`}`);

    return lines.join("\n").trim();
  }
};

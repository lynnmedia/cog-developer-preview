import type { DomainLibrary } from "../contract";

export const cognitiveEcologyLibrary: DomainLibrary = {
  id: "cog:domain:cognitive-ecology",
  name: "Cognitive Ecology Library",
  description: "Analytical cognitive ecology library mapping systems actors, feedback loops, constraints, and system-level explanations.",
  capabilities: ["cognitive-ecology"],
  supportedPatterns: ["systems-mapping", "feedback-analysis", "intervention-discovery"],

  generate(params: {
    actorId: string;
    actorVal: string;
    constraintId: string;
    constraintVal: string;
    explanationId: string;
    explanationVal: string;
  }): string {
    const lines: string[] = [];

    // Define L1 systems actor
    lines.push(`define entity "${params.actorId}" {`);
    lines.push(`  kind: "actor"`);
    lines.push(`  level: L1`);
    lines.push(`  value: "${params.actorVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Define L2 feedback constraint
    lines.push(`define entity "${params.constraintId}" {`);
    lines.push(`  kind: "constraint"`);
    lines.push(`  level: L2`);
    lines.push(`  value: "${params.constraintVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Define L3 system explanation (intervention/explanation)
    lines.push(`define entity "${params.explanationId}" {`);
    lines.push(`  kind: "system-explanation"`);
    lines.push(`  level: L3`);
    lines.push(`  value: "${params.explanationVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Relate actor to constraint (acts-under)
    lines.push(`relate "${params.actorId}" -> "${params.constraintId}" {`);
    lines.push(`  kind: "acts-under"`);
    lines.push(`  operation: "classify"`);
    lines.push(`}`);
    lines.push(``);

    // Relate constraint to explanation (governs)
    lines.push(`relate "${params.constraintId}" -> "${params.explanationId}" {`);
    lines.push(`  kind: "governs-explanation"`);
    lines.push(`  operation: "relate"`);
    lines.push(`}`);
    lines.push(``);

    // Emit proposed systems explanation
    lines.push(`emit {`);
    lines.push(`  target: "${params.explanationId}"`);
    lines.push(`  kind: "cognitive-ecology"`);
    lines.push(`}`);

    return lines.join("\n").trim();
  }
};

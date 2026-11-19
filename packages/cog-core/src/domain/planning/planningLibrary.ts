import type { DomainLibrary } from "../contract";

export const planningLibrary: DomainLibrary = {
  id: "cog:domain:planning",
  name: "Planning Cognition Library",
  description: "Analytical planning cognition library modeling goals, safety/operational constraints, dependencies, risks, next actions, and reviewable plans.",
  capabilities: ["planning-workflow"],
  supportedPatterns: ["goal-modeling", "risk-assessment", "plan-formulation"],

  generate(params: {
    goalId: string;
    goalVal: string;
    riskId: string;
    riskVal: string;
    resolutionId: string;
    resolutionVal: string;
  }): string {
    const lines: string[] = [];

    // Define L1 goal description
    lines.push(`define entity "${params.goalId}" {`);
    lines.push(`  kind: "goal"`);
    lines.push(`  level: L1`);
    lines.push(`  value: "${params.goalVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Define L2 risk assessment
    lines.push(`define entity "${params.riskId}" {`);
    lines.push(`  kind: "risk"`);
    lines.push(`  level: L2`);
    lines.push(`  value: "${params.riskVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Define L3 formulated plan output
    lines.push(`define entity "${params.resolutionId}" {`);
    lines.push(`  kind: "formulated-plan"`);
    lines.push(`  level: L3`);
    lines.push(`  value: "${params.resolutionVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Relate goal to risk (identifies)
    lines.push(`relate "${params.goalId}" -> "${params.riskId}" {`);
    lines.push(`  kind: "identifies-risk"`);
    lines.push(`  operation: "classify"`);
    lines.push(`}`);
    lines.push(``);

    // Relate risk to plan (mitigates)
    lines.push(`relate "${params.riskId}" -> "${params.resolutionId}" {`);
    lines.push(`  kind: "mitigates-risk"`);
    lines.push(`  operation: "relate"`);
    lines.push(`}`);
    lines.push(``);

    // Emit reviewable plan (non-executable modeling/planning only)
    lines.push(`emit {`);
    lines.push(`  target: "${params.resolutionId}"`);
    lines.push(`  kind: "planning-workflow"`);
    lines.push(`}`);

    return lines.join("\n").trim();
  }
};

import type { DomainLibrary } from "../contract";

export const orientationLibrary: DomainLibrary = {
  id: "cog:domain:orientation",
  name: "Human Orientation Library",
  description: "Reflective human orientation library mapping observations, pressures, tensions, and proposing guided reflective paths without authoritative verdicts.",
  capabilities: ["orientation-support"],
  supportedPatterns: ["situation-observation", "tension-identification", "reflective-guidance"],

  generate(params: {
    observationId: string;
    observationVal: string;
    tensionId: string;
    tensionVal: string;
    resolutionId: string;
    resolutionVal: string;
  }): string {
    const lines: string[] = [];

    // Define L1 situation observation
    lines.push(`define entity "${params.observationId}" {`);
    lines.push(`  kind: "observation"`);
    lines.push(`  level: L1`);
    lines.push(`  value: "${params.observationVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Define L2 tension identification
    lines.push(`define entity "${params.tensionId}" {`);
    lines.push(`  kind: "tension"`);
    lines.push(`  level: L2`);
    lines.push(`  value: "${params.tensionVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Define L3 proposed resolution
    lines.push(`define entity "${params.resolutionId}" {`);
    lines.push(`  kind: "reflective-guidance"`);
    lines.push(`  level: L3`);
    lines.push(`  value: "${params.resolutionVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Relate observation to tension
    lines.push(`relate "${params.observationId}" -> "${params.tensionId}" {`);
    lines.push(`  kind: "yields-tension"`);
    lines.push(`  operation: "classify"`);
    lines.push(`}`);
    lines.push(``);

    // Relate tension to resolution suggestion
    lines.push(`relate "${params.tensionId}" -> "${params.resolutionId}" {`);
    lines.push(`  kind: "suggests-reflection"`);
    lines.push(`  operation: "relate"`);
    lines.push(`}`);
    lines.push(``);

    // Emit proposed resolution guidance
    lines.push(`emit {`);
    lines.push(`  target: "${params.resolutionId}"`);
    lines.push(`  kind: "orientation-support"`);
    lines.push(`}`);

    return lines.join("\n").trim();
  }
};

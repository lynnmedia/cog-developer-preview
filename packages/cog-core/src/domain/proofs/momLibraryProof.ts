import type { DomainLibrary } from "../contract";

export const momLibraryProof: DomainLibrary = {
  id: "cog:domain:mom-proof",
  name: "MoM-Oriented Proof Library",
  description: "Library proof demonstrating MoM-oriented adapter behaviors such as level/kind mapping and plan enrichment.",
  capabilities: ["decision-analysis"],
  supportedPatterns: ["mom-verification-flow"],

  generate(params: {
    entityId?: string;
    entityVal?: string;
    resolutionLevel?: "L1" | "L2" | "L3" | "L4" | "L5";
  }): string {
    const entityId = params.entityId ?? "mom-target";
    const entityVal = params.entityVal ?? "mom-payload-data";
    const level = params.resolutionLevel ?? "L3";

    const lines: string[] = [
      `define entity "${entityId}" {`,
      `  kind: "mom-observation"`,
      `  level: ${level}`,
      `  value: "${entityVal}"`,
      `}`,
      ``,
      `resolve "${entityId}" to ${level} {`,
      `  operation: "resolve"`,
      `  reason: "mom-resolution-check"`,
      `}`,
      ``,
      `emit {`,
      `  target: "${entityId}"`,
      `  kind: "mom-report"`,
      `}`,
    ];

    return lines.join("\n").trim();
  },
};

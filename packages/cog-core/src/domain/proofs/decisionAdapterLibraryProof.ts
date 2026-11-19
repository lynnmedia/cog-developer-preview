import type { DomainLibrary } from "../contract";

export const decisionAdapterLibraryProof: DomainLibrary = {
  id: "cog:domain:decision-adapter-proof",
  name: "Decision Adapter-Aware Proof Library",
  description: "Library proof demonstrating decision-specific adapter behaviors such as relation mapping and custom verification step enrichment.",
  capabilities: ["decision-analysis"],
  supportedPatterns: ["decision-adapter-verification"],

  generate(params: {
    metricId?: string;
    metricValue?: number;
    optionId?: string;
    decisionId?: string;
    threshold?: number;
  }): string {
    const metricId = params.metricId ?? "raw-metric";
    const metricValue = params.metricValue ?? 85;
    const optionId = params.optionId ?? "selected-option";
    const decisionId = params.decisionId ?? "final-decision";
    const threshold = params.threshold ?? 80;

    const lines: string[] = [
      `define entity "${metricId}" {`,
      `  kind: "observation"`,
      `  level: L1`,
      `  value: ${metricValue}`,
      `}`,
      ``,
      `define entity "${optionId}" {`,
      `  kind: "alternative"`,
      `  level: L1`,
      `  value: "option-alpha"`,
      `}`,
      ``,
      `define entity "${decisionId}" {`,
      `  kind: "decision"`,
      `  level: L2`,
      `  value: "option-alpha-approved"`,
      `}`,
      ``,
      `relate "${metricId}" -> "${optionId}" {`,
      `  kind: "supports"`,
      `  operation: "evaluate"`,
      `}`,
      ``,
      `constrain {`,
      `  target: "${optionId}"`,
      `  operation: "evaluate"`,
      `  rule: "metric-threshold-met"`,
      `  threshold: ${threshold}`,
      `}`,
      ``,
      `resolve "${optionId}" to L2 {`,
      `  operation: "resolve"`,
      `  reason: "metrics-exceeded-threshold"`,
      `}`,
      ``,
      `relate "${optionId}" -> "${decisionId}" {`,
      `  kind: "approved-as"`,
      `  operation: "resolve"`,
      `}`,
      ``,
      `emit {`,
      `  target: "${decisionId}"`,
      `  kind: "decision-analysis"`,
      `}`,
    ];

    return lines.join("\n").trim();
  },
};

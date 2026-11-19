import type { DomainLibrary } from "../contract";

export const decisionLibrary: DomainLibrary = {
  id: "cog:domain:decision",
  name: "Decision Analysis Library",
  description: "Library for metric observation, alternative evaluation, criteria constraints, decision resolution, and emissions.",
  capabilities: ["decision-analysis"],
  supportedPatterns: ["alternative-evaluation", "metric-constraint", "decision-resolution"],

  generate(params: {
    metricId?: string;
    metricValue?: number;
    optionId?: string;
    optionValue?: string;
    decisionId?: string;
    decisionValue?: string;
    threshold?: number;
  }): string {
    const metricId = params.metricId ?? "raw-metric";
    const metricValue = params.metricValue ?? 85;
    const optionId = params.optionId ?? "selected-option";
    const optionValue = params.optionValue ?? "option-alpha";
    const decisionId = params.decisionId ?? "final-decision";
    const decisionValue = params.decisionValue ?? "option-alpha-approved";
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
      `  value: "${optionValue}"`,
      `}`,
      ``,
      `define entity "${decisionId}" {`,
      `  kind: "decision"`,
      `  level: L2`,
      `  value: "${decisionValue}"`,
      `}`,
      ``,
      `// Observe`,
      `constrain {`,
      `  target: "${metricId}"`,
      `  operation: "observe"`,
      `}`,
      ``,
      `// Evaluate`,
      `relate "${metricId}" -> "${optionId}" {`,
      `  kind: "supports"`,
      `  operation: "evaluate"`,
      `}`,
      ``,
      `// Constrain`,
      `constrain {`,
      `  target: "${optionId}"`,
      `  operation: "evaluate"`,
      `  rule: "metric-threshold-met"`,
      `  threshold: ${threshold}`,
      `}`,
      ``,
      `// Resolve`,
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
      `// Emit`,
      `emit {`,
      `  target: "${decisionId}"`,
      `  kind: "decision-analysis"`,
      `}`,
    ];

    return lines.join("\n").trim();
  },
};

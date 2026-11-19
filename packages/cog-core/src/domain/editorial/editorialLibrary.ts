import type { DomainLibrary } from "../contract";

export const editorialLibrary: DomainLibrary = {
  id: "cog:domain:editorial",
  name: "Editorial Review Library",
  description: "Library for document review, drift detection, reconciliation planning, and explanation workflows.",
  capabilities: ["document-review"],
  supportedPatterns: ["drift-detection", "reconciliation-action", "editorial-explanation"],

  generate(params: {
    draftId?: string;
    draftValue?: string;
    goldenId?: string;
    goldenValue?: string;
    driftId?: string;
    driftValue?: string;
    actionId?: string;
    actionValue?: string;
    explanationId?: string;
    explanationValue?: string;
  }): string {
    const draftId = params.draftId ?? "document-draft";
    const draftValue = params.draftValue ?? "draft-content";
    const goldenId = params.goldenId ?? "document-golden";
    const goldenValue = params.goldenValue ?? "golden-content";
    const driftId = params.driftId ?? "drift-report";
    const driftValue = params.driftValue ?? "detected-drift-details";
    const actionId = params.actionId ?? "reconciliation-action";
    const actionValue = params.actionValue ?? "align-draft-to-golden";
    const explanationId = params.explanationId ?? "explanation-summary";
    const explanationValue = params.explanationValue ?? "drift-mitigation-reasoning";

    const lines: string[] = [
      `define entity "${draftId}" {`,
      `  kind: "observation"`,
      `  level: L1`,
      `  value: "${draftValue}"`,
      `}`,
      ``,
      `define entity "${goldenId}" {`,
      `  kind: "expectation"`,
      `  level: L1`,
      `  value: "${goldenValue}"`,
      `}`,
      ``,
      `define entity "${driftId}" {`,
      `  kind: "drift"`,
      `  level: L2`,
      `  value: "${driftValue}"`,
      `}`,
      ``,
      `define entity "${actionId}" {`,
      `  kind: "action"`,
      `  level: L2`,
      `  value: "${actionValue}"`,
      `}`,
      ``,
      `define entity "${explanationId}" {`,
      `  kind: "explanation"`,
      `  level: L3`,
      `  value: "${explanationValue}"`,
      `}`,
      ``,
      `// Observe`,
      `constrain {`,
      `  target: "${draftId}"`,
      `  operation: "observe"`,
      `}`,
      ``,
      `// Compare`,
      `relate "${draftId}" -> "${goldenId}" {`,
      `  kind: "differs-from"`,
      `  operation: "compare"`,
      `}`,
      ``,
      `// Detect Drift`,
      `relate "${draftId}" -> "${driftId}" {`,
      `  kind: "has-drift"`,
      `  operation: "detect-drift"`,
      `}`,
      ``,
      `// Resolve`,
      `resolve "${driftId}" to L2 {`,
      `  operation: "resolve"`,
      `  reason: "drift-detected"`,
      `}`,
      ``,
      `relate "${driftId}" -> "${actionId}" {`,
      `  kind: "mitigated-by"`,
      `  operation: "resolve"`,
      `}`,
      ``,
      `// Explain`,
      `relate "${actionId}" -> "${explanationId}" {`,
      `  kind: "explained-by"`,
      `  operation: "explain"`,
      `}`,
      ``,
      `// Emit report`,
      `emit {`,
      `  target: "${explanationId}"`,
      `  kind: "document-review"`,
      `}`,
    ];

    return lines.join("\n").trim();
  },
};

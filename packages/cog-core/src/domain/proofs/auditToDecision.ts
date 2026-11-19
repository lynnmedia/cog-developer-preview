import { auditLibrary } from "../audit/auditLibrary";
import { decisionLibrary } from "../decision/decisionLibrary";

/**
 * Composes Audit Reasoning and Decision Analysis domain libraries.
 * Pipes the severity resolution metrics of audit findings directly as the raw-metric input for a decision workflow.
 */
export function composeAuditToDecision(auditParams: any, decisionParams: any): string {
  const auditSource = auditLibrary.generate(auditParams);
  const decisionSource = decisionLibrary.generate(decisionParams);

  const auditLines = auditSource.split("\n");
  const decisionLines = decisionSource.split("\n");

  // Remove duplicate severity metric entity definition from Decision Analysis code
  const metricId = decisionParams.metricId ?? "raw-metric";
  const filteredDecisionLines: string[] = [];
  let insideMetricDefinition = false;

  for (const line of decisionLines) {
    if (line.trim().startsWith(`define entity "${metricId}"`)) {
      insideMetricDefinition = true;
      continue;
    }
    if (insideMetricDefinition) {
      if (line.trim() === "}") {
        insideMetricDefinition = false;
      }
      continue;
    }
    filteredDecisionLines.push(line);
  }

  // Remove the emit block of Audit Reasoning to only keep the Decision Analysis final emission
  const filteredAuditLines: string[] = [];
  let insideEmit = false;
  for (const line of auditLines) {
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
    filteredAuditLines.push(line);
  }

  return [
    "// === Composed Cog Program: Audit -> Decision ===",
    "// --- Audit Reasoning Phase ---",
    ...filteredAuditLines,
    "",
    "// --- Decision Analysis Phase ---",
    ...filteredDecisionLines,
  ].join("\n").trim();
}

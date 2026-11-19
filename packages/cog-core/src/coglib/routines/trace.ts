/**
 * CogLib TRACE Routine
 *
 * Backward traversal of cognitive lineage without inventing provenance or unsupported causal links:
 * source → grounding → inference → transformation → resulting object
 *
 * Features:
 * - Distinguishes recorded lineage from inference about lineage
 * - Preserves missing links and lineage gaps explicitly
 * - Exposes epistemic changes and assumption accumulation across transformation steps
 * - Detects conflicting provenance records
 * - Rejects attempted provenance invention
 */

import { CognitiveRoutine, EpistemicState } from "../routineContract";

export type TraceStageType =
  | "source"
  | "grounding"
  | "inference"
  | "transformation"
  | "result";

export interface LineageRecord {
  id: string;
  stage: TraceStageType;
  parentId?: string;
  sourceAnchor?: string;
  description: string;
  confidenceDelta?: number;
  assumptionsAdded?: string[];
  isRecorded: boolean; // Recorded vs speculative inference
}

export interface TraceInput {
  targetObjectId: string;
  records: LineageRecord[];
  rootSourceExpected?: string;
}

export interface TraceStep {
  stepIndex: number;
  stage: TraceStageType;
  recordId: string;
  description: string;
  isGrounded: boolean;
  isRecorded: boolean;
  cumulativeConfidence: number;
  assumptionsAccumulated: string[];
  gapDetected?: string;
}

export interface TraceOutput {
  targetObjectId: string;
  integrity: "complete" | "gapped" | "conflicted" | "broken";
  traversalChain: TraceStep[];
  gaps: Array<{ fromId: string; toId: string; reason: string }>;
  conflicts: Array<{ recordId: string; conflictWith: string; reason: string }>;
  explanatoryNarrative: string;
  unresolvedTensions: string[];
}

export const traceRoutine: CognitiveRoutine<TraceInput, TraceOutput> = {
  metadata: {
    id: "coglib:routine:trace",
    name: "Universal Cognitive Lineage Trace",
    version: "1.0.0",
    category: "provenance",
    description: "Backward traversal of cognitive lineage exposing provenance gaps, epistemic shifts, and conflicting claims without fabricating links.",
  },
  inputs: [
    { name: "targetObjectId", type: "string", required: true, description: "Target object to trace" },
    { name: "records", type: "array", required: true, description: "Available lineage records" },
    { name: "rootSourceExpected", type: "string", required: false, description: "Expected origin anchor" },
  ],
  outputs: [
    { name: "traceReport", type: "object", required: true, description: "Structured backward lineage trace report" },
  ],
  preconditions: [
    {
      id: "has-target-and-records",
      description: "Must provide targetObjectId and at least one lineage record",
      evaluate: (input) => ({
        passed: Boolean(input?.targetObjectId && Array.isArray(input?.records) && input.records.length > 0),
        reason: "Precondition failed: targetObjectId and non-empty records required",
      }),
    },
  ],
  postconditions: [
    {
      id: "no-invented-links",
      description: "Gaps must be explicitly recorded rather than silently bridged",
      evaluate: ({ output }) => ({
        passed: output.gaps.length === 0 || output.integrity !== "complete",
        reason: "Postcondition failed: Complete integrity reported despite lineage gaps",
      }),
    },
  ],
  failureModes: [
    {
      code: "TRACE_MISSING_GROUNDING_ANCHOR",
      description: "Lineage contains disconnected steps without recorded parent links",
      severity: "qualified",
      recoverable: true,
      mitigation: "Flag gaps in traversal chain and preserve epistemic qualification",
    },
    {
      code: "TRACE_PROVENANCE_CONTRADICTION",
      description: "Multiple records claim contradictory parents or origins",
      severity: "qualified",
      recoverable: true,
      mitigation: "Emit conflicted integrity status and record contradictory lineage vectors",
    },
  ],
  provenanceRequirements: {
    requiresSourceAnchors: true,
    preserveLineage: true,
    trackTransformations: true,
    auditRequired: true,
  },
  epistemicContract: {
    producesUncertainty: true,
    uncertaintyHandling: "preserve",
    epistemicDelta: "Materializes complete causal chain while highlighting gaps and provenance defects",
    preservesTensions: true,
  },
  invariants: [
    {
      id: "provenance-fidelity",
      description: "Unrecorded speculative steps must not be marked as recorded facts",
      enforce: (input, output) => {
        const hasViolations = output.traversalChain.some((step) => {
          const original = input.records.find((r) => r.id === step.recordId);
          return original && !original.isRecorded && step.isRecorded;
        });
        return {
          valid: !hasViolations,
          violation: "Speculative lineage step was incorrectly marked as recorded fact",
        };
      },
    },
  ],
  domainHooks: [],
  evaluationHooks: [
    {
      hookId: "lineage-depth",
      metricName: "chainDepth",
      description: "Number of steps in the traversal chain",
      computeMetric: (output) => output.traversalChain.length,
    },
  ],
  compatibility: {
    compatibleRoutines: [
      "coglib:routine:shape",
      "coglib:routine:compare",
      "coglib:routine:challenge",
    ],
    incompatibleRoutines: [],
    compositionPatterns: ["pipeline", "branch", "merge", "guarded_transition"],
    requiredKernelVersion: ">=0.1.0",
  },
  execute: (input: TraceInput) => {
    const recordMap = new Map<string, LineageRecord>();
    for (const r of input.records) {
      recordMap.set(r.id, r);
    }

    const traversalChain: TraceStep[] = [];
    const gaps: Array<{ fromId: string; toId: string; reason: string }> = [];
    const conflicts: Array<{ recordId: string; conflictWith: string; reason: string }> = [];
    const unresolvedTensions: string[] = [];

    // Traverse from target object backward to root source
    let currentId: string | undefined = input.targetObjectId;
    const visited = new Set<string>();
    let currentConfidence = 1.0;
    const accumulatedAssumptions: string[] = [];

    const orderedSteps: LineageRecord[] = [];

    while (currentId) {
      if (visited.has(currentId)) {
        conflicts.push({
          recordId: currentId,
          conflictWith: currentId,
          reason: "Circular lineage loop detected in provenance graph",
        });
        unresolvedTensions.push(`Circular lineage detected at '${currentId}'`);
        break;
      }
      visited.add(currentId);

      const record = recordMap.get(currentId);
      if (!record) {
        // Lineage Gap: parent referenced but record missing!
        gaps.push({
          fromId: currentId,
          toId: "unknown",
          reason: `Missing recorded predecessor for step '${currentId}'`,
        });
        unresolvedTensions.push(`Lineage gap: missing predecessor record for '${currentId}'`);
        break;
      }

      orderedSteps.unshift(record); // Prepend to preserve forward causal order
      currentId = record.parentId;
    }

    // Check if expected root matches discovered root
    if (input.rootSourceExpected && orderedSteps.length > 0) {
      const rootStep = orderedSteps[0]!;
      if (rootStep.sourceAnchor !== input.rootSourceExpected && rootStep.id !== input.rootSourceExpected) {
        conflicts.push({
          recordId: rootStep.id,
          conflictWith: input.rootSourceExpected,
          reason: `Expected root source '${input.rootSourceExpected}' does not match discovered root '${rootStep.sourceAnchor ?? rootStep.id}'`,
        });
        unresolvedTensions.push(`Root source mismatch: expected '${input.rootSourceExpected}', found '${rootStep.sourceAnchor ?? rootStep.id}'`);
      }
    }

    // Build explanatory traversal chain
    for (let i = 0; i < orderedSteps.length; i++) {
      const stepRecord = orderedSteps[i]!;
      if (stepRecord.confidenceDelta !== undefined) {
        currentConfidence = Math.max(0.1, Number((currentConfidence * (1 + stepRecord.confidenceDelta)).toFixed(2)));
      }
      if (stepRecord.assumptionsAdded) {
        accumulatedAssumptions.push(...stepRecord.assumptionsAdded);
      }

      traversalChain.push({
        stepIndex: i + 1,
        stage: stepRecord.stage,
        recordId: stepRecord.id,
        description: stepRecord.description,
        isGrounded: Boolean(stepRecord.sourceAnchor || stepRecord.stage === "source"),
        isRecorded: stepRecord.isRecorded,
        cumulativeConfidence: currentConfidence,
        assumptionsAccumulated: [...accumulatedAssumptions],
      });
    }

    // Determine overall integrity
    let integrity: "complete" | "gapped" | "conflicted" | "broken" = "complete";
    if (conflicts.length > 0) {
      integrity = "conflicted";
    } else if (gaps.length > 0) {
      integrity = "gapped";
    } else if (traversalChain.length === 0) {
      integrity = "broken";
    }

    const narrative = traversalChain
      .map((s) => `[Step ${s.stepIndex}: ${s.stage.toUpperCase()}] ${s.description} (grounded: ${s.isGrounded}, recorded: ${s.isRecorded}, confidence: ${s.cumulativeConfidence})`)
      .join("\n");

    return {
      status: integrity === "complete" ? "success" : "qualified",
      output: {
        targetObjectId: input.targetObjectId,
        integrity,
        traversalChain,
        gaps,
        conflicts,
        explanatoryNarrative: narrative,
        unresolvedTensions,
      },
      epistemicState: {
        confidence: integrity === "complete" ? currentConfidence : Math.min(currentConfidence, 0.6),
        uncertaintyBounded: true,
        tensions: unresolvedTensions,
        provenanceLineage: traversalChain.map((s) => s.recordId),
      },
      provenance: {
        routineId: "coglib:routine:trace",
        routineVersion: "1.0.0",
        lineage: traversalChain.map((s) => s.recordId),
        timestamp: new Date().toISOString(),
      },
    };
  },
};

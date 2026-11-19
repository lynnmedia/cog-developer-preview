/**
 * CogLib COMPARE Routine
 *
 * Cognitively significant comparison between two cognitive objects or perspectives.
 * Moves far beyond structural/field-level diffing to evaluate material differences in:
 * - assumptions
 * - scope and resolution
 * - grounding and provenance
 * - epistemic state and confidence
 * - identity continuity across states
 * - tensions, contradictions, and framing consequences
 * - explicit comparability limits (incommensurability)
 */

import { CognitiveRoutine, EpistemicState } from "../routineContract";

export interface CognitiveComparisonTarget {
  id: string;
  name?: string;
  assumptions?: string[];
  scope?: string;
  resolutionLevel?: string;
  groundingSources?: string[];
  epistemicConfidence?: number;
  tensions?: string[];
  attributes?: Record<string, any>;
  identityRoot?: string;
}

export interface CompareInput {
  targetA: CognitiveComparisonTarget;
  targetB: CognitiveComparisonTarget;
  comparisonDimensions?: string[];
}

export interface CognitiveDifference {
  dimension:
    | "assumptions"
    | "scope_resolution"
    | "grounding_provenance"
    | "epistemic_state"
    | "identity_continuity"
    | "tensions"
    | "framing_consequences";
  description: string;
  targetAValue?: any;
  targetBValue?: any;
  significance: "minor" | "material" | "critical";
}

export interface ComparabilityLimit {
  dimension: string;
  reason: string;
  safeToCompare: boolean;
}

export interface CompareOutput {
  targetAId: string;
  targetBId: string;
  comparability: "fully_comparable" | "qualified_comparability" | "incommensurable";
  sharedGrounding: string[];
  sharedAssumptions: string[];
  materialDifferences: CognitiveDifference[];
  comparabilityLimits: ComparabilityLimit[];
  identityContinuous: boolean;
  unresolvedTensions: string[];
}

export const compareRoutine: CognitiveRoutine<CompareInput, CompareOutput> = {
  metadata: {
    id: "coglib:routine:compare",
    name: "Universal Cognitive Comparison",
    version: "1.0.0",
    category: "analysis",
    description: "Evaluates material cognitive differences in assumptions, scope, grounding, epistemic state, identity continuity, and comparability limits.",
  },
  inputs: [
    { name: "targetA", type: "object", required: true, description: "First cognitive object" },
    { name: "targetB", type: "object", required: true, description: "Second cognitive object" },
    { name: "comparisonDimensions", type: "array", required: false, description: "Requested evaluation dimensions" },
  ],
  outputs: [
    { name: "comparisonReport", type: "object", required: true, description: "Detailed cognitive comparison report" },
  ],
  preconditions: [
    {
      id: "valid-targets",
      description: "Both comparison targets must be defined with valid identifiers",
      evaluate: (input) => ({
        passed: Boolean(input?.targetA?.id && input?.targetB?.id),
        reason: "Precondition failed: Both targetA and targetB must be defined with valid IDs",
      }),
    },
  ],
  postconditions: [
    {
      id: "preserves-comparability-limits",
      description: "Incommensurable targets must not produce fully_comparable status",
      evaluate: ({ output }) => ({
        passed:
          output.comparability !== "fully_comparable" ||
          output.comparabilityLimits.every((l) => l.safeToCompare),
        reason: "Postcondition failed: Incommensurable limit marked as fully comparable",
      }),
    },
  ],
  failureModes: [
    {
      code: "COMPARE_INCOMMENSURABLE_FRAMES",
      description: "Targets belong to fundamentally incommensurable ontological frames",
      severity: "qualified",
      recoverable: true,
      mitigation: "Emit qualified output reporting comparability limits without forcing equivalence",
    },
  ],
  provenanceRequirements: {
    requiresSourceAnchors: true,
    preserveLineage: true,
    trackTransformations: true,
    auditRequired: true,
  },
  epistemicContract: {
    producesUncertainty: false,
    uncertaintyHandling: "preserve",
    epistemicDelta: "Exposes framing shifts and material cognitive differences without artificial convergence",
    preservesTensions: true,
  },
  invariants: [
    {
      id: "no-forced-equivalence",
      description: "If targets have disjoint identity roots and no shared grounding, do not claim continuity",
      enforce: (input, output) => {
        if (
          input.targetA.identityRoot &&
          input.targetB.identityRoot &&
          input.targetA.identityRoot !== input.targetB.identityRoot &&
          output.sharedGrounding.length === 0
        ) {
          return {
            valid: !output.identityContinuous,
            violation: "Declared identity continuity for fundamentally disjoint roots without shared grounding",
          };
        }
        return { valid: true };
      },
    },
  ],
  domainHooks: [],
  evaluationHooks: [
    {
      hookId: "material-difference-count",
      metricName: "materialDifferenceCount",
      description: "Number of material differences discovered",
      computeMetric: (output) => output.materialDifferences.filter((d) => d.significance === "material" || d.significance === "critical").length,
    },
  ],
  compatibility: {
    compatibleRoutines: [
      "coglib:routine:shape",
      "coglib:routine:trace",
      "coglib:routine:challenge",
    ],
    incompatibleRoutines: [],
    compositionPatterns: ["pipeline", "branch", "merge", "guarded_transition"],
    requiredKernelVersion: ">=0.1.0",
  },
  execute: (input: CompareInput) => {
    const { targetA, targetB } = input;
    const materialDifferences: CognitiveDifference[] = [];
    const comparabilityLimits: ComparabilityLimit[] = [];
    const unresolvedTensions: string[] = [];

    // 1. Evaluate Assumptions
    const assumptionsA = targetA.assumptions ?? [];
    const assumptionsB = targetB.assumptions ?? [];
    const sharedAssumptions = assumptionsA.filter((a) => assumptionsB.includes(a));
    const uniqueAssumptionsA = assumptionsA.filter((a) => !assumptionsB.includes(a));
    const uniqueAssumptionsB = assumptionsB.filter((b) => !assumptionsA.includes(b));

    if (uniqueAssumptionsA.length > 0 || uniqueAssumptionsB.length > 0) {
      materialDifferences.push({
        dimension: "assumptions",
        description: `Divergent foundational assumptions: A assumes [${uniqueAssumptionsA.join(", ")}], B assumes [${uniqueAssumptionsB.join(", ")}]`,
        targetAValue: uniqueAssumptionsA,
        targetBValue: uniqueAssumptionsB,
        significance: "material",
      });
      unresolvedTensions.push(`Assumption divergence: '${uniqueAssumptionsA.join("; ")}' vs '${uniqueAssumptionsB.join("; ")}'`);
    }

    // 2. Evaluate Scope and Resolution
    if (targetA.scope !== targetB.scope || targetA.resolutionLevel !== targetB.resolutionLevel) {
      const isCriticalScopeMismatch =
        targetA.scope && targetB.scope && targetA.scope !== targetB.scope && !targetA.scope.includes(targetB.scope) && !targetB.scope.includes(targetA.scope);

      materialDifferences.push({
        dimension: "scope_resolution",
        description: `Scope/Resolution disparity: A=(scope:${targetA.scope ?? "default"}, level:${targetA.resolutionLevel ?? "unspecified"}), B=(scope:${targetB.scope ?? "default"}, level:${targetB.resolutionLevel ?? "unspecified"})`,
        targetAValue: { scope: targetA.scope, level: targetA.resolutionLevel },
        targetBValue: { scope: targetB.scope, level: targetB.resolutionLevel },
        significance: isCriticalScopeMismatch ? "critical" : "material",
      });

      if (isCriticalScopeMismatch) {
        comparabilityLimits.push({
          dimension: "scope",
          reason: `Target scopes '${targetA.scope}' and '${targetB.scope}' operate at disparate non-overlapping granularities`,
          safeToCompare: false,
        });
        unresolvedTensions.push(`Incommensurable scope difference between '${targetA.scope}' and '${targetB.scope}'`);
      }
    }

    // 3. Grounding & Provenance
    const groundingA = targetA.groundingSources ?? [];
    const groundingB = targetB.groundingSources ?? [];
    const sharedGrounding = groundingA.filter((g) => groundingB.includes(g));
    const uniqueGroundingA = groundingA.filter((g) => !groundingB.includes(g));
    const uniqueGroundingB = groundingB.filter((g) => !groundingA.includes(g));

    if (uniqueGroundingA.length > 0 || uniqueGroundingB.length > 0) {
      materialDifferences.push({
        dimension: "grounding_provenance",
        description: `Grounding sources diverge: A grounded in [${uniqueGroundingA.join(", ")}], B grounded in [${uniqueGroundingB.join(", ")}]`,
        targetAValue: uniqueGroundingA,
        targetBValue: uniqueGroundingB,
        significance: "material",
      });
    }

    // 4. Epistemic State & Confidence
    const confA = targetA.epistemicConfidence ?? 1.0;
    const confB = targetB.epistemicConfidence ?? 1.0;
    if (Math.abs(confA - confB) >= 0.2) {
      materialDifferences.push({
        dimension: "epistemic_state",
        description: `Epistemic confidence gap: A (${confA}) vs B (${confB})`,
        targetAValue: confA,
        targetBValue: confB,
        significance: "material",
      });
      unresolvedTensions.push(`Epistemic confidence asymmetry: A has confidence ${confA}, B has ${confB}`);
    }

    // 5. Identity Continuity
    const identityContinuous = Boolean(
      (targetA.identityRoot && targetB.identityRoot && targetA.identityRoot === targetB.identityRoot) ||
      (targetA.id === targetB.id) ||
      (sharedGrounding.length > 0 && targetA.name === targetB.name),
    );

    if (!identityContinuous) {
      materialDifferences.push({
        dimension: "identity_continuity",
        description: `Targets do not share continuous identity: A root is '${targetA.identityRoot ?? targetA.id}', B root is '${targetB.identityRoot ?? targetB.id}'`,
        targetAValue: targetA.identityRoot ?? targetA.id,
        targetBValue: targetB.identityRoot ?? targetB.id,
        significance: "material",
      });
    }

    // 6. Framing Consequences & Tensions
    const allTensions = Array.from(new Set([...(targetA.tensions ?? []), ...(targetB.tensions ?? [])]));
    if (allTensions.length > 0) {
      materialDifferences.push({
        dimension: "tensions",
        description: `Active tensions present in compared objects: [${allTensions.join("; ")}]`,
        targetAValue: targetA.tensions,
        targetBValue: targetB.tensions,
        significance: "material",
      });
      unresolvedTensions.push(...allTensions);
    }

    // Determine Overall Comparability
    let comparability: "fully_comparable" | "qualified_comparability" | "incommensurable" = "fully_comparable";
    if (comparabilityLimits.some((l) => !l.safeToCompare)) {
      comparability = "incommensurable";
    } else if (materialDifferences.length > 0 || comparabilityLimits.length > 0) {
      comparability = "qualified_comparability";
    }

    const output: CompareOutput = {
      targetAId: targetA.id,
      targetBId: targetB.id,
      comparability,
      sharedGrounding,
      sharedAssumptions,
      materialDifferences,
      comparabilityLimits,
      identityContinuous,
      unresolvedTensions,
    };

    return {
      status: comparability === "incommensurable" ? "qualified" : "success",
      output,
      epistemicState: {
        confidence: comparability === "incommensurable" ? 0.5 : comparability === "qualified_comparability" ? 0.85 : 1.0,
        uncertaintyBounded: true,
        tensions: unresolvedTensions,
        provenanceLineage: [`compare(${targetA.id}, ${targetB.id})`],
      },
      provenance: {
        routineId: "coglib:routine:compare",
        routineVersion: "1.0.0",
        lineage: [`compare(${targetA.id}, ${targetB.id})`],
        timestamp: new Date().toISOString(),
      },
    };
  },
};

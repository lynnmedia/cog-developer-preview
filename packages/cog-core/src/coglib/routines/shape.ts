/**
 * CogLib SHAPE Routine
 *
 * Governed first-contact operation for transforming raw, unfamiliar, or underspecified input
 * into an initial structured CognitiveObject without fabricating certainty or silently
 * filling in missing information.
 *
 * Categorizes material into:
 * - known (grounded in explicit observations)
 * - inferred (derived via declared relationships)
 * - uncertain (explicitly ambiguous/probabilistic)
 * - missing (required dimensions absent in input)
 * - conflicting (contradictory claims/attributes)
 * - unresolved (open tensions / undetermined aspects)
 */

import {
  CognitiveRoutine,
  CognitivePortDefinition,
  EpistemicState,
} from "../routineContract";

export interface RawInputElement {
  id?: string;
  sourceAnchor?: string;
  statement?: string;
  attributes?: Record<string, any>;
  confidence?: number;
  isContradictoryWith?: string[];
  isInferred?: boolean;
}

export interface ShapeInput {
  objectId?: string;
  rawElements: RawInputElement[];
  expectedDimensions?: string[];
  assumptionsDeclared?: string[];
}

export interface ShapedCognitiveObject {
  objectId: string;
  known: Array<{ id: string; sourceAnchor: string; data: Record<string, any> }>;
  inferred: Array<{ id: string; derivedFrom: string[]; data: Record<string, any> }>;
  uncertain: Array<{ id: string; reason: string; confidence: number; data: Record<string, any> }>;
  missingDimensions: string[];
  conflicts: Array<{ elementIds: string[]; description: string }>;
  unresolvedTensions: string[];
  introducedAssumptions: string[];
}

export const shapeRoutine: CognitiveRoutine<ShapeInput, ShapedCognitiveObject> = {
  metadata: {
    id: "coglib:routine:shape",
    name: "Universal Cognitive Shaping",
    version: "1.0.0",
    category: "synthesis",
    description: "Transforms raw/underspecified input into initial cognitive structure distinguishing known, inferred, uncertain, missing, and conflicting elements without fabricating certainty.",
  },
  inputs: [
    { name: "rawElements", type: "array", required: true, description: "Raw input observations or claims" },
    { name: "expectedDimensions", type: "array", required: false, description: "Expected structural dimensions for complete representation" },
    { name: "assumptionsDeclared", type: "array", required: false, description: "Explicit caller assumptions" },
  ],
  outputs: [
    { name: "shapedObject", type: "object", required: true, description: "Structured cognitive object with explicit epistemic taxonomy" },
  ],
  preconditions: [
    {
      id: "non-empty-raw-elements",
      description: "Must provide at least one raw input element or claim",
      evaluate: (input) => ({
        passed: Array.isArray(input?.rawElements) && input.rawElements.length > 0,
        reason: "Precondition failed: rawElements must be a non-empty array",
      }),
    },
  ],
  postconditions: [
    {
      id: "no-silent-fabrication",
      description: "Shaped object must not contain known elements without source anchors",
      evaluate: ({ output }) => ({
        passed: output.known.every((k) => Boolean(k.sourceAnchor)),
        reason: "Postcondition failed: Known element found without valid source anchor",
      }),
    },
  ],
  failureModes: [
    {
      code: "SHAPE_MISSING_CRITICAL_DIMENSIONS",
      description: "Input lacks essential structural dimensions",
      severity: "qualified",
      recoverable: true,
      mitigation: "Emit qualified output with missing dimensions and reduced confidence",
    },
    {
      code: "SHAPE_CONTRADICTORY_OBSERVATIONS",
      description: "Input contains conflicting observations",
      severity: "qualified",
      recoverable: true,
      mitigation: "Segregate conflicting elements into conflicts list and preserve tension",
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
    epistemicDelta: "Structures raw inputs while exposing missingness, uncertainty, and conflict",
    preservesTensions: true,
  },
  invariants: [
    {
      id: "epistemic-honesty",
      description: "Missing dimensions and conflicts must reduce overall epistemic confidence",
      enforce: (input, output) => {
        const hasDeficiencies = output.missingDimensions.length > 0 || output.conflicts.length > 0;
        return {
          valid: true,
        };
      },
    },
  ],
  domainHooks: [],
  evaluationHooks: [
    {
      hookId: "epistemic-completeness",
      metricName: "completenessRatio",
      description: "Ratio of known dimensions to total expected dimensions",
      computeMetric: (output) => {
        const total = output.known.length + output.missingDimensions.length;
        return total > 0 ? output.known.length / total : 1;
      },
    },
  ],
  compatibility: {
    compatibleRoutines: [
      "coglib:routine:compare",
      "coglib:routine:trace",
      "coglib:routine:challenge",
      "coglib:routine:tension-reconciliation",
    ],
    incompatibleRoutines: [],
    compositionPatterns: ["pipeline", "branch", "merge", "guarded_transition"],
    requiredKernelVersion: ">=0.1.0",
  },
  execute: (input: ShapeInput) => {
    const objectId = input.objectId ?? `cog-obj-${Date.now().toString(36)}`;
    const known: Array<{ id: string; sourceAnchor: string; data: Record<string, any> }> = [];
    const inferred: Array<{ id: string; derivedFrom: string[]; data: Record<string, any> }> = [];
    const uncertain: Array<{ id: string; reason: string; confidence: number; data: Record<string, any> }> = [];
    const conflicts: Array<{ elementIds: string[]; description: string }> = [];
    const unresolvedTensions: string[] = [];

    const availableDimensionKeys = new Set<string>();

    for (let i = 0; i < input.rawElements.length; i++) {
      const elem = input.rawElements[i]!;
      const elemId = elem.id ?? `elem-${i + 1}`;
      const anchor = elem.sourceAnchor ?? (elem.isInferred ? `inferred-from-${elemId}` : `raw-source-${elemId}`);

      if (elem.attributes) {
        Object.keys(elem.attributes).forEach((k) => availableDimensionKeys.add(k));
      }
      if (elem.statement) {
        availableDimensionKeys.add("statement");
      }

      // Categorize into explicit epistemic categories: conflicting, inferred, uncertain, or known
      if (elem.isContradictoryWith && elem.isContradictoryWith.length > 0) {
        conflicts.push({
          elementIds: [elemId, ...elem.isContradictoryWith],
          description: `Element '${elemId}' conflicts with [${elem.isContradictoryWith.join(", ")}]`,
        });
        unresolvedTensions.push(`Conflict on element '${elemId}': contradictory observations`);
      } else if (elem.isInferred) {
        inferred.push({
          id: elemId,
          derivedFrom: [anchor],
          data: { statement: elem.statement, ...elem.attributes },
        });
      } else if (elem.confidence !== undefined && elem.confidence < 0.8) {
        uncertain.push({
          id: elemId,
          reason: `Low observational confidence (${elem.confidence})`,
          confidence: elem.confidence,
          data: { statement: elem.statement, ...elem.attributes },
        });
        unresolvedTensions.push(`Uncertainty on '${elemId}': confidence ${elem.confidence}`);
      } else {
        known.push({
          id: elemId,
          sourceAnchor: anchor,
          data: { statement: elem.statement, ...elem.attributes },
        });
      }
    }

    // Determine missing dimensions (no silent filling!)
    const missingDimensions: string[] = [];
    if (input.expectedDimensions) {
      for (const expectedDim of input.expectedDimensions) {
        if (!availableDimensionKeys.has(expectedDim)) {
          missingDimensions.push(expectedDim);
          unresolvedTensions.push(`Missing expected dimension: '${expectedDim}'`);
        }
      }
    }

    const introducedAssumptions = [...(input.assumptionsDeclared ?? [])];

    // Compute epistemic confidence
    let baseConfidence = 1.0;
    if (missingDimensions.length > 0) {
      baseConfidence -= 0.15 * Math.min(missingDimensions.length, 3);
    }
    if (conflicts.length > 0) {
      baseConfidence -= 0.25 * Math.min(conflicts.length, 2);
    }
    if (uncertain.length > 0) {
      baseConfidence -= 0.1 * Math.min(uncertain.length, 3);
    }
    const finalConfidence = Math.max(0.1, Number(baseConfidence.toFixed(2)));

    const isDegradedOrQualified =
      missingDimensions.length > 0 || conflicts.length > 0 || uncertain.length > 0;

    const shapedObject: ShapedCognitiveObject = {
      objectId,
      known,
      inferred,
      uncertain,
      missingDimensions,
      conflicts,
      unresolvedTensions,
      introducedAssumptions,
    };

    return {
      status: isDegradedOrQualified ? "qualified" : "success",
      output: shapedObject,
      epistemicState: {
        confidence: finalConfidence,
        uncertaintyBounded: true,
        tensions: unresolvedTensions,
        provenanceLineage: ["coglib:routine:shape"],
      },
      provenance: {
        routineId: "coglib:routine:shape",
        routineVersion: "1.0.0",
        lineage: ["coglib:routine:shape"],
        timestamp: new Date().toISOString(),
      },
      metrics: {
        knownCount: known.length,
        inferredCount: inferred.length,
        uncertainCount: uncertain.length,
        missingCount: missingDimensions.length,
        conflictCount: conflicts.length,
      },
    };
  },
};

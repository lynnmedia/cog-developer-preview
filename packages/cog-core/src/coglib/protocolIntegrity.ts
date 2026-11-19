/**
 * CogLib Cognitive Object Protocol (CogOP) Semantic Integrity & Authority Model
 *
 * Defines and enforces the transformation boundaries, immutable field constraints,
 * tension preservation, provenance monotonicity, and change disclosure rules
 * when an envelope is processed by a receiver runtime.
 *
 * CORE GOVERNANCE INVARIANTS:
 * 1. Concept Identity, origin runtime, creation timestamp, and existing source anchors are IMMUTABLE.
 * 2. Active unresolved tensions CANNOT be deleted or suppressed by a receiver.
 * 3. Confidence cannot be inflated without new verifiable grounding anchors.
 * 4. Authority escalation is strictly forbidden.
 * 5. All mutations must be explicitly disclosed in declaredMutations.
 */

import { CognitiveObjectEnvelope, DeclaredMutationRecord, DeclaredMutationAction } from "./cognitiveObjectEnvelope";

export interface EnvelopeMutationRequest<TPayload = any> {
  readonly transformerRuntime: string;
  readonly newPayload?: TPayload;
  readonly addedAssumptions?: readonly string[];
  readonly removedAssumptions?: readonly string[];
  readonly newConfidence?: number;
  readonly addedTensions?: readonly string[];
  readonly addedSourceAnchors?: readonly string[];
  readonly addedGroundingSources?: readonly string[];
  readonly mutationRecords: readonly DeclaredMutationRecord[];
}

export interface TransformationIntegrityReport {
  readonly valid: boolean;
  readonly envelopeId: string;
  readonly violations: readonly string[];
}

/**
 * Validates the semantic integrity of a transformed envelope relative to its original.
 * Fails closed if any unauthorized mutation, tension deletion, anchor stripping,
 * identity substitution, or confidence inflation is detected.
 */
export function validateTransformationIntegrity(
  original: CognitiveObjectEnvelope,
  transformed: CognitiveObjectEnvelope,
): TransformationIntegrityReport {
  const violations: string[] = [];

  // Invariant 1: Envelope & Concept Identity Continuity
  if (transformed.objectId !== original.objectId) {
    violations.push(`Concept Identity violated: objectId changed from '${original.objectId}' to '${transformed.objectId}'`);
  }
  if (transformed.objectType !== original.objectType) {
    violations.push(`ObjectType violated: changed from '${original.objectType}' to '${transformed.objectType}'`);
  }

  // Invariant 2: Origin Runtime & Creation Immutability
  if (transformed.provenance.originRuntime !== original.provenance.originRuntime) {
    violations.push(`Origin runtime immutability violated: changed from '${original.provenance.originRuntime}' to '${transformed.provenance.originRuntime}'`);
  }
  if (transformed.provenance.createdAt !== original.provenance.createdAt) {
    violations.push("Provenance createdAt timestamp immutability violated");
  }

  // Invariant 3: Source Anchor Monotonicity (Cannot delete existing anchors)
  for (const anchor of original.grounding.sourceAnchors) {
    if (!transformed.grounding.sourceAnchors.includes(anchor)) {
      violations.push(`Source anchor stripped: prior anchor '${anchor}' was deleted`);
    }
  }

  // Invariant 4: Unresolved Tension Monotonicity (Cannot delete existing tensions)
  for (const tension of original.epistemicState.tensions) {
    if (!transformed.epistemicState.tensions.includes(tension)) {
      violations.push(`Unresolved tension suppressed: prior tension '${tension}' was deleted`);
    }
  }

  // Invariant 5: Authority Escalation Forbidden
  if (
    transformed.memoryContext &&
    original.memoryContext &&
    transformed.memoryContext.authorityLevel !== original.memoryContext.authorityLevel
  ) {
    violations.push("Authority level escalation/alteration is forbidden across protocol boundaries");
  }

  // Invariant 6: Permission Discipline
  if (!original.permissions.allowMutation) {
    const payloadChanged = JSON.stringify(original.payload) !== JSON.stringify(transformed.payload);
    if (payloadChanged) {
      violations.push("Unauthorized mutation: original envelope permissions disallow mutation (allowMutation=false)");
    }
  }

  // Invariant 7: Confidence Non-Inflation (Unless new grounding anchors added)
  const newAnchorsAdded = transformed.grounding.sourceAnchors.length > original.grounding.sourceAnchors.length;
  if (!newAnchorsAdded && transformed.epistemicState.confidence > original.epistemicState.confidence) {
    violations.push(`Confidence inflation detected: increased from ${original.epistemicState.confidence} to ${transformed.epistemicState.confidence} without new grounding anchors`);
  }

  // Invariant 8: Explicit Change Disclosure
  if (original.permissions.requireChangeDisclosure) {
    const payloadChanged = JSON.stringify(original.payload) !== JSON.stringify(transformed.payload);
    const hasDeclaredMutations = (transformed.declaredMutations?.length ?? 0) > 0;
    if (payloadChanged && !hasDeclaredMutations) {
      violations.push("Missing change disclosure: payload modified but no declaredMutations records attached");
    }
  }

  return {
    valid: violations.length === 0,
    envelopeId: transformed.envelopeId,
    violations,
  };
}

/**
 * Governed transformation engine that applies mutations while enforcing all protocol integrity invariants.
 */
export function applyGovernedEnvelopeTransformation<TPayload = any>(
  original: CognitiveObjectEnvelope<TPayload>,
  mutation: EnvelopeMutationRequest<TPayload>,
): CognitiveObjectEnvelope<TPayload> {
  if (!original.permissions.allowMutation) {
    throw new Error(`Envelope '${original.envelopeId}' does not permit mutation`);
  }

  const newAnchors = Array.from(new Set([...original.grounding.sourceAnchors, ...(mutation.addedSourceAnchors ?? [])]));
  const newTensions = Array.from(new Set([...original.epistemicState.tensions, ...(mutation.addedTensions ?? [])]));
  const newGrounding = Array.from(new Set([...original.grounding.groundingSources, ...(mutation.addedGroundingSources ?? [])]));

  let finalConfidence = mutation.newConfidence ?? original.epistemicState.confidence;
  // Guard against inflation if no new anchors added
  if (newAnchors.length === original.grounding.sourceAnchors.length && finalConfidence > original.epistemicState.confidence) {
    finalConfidence = original.epistemicState.confidence;
  }

  const existingMutations = original.declaredMutations ?? [];
  const updatedMutations = [...existingMutations, ...mutation.mutationRecords];

  const newLineage = [...original.provenance.lineage, `transformed_by(${mutation.transformerRuntime})`];

  const transformed: CognitiveObjectEnvelope<TPayload> = {
    ...original,
    payload: mutation.newPayload !== undefined ? mutation.newPayload : original.payload,
    epistemicState: {
      ...original.epistemicState,
      confidence: finalConfidence,
      tensions: newTensions,
    },
    grounding: {
      ...original.grounding,
      sourceAnchors: newAnchors,
      groundingSources: newGrounding,
    },
    provenance: {
      ...original.provenance,
      lineage: newLineage,
      lastTransformedAt: new Date().toISOString(),
    },
    declaredMutations: updatedMutations,
  };

  const check = validateTransformationIntegrity(original, transformed);
  if (!check.valid) {
    throw new Error(`Transformation integrity check failed: ${check.violations.join("; ")}`);
  }

  return transformed;
}

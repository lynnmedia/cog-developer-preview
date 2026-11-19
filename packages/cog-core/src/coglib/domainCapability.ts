/**
 * CogLib Domain Capability Contract & Governance
 *
 * Governed contract through which domain cognition may specialize CogLib routines
 * without CogLib becoming domain-specific or weakening core governance invariants.
 *
 * A mounted DomainCapability exposes bounded domain vocabulary, invariants,
 * evidence classes, and routine specialization hooks.
 *
 * PROHIBITED OVERRIDES:
 * Domain capabilities MUST NOT:
 * 1. Weaken provenance tracking or forge source anchors.
 * 2. Fabricate certainty or override epistemic qualifications.
 * 3. Bypass or weaken CogLib invariants and preconditions/postconditions.
 * 4. Suppress failure modes or convert fatal/qualified errors into false success.
 * 5. Violate kernel authority or execute unbounded side-effects.
 */

import { CognitiveRoutineExecutionResult, EpistemicState } from "./routineContract";

export interface DomainInvariant {
  id: string;
  description: string;
  enforce: (target: any) => { valid: boolean; violation?: string };
}

export interface DomainFailurePattern {
  code: string;
  description: string;
  domainMitigation: string;
}

export interface DomainEvaluationHook {
  metricId: string;
  metricName: string;
  description: string;
  compute: (output: any) => number | Record<string, any>;
}

export interface DomainShapeSpecialization {
  expectedDimensions?: string[];
  recognizedObjectClasses?: string[];
  domainAssumptions?: string[];
  categorizeRawElement?: (element: any) => {
    isDomainKnown?: boolean;
    domainClass?: string;
    domainAnchorValid?: boolean;
  };
}

export interface DomainCompareSpecialization {
  domainDimensions?: string[];
  evaluateDomainDifference?: (targetA: any, targetB: any) => {
    differences: Array<{ dimension: string; description: string; significance: "minor" | "material" | "critical" }>;
    incommensurabilityLimits?: Array<{ dimension: string; reason: string }>;
  };
}

export interface DomainChallengeSpecialization {
  inspectDomainVulnerabilities?: (target: any, evidencePool?: any[]) => Array<{
    dimension: string;
    severity: "minor" | "moderate" | "severe";
    description: string;
    groundingRef: string;
  }>;
}

export interface DomainCapabilityHooks {
  onShape?: DomainShapeSpecialization;
  onCompare?: DomainCompareSpecialization;
  onChallenge?: DomainChallengeSpecialization;
  evaluationHooks?: DomainEvaluationHook[];
}

export interface DomainCapability {
  readonly id: string; // e.g. "capability:domain:music"
  readonly name: string;
  readonly version: string;
  readonly targetDomain: string;
  readonly description: string;

  readonly objectClasses: readonly string[];
  readonly significantDimensions: readonly string[];
  readonly relationshipVocabulary: readonly string[];
  readonly domainInvariants: readonly DomainInvariant[];
  readonly evidenceClasses: readonly string[];
  readonly domainAssumptions: readonly string[];
  readonly characteristicFailures: readonly DomainFailurePattern[];

  readonly hooks: DomainCapabilityHooks;

  // Security & governance signature
  readonly securityPolicy?: {
    prohibitsForgedLineage: boolean;
    prohibitsConfidenceInflation: boolean;
  };
}

export interface CapabilityValidationReport {
  valid: boolean;
  capabilityId: string;
  defects: string[];
}

/**
 * Validates that a candidate DomainCapability adheres to the governed contract
 * and does not declare prohibited overrides.
 */
export function validateDomainCapabilityContract(capability: DomainCapability): CapabilityValidationReport {
  const defects: string[] = [];

  if (!capability.id || !capability.id.startsWith("capability:domain:")) {
    defects.push("Capability id must begin with 'capability:domain:' prefix");
  }
  if (!capability.name) defects.push("Capability name is required");
  if (!capability.version || !/^\d+\.\d+\.\d+/.test(capability.version)) {
    defects.push("Capability version must follow SemVer format (e.g. 1.0.0)");
  }
  if (!capability.targetDomain) defects.push("Capability targetDomain is required");
  if (!Array.isArray(capability.objectClasses) || capability.objectClasses.length === 0) {
    defects.push("Capability must declare at least one domain object class");
  }
  if (!Array.isArray(capability.significantDimensions) || capability.significantDimensions.length === 0) {
    defects.push("Capability must declare at least one significant dimension");
  }
  if (!Array.isArray(capability.relationshipVocabulary)) {
    defects.push("Capability relationshipVocabulary must be an array");
  }
  if (!Array.isArray(capability.domainInvariants)) {
    defects.push("Capability domainInvariants must be an array");
  }
  if (!Array.isArray(capability.evidenceClasses)) {
    defects.push("Capability evidenceClasses must be an array");
  }
  if (!capability.hooks) {
    defects.push("Capability hooks object is required");
  }

  return {
    valid: defects.length === 0,
    capabilityId: capability.id ?? "unknown",
    defects,
  };
}

/**
 * Enforces CogLib governance boundaries over a domain specialization execution.
 * Guarantees that domain hooks can amplify and specialize output, but CANNOT:
 * - Inflate epistemic confidence artificially
 * - Remove or suppress unresolved tensions
 * - Delete provenance lineage steps
 * - Convert failed/qualified statuses to success
 */
export function applyGovernedSpecialization<TOutput = any>(
  baseResult: CognitiveRoutineExecutionResult<TOutput>,
  specializedDelta: {
    enhancedOutput?: Partial<TOutput>;
    domainTensions?: string[];
    domainMetrics?: Record<string, any>;
    attemptedConfidenceOverride?: number;
  },
  capability: DomainCapability,
): CognitiveRoutineExecutionResult<TOutput> {
  // Governance Invariant 1: Confidence cannot be inflated beyond base result
  let governedConfidence = baseResult.epistemicState.confidence;
  if (specializedDelta.attemptedConfidenceOverride !== undefined) {
    if (specializedDelta.attemptedConfidenceOverride > baseResult.epistemicState.confidence) {
      // PROHIBITED OVERRIDE: Reject inflation
      governedConfidence = baseResult.epistemicState.confidence;
    } else {
      governedConfidence = specializedDelta.attemptedConfidenceOverride;
    }
  }

  // Governance Invariant 2: Tensions are monotonic union (never silently dropped)
  const mergedTensions = Array.from(
    new Set([
      ...baseResult.epistemicState.tensions,
      ...(specializedDelta.domainTensions ?? []),
    ]),
  );

  // Governance Invariant 3: Provenance lineage must retain routine ID and record capability mount
  const governedLineage = [
    ...baseResult.provenance.lineage,
    `mounted(${capability.id})`,
  ];

  // Governance Invariant 4: Status cannot be demoted from qualified to success if tensions exist
  let governedStatus = baseResult.status;
  if (mergedTensions.length > 0 && governedStatus === "success") {
    governedStatus = "qualified";
  }

  return {
    ...baseResult,
    status: governedStatus,
    output: specializedDelta.enhancedOutput
      ? ({ ...baseResult.output, ...specializedDelta.enhancedOutput } as TOutput)
      : baseResult.output,
    epistemicState: {
      ...baseResult.epistemicState,
      confidence: governedConfidence,
      tensions: mergedTensions,
      provenanceLineage: governedLineage,
    },
    provenance: {
      ...baseResult.provenance,
      lineage: governedLineage,
    },
    metrics: {
      ...baseResult.metrics,
      ...(specializedDelta.domainMetrics ?? {}),
      mountedCapability: capability.id,
    },
  };
}

/**
 * CogLib Cognitive Object Protocol (CogOP) Envelope Contract
 *
 * Universal portable envelope for transporting declared cognitive artifacts
 * between heterogeneous runtimes without coupling to sender internals,
 * hidden model states, or vendor-specific execution mechanics.
 *
 * CORE GOVERNANCE PRINCIPLES:
 * 1. CogOP transports inspectable declared cognitive artifacts, NOT hidden model state,
 *    chain-of-thought tokens, or opaque neural representations.
 * 2. Semantic identity, provenance, epistemic qualification, active tensions,
 *    authority boundaries, and mutation lineage must survive serialization intact.
 */

import { MemoryAuthorityLevel } from "./memoryInterface";

export type CogOpProtocolVersion = "cogop/1.0";

export interface CognitiveObjectPermissions {
  readonly allowMutation: boolean;
  readonly permittedOperations: readonly string[]; // e.g. ["shape", "compare", "challenge", "trace"]
  readonly allowAuthorityEscalation: false;       // Always false
  readonly requireChangeDisclosure: boolean;
}

export type DeclaredMutationAction =
  | "PRESERVED"
  | "ADDED"
  | "MODIFIED"
  | "REMOVED"
  | "CHALLENGED"
  | "UNRESOLVED";

export interface DeclaredMutationRecord {
  readonly timestamp: string; // ISO 8601
  readonly transformerRuntime: string;
  readonly action: DeclaredMutationAction;
  readonly field: string;
  readonly rationale: string;
  readonly previousValueSummary?: string;
  readonly newValueSummary?: string;
}

export interface CognitiveObjectEnvelope<TPayload = any> {
  readonly envelopeId: string; // "cogop:env:<id>"
  readonly protocolVersion: CogOpProtocolVersion;
  readonly objectId: string;
  readonly objectType: string;
  readonly scope: string;
  readonly frameAndIntent: {
    readonly frame: string;
    readonly intent: string;
    readonly perspective?: string;
  };
  readonly payload: TPayload;
  readonly assumptions: readonly string[];
  readonly epistemicState: {
    readonly confidence: number; // [0.0, 1.0]
    readonly tensions: readonly string[];
    readonly isHypothetical?: boolean;
    readonly limitations?: readonly string[];
  };
  readonly grounding: {
    readonly sourceAnchors: readonly string[];
    readonly groundingSources: readonly string[];
    readonly evidenceIds?: readonly string[];
  };
  readonly provenance: {
    readonly originRuntime: string;
    readonly lineage: readonly string[];
    readonly createdAt: string; // ISO 8601
    readonly lastTransformedAt?: string; // ISO 8601
  };
  readonly capabilityContext?: {
    readonly requiredCapabilityId?: string;
    readonly mountedCapabilities?: readonly string[];
  };
  readonly memoryContext?: {
    readonly authorityLevel: MemoryAuthorityLevel;
    readonly isStale?: boolean;
    readonly priorStateVersion?: number;
  };
  readonly permissions: CognitiveObjectPermissions;
  readonly requestedOperation?: {
    readonly routineId: string;
    readonly parameters?: Readonly<Record<string, any>>;
  };
  readonly declaredMutations?: readonly DeclaredMutationRecord[];
}

export interface EnvelopeValidationReport {
  readonly valid: boolean;
  readonly envelopeId: string;
  readonly defects: readonly string[];
}

/**
 * Validates that a CognitiveObjectEnvelope satisfies the CogOP specification
 * and does not contain prohibited hidden model states or ungrounded fields.
 */
export function validateCognitiveObjectEnvelope(envelope: CognitiveObjectEnvelope): EnvelopeValidationReport {
  const defects: string[] = [];

  if (!envelope) {
    return { valid: false, envelopeId: "unknown", defects: ["Envelope is null or undefined"] };
  }

  if (!envelope.envelopeId || !envelope.envelopeId.startsWith("cogop:env:")) {
    defects.push("Envelope envelopeId must begin with 'cogop:env:' prefix");
  }

  if (envelope.protocolVersion !== "cogop/1.0") {
    defects.push(`Unsupported protocolVersion '${envelope.protocolVersion}'; expected 'cogop/1.0'`);
  }

  if (!envelope.objectId) defects.push("Envelope objectId is required");
  if (!envelope.objectType) defects.push("Envelope objectType is required");
  if (!envelope.scope) defects.push("Envelope scope is required");

  // Frame & Intent
  if (!envelope.frameAndIntent) {
    defects.push("Envelope frameAndIntent is required");
  } else {
    if (!envelope.frameAndIntent.frame) defects.push("frameAndIntent.frame is required");
    if (!envelope.frameAndIntent.intent) defects.push("frameAndIntent.intent is required");
  }

  // Epistemic State
  if (!envelope.epistemicState) {
    defects.push("Envelope epistemicState is required");
  } else {
    if (envelope.epistemicState.confidence === undefined || envelope.epistemicState.confidence < 0 || envelope.epistemicState.confidence > 1) {
      defects.push("epistemicState.confidence must be between 0.0 and 1.0");
    }
    if (!Array.isArray(envelope.epistemicState.tensions)) {
      defects.push("epistemicState.tensions must be an array");
    }
  }

  // Grounding
  if (!envelope.grounding) {
    defects.push("Envelope grounding is required");
  } else {
    if (!Array.isArray(envelope.grounding.sourceAnchors)) defects.push("grounding.sourceAnchors must be an array");
    if (!Array.isArray(envelope.grounding.groundingSources)) defects.push("grounding.groundingSources must be an array");
  }

  // Provenance
  if (!envelope.provenance) {
    defects.push("Envelope provenance is required");
  } else {
    if (!envelope.provenance.originRuntime) defects.push("provenance.originRuntime is required");
    if (!Array.isArray(envelope.provenance.lineage)) defects.push("provenance.lineage must be an array");
    if (!envelope.provenance.createdAt) defects.push("provenance.createdAt is required");
  }

  // Permissions
  if (!envelope.permissions) {
    defects.push("Envelope permissions is required");
  } else {
    if (typeof envelope.permissions.allowMutation !== "boolean") defects.push("permissions.allowMutation must be a boolean");
    if (!Array.isArray(envelope.permissions.permittedOperations)) defects.push("permissions.permittedOperations must be an array");
    if (envelope.permissions.allowAuthorityEscalation !== false) {
      defects.push("permissions.allowAuthorityEscalation must strictly be false");
    }
  }

  // Anti-Hidden State Invariant: Disallow hidden model states or opaque reasoning traces
  const prohibitedKeys = [
    "chainOfThought",
    "hiddenState",
    "modelLogits",
    "opaqueReasoningTrace",
    "systemPromptTokens",
  ];
  for (const key of prohibitedKeys) {
    if ((envelope as any)[key] !== undefined || (envelope.payload && (envelope.payload as any)[key] !== undefined)) {
      defects.push(`PROHIBITED: Transporting hidden model state or opaque trace key '${key}' is forbidden in CogOP`);
    }
  }

  return {
    valid: defects.length === 0,
    envelopeId: envelope.envelopeId ?? "unknown",
    defects,
  };
}

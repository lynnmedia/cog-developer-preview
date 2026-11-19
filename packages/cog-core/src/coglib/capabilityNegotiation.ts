/**
 * CogLib Cognitive Capability Negotiation Engine
 *
 * Ensures heterogeneous runtimes can exchange cognitive tasks and envelopes
 * without falsely implying capability equivalence or silently dropping domain requirements.
 *
 * CORE GOVERNANCE PRINCIPLES:
 * 1. Heterogeneous systems negotiate protocol versions, supported routines,
 *    mounted domain capabilities, and evidence roles before execution.
 * 2. Missing capabilities must remain explicitly visible via dispositions and qualifications:
 *    SUPPORTED | SUPPORTED_WITH_QUALIFICATION | REQUIRES_CAPABILITY | UNSUPPORTED | VERSION_INCOMPATIBLE
 * 3. A generic node must NOT pretend to perform specialized domain analysis.
 */

import { CognitiveObjectEnvelope } from "./cognitiveObjectEnvelope";
import { ToolEpistemicRole } from "./toolEpistemicContract";

export type CapabilityNegotiationDisposition =
  | "SUPPORTED"
  | "SUPPORTED_WITH_QUALIFICATION"
  | "REQUIRES_CAPABILITY"
  | "UNSUPPORTED"
  | "VERSION_INCOMPATIBLE";

export interface CognitiveCapabilityProfile {
  readonly runtimeId: string;
  readonly supportedProtocolVersions: readonly string[]; // e.g. ["cogop/1.0"]
  readonly supportedRoutines: ReadonlyArray<{ routineId: string; version: string }>;
  readonly mountedCapabilities: readonly string[]; // e.g. ["capability:domain:scientific-inquiry"]
  readonly supportedEvidenceRoles: readonly ToolEpistemicRole[];
  readonly supportsMemory: boolean;
  readonly supportsEvaluation: boolean;
  readonly allowsMutations: boolean;
}

export interface CapabilityNegotiationResult {
  readonly disposition: CapabilityNegotiationDisposition;
  readonly canExecute: boolean;
  readonly qualifications: readonly string[];
  readonly missingCapabilities: readonly string[];
  readonly negotiatedProtocolVersion?: string;
  readonly rationale: string;
}

/**
 * Negotiates whether a runtime can accept and execute the operation requested in a CognitiveObjectEnvelope.
 */
export function negotiateCognitiveTask(
  envelope: CognitiveObjectEnvelope,
  runtimeProfile: CognitiveCapabilityProfile,
): CapabilityNegotiationResult {
  // 1. Check Protocol Version
  if (!runtimeProfile.supportedProtocolVersions.includes(envelope.protocolVersion)) {
    return {
      disposition: "VERSION_INCOMPATIBLE",
      canExecute: false,
      qualifications: [`Runtime '${runtimeProfile.runtimeId}' does not support protocol version '${envelope.protocolVersion}'`],
      missingCapabilities: [],
      rationale: `Protocol version mismatch: requested '${envelope.protocolVersion}', supported [${runtimeProfile.supportedProtocolVersions.join(", ")}]`,
    };
  }

  // 2. Check Requested Operation (if specified)
  const requestedOp = envelope.requestedOperation;
  if (requestedOp) {
    const routineMatch = runtimeProfile.supportedRoutines.find((r) => r.routineId === requestedOp.routineId);
    if (!routineMatch) {
      return {
        disposition: "UNSUPPORTED",
        canExecute: false,
        qualifications: [`Requested routine '${requestedOp.routineId}' is not supported by runtime '${runtimeProfile.runtimeId}'`],
        missingCapabilities: [requestedOp.routineId],
        negotiatedProtocolVersion: envelope.protocolVersion,
        rationale: `Unsupported routine '${requestedOp.routineId}'`,
      };
    }
  }

  // 3. Check Required Domain Capability
  const requiredCap = envelope.capabilityContext?.requiredCapabilityId;
  if (requiredCap) {
    const hasCapability = runtimeProfile.mountedCapabilities.includes(requiredCap);
    if (!hasCapability) {
      // If envelope permits mutation and requested routine is generic-compatible, allow qualified execution
      // Otherwise, return REQUIRES_CAPABILITY
      return {
        disposition: "REQUIRES_CAPABILITY",
        canExecute: false,
        qualifications: [`Envelope requires domain capability '${requiredCap}' which is not mounted on runtime '${runtimeProfile.runtimeId}'`],
        missingCapabilities: [requiredCap],
        negotiatedProtocolVersion: envelope.protocolVersion,
        rationale: `Hard capability dependency '${requiredCap}' is missing`,
      };
    }
  }

  // 4. Check Optional Capability Context (Partial / Generic fallback)
  const mountedCapsInEnvelope = envelope.capabilityContext?.mountedCapabilities ?? [];
  const unmountedCaps = mountedCapsInEnvelope.filter((c) => !runtimeProfile.mountedCapabilities.includes(c));

  if (unmountedCaps.length > 0) {
    return {
      disposition: "SUPPORTED_WITH_QUALIFICATION",
      canExecute: true,
      qualifications: [
        `Executing in generic mode; originating domain capabilities [${unmountedCaps.join(", ")}] are not mounted on this runtime`,
      ],
      missingCapabilities: unmountedCaps,
      negotiatedProtocolVersion: envelope.protocolVersion,
      rationale: `Partial support: executing using generic CogLib routines with explicit domain qualifications`,
    };
  }

  // 5. Full native support
  return {
    disposition: "SUPPORTED",
    canExecute: true,
    qualifications: [],
    missingCapabilities: [],
    negotiatedProtocolVersion: envelope.protocolVersion,
    rationale: `Full native capability match on runtime '${runtimeProfile.runtimeId}'`,
  };
}

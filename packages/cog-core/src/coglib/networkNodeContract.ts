/**
 * CogLib Big Net Coordination Layer: Governed Cognitive Node Contract
 *
 * Defines the contract, capability declaration, trust boundary, and availability
 * profile for heterogeneous cognitive nodes participating in Big Net coordination.
 *
 * CORE GOVERNANCE PRINCIPLES:
 * 1. Node Identity != Capability Identity: A node may host multiple capabilities;
 *    a capability may be hosted on multiple nodes.
 * 2. Trust and authority are explicitly scoped, NOT collapsed into a scalar score.
 * 3. Big Net is an in-process / protocol-governed coordination layer, not an
 *    infrastructure deployment or distributed-agent swarm.
 */

import { ToolEpistemicRole } from "./toolEpistemicContract";
import { MemoryAuthorityLevel } from "./memoryInterface";

export type CognitiveNodeStatus = "online" | "busy" | "degraded" | "offline";

export interface NodeTrustScope {
  readonly authorizedDomains: readonly string[];
  readonly maximumAuthorityTier: MemoryAuthorityLevel;
  readonly allowedEvidenceRoles: readonly ToolEpistemicRole[];
  readonly requiresMutualReview: boolean;
}

export interface GovernedCognitiveNodeProfile {
  readonly nodeId: string; // e.g. "node:science-lab:verifier-01"
  readonly protocolVersions: readonly string[]; // e.g. ["cogop/1.0"]
  readonly supportedRoutines: ReadonlyArray<{ routineId: string; version: string }>;
  readonly mountedCapabilities: readonly string[]; // e.g. ["capability:domain:scientific-inquiry"]
  readonly supportsMemory: boolean;
  readonly supportsTools: boolean;
  readonly supportsEvaluation: boolean;
  readonly supportedInstruments: readonly string[]; // e.g. ["instrument:drift-lens", "instrument:epistemic-map"]
  readonly trustScope: NodeTrustScope;
  readonly availability: {
    readonly status: CognitiveNodeStatus;
    readonly queueDepth?: number;
    readonly concurrencyLimit?: number;
    readonly lastHeartbeatAt: string; // ISO 8601
  };
  readonly limitations: readonly string[];
}

export interface NodeValidationReport {
  readonly valid: boolean;
  readonly nodeId: string;
  readonly defects: readonly string[];
}

/**
 * Validates that a GovernedCognitiveNodeProfile conforms to Big Net coordination specifications.
 */
export function validateGovernedNodeProfile(node: GovernedCognitiveNodeProfile): NodeValidationReport {
  const defects: string[] = [];

  if (!node) {
    return { valid: false, nodeId: "unknown", defects: ["Node profile is null or undefined"] };
  }

  if (!node.nodeId || !node.nodeId.startsWith("node:")) {
    defects.push("Node nodeId must begin with 'node:' prefix");
  }

  if (!Array.isArray(node.protocolVersions) || node.protocolVersions.length === 0) {
    defects.push("Node protocolVersions must be a non-empty array");
  }

  if (!Array.isArray(node.supportedRoutines) || node.supportedRoutines.length === 0) {
    defects.push("Node supportedRoutines must be a non-empty array");
  }

  // Node identity != Capability identity invariant
  if (node.mountedCapabilities && node.mountedCapabilities.includes(node.nodeId)) {
    defects.push(`CONFLATION: nodeId '${node.nodeId}' cannot be identical to a mountedCapability identity`);
  }

  if (!node.trustScope) {
    defects.push("Node trustScope is required");
  } else {
    if (!node.trustScope.maximumAuthorityTier) {
      defects.push("trustScope.maximumAuthorityTier is required");
    }
    if (!Array.isArray(node.trustScope.authorizedDomains)) {
      defects.push("trustScope.authorizedDomains must be an array");
    }
    if (!Array.isArray(node.trustScope.allowedEvidenceRoles)) {
      defects.push("trustScope.allowedEvidenceRoles must be an array");
    }
  }

  if (!node.availability) {
    defects.push("Node availability is required");
  } else {
    const validStatuses: CognitiveNodeStatus[] = ["online", "busy", "degraded", "offline"];
    if (!validStatuses.includes(node.availability.status)) {
      defects.push(`Invalid availability status '${node.availability.status}'`);
    }
    if (!node.availability.lastHeartbeatAt) {
      defects.push("availability.lastHeartbeatAt is required");
    }
  }

  if (!Array.isArray(node.limitations)) {
    defects.push("Node limitations must be an array");
  }

  return {
    valid: defects.length === 0,
    nodeId: node.nodeId ?? "unknown",
    defects,
  };
}

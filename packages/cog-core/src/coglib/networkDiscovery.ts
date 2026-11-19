/**
 * CogLib Big Net Coordination Layer: Capability Discovery Engine
 *
 * Evaluates candidate cognitive node profiles against task requirements
 * without hard-coded global topology, centralized orchestrator assumptions,
 * or false capability claims.
 */

import { GovernedCognitiveNodeProfile, CognitiveNodeStatus } from "./networkNodeContract";
import { ToolEpistemicRole } from "./toolEpistemicContract";
import { MemoryAuthorityLevel } from "./memoryInterface";

export type DiscoveryDisposition =
  | "MATCH"
  | "MATCH_WITH_QUALIFICATION"
  | "NO_CAPABILITY"
  | "TRUST_INSUFFICIENT"
  | "VERSION_INCOMPATIBLE"
  | "UNAVAILABLE";

export interface NodeDiscoveryQuery {
  readonly requiredRoutineId?: string;
  readonly requiredDomainCapabilityId?: string;
  readonly requiredProtocolVersion?: string; // defaults to "cogop/1.0"
  readonly requiredMemorySupport?: boolean;
  readonly requiredEvidenceRole?: ToolEpistemicRole;
  readonly targetScope?: string;
  readonly demandedAuthorityTier?: MemoryAuthorityLevel;
  readonly maxAcceptableAvailabilityStatus?: CognitiveNodeStatus;
}

export interface NodeDiscoveryEvaluation {
  readonly nodeId: string;
  readonly disposition: DiscoveryDisposition;
  readonly isEligible: boolean;
  readonly qualifications: readonly string[];
  readonly rejections: readonly string[];
}

const AUTHORITY_RANK: Record<MemoryAuthorityLevel, number> = {
  inferred: 1,
  semantic: 2,
  episodic: 3,
  project: 4,
  canonical: 5,
};

/**
 * Evaluates a single cognitive node profile against a discovery query.
 */
export function evaluateNodeDiscoveryMatch(
  node: GovernedCognitiveNodeProfile,
  query: NodeDiscoveryQuery,
): NodeDiscoveryEvaluation {
  const reqVersion = query.requiredProtocolVersion ?? "cogop/1.0";
  const qualifications: string[] = [];
  const rejections: string[] = [];

  // 1. Check Protocol Version
  if (!node.protocolVersions.includes(reqVersion)) {
    return {
      nodeId: node.nodeId,
      disposition: "VERSION_INCOMPATIBLE",
      isEligible: false,
      qualifications: [],
      rejections: [`Node does not support required protocol version '${reqVersion}'`],
    };
  }

  // 2. Check Availability
  if (node.availability.status === "offline") {
    return {
      nodeId: node.nodeId,
      disposition: "UNAVAILABLE",
      isEligible: false,
      qualifications: [],
      rejections: ["Node is currently offline"],
    };
  }

  if (node.availability.status === "degraded" && query.maxAcceptableAvailabilityStatus === "online") {
    return {
      nodeId: node.nodeId,
      disposition: "UNAVAILABLE",
      isEligible: false,
      qualifications: [],
      rejections: ["Node is in degraded operational state"],
    };
  }

  // 3. Check Trust & Authority Scope
  if (query.demandedAuthorityTier) {
    const nodeMax = AUTHORITY_RANK[node.trustScope.maximumAuthorityTier];
    const demanded = AUTHORITY_RANK[query.demandedAuthorityTier];
    if (demanded > nodeMax) {
      return {
        nodeId: node.nodeId,
        disposition: "TRUST_INSUFFICIENT",
        isEligible: false,
        qualifications: [],
        rejections: [
          `Demanded authority '${query.demandedAuthorityTier}' exceeds node maximum '${node.trustScope.maximumAuthorityTier}'`,
        ],
      };
    }
  }

  if (query.targetScope && !node.trustScope.authorizedDomains.includes("*")) {
    const isAuthorized = node.trustScope.authorizedDomains.some((d) =>
      query.targetScope!.startsWith(d) || d.startsWith(query.targetScope!),
    );
    if (!isAuthorized) {
      return {
        nodeId: node.nodeId,
        disposition: "TRUST_INSUFFICIENT",
        isEligible: false,
        qualifications: [],
        rejections: [`Target scope '${query.targetScope}' not within authorized domains [${node.trustScope.authorizedDomains.join(", ")}]`],
      };
    }
  }

  if (query.requiredEvidenceRole && !node.trustScope.allowedEvidenceRoles.includes(query.requiredEvidenceRole)) {
    return {
      nodeId: node.nodeId,
      disposition: "TRUST_INSUFFICIENT",
      isEligible: false,
      qualifications: [],
      rejections: [`Required evidence role '${query.requiredEvidenceRole}' not permitted by node trust scope`],
    };
  }

  // 4. Check Routine & Memory Requirements
  if (query.requiredRoutineId) {
    const hasRoutine = node.supportedRoutines.some((r) => r.routineId === query.requiredRoutineId);
    if (!hasRoutine) {
      return {
        nodeId: node.nodeId,
        disposition: "NO_CAPABILITY",
        isEligible: false,
        qualifications: [],
        rejections: [`Node does not support required routine '${query.requiredRoutineId}'`],
      };
    }
  }

  if (query.requiredMemorySupport && !node.supportsMemory) {
    return {
      nodeId: node.nodeId,
      disposition: "NO_CAPABILITY",
      isEligible: false,
      qualifications: [],
      rejections: ["Node lacks memory support"],
    };
  }

  // 5. Check Domain Capability Requirement
  if (query.requiredDomainCapabilityId) {
    const hasCapability = node.mountedCapabilities.includes(query.requiredDomainCapabilityId);
    if (!hasCapability) {
      return {
        nodeId: node.nodeId,
        disposition: "NO_CAPABILITY",
        isEligible: false,
        qualifications: [],
        rejections: [`Node lacks demanded domain capability '${query.requiredDomainCapabilityId}'`],
      };
    }
  }

  // 6. Disposition Verdict
  if (node.availability.status === "busy" || node.availability.status === "degraded") {
    qualifications.push(`Node is operational but currently ${node.availability.status}`);
  }

  const disposition: DiscoveryDisposition = qualifications.length > 0 ? "MATCH_WITH_QUALIFICATION" : "MATCH";

  return {
    nodeId: node.nodeId,
    disposition,
    isEligible: true,
    qualifications,
    rejections,
  };
}

/**
 * Discovers and filters all eligible nodes from a candidate pool.
 */
export function discoverEligibleNodes(
  nodes: readonly GovernedCognitiveNodeProfile[],
  query: NodeDiscoveryQuery,
): readonly NodeDiscoveryEvaluation[] {
  return nodes.map((node) => evaluateNodeDiscoveryMatch(node, query));
}

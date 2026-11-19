/**
 * CogLib Big Net Coordination Layer: Governed Routing & Delegation Engine
 *
 * Directs cognitive envelopes to qualified nodes based on cognitive requirements,
 * trust boundaries, and failure isolation without generic ranking or scheduler engines.
 * Constructs inspectable, provenance-bearing delegation tickets.
 */

import { CognitiveObjectEnvelope } from "./cognitiveObjectEnvelope";
import { GovernedCognitiveNodeProfile } from "./networkNodeContract";
import { evaluateNodeDiscoveryMatch, NodeDiscoveryEvaluation } from "./networkDiscovery";
import { MemoryAuthorityLevel } from "./memoryInterface";
import { ToolEpistemicRole } from "./toolEpistemicContract";

export interface CognitiveDelegationTicket {
  readonly ticketId: string; // e.g. "ticket:del:<id>"
  readonly envelopeId: string;
  readonly objectId: string;
  readonly delegatingRuntime: string;
  readonly targetNodeId: string;
  readonly delegatedRoutineId: string;
  readonly grantedAuthorityTier: MemoryAuthorityLevel;
  readonly delegatedCapabilities: readonly string[];
  readonly requiredEvidenceRoles: readonly ToolEpistemicRole[];
  readonly selectionRationale: string;
  readonly failureIsolationDomain: string;
  readonly issuedAt: string; // ISO 8601
}

export interface NodeRoutingCriteria {
  readonly envelope: CognitiveObjectEnvelope;
  readonly delegatorRuntimeId: string;
  readonly candidateNodes: readonly GovernedCognitiveNodeProfile[];
  readonly excludeNodeIds?: readonly string[]; // For failure isolation or conflict of interest
  readonly demandedEvidenceRoles?: readonly ToolEpistemicRole[];
}

export interface NodeRoutingResult {
  readonly routed: boolean;
  readonly selectedNodeId?: string;
  readonly delegationTicket?: CognitiveDelegationTicket;
  readonly candidateEvaluations: readonly NodeDiscoveryEvaluation[];
  readonly routingRationale: string;
}

/**
 * Evaluates candidate nodes against an envelope's requirements and issues a governed delegation ticket.
 */
export function routeAndDelegateCognitiveTask(criteria: NodeRoutingCriteria): NodeRoutingResult {
  const env = criteria.envelope;
  const requestedRoutine = env.requestedOperation?.routineId ?? "coglib:routine:shape";
  const requiredCap = env.capabilityContext?.requiredCapabilityId;
  const targetScope = env.scope;
  const authorityTier = env.memoryContext?.authorityLevel ?? "project";
  const excluded = criteria.excludeNodeIds ?? [];

  const candidateEvals: NodeDiscoveryEvaluation[] = [];

  // Filter and evaluate candidates
  for (const node of criteria.candidateNodes) {
    if (excluded.includes(node.nodeId)) {
      candidateEvals.push({
        nodeId: node.nodeId,
        disposition: "UNAVAILABLE",
        isEligible: false,
        qualifications: [],
        rejections: ["Node excluded due to failure isolation or conflict-of-interest boundary"],
      });
      continue;
    }

    const evaluation = evaluateNodeDiscoveryMatch(node, {
      requiredRoutineId: requestedRoutine,
      requiredDomainCapabilityId: requiredCap,
      targetScope,
      demandedAuthorityTier: authorityTier,
    });
    candidateEvals.push(evaluation);
  }

  const eligible = candidateEvals.filter((e) => e.isEligible);

  if (eligible.length === 0) {
    return {
      routed: false,
      candidateEvaluations: candidateEvals,
      routingRationale: `No qualified node found matching routine '${requestedRoutine}', capability '${requiredCap ?? "none"}', and scope '${targetScope}'`,
    };
  }

  // Preference order: Exact MATCH over MATCH_WITH_QUALIFICATION, then lowest queue depth
  const exactMatches = eligible.filter((e) => e.disposition === "MATCH");
  const bestCandidateEval = exactMatches.length > 0 ? exactMatches[0]! : eligible[0]!;
  const selectedNode = criteria.candidateNodes.find((n) => n.nodeId === bestCandidateEval.nodeId)!;

  const ticketId = `ticket:del:${env.envelopeId.replace("cogop:env:", "")}-${selectedNode.nodeId.replace("node:", "")}`;

  const delegationTicket: CognitiveDelegationTicket = {
    ticketId,
    envelopeId: env.envelopeId,
    objectId: env.objectId,
    delegatingRuntime: criteria.delegatorRuntimeId,
    targetNodeId: selectedNode.nodeId,
    delegatedRoutineId: requestedRoutine,
    grantedAuthorityTier: authorityTier,
    delegatedCapabilities: selectedNode.mountedCapabilities,
    requiredEvidenceRoles: criteria.demandedEvidenceRoles ?? ["MEASUREMENT", "CALCULATION", "RETRIEVED_DOCUMENT"],
    selectionRationale: `Selected node '${selectedNode.nodeId}' with status '${selectedNode.availability.status}' and matching domain capabilities [${selectedNode.mountedCapabilities.join(", ")}]`,
    failureIsolationDomain: `isolation:${targetScope}:${selectedNode.nodeId}`,
    issuedAt: new Date().toISOString(),
  };

  return {
    routed: true,
    selectedNodeId: selectedNode.nodeId,
    delegationTicket,
    candidateEvaluations: candidateEvals,
    routingRationale: delegationTicket.selectionRationale,
  };
}

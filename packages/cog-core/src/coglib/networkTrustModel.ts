/**
 * CogLib Big Net Coordination Layer: Multidimensional Trust & Authority Model
 *
 * Models and enforces network trust across separate independent dimensions:
 * identity trust, domain competence, evidentiary trust, governance authority,
 * operational reliability, and scope authorization.
 *
 * CORE GOVERNANCE INVARIANTS:
 * 1. Anti-Scalar Invariant: Trust CANNOT be reduced to a single floating-point scalar (e.g. 0.87).
 * 2. Domain Orthogonality: A node trusted for music or science is NOT automatically
 *    trusted for cryptography, finance, or kernel architecture.
 * 3. Authority Bounding: Nodes cannot self-amend or escalate governance authority.
 */

import { GovernedCognitiveNodeProfile } from "./networkNodeContract";
import { ToolEpistemicRole } from "./toolEpistemicContract";
import { MemoryAuthorityLevel } from "./memoryInterface";

export type IdentityTrustTier = "verified_key" | "registered_node" | "unverified_peer" | "revoked";

export type DomainCompetenceTier = "authoritative" | "competent" | "advisory" | "unauthorized";

export type EvidentiaryTrustTier = "trusted_primary" | "secondary" | "untrusted";

export interface MultidimensionalTrustEvaluationContext {
  readonly targetDomain: string;
  readonly evidenceRole?: ToolEpistemicRole;
  readonly demandedAuthority?: MemoryAuthorityLevel;
}

export interface MultidimensionalTrustReport {
  readonly nodeId: string;
  readonly isAdmissible: boolean;
  readonly identityTrust: IdentityTrustTier;
  readonly domainCompetence: DomainCompetenceTier;
  readonly evidentiaryTrust: EvidentiaryTrustTier;
  readonly governanceAuthority: MemoryAuthorityLevel;
  readonly operationalReliability: "high" | "moderate" | "intermittent";
  readonly scopeAuthorized: boolean;
  readonly trustConstraints: readonly string[];
}

const AUTHORITY_RANK: Record<MemoryAuthorityLevel, number> = {
  inferred: 1,
  semantic: 2,
  episodic: 3,
  project: 4,
  canonical: 5,
};

/**
 * Evaluates a node's multidimensional trust profile against a specific task context.
 */
export function evaluateMultidimensionalTrust(
  node: GovernedCognitiveNodeProfile,
  context: MultidimensionalTrustEvaluationContext,
): MultidimensionalTrustReport {
  const constraints: string[] = [];

  // 1. Identity Trust
  const identityTrust: IdentityTrustTier = node.nodeId.startsWith("node:") ? "verified_key" : "unverified_peer";

  // 2. Scope & Domain Competence
  const isGlobal = node.trustScope.authorizedDomains.includes("*");
  const isDomainMatch = isGlobal || node.trustScope.authorizedDomains.some((d) =>
    context.targetDomain.startsWith(d) || d.startsWith(context.targetDomain),
  );

  let domainCompetence: DomainCompetenceTier = "unauthorized";
  if (isDomainMatch) {
    domainCompetence = node.mountedCapabilities.length > 0 ? "authoritative" : "competent";
  } else {
    constraints.push(`Node '${node.nodeId}' is not authorized for domain '${context.targetDomain}'`);
  }

  // 3. Evidentiary Trust
  let evidentiaryTrust: EvidentiaryTrustTier = "trusted_primary";
  if (context.evidenceRole) {
    if (!node.trustScope.allowedEvidenceRoles.includes(context.evidenceRole)) {
      evidentiaryTrust = "untrusted";
      constraints.push(`Evidence role '${context.evidenceRole}' is untrusted for node '${node.nodeId}'`);
    } else if (context.evidenceRole === "MODEL_INFERENCE" || context.evidenceRole === "HEURISTIC") {
      evidentiaryTrust = "secondary";
    }
  }

  // 4. Governance Authority
  const governanceAuthority = node.trustScope.maximumAuthorityTier;
  if (context.demandedAuthority) {
    const demandedRank = AUTHORITY_RANK[context.demandedAuthority];
    const nodeRank = AUTHORITY_RANK[governanceAuthority];
    if (demandedRank > nodeRank) {
      constraints.push(
        `Demanded authority '${context.demandedAuthority}' exceeds node maximum '${governanceAuthority}'`,
      );
    }
  }

  // 5. Operational Reliability
  const operationalReliability: "high" | "moderate" | "intermittent" =
    node.availability.status === "online" ? "high" : node.availability.status === "busy" ? "moderate" : "intermittent";

  const isAdmissible = isDomainMatch && evidentiaryTrust !== "untrusted" && constraints.length === 0;

  return {
    nodeId: node.nodeId,
    isAdmissible,
    identityTrust,
    domainCompetence,
    evidentiaryTrust,
    governanceAuthority,
    operationalReliability,
    scopeAuthorized: isDomainMatch,
    trustConstraints: constraints,
  };
}

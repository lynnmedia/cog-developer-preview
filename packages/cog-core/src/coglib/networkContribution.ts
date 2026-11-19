/**
 * CogLib Big Net Coordination Layer: Multi-Node Contribution Model
 *
 * Combines heterogeneous node contributions into a shared cognitive state
 * without flattening disagreement, voting down minority evidence,
 * or forcing unearned consensus.
 *
 * CORE GOVERNANCE INVARIANTS:
 * 1. Each contribution remains individually inspectable with full provenance.
 * 2. Shared state explicitly categorizes:
 *    agreements, complementary findings, evidence conflicts, authority differences, and unresolved tensions.
 * 3. No artificial scalar consensus or voting algorithms.
 */

import { MemoryAuthorityLevel } from "./memoryInterface";

export interface NodeContribution<TPayload = any> {
  readonly contributionId: string; // e.g. "contrib:node-a:1"
  readonly contributingNodeId: string;
  readonly capabilityContext?: readonly string[];
  readonly authorityLevel: MemoryAuthorityLevel;
  readonly payloadSummary: string;
  readonly payloadDetails?: TPayload;
  readonly epistemicConfidence: number;
  readonly sourceAnchors: readonly string[];
  readonly attachedEvidenceIds?: readonly string[];
  readonly surfacedTensions: readonly string[];
  readonly qualifications: readonly string[];
  readonly submittedAt: string; // ISO 8601
}

export interface SharedCognitiveState<TPayload = any> {
  readonly sharedObjectId: string;
  readonly objectType: string;
  readonly scope: string;
  readonly contributions: readonly NodeContribution<TPayload>[];
  readonly agreements: readonly string[];
  readonly complementaryFindings: readonly string[];
  readonly evidenceConflicts: ReadonlyArray<{
    readonly dimension: string;
    readonly nodeA: string;
    readonly nodeB: string;
    readonly description: string;
  }>;
  readonly authorityDifferences: ReadonlyArray<{
    readonly nodeId: string;
    readonly authorityLevel: MemoryAuthorityLevel;
  }>;
  readonly unresolvedTensions: readonly string[];
  readonly composedConfidence: number;
}

/**
 * Composes multiple node contributions into a shared cognitive state while preserving
 * individual provenance, authority disparities, and active tensions.
 */
export function composeMultiNodeContributions<TPayload = any>(
  sharedObjectId: string,
  objectType: string,
  scope: string,
  contributions: readonly NodeContribution<TPayload>[],
): SharedCognitiveState<TPayload> {
  if (!contributions || contributions.length === 0) {
    throw new Error("Cannot compose empty contributions into shared state");
  }

  const agreements: string[] = [];
  const complementaryFindings: string[] = [];
  const evidenceConflicts: Array<{ dimension: string; nodeA: string; nodeB: string; description: string }> = [];
  const authorityDifferences: Array<{ nodeId: string; authorityLevel: MemoryAuthorityLevel }> = [];
  const allTensions = new Set<string>();

  // Collect authority levels
  for (const c of contributions) {
    authorityDifferences.push({ nodeId: c.contributingNodeId, authorityLevel: c.authorityLevel });
    for (const t of c.surfacedTensions) {
      allTensions.add(t);
    }
  }

  // Cross-compare contributions for agreements, complements, and conflicts
  for (let i = 0; i < contributions.length; i++) {
    const cA = contributions[i]!;
    for (let j = i + 1; j < contributions.length; j++) {
      const cB = contributions[j]!;

      // Compare summaries / statements
      if (cA.payloadSummary === cB.payloadSummary) {
        agreements.push(`Nodes '${cA.contributingNodeId}' and '${cB.contributingNodeId}' agree on: ${cA.payloadSummary}`);
      } else {
        const sumA = cA.payloadSummary.toLowerCase();
        const sumB = cB.payloadSummary.toLowerCase();
        const isConflict =
          (sumA.includes("fail") && sumB.includes("pass")) ||
          (sumA.includes("pass") && sumB.includes("fail")) ||
          (sumA.includes("unsafe") && sumB.includes("safe")) ||
          (sumA.includes("safe") && sumB.includes("unsafe")) ||
          (sumA.includes("true") && sumB.includes("false")) ||
          (sumA.includes("false") && sumB.includes("true")) ||
          sumA.includes("invalidates") || sumB.includes("invalidates") ||
          sumA.includes("contradicts") || sumB.includes("contradicts") ||
          sumA.includes("refutes") || sumB.includes("refutes");

        if (isConflict) {
          evidenceConflicts.push({
            dimension: "substantive_claim",
            nodeA: cA.contributingNodeId,
            nodeB: cB.contributingNodeId,
            description: `Divergent assertions: '${cA.payloadSummary}' vs '${cB.payloadSummary}'`,
          });
          allTensions.add(`Direct conflict between '${cA.contributingNodeId}' and '${cB.contributingNodeId}'`);
        } else {
          complementaryFindings.push(
            `Complementary perspective: Node '${cA.contributingNodeId}' contributes '${cA.payloadSummary}'; Node '${cB.contributingNodeId}' contributes '${cB.payloadSummary}'`,
          );
        }
      }
    }
  }

  // Bounded confidence: If conflicts exist, confidence is bounded by minimum confidence
  let minConf = 1.0;
  for (const c of contributions) {
    if (c.epistemicConfidence < minConf) minConf = c.epistemicConfidence;
  }
  const hasConflicts = evidenceConflicts.length > 0;
  const composedConfidence = hasConflicts ? Math.min(minConf, 0.65) : minConf;

  return {
    sharedObjectId,
    objectType,
    scope,
    contributions,
    agreements,
    complementaryFindings,
    evidenceConflicts,
    authorityDifferences,
    unresolvedTensions: Array.from(allTensions),
    composedConfidence,
  };
}

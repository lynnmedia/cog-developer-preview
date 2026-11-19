/**
 * CogLib Tool Evidence Influence Governance Engine
 *
 * Governs how epistemically typed tool results influence cognition and memory.
 *
 * CORE GOVERNANCE PRINCIPLES:
 * 1. A calculator, calibrated sensor, registry, retrieved document, simulation,
 *    and model inference receive distinct epistemic treatment based on role,
 *    reliability, strength, and freshness.
 * 2. Multi-factor governance prevents collapsing tool evidence into a universal scalar score.
 * 3. Weak, speculative, or unverified tool output cannot silently overwrite established truth.
 */

import { ToolResultEvidence } from "./toolEpistemicContract";
import { MemoryAuthorityLevel } from "./memoryInterface";

export type EvidenceReconciliationAction =
  | "CONFIRMS"              // Evidence corroborates existing state without changing belief
  | "UPDATES"               // Fresh authoritative evidence refines/extends state
  | "CONTRADICTS"           // Direct irreconcilable conflict, surfaces active tension
  | "SUPERSEDES"            // Fresh decisive evidence replaces stale or weaker prior state
  | "QUALIFIES"             // Suggestive evidence introduces epistemic boundaries/tensions
  | "INSUFFICIENT_TO_AFFECT"; // Weak, out-of-scope, or unverified evidence rejected

export interface ToolEvidenceInfluenceReport {
  readonly evidenceId: string;
  readonly action: EvidenceReconciliationAction;
  readonly isScopeCompatible: boolean;
  readonly isFresh: boolean;
  readonly effectiveConfidence: number;
  readonly tensionsToAttach: readonly string[];
  readonly humanReviewRequired: boolean;
  readonly provenanceTrailEntry: string;
  readonly rationale: string;
}

export interface MemoryUpdateEligibilityReport {
  readonly eligible: boolean;
  readonly targetAuthorityLevel: MemoryAuthorityLevel;
  readonly humanReviewRequired: boolean;
  readonly rationale: string;
}

/**
 * Assesses whether a tool result is eligible to update durable memory.
 */
export function assessMemoryUpdateEligibility(
  evidence: ToolResultEvidence,
  currentTimeIso: string = new Date().toISOString(),
): MemoryUpdateEligibilityReport {
  const isExpired = evidence.freshnessExpiresAt ? currentTimeIso > evidence.freshnessExpiresAt : false;

  if (isExpired) {
    return {
      eligible: false,
      targetAuthorityLevel: "inferred",
      humanReviewRequired: false,
      rationale: `Evidence '${evidence.evidenceId}' has expired; stale evidence cannot update durable memory`,
    };
  }

  // Model inference or unverified source cannot directly update canonical or project memory
  if (evidence.sourceReliability === "stochastic_model" || evidence.sourceReliability === "unverified_source") {
    return {
      eligible: false,
      targetAuthorityLevel: "inferred",
      humanReviewRequired: true,
      rationale: `Stochastic model or unverified source output requires human review before durable memory mutation`,
    };
  }

  // Authoritative registries and deterministic engines with decisive strength
  if (
    (evidence.sourceReliability === "authoritative_registry" || evidence.sourceReliability === "deterministic_engine") &&
    evidence.evidentiaryStrength === "decisive" &&
    evidence.governanceAuthority === "canonical"
  ) {
    return {
      eligible: true,
      targetAuthorityLevel: "canonical",
      humanReviewRequired: false,
      rationale: `Decisive authoritative/deterministic evidence eligible for canonical memory update`,
    };
  }

  // Calibrated hardware or verified human with corroborative strength
  if (
    (evidence.sourceReliability === "calibrated_hardware" || evidence.sourceReliability === "verified_human") &&
    (evidence.evidentiaryStrength === "decisive" || evidence.evidentiaryStrength === "corroborative")
  ) {
    return {
      eligible: true,
      targetAuthorityLevel: evidence.governanceAuthority === "canonical" ? "canonical" : "project",
      humanReviewRequired: false,
      rationale: `Grounded empirical measurement eligible for project-level memory update`,
    };
  }

  // Fallback for suggestive or advisory evidence
  return {
    eligible: false,
    targetAuthorityLevel: "episodic",
    humanReviewRequired: evidence.evidentiaryStrength === "suggestive",
    rationale: `Evidentiary strength '${evidence.evidentiaryStrength}' is insufficient for automated durable memory update`,
  };
}

/**
 * Evaluates how an external tool result influences an active cognitive claim or memory item.
 */
export function evaluateToolEvidenceInfluence(
  targetClaim: {
    statement: string;
    scope: string;
    confidence?: number;
    authorityLevel?: MemoryAuthorityLevel;
    isStale?: boolean;
  },
  evidence: ToolResultEvidence,
  currentTimeIso: string = new Date().toISOString(),
): ToolEvidenceInfluenceReport {
  const isFresh = evidence.freshnessExpiresAt ? currentTimeIso <= evidence.freshnessExpiresAt : true;
  const isScopeCompatible = targetClaim.scope === evidence.scope || targetClaim.scope.startsWith(evidence.scope);
  const tensions: string[] = [...evidence.tensionsSurfaced];

  if (!isScopeCompatible) {
    return {
      evidenceId: evidence.evidenceId,
      action: "INSUFFICIENT_TO_AFFECT",
      isScopeCompatible: false,
      isFresh,
      effectiveConfidence: targetClaim.confidence ?? 1.0,
      tensionsToAttach: [`Evidence '${evidence.evidenceId}' scope (${evidence.scope}) does not match target (${targetClaim.scope})`],
      humanReviewRequired: false,
      provenanceTrailEntry: `rejected_out_of_scope(evidence:${evidence.evidenceId})`,
      rationale: `Scope mismatch: evidence scope '${evidence.scope}' incompatible with target claim '${targetClaim.scope}'`,
    };
  }

  if (!isFresh) {
    tensions.push(`Tool evidence '${evidence.evidenceId}' is stale (expired at ${evidence.freshnessExpiresAt})`);
    return {
      evidenceId: evidence.evidenceId,
      action: "QUALIFIES",
      isScopeCompatible: true,
      isFresh: false,
      effectiveConfidence: Math.min(targetClaim.confidence ?? 1.0, 0.5),
      tensionsToAttach: tensions,
      humanReviewRequired: false,
      provenanceTrailEntry: `stale_evidence_qualified(evidence:${evidence.evidenceId})`,
      rationale: `Stale tool evidence cannot supersede state; degrades confidence and attaches qualification`,
    };
  }

  // Model inference (LLM) vs Strong Prior Memory
  if (evidence.epistemicRole === "MODEL_INFERENCE" || evidence.sourceReliability === "stochastic_model") {
    const isContradictory = evidence.limitations.length > 0 || evidence.tensionsSurfaced.length > 0;
    const boundedConfidence = Math.min(targetClaim.confidence ?? 1.0, 0.75);

    if (targetClaim.authorityLevel === "canonical" || targetClaim.authorityLevel === "project") {
      tensions.push(`Speculative model inference '${evidence.evidenceId}' cannot override ${targetClaim.authorityLevel} state`);
      return {
        evidenceId: evidence.evidenceId,
        action: "QUALIFIES",
        isScopeCompatible: true,
        isFresh: true,
        effectiveConfidence: boundedConfidence,
        tensionsToAttach: tensions,
        humanReviewRequired: true,
        provenanceTrailEntry: `model_inference_qualified(evidence:${evidence.evidenceId})`,
        rationale: `Stochastic model inference attaches hypothesis qualification without overriding higher authority memory`,
      };
    }
  }

  // Decisive calculation or authoritative record vs Stale Prior State
  if (
    (evidence.epistemicRole === "CALCULATION" || evidence.epistemicRole === "AUTHORITATIVE_RECORD" || evidence.epistemicRole === "MEASUREMENT") &&
    evidence.evidentiaryStrength === "decisive"
  ) {
    if (targetClaim.isStale || targetClaim.authorityLevel === "inferred" || targetClaim.authorityLevel === "episodic") {
      return {
        evidenceId: evidence.evidenceId,
        action: "SUPERSEDES",
        isScopeCompatible: true,
        isFresh: true,
        effectiveConfidence: evidence.confidence,
        tensionsToAttach: tensions,
        humanReviewRequired: false,
        provenanceTrailEntry: `superseded_by_decisive_evidence(evidence:${evidence.evidenceId}, role:${evidence.epistemicRole})`,
        rationale: `Decisive ${evidence.epistemicRole} evidence supersedes stale/lower-authority prior claim`,
      };
    }

    return {
      evidenceId: evidence.evidenceId,
      action: "UPDATES",
      isScopeCompatible: true,
      isFresh: true,
      effectiveConfidence: Math.min(evidence.confidence, targetClaim.confidence ?? 1.0),
      tensionsToAttach: tensions,
      humanReviewRequired: false,
      provenanceTrailEntry: `updated_by_tool_evidence(evidence:${evidence.evidenceId})`,
      rationale: `Decisive evidence successfully refines claim state`,
    };
  }

  // Suggestive / Corroborative evidence
  if (evidence.evidentiaryStrength === "corroborative") {
    return {
      evidenceId: evidence.evidenceId,
      action: "CONFIRMS",
      isScopeCompatible: true,
      isFresh: true,
      effectiveConfidence: targetClaim.confidence ?? evidence.confidence,
      tensionsToAttach: tensions,
      humanReviewRequired: false,
      provenanceTrailEntry: `corroborated_by_tool(evidence:${evidence.evidenceId})`,
      rationale: `Corroborative evidence reinforces target claim within scope`,
    };
  }

  // Default fallback for weak/suggestive
  return {
    evidenceId: evidence.evidenceId,
    action: "QUALIFIES",
    isScopeCompatible: true,
    isFresh: true,
    effectiveConfidence: Math.min(targetClaim.confidence ?? 1.0, 0.8),
    tensionsToAttach: tensions,
    humanReviewRequired: false,
    provenanceTrailEntry: `qualified_by_suggestive_tool(evidence:${evidence.evidenceId})`,
    rationale: `Suggestive tool evidence qualifies target claim with attached limitations`,
  };
}

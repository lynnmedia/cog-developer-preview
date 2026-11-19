/**
 * CogLib CHALLENGE Routine
 *
 * Governed adversarial cognitive operation that exposes vulnerabilities, hidden assumptions,
 * counterexamples, incompatible evidence, brittle dependencies, invalid generalizations,
 * and unsupported scope extensions without collapsing into automatic rejection or generic contrarianism.
 *
 * Characteristics:
 * - Provenance-grounded challenges
 * - Distinguishes defensible objects from vulnerable objects
 * - Preserves surfaced objections as persistent tensions and qualification
 */

import { CognitiveRoutine, EpistemicState } from "../routineContract";

export type ChallengeDimension =
  | "hidden_assumptions"
  | "counterexamples"
  | "incompatible_evidence"
  | "invalid_generalization"
  | "brittle_dependencies"
  | "unsupported_scope_extension"
  | "unresolved_contradiction";

export interface TargetClaim {
  id: string;
  statement: string;
  scopeDeclared?: string;
  sampleSize?: number;
  assumptionsDeclared?: string[];
  dependencies?: Array<{ id: string; redundancy: boolean; isVerified: boolean }>;
  groundingSources?: string[];
}

export interface CounterEvidenceItem {
  id: string;
  dimension: ChallengeDimension;
  description: string;
  sourceRef?: string;
  appliesToClaimId?: string;
  severity: "minor" | "moderate" | "severe";
}

export interface ChallengeInput {
  target: TargetClaim;
  counterEvidencePool?: CounterEvidenceItem[];
  knownDomainLimits?: Array<{ limitDimension: string; boundary: string }>;
}

export interface SurfacedChallenge {
  dimension: ChallengeDimension;
  severity: "minor" | "moderate" | "severe";
  description: string;
  groundingRef: string;
  recommendedMitigation?: string;
}

export interface ChallengeOutput {
  targetId: string;
  challengeStatus: "resilient" | "qualified_challenges" | "vulnerable";
  challengesSurfaced: SurfacedChallenge[];
  defensiblePoints: string[];
  unresolvedTensions: string[];
}

export const challengeRoutine: CognitiveRoutine<ChallengeInput, ChallengeOutput> = {
  metadata: {
    id: "coglib:routine:challenge",
    name: "Universal Adversarial Cognitive Challenge",
    version: "1.0.0",
    category: "falsification",
    description: "Governed adversarial inspection uncovering hidden assumptions, counterexamples, brittle dependencies, and invalid generalizations.",
  },
  inputs: [
    { name: "target", type: "object", required: true, description: "Target cognitive claim or structure" },
    { name: "counterEvidencePool", type: "array", required: false, description: "Dataset of known counterexamples or boundary anomalies" },
    { name: "knownDomainLimits", type: "array", required: false, description: "Boundary limits of the valid domain" },
  ],
  outputs: [
    { name: "challengeReport", type: "object", required: true, description: "Structured adversarial vulnerability assessment" },
  ],
  preconditions: [
    {
      id: "has-valid-target",
      description: "Target must have an identifier and non-empty statement",
      evaluate: (input) => ({
        passed: Boolean(input?.target?.id && input?.target?.statement),
        reason: "Precondition failed: target must declare id and statement",
      }),
    },
  ],
  postconditions: [
    {
      id: "grounded-challenges-only",
      description: "Every surfaced challenge must have an explicit groundingRef",
      evaluate: ({ output }) => ({
        passed: output.challengesSurfaced.every((c) => Boolean(c.groundingRef)),
        reason: "Postcondition failed: Surfaced challenge found without grounding reference",
      }),
    },
  ],
  failureModes: [
    {
      code: "CHALLENGE_CRITICAL_VULNERABILITY",
      description: "Target possesses severe counterexamples or contradictory evidence",
      severity: "qualified",
      recoverable: true,
      mitigation: "Emit qualified output highlighting severe challenges and reduced epistemic confidence",
    },
  ],
  provenanceRequirements: {
    requiresSourceAnchors: true,
    preserveLineage: true,
    trackTransformations: true,
    auditRequired: true,
  },
  epistemicContract: {
    producesUncertainty: true,
    uncertaintyHandling: "preserve",
    epistemicDelta: "Subjects target to adversarial scrutiny, adjusting epistemic confidence based on empirical resilience",
    preservesTensions: true,
  },
  invariants: [
    {
      id: "no-arbitrary-rejection",
      description: "If no counter-evidence or structural vulnerabilities exist, do not fabricate challenges",
      enforce: (input, output) => {
        const hadEvidence = (input.counterEvidencePool?.length ?? 0) > 0;
        const hasDependencies = (input.target.dependencies?.length ?? 0) > 0;
        if (!hadEvidence && !hasDependencies && output.challengesSurfaced.length > 0) {
          // Verify challenges are structurally grounded in input
          const valid = output.challengesSurfaced.every((c) => c.groundingRef.startsWith("structural:") || c.groundingRef.startsWith("evidence:"));
          return { valid, violation: "Fabricated ungrounded challenge detected" };
        }
        return { valid: true };
      },
    },
  ],
  domainHooks: [],
  evaluationHooks: [
    {
      hookId: "vulnerability-score",
      metricName: "challengeCount",
      description: "Total number of grounded challenges surfaced",
      computeMetric: (output) => output.challengesSurfaced.length,
    },
  ],
  compatibility: {
    compatibleRoutines: [
      "coglib:routine:shape",
      "coglib:routine:compare",
      "coglib:routine:trace",
      "coglib:routine:tension-reconciliation",
    ],
    incompatibleRoutines: [],
    compositionPatterns: ["pipeline", "branch", "merge", "guarded_transition"],
    requiredKernelVersion: ">=0.1.0",
  },
  execute: (input: ChallengeInput) => {
    const { target, counterEvidencePool = [], knownDomainLimits = [] } = input;
    const challengesSurfaced: SurfacedChallenge[] = [];
    const defensiblePoints: string[] = [];
    const unresolvedTensions: string[] = [];

    // 1. Evaluate Grounding and Provenance
    if (!target.groundingSources || target.groundingSources.length === 0) {
      challengesSurfaced.push({
        dimension: "hidden_assumptions",
        severity: "moderate",
        description: "Target claim makes empirical assertion without declaring citations or grounding sources",
        groundingRef: "structural:missing-grounding",
        recommendedMitigation: "Attach empirical grounding citations or mark as speculative hypothesis",
      });
      unresolvedTensions.push("Unaligned assertion: missing grounding citations");
    } else {
      defensiblePoints.push(`Grounded in ${target.groundingSources.length} explicit sources`);
    }

    // 2. Evaluate Generalization vs Sample Size
    const isUniversalStatement = /\b(all|every|always|never|universal|guaranteed)\b/i.test(target.statement);
    if (isUniversalStatement && (target.sampleSize === undefined || target.sampleSize < 100)) {
      challengesSurfaced.push({
        dimension: "invalid_generalization",
        severity: "severe",
        description: `Universal quantifier used in claim ('${target.statement}') with insufficient sample support (${target.sampleSize ?? "unspecified"})`,
        groundingRef: "structural:universal-quantifier-without-census",
        recommendedMitigation: "Narrow claim scope from universal to qualified probabilistic quantifier",
      });
      unresolvedTensions.push(`Invalid generalization: universal claim without exhaustive sample`);
    }

    // 3. Evaluate Dependencies (Brittle / Single Point of Failure)
    if (target.dependencies && target.dependencies.length > 0) {
      for (const dep of target.dependencies) {
        if (!dep.isVerified) {
          challengesSurfaced.push({
            dimension: "brittle_dependencies",
            severity: "moderate",
            description: `Relies on unverified upstream dependency '${dep.id}'`,
            groundingRef: `structural:dependency:${dep.id}`,
            recommendedMitigation: `Verify correctness of '${dep.id}' or add defensive fallback`,
          });
          unresolvedTensions.push(`Brittle dependency: unverified component '${dep.id}'`);
        }
        if (!dep.redundancy) {
          challengesSurfaced.push({
            dimension: "brittle_dependencies",
            severity: "minor",
            description: `Dependency '${dep.id}' lacks redundancy or fallback`,
            groundingRef: `structural:dependency:${dep.id}:no-redundancy`,
            recommendedMitigation: `Introduce fallback strategy for '${dep.id}'`,
          });
        }
      }
    }

    // 4. Evaluate Counter-Evidence Pool
    for (const item of counterEvidencePool) {
      if (!item.appliesToClaimId || item.appliesToClaimId === target.id) {
        challengesSurfaced.push({
          dimension: item.dimension,
          severity: item.severity,
          description: item.description,
          groundingRef: `evidence:${item.id}${item.sourceRef ? `:${item.sourceRef}` : ""}`,
          recommendedMitigation: "Reconcile contradictory evidence or bound domain scope",
        });
        unresolvedTensions.push(`Counter-evidence challenge [${item.dimension}]: ${item.description}`);
      }
    }

    // 5. Evaluate Scope Bounds against Known Domain Limits
    if (target.scopeDeclared) {
      for (const limit of knownDomainLimits) {
        if (target.scopeDeclared.includes(limit.limitDimension)) {
          challengesSurfaced.push({
            dimension: "unsupported_scope_extension",
            severity: "moderate",
            description: `Declared scope '${target.scopeDeclared}' crosses established boundary '${limit.boundary}'`,
            groundingRef: `boundary:${limit.limitDimension}`,
            recommendedMitigation: `Constrain scope within ${limit.boundary}`,
          });
          unresolvedTensions.push(`Scope extension beyond verified boundary: '${limit.boundary}'`);
        }
      }
    }

    // Determine Challenge Status and Epistemic Confidence
    let challengeStatus: "resilient" | "qualified_challenges" | "vulnerable" = "resilient";
    const severeCount = challengesSurfaced.filter((c) => c.severity === "severe").length;
    const moderateCount = challengesSurfaced.filter((c) => c.severity === "moderate").length;

    let finalConfidence = 1.0;
    if (severeCount > 0) {
      challengeStatus = "vulnerable";
      finalConfidence = Math.max(0.2, 0.9 - severeCount * 0.35 - moderateCount * 0.1);
    } else if (challengesSurfaced.length > 0) {
      challengeStatus = "qualified_challenges";
      finalConfidence = Math.max(0.5, 0.95 - challengesSurfaced.length * 0.1);
    } else {
      challengeStatus = "resilient";
      finalConfidence = 0.98;
      defensiblePoints.push("Survives all adversarial challenge vectors without substantiated vulnerability");
    }

    return {
      status: challengeStatus === "vulnerable" || challengeStatus === "qualified_challenges" ? "qualified" : "success",
      output: {
        targetId: target.id,
        challengeStatus,
        challengesSurfaced,
        defensiblePoints,
        unresolvedTensions,
      },
      epistemicState: {
        confidence: Number(finalConfidence.toFixed(2)),
        uncertaintyBounded: true,
        tensions: unresolvedTensions,
        provenanceLineage: [`challenge(${target.id})`],
      },
      provenance: {
        routineId: "coglib:routine:challenge",
        routineVersion: "1.0.0",
        lineage: [`challenge(${target.id})`],
        timestamp: new Date().toISOString(),
      },
    };
  },
};

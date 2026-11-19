/**
 * CogLib Memory Authority & Epistemic Governance Model
 *
 * Formalizes authority precedence, conflict resolution, staleness decay,
 * and tension preservation across the 5 memory classes:
 * - canonical (Rank 5)
 * - project (Rank 4)
 * - episodic (Rank 3)
 * - semantic (Rank 2)
 * - inferred / vector_retrieval (Rank 1)
 *
 * CORE GOVERNANCE INVARIANTS:
 * 1. Low-authority, inferred, or vector memory NEVER silently overrides higher-authority truth.
 * 2. Stale memory automatically undergoes authority decay and confidence capping.
 * 3. Memory conflicts are preserved as active unresolved tensions rather than silently laundered.
 */

import { MemoryEntry, MemoryAuthorityLevel, getAuthorityRank } from "./memoryInterface";

export interface MemoryReconciliationResult {
  readonly winner: MemoryEntry | null; // Null if tied conflict
  readonly status: "authoritative_override" | "unresolved_conflict" | "stale_superseded";
  readonly activeTensions: readonly string[];
  readonly effectiveConfidence: number;
  readonly explanatoryRationale: string;
}

export interface GovernedMemoryInfluenceResult {
  readonly permitted: boolean;
  readonly qualifiedClaim: any;
  readonly epistemicConfidence: number;
  readonly attachedTensions: readonly string[];
  readonly provenanceEntry: string;
}

/**
 * Applies staleness decay to a memory entry if current time exceeds freshness expiration.
 */
export function applyMemoryEpistemicDecay(
  entry: MemoryEntry,
  currentTimeIso: string = new Date().toISOString(),
): MemoryEntry {
  const isExpired = entry.freshnessExpiresAt ? currentTimeIso > entry.freshnessExpiresAt : false;
  const isFlaggedStale = Boolean(entry.epistemicState.isStale || isExpired);

  if (!isFlaggedStale) {
    return entry;
  }

  // Staleness Decay: Cap confidence to max 0.5 and attach staleness tension
  return {
    ...entry,
    epistemicState: {
      ...entry.epistemicState,
      confidence: Math.min(entry.epistemicState.confidence, 0.5),
      isStale: true,
      tensions: [
        ...entry.epistemicState.tensions,
        `Stale memory '${entry.id}': freshness expired at ${entry.freshnessExpiresAt ?? "prior-session"}`,
      ],
    },
  };
}

/**
 * Reconciles two conflicting memory entries using strict authority precedence and staleness rules.
 */
export function reconcileMemoryConflict(
  memoryA: MemoryEntry,
  memoryB: MemoryEntry,
  currentTimeIso: string = new Date().toISOString(),
): MemoryReconciliationResult {
  const decayedA = applyMemoryEpistemicDecay(memoryA, currentTimeIso);
  const decayedB = applyMemoryEpistemicDecay(memoryB, currentTimeIso);

  // Calculate effective authority ranks (decayed if stale)
  const rankA = getAuthorityRank(decayedA.authorityLevel) - (decayedA.epistemicState.isStale ? 2 : 0);
  const rankB = getAuthorityRank(decayedB.authorityLevel) - (decayedB.epistemicState.isStale ? 2 : 0);

  const activeTensions: string[] = [];

  if (rankA > rankB) {
    return {
      winner: decayedA,
      status: "authoritative_override",
      activeTensions: [
        `Memory '${decayedB.id}' (${decayedB.authorityLevel}) overridden by higher authority '${decayedA.id}' (${decayedA.authorityLevel})`,
      ],
      effectiveConfidence: decayedA.epistemicState.confidence,
      explanatoryRationale: `Higher authority level '${decayedA.authorityLevel}' (rank ${rankA}) takes precedence over '${decayedB.authorityLevel}' (rank ${rankB})`,
    };
  }

  if (rankB > rankA) {
    return {
      winner: decayedB,
      status: "authoritative_override",
      activeTensions: [
        `Memory '${decayedA.id}' (${decayedA.authorityLevel}) overridden by higher authority '${decayedB.id}' (${decayedB.authorityLevel})`,
      ],
      effectiveConfidence: decayedB.epistemicState.confidence,
      explanatoryRationale: `Higher authority level '${decayedB.authorityLevel}' (rank ${rankB}) takes precedence over '${decayedA.authorityLevel}' (rank ${rankA})`,
    };
  }

  // Equal rank conflict: No automatic winner! Emit unresolved tension and qualify confidence.
  const tension = `Unresolved contradiction between equal authority memories '${decayedA.id}' and '${decayedB.id}' (${decayedA.authorityLevel})`;
  activeTensions.push(tension);

  return {
    winner: null,
    status: "unresolved_conflict",
    activeTensions,
    effectiveConfidence: Math.min(decayedA.epistemicState.confidence, decayedB.epistemicState.confidence, 0.6),
    explanatoryRationale: `Memories '${decayedA.id}' and '${decayedB.id}' possess identical authority rank (${rankA}); conflict preserved as active tension`,
  };
}

/**
 * Evaluates whether retrieved memory can safely influence a current cognitive claim
 * and produces a governed epistemic qualification.
 */
export function guardMemoryInfluence(
  currentClaim: { statement: string; confidence?: number },
  retrievedMemory: MemoryEntry,
  currentTimeIso: string = new Date().toISOString(),
): GovernedMemoryInfluenceResult {
  const decayed = applyMemoryEpistemicDecay(retrievedMemory, currentTimeIso);
  const tensions: string[] = [];

  let boundedConfidence = currentClaim.confidence ?? 1.0;

  // Invariant 1: Inferred or vector memory cannot elevate confidence
  if (decayed.authorityLevel === "inferred") {
    boundedConfidence = Math.min(boundedConfidence, 0.75);
    tensions.push(`Claim influenced by low-authority inferred memory '${decayed.id}'`);
  }

  // Invariant 2: Stale memory bounds confidence
  if (decayed.epistemicState.isStale) {
    boundedConfidence = Math.min(boundedConfidence, 0.5);
    tensions.push(`Claim influenced by stale memory '${decayed.id}'`);
  }

  // Invariant 3: Inherit memory tensions
  if (decayed.epistemicState.tensions.length > 0) {
    tensions.push(...decayed.epistemicState.tensions);
  }

  const provenanceEntry = `memory_influence(${decayed.id}, authority:${decayed.authorityLevel}, stale:${Boolean(decayed.epistemicState.isStale)})`;

  return {
    permitted: true,
    qualifiedClaim: {
      ...currentClaim,
      groundedInMemory: decayed.id,
      authorityLevel: decayed.authorityLevel,
    },
    epistemicConfidence: Number(boundedConfidence.toFixed(2)),
    attachedTensions: Array.from(new Set(tensions)),
    provenanceEntry,
  };
}

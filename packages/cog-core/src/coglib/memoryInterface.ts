/**
 * CogLib Governed Memory Interface Contract
 *
 * Substrate-neutral contract for retrieving and persisting governed cognitive memory
 * across time without coupling Cog to Firestore, SQLite, vector databases, or any concrete engine.
 *
 * CORE GOVERNANCE INVARIANT:
 * Memory influence must always declare explicit authority, provenance, scope, freshness,
 * and epistemic status. Memory retrieval must NEVER automatically upgrade content to truth.
 */

export type MemoryAuthorityLevel =
  | "canonical" // Ground truth definitions, ratified constitutions, formal specs
  | "project"   // Project workspace state, committed configs, approved plans
  | "episodic"  // Prior session transcripts, execution traces, situational history
  | "semantic"  // Conceptual linkages, taxonomy maps, domain relationships
  | "inferred"; // Probabilistic derivations, model hypotheses, synthetic drafts

export interface MemoryProvenanceMetadata {
  readonly sourceAnchors: readonly string[];
  readonly lineage: readonly string[];
  readonly authorRef?: string;
}

export interface MemoryEpistemicMetadata {
  readonly confidence: number; // [0.0, 1.0]
  readonly tensions: readonly string[];
  readonly isHypothetical?: boolean;
  readonly isStale?: boolean;
}

export interface MemoryEntry<TContent = any> {
  readonly id: string;
  readonly objectType: string;
  readonly content: TContent;
  readonly authorityLevel: MemoryAuthorityLevel;
  readonly scope: string;
  readonly perspectives: readonly string[];
  readonly recordedAt: string; // ISO 8601
  readonly freshnessExpiresAt?: string; // ISO 8601
  readonly provenance: MemoryProvenanceMetadata;
  readonly epistemicState: MemoryEpistemicMetadata;
  readonly tags: readonly string[];
  readonly supersededById?: string;
  readonly version?: number;
}

export interface MemoryQuery {
  readonly intent?: string;
  readonly scope?: string;
  readonly perspective?: string;
  readonly minAuthority?: MemoryAuthorityLevel;
  readonly objectId?: string;
  readonly retrievePriorStates?: boolean;
  readonly includeTensions?: boolean;
  readonly requiredSourceAnchor?: string;
  readonly relatedToObjectId?: string;
  readonly maxResults?: number;
}

export interface MemoryQueryResult<TContent = any> {
  readonly queryId: string;
  readonly entries: readonly MemoryEntry<TContent>[];
  readonly unresolvedTensionsDiscovered: readonly string[];
  readonly provenanceTrail: readonly string[];
  readonly retrievedAt: string;
}

export interface CognitiveMemoryProvider {
  readonly providerId: string;
  readonly providerType: string;
  readonly description: string;

  retrieve(query: MemoryQuery): Promise<MemoryQueryResult>;
  persist(entry: MemoryEntry): Promise<{ success: boolean; entryId: string; version: number }>;
  getPriorState(objectId: string, version?: number): Promise<MemoryEntry | null>;
}

export interface MemoryContractValidationReport {
  readonly valid: boolean;
  readonly providerId: string;
  readonly defects: readonly string[];
}

const AUTHORITY_HIERARCHY: Record<MemoryAuthorityLevel, number> = {
  canonical: 5,
  project: 4,
  episodic: 3,
  semantic: 2,
  inferred: 1,
};

export function getAuthorityRank(level: MemoryAuthorityLevel): number {
  return AUTHORITY_HIERARCHY[level] ?? 0;
}

/**
 * Validates that a CognitiveMemoryProvider adheres to the substrate-neutral contract.
 */
export function validateMemoryContract(provider: CognitiveMemoryProvider): MemoryContractValidationReport {
  const defects: string[] = [];

  if (!provider) {
    return { valid: false, providerId: "unknown", defects: ["Memory provider is null or undefined"] };
  }

  if (!provider.providerId || !provider.providerId.startsWith("memory:provider:")) {
    defects.push("Provider providerId must begin with 'memory:provider:' prefix");
  }
  if (!provider.providerType) defects.push("Provider providerType is required");
  if (!provider.description) defects.push("Provider description is required");
  if (typeof provider.retrieve !== "function") defects.push("Provider retrieve() must be a function");
  if (typeof provider.persist !== "function") defects.push("Provider persist() must be a function");
  if (typeof provider.getPriorState !== "function") defects.push("Provider getPriorState() must be a function");

  return {
    valid: defects.length === 0,
    providerId: provider.providerId ?? "unknown",
    defects,
  };
}

/**
 * Reference In-Memory implementation of CognitiveMemoryProvider for deterministic testing.
 */
export class InMemoryCognitiveMemoryProvider implements CognitiveMemoryProvider {
  public readonly providerId: string;
  public readonly providerType: string = "in_memory_ephemeral";
  public readonly description: string = "Deterministic in-memory cognitive memory provider";

  private store = new Map<string, MemoryEntry[]>(); // objectId -> versions array

  constructor(id: string = "memory:provider:in-memory-reference") {
    this.providerId = id;
  }

  async persist(entry: MemoryEntry): Promise<{ success: boolean; entryId: string; version: number }> {
    const versions = this.store.get(entry.id) ?? [];
    const newVersion = versions.length + 1;
    const versionedEntry: MemoryEntry = {
      ...entry,
      version: newVersion,
    };
    versions.push(versionedEntry);
    this.store.set(entry.id, versions);
    return { success: true, entryId: entry.id, version: newVersion };
  }

  async getPriorState(objectId: string, version?: number): Promise<MemoryEntry | null> {
    const versions = this.store.get(objectId);
    if (!versions || versions.length === 0) return null;
    if (version !== undefined) {
      return versions.find((v) => v.version === version) ?? null;
    }
    return versions[versions.length - 1] ?? null;
  }

  async retrieve(query: MemoryQuery): Promise<MemoryQueryResult> {
    const queryId = `query-${Date.now().toString(36)}`;
    const results: MemoryEntry[] = [];
    const tensions: string[] = [];
    const provenance: string[] = [];

    const minRank = query.minAuthority ? getAuthorityRank(query.minAuthority) : 0;

    for (const [id, versions] of this.store.entries()) {
      if (versions.length === 0) continue;
      const latest = versions[versions.length - 1]!;

      // Scope match
      if (query.scope && latest.scope !== query.scope) continue;
      // Object match
      if (query.objectId && latest.id !== query.objectId) continue;
      // Authority match
      if (getAuthorityRank(latest.authorityLevel) < minRank) continue;
      // Perspective match
      if (query.perspective && !latest.perspectives.includes(query.perspective)) continue;
      // Anchor match
      if (query.requiredSourceAnchor && !latest.provenance.sourceAnchors.includes(query.requiredSourceAnchor)) continue;

      // Intent match (keyword in tags/scope/content)
      if (query.intent) {
        const intentKeywords = query.intent.toLowerCase().split(/\s+/);
        const matchesIntent = intentKeywords.some(
          (k) => latest.tags.some((t) => t.toLowerCase().includes(k)) || latest.scope.toLowerCase().includes(k),
        );
        if (!matchesIntent) continue;
      }

      results.push(latest);
      if (latest.epistemicState.tensions) {
        tensions.push(...latest.epistemicState.tensions);
      }
      provenance.push(...latest.provenance.lineage);

      if (query.maxResults && results.length >= query.maxResults) break;
    }

    return {
      queryId,
      entries: results,
      unresolvedTensionsDiscovered: Array.from(new Set(tensions)),
      provenanceTrail: Array.from(new Set(provenance)),
      retrievedAt: new Date().toISOString(),
    };
  }
}

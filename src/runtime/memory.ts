import {
  CanonicalMemoryEntry,
  EpisodicMemoryEntry,
  LearnedPattern,
  MemoryAdapter,
  ProfileState,
  RunRecord,
  SemanticMemoryEntry
} from './types';

export class InMemoryAdapter implements MemoryAdapter {
  private readonly canonical: CanonicalMemoryEntry[];
  private readonly episodic: EpisodicMemoryEntry[] = [];
  private readonly semantic: SemanticMemoryEntry[] = [];
  private readonly runs: RunRecord[] = [];
  private readonly patterns: LearnedPattern[] = [];
  private readonly profiles = new Map<string, ProfileState>();

  constructor(seed?: {
    canonical?: CanonicalMemoryEntry[];
    semantic?: SemanticMemoryEntry[];
    patterns?: LearnedPattern[];
    profiles?: ProfileState[];
  }) {
    this.canonical = seed?.canonical ?? [];
    this.semantic = seed?.semantic ?? [];
    this.patterns = seed?.patterns ? [...seed.patterns] : [];
    for (const profile of seed?.profiles ?? []) this.profiles.set(profile.profileId, profile);
  }

  getCanonicalEntries(): CanonicalMemoryEntry[] {
    return [...this.canonical];
  }

  saveEpisodic(entry: EpisodicMemoryEntry): void {
    this.episodic.push(entry);
  }

  getSemanticEntries(): SemanticMemoryEntry[] {
    return [...this.semantic];
  }

  saveSemantic(entry: SemanticMemoryEntry): void {
    this.semantic.push(entry);
  }

  recordRun(record: RunRecord): void {
    this.runs.push(record);
  }

  getRunRecords(): RunRecord[] {
    return [...this.runs];
  }

  savePattern(pattern: LearnedPattern): void {
    const index = this.patterns.findIndex((existing) => existing.id === pattern.id);
    if (index >= 0) this.patterns[index] = pattern;
    else this.patterns.push(pattern);
  }

  getPatterns(): LearnedPattern[] {
    return [...this.patterns];
  }

  getProfile(profileId: string): ProfileState | undefined {
    const profile = this.profiles.get(profileId);
    return profile ? { ...profile, learnedPatterns: [...profile.learnedPatterns], behavioralSignals: [...profile.behavioralSignals] } : undefined;
  }

  saveProfile(profile: ProfileState): void {
    this.profiles.set(profile.profileId, profile);
  }

  snapshot(): {
    canonical: CanonicalMemoryEntry[];
    episodic: EpisodicMemoryEntry[];
    semantic: SemanticMemoryEntry[];
    runs: RunRecord[];
    patterns: LearnedPattern[];
    profiles: ProfileState[];
  } {
    return {
      canonical: [...this.canonical],
      episodic: [...this.episodic],
      semantic: [...this.semantic],
      runs: [...this.runs],
      patterns: [...this.patterns],
      profiles: [...this.profiles.values()]
    };
  }
}

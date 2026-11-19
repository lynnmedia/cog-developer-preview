import { CognitiveIR } from '../compiler/compileToIR';
import { Diagnostic } from '../semantics/diagnostics';

export type ValidationStatus = 'VALID' | 'WARN' | 'INVALID';
export type Perspective = 'descriptive' | 'conceptual' | 'structural' | 'advisory' | 'actionable' | 'reflective';
export type Resolution = 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
export type MemoryScope = 'canonical' | 'episodic' | 'semantic';
export type IntelligenceMode = 'deterministic' | 'adaptive';
export type IntelligenceDepth = 'shallow' | 'standard' | 'deep';
export type OutputType = 'action_plan' | 'structured_routine' | 'framework' | 'checklist' | 'reflection' | 'analysis';
export type PatternCategory = 'output_preference' | 'focus_preference' | 'constraint_preference' | 'behavior_signal' | 'success_pattern';

export interface ExecutionFeedback {
  success: boolean;
  rating: number;
  notes?: string;
}

export interface ExecutionContext {
  requestId: string;
  userId?: string;
  profileId?: string;
  intent?: string;
  domain?: string;
  constraints?: string[];
  memoryScope?: ReadonlyArray<MemoryScope>;
  targetResolution?: Resolution;
  targetPerspective?: Perspective;
  intelligenceMode?: IntelligenceMode;
  intelligenceDepth?: IntelligenceDepth;
  feedback?: ExecutionFeedback;
}

export interface CanonicalMemoryEntry {
  key: string;
  value: unknown;
}

export interface EpisodicMemoryEntry {
  requestId: string;
  timestamp: string;
  summary: string;
  outputType?: string;
  resolution?: Resolution;
  perspective?: Perspective;
  actionCount?: number;
}

export interface SemanticMemoryEntry {
  key: string;
  value: unknown;
}

export interface LearnedPattern {
  id: string;
  category: PatternCategory;
  key: string;
  value: string;
  weight: number;
  confidence: number;
  contexts: string[];
  successes: number;
  failures: number;
  lastUpdated: string;
}

export interface ProfileState {
  profileId: string;
  learnedPatterns: LearnedPattern[];
  behavioralSignals: string[];
  preferredPerspective?: Perspective;
  preferredResolution?: Resolution;
  updatedAt: string;
}

export interface RunRecord {
  requestId: string;
  timestamp: string;
  irStats: {
    concepts: number;
    relations: number;
    transforms: number;
    constraints: number;
  };
  outputType?: string;
  resolution?: Resolution;
  perspective?: Perspective;
  validationStatus: ValidationStatus;
  success?: boolean;
  rating?: number;
  meaningScore?: number;
  driftRisk?: number;
}

export interface MemoryAdapter {
  getCanonicalEntries(): CanonicalMemoryEntry[];
  saveEpisodic(entry: EpisodicMemoryEntry): void;
  getSemanticEntries(): SemanticMemoryEntry[];
  saveSemantic(entry: SemanticMemoryEntry): void;
  recordRun(record: RunRecord): void;
  getRunRecords(): RunRecord[];
  savePattern(pattern: LearnedPattern): void;
  getPatterns(): LearnedPattern[];
  getProfile(profileId: string): ProfileState | undefined;
  saveProfile(profile: ProfileState): void;
}

export interface TransitionApplication {
  from: Perspective;
  to: Perspective;
  target: string;
}

export interface IntelligencePlan {
  mode: IntelligenceMode;
  depth: IntelligenceDepth;
  outputType?: OutputType;
  derivedPerspective: Perspective;
  derivedResolution: Resolution;
  focusConcepts: string[];
  preferredStructure: 'steps' | 'framework' | 'reflection';
  memorySignals: string[];
  learnedPatternIds: string[];
  adaptationNotes: string[];
}

export interface MeaningIntegrity {
  preserved: boolean;
  score: number;
  violations: string[];
}

export interface TransformationTraceStep {
  stage: string;
  detail: string;
  status: ValidationStatus | 'INFO';
}

export interface TransformationTrace {
  steps: TransformationTraceStep[];
  transitions: TransitionApplication[];
  mutations: string[];
  justifications: string[];
}

export interface IntegrityReport {
  conceptIdentity: MeaningIntegrity;
  canonicalProtection: {
    preserved: boolean;
    violations: string[];
  };
  driftRisk: number;
  trace: TransformationTrace;
  diagnostics: string[];
}

export interface OutputBundle {
  resolution: Resolution;
  perspective: Perspective;
  insights: string[];
  actions: string[];
  structures: string[];
  narrative: string;
  confidenceScore: number;
  constraintsApplied: string[];
  transitionsApplied: TransitionApplication[];
  recommendations: string[];
  intelligence: {
    mode: IntelligenceMode;
    depth: IntelligenceDepth;
    focusConcepts: string[];
    memorySignals: string[];
    plannerNotes: string[];
    learnedPatternIds: string[];
    adaptationNotes: string[];
  };
  learning: {
    extractedPatternIds: string[];
    feedbackApplied: boolean;
    profileUpdated: boolean;
  };
  integrity: IntegrityReport;
  provenance: {
    requestId: string;
    intent?: string;
    outputType?: string;
    conceptLabels: string[];
    relationCount: number;
    diagnostics: string[];
  };
  validationStatus: ValidationStatus;
}

export interface ExecuteIRResult {
  bundle: OutputBundle;
  validationStatus: ValidationStatus;
}

export interface ExecuteCogResult {
  astDiagnostics: Diagnostic[];
  ir: CognitiveIR;
  bundle: OutputBundle;
  validationStatus: ValidationStatus;
}

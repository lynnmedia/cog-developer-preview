import { CognitiveIR } from '../compiler/compileToIR';
import {
  ExecutionContext,
  ExecutionFeedback,
  LearnedPattern,
  MemoryAdapter,
  OutputBundle,
  ProfileState,
  Resolution
} from './types';

function safeIdPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function patternId(category: string, key: string, value: string): string {
  return `${safeIdPart(category)}:${safeIdPart(key)}:${safeIdPart(value)}`;
}

export function extractPatterns(
  ir: CognitiveIR,
  bundle: OutputBundle,
  context: ExecutionContext,
  timestamp: string
): LearnedPattern[] {
  const patterns: LearnedPattern[] = [];
  const domain = context.domain ? [context.domain] : [];
  const focusValue = bundle.intelligence.focusConcepts.join('|') || ir.concepts.slice(0, 2).map((c) => c.label).join('|');
  const outputType = bundle.provenance.outputType ?? 'analysis';
  const maxSteps = ir.constraints[0]?.fields.max_steps;

  patterns.push({
    id: patternId('output_preference', 'output_type', outputType),
    category: 'output_preference',
    key: 'output_type',
    value: outputType,
    weight: 0.6,
    confidence: 0.6,
    contexts: domain,
    successes: 0,
    failures: 0,
    lastUpdated: timestamp
  });

  if (focusValue) {
    patterns.push({
      id: patternId('focus_preference', 'focus', focusValue),
      category: 'focus_preference',
      key: 'focus',
      value: focusValue,
      weight: 0.55,
      confidence: 0.55,
      contexts: domain,
      successes: 0,
      failures: 0,
      lastUpdated: timestamp
    });
  }

  if (typeof maxSteps === 'number') {
    patterns.push({
      id: patternId('constraint_preference', 'max_steps', String(maxSteps)),
      category: 'constraint_preference',
      key: 'max_steps',
      value: String(maxSteps),
      weight: 0.5,
      confidence: 0.5,
      contexts: domain,
      successes: 0,
      failures: 0,
      lastUpdated: timestamp
    });
  }

  if (context.targetResolution === 'R5' || bundle.resolution === 'R5') {
    patterns.push({
      id: patternId('behavior_signal', 'resolution_bias', 'r5_actionable'),
      category: 'behavior_signal',
      key: 'resolution_bias',
      value: 'r5_actionable',
      weight: 0.52,
      confidence: 0.52,
      contexts: domain,
      successes: 0,
      failures: 0,
      lastUpdated: timestamp
    });
  }

  return patterns;
}

export function mergePattern(existing: LearnedPattern | undefined, incoming: LearnedPattern, feedback?: ExecutionFeedback): LearnedPattern {
  if (!existing) {
    const delta = feedback ? (feedback.success ? 0.18 : -0.12) + ((feedback.rating - 3) * 0.03) : 0;
    return {
      ...incoming,
      weight: clamp(incoming.weight + delta, 0.1, 1),
      confidence: clamp(incoming.confidence + (feedback ? 0.08 : 0.02), 0.1, 1),
      successes: feedback?.success ? 1 : 0,
      failures: feedback && !feedback.success ? 1 : 0
    };
  }

  const successDelta = feedback ? (feedback.success ? 0.12 : -0.1) : 0.03;
  const ratingDelta = feedback ? (feedback.rating - 3) * 0.03 : 0;
  return {
    ...existing,
    value: incoming.value,
    contexts: [...new Set([...existing.contexts, ...incoming.contexts])],
    weight: clamp(Number((existing.weight + successDelta + ratingDelta).toFixed(2)), 0.1, 1),
    confidence: clamp(Number((existing.confidence + (feedback ? 0.08 : 0.03)).toFixed(2)), 0.1, 1),
    successes: existing.successes + (feedback?.success ? 1 : 0),
    failures: existing.failures + (feedback && !feedback.success ? 1 : 0),
    lastUpdated: incoming.lastUpdated
  };
}

export function updatePatterns(
  memory: MemoryAdapter,
  extractedPatterns: LearnedPattern[],
  feedback: ExecutionFeedback | undefined
): LearnedPattern[] {
  const existing = new Map(memory.getPatterns().map((pattern) => [pattern.id, pattern]));
  const merged: LearnedPattern[] = [];
  for (const pattern of extractedPatterns) {
    const next = mergePattern(existing.get(pattern.id), pattern, feedback);
    memory.savePattern(next);
    merged.push(next);
  }
  return merged;
}

export function evolveProfile(
  memory: MemoryAdapter,
  context: ExecutionContext,
  bundle: OutputBundle,
  patterns: LearnedPattern[],
  timestamp: string
): ProfileState | undefined {
  if (!context.profileId) return undefined;

  const prior = memory.getProfile(context.profileId);
  const learnedPatterns = [...new Map([...(prior?.learnedPatterns ?? []), ...patterns].map((pattern) => [pattern.id, pattern])).values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 12);

  const behavioralSignals = Array.from(new Set([
    ...(prior?.behavioralSignals ?? []),
    ...patterns.filter((p) => p.category === 'behavior_signal' || p.category === 'success_pattern').map((p) => p.value)
  ])).slice(0, 8);

  const profile: ProfileState = {
    profileId: context.profileId,
    learnedPatterns,
    behavioralSignals,
    preferredPerspective: bundle.perspective,
    preferredResolution: bundle.resolution,
    updatedAt: timestamp
  };

  memory.saveProfile(profile);
  return profile;
}

export function synthesizeSemanticEntries(patterns: LearnedPattern[]): { key: string; value: unknown }[] {
  const entries: { key: string; value: unknown }[] = [];
  const outputPattern = patterns.find((p) => p.category === 'output_preference');
  if (outputPattern) entries.push({ key: 'preferred_output', value: outputPattern.value });
  const focusPattern = patterns.find((p) => p.category === 'focus_preference');
  if (focusPattern) entries.push({ key: 'focus_bias', value: focusPattern.value });
  const successPattern = patterns.find((p) => p.category === 'behavior_signal');
  if (successPattern) entries.push({ key: 'user_pattern', value: successPattern.value });
  return entries;
}

export function buildAdaptiveNotes(patterns: LearnedPattern[], runs: number, feedback?: ExecutionFeedback): string[] {
  const notes: string[] = [];
  if (runs > 0) notes.push(`Adaptation considered ${runs} prior run(s).`);
  const strongest = [...patterns].sort((a, b) => b.weight - a.weight)[0];
  if (strongest) notes.push(`Strongest learned pattern: ${strongest.category}/${strongest.value} (${strongest.weight.toFixed(2)}).`);
  if (feedback) notes.push(`Feedback applied with rating ${feedback.rating} and success=${feedback.success}.`);
  return notes;
}

export function inferAdaptiveResolution(patterns: LearnedPattern[], fallback: Resolution): Resolution {
  return patterns.some((p) => p.value === 'r5_actionable') ? 'R5' : fallback;
}

import { CognitiveIR } from '../compiler/compileToIR';
import {
  ExecutionContext,
  IntelligencePlan,
  LearnedPattern,
  OutputType,
  Perspective,
  ProfileState,
  Resolution,
  SemanticMemoryEntry
} from './types';
import { inferAdaptiveResolution } from './learning';

const ACTIONABLE_OUTPUTS = new Set<OutputType>(['action_plan', 'structured_routine', 'checklist']);

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function coerceOutputType(value: unknown): OutputType | undefined {
  if (typeof value !== 'string') return undefined;
  const allowed: OutputType[] = ['action_plan', 'structured_routine', 'framework', 'checklist', 'reflection', 'analysis'];
  return allowed.includes(value as OutputType) ? (value as OutputType) : undefined;
}

export function createIntelligencePlan(
  ir: CognitiveIR,
  context: ExecutionContext,
  semanticEntries: SemanticMemoryEntry[],
  learnedPatterns: LearnedPattern[] = [],
  profile?: ProfileState,
  priorRuns = 0
): IntelligencePlan {
  const outputType = coerceOutputType(ir.emits[0]?.fields.type);
  const preferredOutput = coerceOutputType(
    learnedPatterns.find((pattern) => pattern.category === 'output_preference')?.value ??
    semanticEntries.find((entry) => entry.key === 'preferred_output')?.value
  );

  const highComplexity = ir.concepts.length + ir.relations.length + ir.transforms.length >= 6;
  const depth =
    context.intelligenceDepth ??
    (profile?.learnedPatterns.length || learnedPatterns.length || priorRuns > 1 ? 'deep' : highComplexity ? 'deep' : 'standard');
  const mode = context.intelligenceMode ?? (semanticEntries.length > 0 || learnedPatterns.length > 0 || priorRuns > 0 ? 'adaptive' : 'deterministic');

  const resolveTarget = (ir.resolves[0]?.resolution as Resolution | undefined) ?? 'R2';
  const learnedResolution = inferAdaptiveResolution(learnedPatterns, resolveTarget);
  const derivedResolution = context.targetResolution ?? profile?.preferredResolution ?? learnedResolution;

  const viewPerspective = ir.views[0]?.perspective as Perspective | undefined;
  const transformTo = ir.transforms[0]?.fields.to as Perspective | undefined;
  const learnedPerspective = profile?.preferredPerspective;
  const derivedPerspective =
    context.targetPerspective ??
    learnedPerspective ??
    transformTo ??
    viewPerspective ??
    (derivedResolution === 'R5' ? 'actionable' : derivedResolution === 'R4' ? 'advisory' : 'descriptive');

  const learnedFocus = learnedPatterns
    .filter((pattern) => pattern.category === 'focus_preference' && pattern.weight >= 0.5)
    .flatMap((pattern) => pattern.value.split('|'));

  const focusConcepts = unique([
    ...learnedFocus,
    ...ir.concepts.slice(0, 3).map((concept) => concept.label),
    ...ir.transforms
      .map((transform) => (typeof transform.fields.target === 'string' ? transform.fields.target : undefined))
      .filter((value): value is string => Boolean(value))
  ]).slice(0, depth === 'deep' ? 5 : 3);

  const memorySignals = [
    ...semanticEntries
      .filter((entry) => ['preferred_output', 'user_pattern', 'focus_bias', 'recent_theme'].includes(entry.key))
      .map((entry) => `${entry.key}:${String(entry.value)}`),
    ...learnedPatterns.slice(0, 4).map((pattern) => `pattern:${pattern.category}:${pattern.value}:${pattern.weight.toFixed(2)}`),
    ...profile?.behavioralSignals.map((signal) => `profile_signal:${signal}`) ?? []
  ];

  const requestedOutput = outputType ?? preferredOutput;
  const preferredStructure =
    requestedOutput === 'framework' || requestedOutput === 'analysis'
      ? 'framework'
      : requestedOutput === 'reflection'
        ? 'reflection'
        : 'steps';

  const adaptationNotes = [
    learnedPatterns.length > 0 ? `Planner incorporated ${learnedPatterns.length} learned pattern(s).` : 'Planner had no learned patterns.',
    profile ? `Profile ${profile.profileId} influenced planning.` : 'No persisted profile influenced planning.',
    priorRuns > 0 ? `Planner observed ${priorRuns} prior run(s).` : 'Planner observed no prior runs.'
  ];

  return {
    mode,
    depth,
    outputType: requestedOutput,
    derivedPerspective,
    derivedResolution,
    focusConcepts,
    preferredStructure,
    memorySignals,
    learnedPatternIds: learnedPatterns.map((pattern) => pattern.id).slice(0, 6),
    adaptationNotes
  };
}

export function expandInsights(
  ir: CognitiveIR,
  plan: IntelligencePlan,
  semanticEntries: SemanticMemoryEntry[],
  learnedPatterns: LearnedPattern[] = []
): string[] {
  const insights: string[] = [];

  if (plan.depth !== 'shallow') {
    for (const relation of ir.relations) {
      const relationType = typeof relation.fields.type === 'string' ? relation.fields.type : 'relates_to';
      insights.push(`Intelligence layer links ${relation.from} -> ${relation.to} via ${relationType}.`);
    }
  }

  const userPattern = semanticEntries.find((entry) => entry.key === 'user_pattern');
  if (userPattern) insights.push(`Memory suggests a recurring user pattern: ${String(userPattern.value)}.`);

  const focusBias = semanticEntries.find((entry) => entry.key === 'focus_bias');
  if (focusBias) insights.push(`Planner bias applied from memory: ${String(focusBias.value)}.`);

  for (const pattern of learnedPatterns.slice(0, 3)) {
    insights.push(`Adaptive memory prioritizes ${pattern.category}=${pattern.value} with weight ${pattern.weight.toFixed(2)}.`);
  }

  if (plan.outputType && ACTIONABLE_OUTPUTS.has(plan.outputType)) {
    insights.push(`The selected output mode favors executable structure over open-ended reflection.`);
  }

  if (plan.depth === 'deep') {
    insights.push(`Deep mode enabled cross-concept synthesis for ${plan.focusConcepts.join(', ')}.`);
  }

  return insights;
}

export function deriveRecommendations(
  ir: CognitiveIR,
  plan: IntelligencePlan,
  context: ExecutionContext,
  semanticEntries: SemanticMemoryEntry[],
  learnedPatterns: LearnedPattern[] = []
): string[] {
  const recommendations: string[] = [];
  const target = typeof ir.transforms[0]?.fields.target === 'string' ? String(ir.transforms[0]?.fields.target) : plan.focusConcepts[0];

  if (plan.preferredStructure === 'steps') {
    recommendations.push(`Keep the execution path for ${target} short, repeatable, and explicitly reviewable.`);
  }
  if (plan.preferredStructure === 'framework') {
    recommendations.push(`Model ${target} as a reusable framework before expanding into daily execution.`);
  }
  if (plan.preferredStructure === 'reflection') {
    recommendations.push(`Preserve reflection checkpoints so ${target} does not collapse into mere task completion.`);
  }

  if (context.domain) recommendations.push(`Anchor examples and language to the current domain: ${context.domain}.`);
  if (semanticEntries.some((entry) => entry.key === 'preferred_output')) {
    recommendations.push(`Honor the user's historically preferred output form unless the active constraints forbid it.`);
  }
  const learnedMaxSteps = learnedPatterns.find((pattern) => pattern.category === 'constraint_preference' && pattern.key === 'max_steps');
  if (learnedMaxSteps) recommendations.push(`Bias execution toward ${learnedMaxSteps.value} steps because prior runs reinforced it.`);
  if (plan.derivedResolution === 'R5') recommendations.push(`Do not leave ${target} at the conceptual layer; bind it to a concrete next action.`);

  return recommendations.slice(0, 5);
}
